#!/usr/bin/env python3
"""
scheduler.py — Run IndiaEventsFinder on a schedule, appending new results
to data/events_master.json without duplicates.  Logs each run with timestamp.
"""

import json
import logging
import time
from datetime import datetime
from pathlib import Path

from events_finder import (
    build_query_plan,
    console,
    deduplicate,
    search_events,
    RATE_LIMIT_SECONDS,
)

DATA_DIR = Path(__file__).parent / "data"
MASTER_FILE = DATA_DIR / "events_master.json"
LOG_FILE = DATA_DIR / "scheduler.log"

# Set up file logging
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s  %(levelname)s  %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("scheduler")


def load_master() -> list[dict]:
    """Load existing master events list."""
    if MASTER_FILE.exists():
        with open(MASTER_FILE, encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
    return []


def save_master(events: list[dict]) -> None:
    """Save the master events list."""
    with open(MASTER_FILE, "w", encoding="utf-8") as f:
        json.dump(events, f, indent=2, ensure_ascii=False)


def run() -> None:
    """Execute a full search run and merge into master."""
    start = datetime.now()
    logger.info("Scheduler run started")
    console.print(f"[bold cyan]Scheduler run — {start.isoformat()}[/bold cyan]")

    master = load_master()
    existing_urls = {e["url"] for e in master}
    logger.info("Master contains %d events", len(master))

    # Build query plan — use defaults (aggregator sites x common event types)
    plan = build_query_plan()
    # Limit to 35 queries per run to stay well within free tier
    plan = plan[:35]
    logger.info("Running %d queries", len(plan))

    new_events: list[dict] = []

    for i, (kw, site) in enumerate(plan, 1):
        label = f"site:{site} " if site else ""
        console.print(f"[dim][{i}/{len(plan)}] {label}{kw}[/dim]")

        results = search_events(kw, site=site)
        for ev in results:
            if ev["url"] not in existing_urls:
                new_events.append(ev)
                existing_urls.add(ev["url"])

        if i < len(plan):
            time.sleep(RATE_LIMIT_SECONDS)

    new_events = deduplicate(new_events)

    if new_events:
        master.extend(new_events)
        save_master(master)
        msg = f"Added {len(new_events)} new events (total: {len(master)})"
    else:
        msg = f"No new events found (total: {len(master)})"

    logger.info(msg)
    console.print(f"[green]{msg}[/green]")

    elapsed = (datetime.now() - start).total_seconds()
    logger.info("Run completed in %.1f seconds", elapsed)
    console.print(f"[dim]Completed in {elapsed:.1f}s[/dim]")


if __name__ == "__main__":
    run()
