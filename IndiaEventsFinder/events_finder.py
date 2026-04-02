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
        resp.raise_for_status()
        data = resp.json()
    except requests.exceptions.HTTPError as exc:
        if resp.status_code == 429:
            console.print("[red]API quota exceeded — stopping.[/red]")
            sys.exit(1)
        console.print(f"[red]HTTP error: {exc}[/red]")
        return []
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
    args = parser.parse_args()

    if not args.dry_run and (not API_KEY or not CX):
        console.print("[red]Missing GOOGLE_API_KEY or GOOGLE_CX in .env file.[/red]")
        console.print("Copy .env.example to .env and fill in your credentials.")
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
