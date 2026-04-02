#!/usr/bin/env python3
"""
IndiaEventsFinder — Discover events at top Indian institutes via Google Custom Search.

Uses Google CSE free tier (100 queries/day) with site-targeted searches on
LinkedIn Events, Unstop, Devfolio, Townscript, WikiCFP, Insider.in, and
institute websites directly.
"""

import argparse
import csv
import json
import os
import re
import sys
import time
from datetime import datetime, date
from pathlib import Path

import requests
from dotenv import load_dotenv
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich import box

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

load_dotenv(Path(__file__).parent / ".env")

API_KEY = os.getenv("GOOGLE_API_KEY", "")
CX = os.getenv("GOOGLE_CX", "")

SEARCH_ENDPOINT = "https://www.googleapis.com/customsearch/v1"

# Rate-limit: 1 second between API calls
RATE_LIMIT_SECONDS = 1

# Max results Google CSE returns per call (free tier caps at 10)
RESULTS_PER_QUERY = 10

# Date restriction — results from last 2 months
DATE_RESTRICT = "m2"

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

console = Console()

# ---------------------------------------------------------------------------
# Search targets
# ---------------------------------------------------------------------------

SITES = [
    "linkedin.com/events",
    "unstop.com",
    "devfolio.co",
    "townscript.com",
    "wikicfp.com",
    "insider.in",
    # Institute domains
    "iitb.ac.in",
    "iitd.ac.in",
    "iitm.ac.in",
    "iitk.ac.in",
    "iitkgp.ac.in",
    "iitr.ac.in",
    "iith.ac.in",
    "iisc.ac.in",
    "bits-pilani.ac.in",
    "nitt.edu",
    "nitw.ac.in",
    "nitk.edu.in",
    "iima.ac.in",
    "iimb.ac.in",
    "iiit.ac.in",
    "vit.ac.in",
    "manipal.edu",
    "annauniv.edu",
]

EVENT_TYPES = [
    "conference",
    "workshop",
    "hackathon",
    "fest",
    "symposium",
    "summit",
    "seminar",
    "bootcamp",
    "webinar",
    "competition",
    "conclave",
    "tech talk",
    "ideathon",
    "datathon",
    "case study competition",
]

INSTITUTES = {
    "IIT Bombay":       ["iitb", "iit bombay"],
    "IIT Delhi":        ["iitd", "iit delhi"],
    "IIT Madras":       ["iitm", "iit madras"],
    "IIT Kanpur":       ["iitk", "iit kanpur"],
    "IIT Kharagpur":    ["iitkgp", "iit kharagpur", "iit kgp"],
    "IIT Roorkee":      ["iitr", "iit roorkee"],
    "IIT Hyderabad":    ["iith", "iit hyderabad"],
    "IIT Bangalore":    ["iitb", "iit bangalore", "iit bengaluru"],
    "NIT Trichy":       ["nitt", "nit trichy", "nit tiruchirappalli"],
    "NIT Warangal":     ["nitw", "nit warangal"],
    "NIT Surathkal":    ["nitk", "nit surathkal"],
    "BITS Pilani":      ["bits", "bits pilani", "birla institute"],
    "IISc Bangalore":   ["iisc", "indian institute of science"],
    "IIM Ahmedabad":    ["iima", "iim ahmedabad"],
    "IIM Bangalore":    ["iimb", "iim bangalore", "iim bengaluru"],
    "IIIT Hyderabad":   ["iiit", "iiit hyderabad"],
    "VIT Vellore":      ["vit", "vit vellore"],
    "Manipal":          ["manipal"],
    "Anna University":  ["anna university", "annauniv"],
}

# ---------------------------------------------------------------------------
# Source detection from URL
# ---------------------------------------------------------------------------

SOURCE_MAP = {
    "linkedin.com":   "linkedin",
    "unstop.com":     "unstop",
    "devfolio.co":    "devfolio",
    "townscript.com": "townscript",
    "wikicfp.com":    "wikicfp",
    "insider.in":     "insider",
}


def detect_source(url: str) -> str:
    """Return a human-friendly source label for the URL."""
    for domain, label in SOURCE_MAP.items():
        if domain in url:
            return label
    return "institute_website"


# ---------------------------------------------------------------------------
# Institute & event-type extraction
# ---------------------------------------------------------------------------

def extract_institute(text: str) -> str:
    """Best-effort extraction of institute name from text."""
    lower = text.lower()
    for name, keywords in INSTITUTES.items():
        for kw in keywords:
            if kw in lower:
                return name
    return ""


def extract_event_type(text: str) -> str:
    """Classify the event type from title/snippet text."""
    lower = text.lower()
    # Check most specific first
    for et in sorted(EVENT_TYPES, key=len, reverse=True):
        if et in lower:
            return et.replace(" ", "_") if " " in et else et
    return "other"


def extract_date_raw(text: str) -> str:
    """Try to pull a date-like string from text (best-effort regex)."""
    patterns = [
        # "12-14 March 2025", "March 12, 2025", "12 Mar 2025"
        r'\d{1,2}[-–]\d{1,2}\s+\w+\s+\d{4}',
        r'\w+\s+\d{1,2}[-–]\d{1,2},?\s+\d{4}',
        r'\d{1,2}\s+\w{3,9}\s+\d{4}',
        r'\w{3,9}\s+\d{1,2},?\s+\d{4}',
        r'\d{4}-\d{2}-\d{2}',
    ]
    for pat in patterns:
        m = re.search(pat, text)
        if m:
            return m.group(0)
    return ""


# ---------------------------------------------------------------------------
# Scoring
# ---------------------------------------------------------------------------

def score_result(title: str, snippet: str, url: str) -> int:
    """Higher score = more relevant.  Boost for institute names, dates, registration cues."""
    combined = f"{title} {snippet}".lower()
    s = 0
    # Institute mention
    for keywords in INSTITUTES.values():
        if any(kw in combined for kw in keywords):
            s += 10
            break
    # Specific date mentioned
    if extract_date_raw(f"{title} {snippet}"):
        s += 5
    # Registration cues
    if any(w in combined for w in ["register", "registration", "apply", "signup", "sign up"]):
        s += 5
    # Known event platform (more trustworthy)
    if any(d in url for d in SOURCE_MAP):
        s += 3
    return s


# ---------------------------------------------------------------------------
# Google CSE query
# ---------------------------------------------------------------------------

def search_events(
    keyword: str,
    site: str | None = None,
    location: str | None = None,
    dry_run: bool = False,
) -> list[dict]:
    """Run a single Google CSE query and return normalised event dicts."""
    year = datetime.now().year
    parts = [keyword]
    if site:
        parts.insert(0, f"site:{site}")
    if location:
        parts.append(location)
    parts.append(f"India {year}")

    query = " ".join(parts)

    if dry_run:
        console.print(f"  [dim][DRY-RUN] {query}[/dim]")
        return []

    params = {
        "key": API_KEY,
        "cx": CX,
        "q": query,
        "num": RESULTS_PER_QUERY,
        "dateRestrict": DATE_RESTRICT,
    }

    try:
        resp = requests.get(SEARCH_ENDPOINT, params=params, timeout=15)
        if resp.status_code != 200:
            # Try to extract Google's JSON error message
            try:
                err_data = resp.json()
                err_msg = err_data.get("error", {}).get("message", resp.text[:200])
                err_code = err_data.get("error", {}).get("code", resp.status_code)
            except Exception:
                err_msg = resp.text[:200]
                err_code = resp.status_code

            if resp.status_code == 429 or "quota" in str(err_msg).lower():
                console.print("[red]API quota exceeded — stopping.[/red]")
                sys.exit(1)
            elif resp.status_code == 403:
                console.print(
                    f"[red]API returned 403 Forbidden: {err_msg}[/red]\n"
                    "[yellow]Ensure 'Custom Search API' is enabled at "
                    "https://console.cloud.google.com/apis/library/customsearch.googleapis.com\n"
                    "and your API key has permission to call it.[/yellow]"
                )
                sys.exit(1)
            else:
                console.print(f"[red]API error {err_code}: {err_msg}[/red]")
            return []
        data = resp.json()
    except requests.exceptions.RequestException as exc:
        console.print(f"[red]Network error: {exc}[/red]")
        return []

    items = data.get("items", [])
    events: list[dict] = []

    for item in items:
        title = item.get("title", "")
        url = item.get("link", "")
        snippet = item.get("snippet", "")
        combined = f"{title} {snippet}"

        events.append({
            "title": title,
            "url": url,
            "source": detect_source(url),
            "institute": extract_institute(combined),
            "event_type": extract_event_type(combined),
            "snippet": snippet.replace("\n", " ").strip(),
            "date_raw": extract_date_raw(combined),
            "found_on": date.today().isoformat(),
            "score": score_result(title, snippet, url),
        })

    return events


# ---------------------------------------------------------------------------
# Deduplication
# ---------------------------------------------------------------------------

def deduplicate(events: list[dict]) -> list[dict]:
    """Remove duplicate events by URL."""
    seen: set[str] = set()
    unique: list[dict] = []
    for ev in events:
        if ev["url"] not in seen:
            seen.add(ev["url"])
            unique.append(ev)
    return unique


# ---------------------------------------------------------------------------
# Save helpers
# ---------------------------------------------------------------------------

def save_json(events: list[dict], path: Path) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)
    console.print(f"[green]Saved {len(events)} events to {path}[/green]")


def save_csv(events: list[dict], path: Path) -> None:
    if not events:
        return
    fieldnames = ["title", "url", "source", "institute", "event_type",
                  "snippet", "date_raw", "found_on", "score"]
    with open(path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(events)
    console.print(f"[green]Saved {len(events)} events to {path}[/green]")


# ---------------------------------------------------------------------------
# Pretty CLI output
# ---------------------------------------------------------------------------

def print_results_table(events: list[dict]) -> None:
    """Print a rich table of events."""
    if not events:
        console.print("[yellow]No events found.[/yellow]")
        return

    table = Table(
        title="IndiaEventsFinder Results",
        box=box.ROUNDED,
        show_lines=True,
        title_style="bold cyan",
    )
    table.add_column("#", style="dim", width=4)
    table.add_column("Title", style="bold white", max_width=50)
    table.add_column("Type", style="magenta", width=14)
    table.add_column("Institute", style="green", width=18)
    table.add_column("Source", style="blue", width=12)
    table.add_column("Date", style="yellow", width=18)
    table.add_column("Score", style="cyan", width=5, justify="right")

    for i, ev in enumerate(events, 1):
        table.add_row(
            str(i),
            ev["title"][:50],
            ev["event_type"],
            ev["institute"] or "-",
            ev["source"],
            ev["date_raw"] or "-",
            str(ev.get("score", 0)),
        )

    console.print(table)


def print_summary(events: list[dict]) -> None:
    """Print breakdown by event type and institute."""
    if not events:
        return

    type_counts: dict[str, int] = {}
    inst_counts: dict[str, int] = {}
    for ev in events:
        t = ev["event_type"]
        type_counts[t] = type_counts.get(t, 0) + 1
        inst = ev["institute"] or "Unknown"
        inst_counts[inst] = inst_counts.get(inst, 0) + 1

    summary_lines = [f"[bold]Total events found:[/bold] {len(events)}\n"]

    summary_lines.append("[bold]By event type:[/bold]")
    for t, c in sorted(type_counts.items(), key=lambda x: -x[1]):
        summary_lines.append(f"  {t:25s} {c}")

    summary_lines.append("\n[bold]By institute:[/bold]")
    for inst, c in sorted(inst_counts.items(), key=lambda x: -x[1]):
        summary_lines.append(f"  {inst:25s} {c}")

    console.print(Panel("\n".join(summary_lines), title="Summary", border_style="cyan"))


# ---------------------------------------------------------------------------
# Query strategy — stay within 100 queries/day
# ---------------------------------------------------------------------------

def build_query_plan(
    event_types: list[str] | None = None,
    sites: list[str] | None = None,
    keyword: str | None = None,
) -> list[tuple[str, str | None]]:
    """
    Build a list of (search_keyword, site) pairs.

    Strategy: pair a handful of high-signal event types with the major
    aggregator sites.  This keeps total queries manageable.
    """
    # Default: pick the most common event types
    chosen_types = event_types or [
        "hackathon", "conference", "workshop", "fest",
        "seminar", "tech talk", "competition",
    ]

    # Default: aggregator sites + a few key institute domains
    chosen_sites = sites or [
        "unstop.com",
        "devfolio.co",
        "townscript.com",
        "insider.in",
        "linkedin.com/events",
    ]

    plan: list[tuple[str, str | None]] = []

    if keyword:
        # User gave a specific keyword — search it on every chosen site
        for s in chosen_sites:
            plan.append((keyword, s))
    else:
        # Cross-product but limit total queries
        for et in chosen_types:
            for s in chosen_sites:
                plan.append((et, s))
                if len(plan) >= 95:  # stay under free-tier cap
                    return plan

    return plan


# ---------------------------------------------------------------------------
# API check
# ---------------------------------------------------------------------------

def check_api_credentials() -> None:
    """Test Google CSE API credentials with a single lightweight query."""
    console.print(Panel("[bold]API Credential Check[/bold]", border_style="cyan"))

    if not API_KEY:
        console.print("[red]GOOGLE_API_KEY is not set in .env[/red]")
        return
    if not CX:
        console.print("[red]GOOGLE_CX is not set in .env[/red]")
        return

    console.print(f"  API Key: {API_KEY[:10]}...{API_KEY[-4:]}")
    console.print(f"  CX:      {CX}")
    console.print()

    try:
        resp = requests.get(SEARCH_ENDPOINT, params={
            "key": API_KEY, "cx": CX, "q": "test", "num": 1,
        }, timeout=15)

        if resp.status_code == 200:
            data = resp.json()
            total = data.get("searchInformation", {}).get("totalResults", "?")
            console.print(f"[green]API is working! Test query returned {total} results.[/green]")
            console.print("[green]You're all set. Run: python events_finder.py[/green]")
        else:
            # Try JSON error first, fall back to status code description
            try:
                err = resp.json().get("error", {})
                err_msg = err.get("message", "Unknown error")
            except Exception:
                err_msg = {
                    400: "Bad request — check your CX (Search Engine ID)",
                    403: "Forbidden — Custom Search API not enabled or key lacks permission",
                    404: "Not found — check your CX (Search Engine ID)",
                    429: "Rate limit exceeded — wait and try again",
                }.get(resp.status_code, f"HTTP {resp.status_code}")
            console.print(f"[red]API error {resp.status_code}: {err_msg}[/red]")

            if resp.status_code == 403:
                console.print(
                    "\n[yellow]How to fix 403 Forbidden:[/yellow]\n"
                    "  1. Go to https://console.cloud.google.com/apis/library/customsearch.googleapis.com\n"
                    "  2. Click [bold]Enable[/bold] for 'Custom Search API'\n"
                    "  3. Make sure your API key is unrestricted or allows Custom Search API\n"
                    "  4. Wait a minute and try again"
                )
    except requests.exceptions.RequestException as exc:
        console.print(f"[red]Network error: {exc}[/red]")


# ---------------------------------------------------------------------------
# Demo mode
# ---------------------------------------------------------------------------

DEMO_EVENTS = [
    {
        "title": "Smart India Hackathon 2026 - Grand Finale at IIT Bombay",
        "url": "https://unstop.com/hackathons/smart-india-hackathon-2026",
        "source": "unstop",
        "institute": "IIT Bombay",
        "event_type": "hackathon",
        "snippet": "India's largest open innovation platform. 48-hour hackathon, "
                   "1000+ teams, 50+ problem statements. Register by March 15, 2026.",
        "date_raw": "22 March 2026",
        "found_on": date.today().isoformat(),
        "score": 23,
    },
    {
        "title": "TechFest 2026 - IIT Bombay Annual Technology Festival",
        "url": "https://techfest.org/2026",
        "source": "institute_website",
        "institute": "IIT Bombay",
        "event_type": "fest",
        "snippet": "Asia's largest science and technology festival. Competitions, "
                   "exhibitions, lectures, and workshops. December 2025.",
        "date_raw": "17 December 2025",
        "found_on": date.today().isoformat(),
        "score": 20,
    },
    {
        "title": "DevSprint - BITS Pilani Hackathon on Devfolio",
        "url": "https://devfolio.co/devsprint-bits",
        "source": "devfolio",
        "institute": "BITS Pilani",
        "event_type": "hackathon",
        "snippet": "36-hour hackathon at BITS Pilani Goa campus. Build innovative "
                   "solutions. Prizes worth INR 5,00,000. Open to all students.",
        "date_raw": "5 April 2026",
        "found_on": date.today().isoformat(),
        "score": 18,
    },
    {
        "title": "AI/ML Workshop Series - IISc Bangalore",
        "url": "https://iisc.ac.in/events/aiml-workshop-2026",
        "source": "institute_website",
        "institute": "IISc Bangalore",
        "event_type": "workshop",
        "snippet": "Hands-on workshop on deep learning and LLMs. Industry experts "
                   "from Google and Microsoft. Registration open.",
        "date_raw": "10 April 2026",
        "found_on": date.today().isoformat(),
        "score": 20,
    },
    {
        "title": "International Conference on Data Science - IIT Madras",
        "url": "https://linkedin.com/events/icds-iitm-2026",
        "source": "linkedin",
        "institute": "IIT Madras",
        "event_type": "conference",
        "snippet": "3-day international conference on data science and machine "
                   "learning. Paper submissions open until Feb 28, 2026.",
        "date_raw": "15 May 2026",
        "found_on": date.today().isoformat(),
        "score": 18,
    },
    {
        "title": "Entrepreneurship Summit 2026 - IIM Ahmedabad",
        "url": "https://insider.in/e-summit-iima-2026",
        "source": "insider",
        "institute": "IIM Ahmedabad",
        "event_type": "summit",
        "snippet": "Annual E-Summit featuring startup pitches, VC panels, and "
                   "networking. Keynote by leading Indian founders.",
        "date_raw": "20 February 2026",
        "found_on": date.today().isoformat(),
        "score": 15,
    },
    {
        "title": "Pragyan 2026 - NIT Trichy Technical Festival",
        "url": "https://townscript.com/pragyan-nitt-2026",
        "source": "townscript",
        "institute": "NIT Trichy",
        "event_type": "fest",
        "snippet": "South India's premier technical festival. Robotics, coding, "
                   "quizzing, and guest lectures. Free for all college students.",
        "date_raw": "7 March 2026",
        "found_on": date.today().isoformat(),
        "score": 15,
    },
    {
        "title": "Cybersecurity Seminar - IIT Delhi",
        "url": "https://iitd.ac.in/events/cybersec-seminar",
        "source": "institute_website",
        "institute": "IIT Delhi",
        "event_type": "seminar",
        "snippet": "Seminar on emerging cybersecurity threats and defenses. "
                   "Guest speaker from CERT-In. Open to public.",
        "date_raw": "12 April 2026",
        "found_on": date.today().isoformat(),
        "score": 15,
    },
    {
        "title": "Case Study Competition - IIM Bangalore",
        "url": "https://unstop.com/competitions/case-iimb-2026",
        "source": "unstop",
        "institute": "IIM Bangalore",
        "event_type": "competition",
        "snippet": "Inter-college case study competition. Solve real-world business "
                   "problems. Cash prizes and PPIs for winners.",
        "date_raw": "25 March 2026",
        "found_on": date.today().isoformat(),
        "score": 18,
    },
    {
        "title": "VIT Riviera 2026 - International Techno-Cultural Fest",
        "url": "https://vit.ac.in/riviera2026",
        "source": "institute_website",
        "institute": "VIT Vellore",
        "event_type": "fest",
        "snippet": "VIT's flagship fest with 50+ events across tech, cultural, "
                   "and sports categories. 30,000+ participants expected.",
        "date_raw": "1 March 2026",
        "found_on": date.today().isoformat(),
        "score": 15,
    },
]


def run_demo() -> None:
    """Show tool capabilities with built-in sample data."""
    console.print(Panel(
        "[bold cyan]IndiaEventsFinder — Demo Mode[/bold cyan]\n"
        "Showing sample data to demonstrate tool capabilities.\n"
        "[dim]No API calls are made in demo mode.[/dim]",
        border_style="cyan",
    ))

    events = DEMO_EVENTS.copy()
    events.sort(key=lambda e: e.get("score", 0), reverse=True)

    print_results_table(events)
    print_summary(events)

    # Save demo output
    json_path = DATA_DIR / "events_demo.json"
    csv_path = DATA_DIR / "events_demo.csv"
    save_json(events, json_path)
    save_csv(events, csv_path)

    console.print(
        "\n[bold yellow]This was demo data.[/bold yellow] "
        "To search live events:\n"
        "  1. Enable Custom Search API: "
        "https://console.cloud.google.com/apis/library/customsearch.googleapis.com\n"
        "  2. Run: [bold]python events_finder.py --check-api[/bold] to verify\n"
        "  3. Run: [bold]python events_finder.py[/bold] for live results\n"
    )


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        description="IndiaEventsFinder — Discover events at top Indian institutes.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("-k", "--keyword", help="Search for a specific keyword (e.g. 'AI hackathon')")
    parser.add_argument("-t", "--types", nargs="+", help="Event types to search (e.g. hackathon workshop)")
    parser.add_argument("-s", "--sites", nargs="+", help="Sites to search (e.g. unstop.com devfolio.co)")
    parser.add_argument("-l", "--location", help="Location to append to queries (e.g. 'Chennai')")
    parser.add_argument("-o", "--output", default="events", help="Output file basename (default: events)")
    parser.add_argument("-n", "--max-queries", type=int, default=35,
                        help="Max number of API queries to run (default: 35)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Print queries without calling the API")
    parser.add_argument("--check-api", action="store_true",
                        help="Test API credentials and exit")
    parser.add_argument("--demo", action="store_true",
                        help="Run with sample data (no API needed)")
    args = parser.parse_args()

    # API connectivity check
    if args.check_api:
        check_api_credentials()
        sys.exit(0)

    # Demo mode — show tool capabilities with sample data
    if args.demo:
        run_demo()
        sys.exit(0)

    if not args.dry_run and (not API_KEY or not CX):
        console.print("[red]Missing GOOGLE_API_KEY or GOOGLE_CX in .env file.[/red]")
        console.print("Copy .env.example to .env and fill in your credentials.")
        console.print("[yellow]Tip: Run with --demo to see the tool in action without API keys.[/yellow]")
        sys.exit(1)

    console.print(Panel(
        "[bold cyan]IndiaEventsFinder[/bold cyan]\n"
        "Discovering events at top Indian institutes",
        border_style="cyan",
    ))

    plan = build_query_plan(
        event_types=args.types,
        sites=args.sites,
        keyword=args.keyword,
    )

    # Cap queries
    plan = plan[: args.max_queries]

    console.print(f"[bold]Planned queries:[/bold] {len(plan)}")
    if args.dry_run:
        console.print("[yellow]DRY-RUN mode — no API calls will be made.[/yellow]\n")

    all_events: list[dict] = []

    for i, (kw, site) in enumerate(plan, 1):
        label = f"site:{site} " if site else ""
        console.print(f"[dim][{i}/{len(plan)}] Searching: {label}{kw}[/dim]")

        results = search_events(kw, site=site, location=args.location, dry_run=args.dry_run)
        all_events.extend(results)

        if not args.dry_run and i < len(plan):
            time.sleep(RATE_LIMIT_SECONDS)

    # Deduplicate and sort by score descending
    all_events = deduplicate(all_events)
    all_events.sort(key=lambda e: e.get("score", 0), reverse=True)

    # Display
    print_results_table(all_events)
    print_summary(all_events)

    if not args.dry_run and all_events:
        json_path = DATA_DIR / f"{args.output}.json"
        csv_path = DATA_DIR / f"{args.output}.csv"
        save_json(all_events, json_path)
        save_csv(all_events, csv_path)


if __name__ == "__main__":
    main()
