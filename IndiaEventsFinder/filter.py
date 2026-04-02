#!/usr/bin/env python3
"""
filter.py — Filter saved IndiaEventsFinder results by institute, event type,
keyword, or date range.
"""

import argparse
import json
import re
import sys
from datetime import datetime
from pathlib import Path

from rich.console import Console
from rich.table import Table
from rich import box

DATA_DIR = Path(__file__).parent / "data"
console = Console()


def load_events(path: Path) -> list[dict]:
    """Load events from a JSON file."""
    if not path.exists():
        console.print(f"[red]File not found: {path}[/red]")
        sys.exit(1)
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def filter_by_institute(events: list[dict], institute: str) -> list[dict]:
    """Keep events whose 'institute' field contains the search string (case-insensitive)."""
    term = institute.lower()
    return [e for e in events if term in e.get("institute", "").lower()]


def filter_by_event_type(events: list[dict], event_type: str) -> list[dict]:
    """Keep events matching the given event type."""
    term = event_type.lower().replace(" ", "_")
    return [e for e in events if e.get("event_type", "").lower() == term]


def filter_by_keyword(events: list[dict], keyword: str) -> list[dict]:
    """Keep events whose title or snippet contains the keyword."""
    term = keyword.lower()
    return [
        e for e in events
        if term in e.get("title", "").lower() or term in e.get("snippet", "").lower()
    ]


def parse_date_loose(raw: str) -> datetime | None:
    """Best-effort parse of a raw date string into a datetime."""
    # Try common formats
    for fmt in [
        "%d %B %Y",       # 12 March 2025
        "%d %b %Y",       # 12 Mar 2025
        "%B %d, %Y",      # March 12, 2025
        "%B %d %Y",       # March 12 2025
        "%Y-%m-%d",       # 2025-03-12
    ]:
        try:
            return datetime.strptime(raw.strip(), fmt)
        except ValueError:
            continue
    # Handle range like "12-14 March 2025" — take start date
    m = re.match(r'(\d{1,2})[-–]\d{1,2}\s+(\w+)\s+(\d{4})', raw)
    if m:
        try:
            return datetime.strptime(f"{m.group(1)} {m.group(2)} {m.group(3)}", "%d %B %Y")
        except ValueError:
            pass
    return None


def filter_by_date_range(
    events: list[dict], start: str | None, end: str | None
) -> list[dict]:
    """Keep events whose date_raw falls within [start, end]. Dates in YYYY-MM-DD."""
    start_dt = datetime.strptime(start, "%Y-%m-%d") if start else None
    end_dt = datetime.strptime(end, "%Y-%m-%d") if end else None

    filtered: list[dict] = []
    for e in events:
        raw = e.get("date_raw", "")
        if not raw:
            continue
        dt = parse_date_loose(raw)
        if dt is None:
            continue
        if start_dt and dt < start_dt:
            continue
        if end_dt and dt > end_dt:
            continue
        filtered.append(e)
    return filtered


def print_table(events: list[dict]) -> None:
    if not events:
        console.print("[yellow]No events match the filter criteria.[/yellow]")
        return

    table = Table(
        title="Filtered Events",
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
    table.add_column("URL", style="dim", max_width=40)

    for i, ev in enumerate(events, 1):
        table.add_row(
            str(i),
            ev["title"][:50],
            ev.get("event_type", ""),
            ev.get("institute", "") or "-",
            ev.get("source", ""),
            ev.get("date_raw", "") or "-",
            ev["url"][:40],
        )

    console.print(table)
    console.print(f"\n[bold]{len(events)} event(s) matched.[/bold]")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Filter IndiaEventsFinder results.",
    )
    parser.add_argument("-f", "--file", default="events",
                        help="JSON file basename in data/ (default: events)")
    parser.add_argument("-i", "--institute", help="Filter by institute name (e.g. 'IIT')")
    parser.add_argument("-t", "--type", dest="event_type",
                        help="Filter by event type (e.g. hackathon, workshop)")
    parser.add_argument("-k", "--keyword", help="Filter by keyword in title/snippet")
    parser.add_argument("--from-date", help="Start date YYYY-MM-DD")
    parser.add_argument("--to-date", help="End date YYYY-MM-DD")
    parser.add_argument("-o", "--output", help="Save filtered results to this JSON file in data/")
    args = parser.parse_args()

    json_path = DATA_DIR / f"{args.file}.json"
    events = load_events(json_path)
    console.print(f"[dim]Loaded {len(events)} events from {json_path}[/dim]\n")

    if args.institute:
        events = filter_by_institute(events, args.institute)
    if args.event_type:
        events = filter_by_event_type(events, args.event_type)
    if args.keyword:
        events = filter_by_keyword(events, args.keyword)
    if args.from_date or args.to_date:
        events = filter_by_date_range(events, args.from_date, args.to_date)

    print_table(events)

    if args.output and events:
        out_path = DATA_DIR / f"{args.output}.json"
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(events, f, indent=2, ensure_ascii=False)
        console.print(f"[green]Saved filtered results to {out_path}[/green]")


if __name__ == "__main__":
    main()
