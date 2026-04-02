# IndiaEventsFinder

A Python CLI tool to discover conferences, hackathons, workshops, fests, and other events at top Indian institutes (IITs, NITs, BITS, IIMs, IISc, etc.) using Google Custom Search API.

## Features

- **Smart search** across LinkedIn Events, Unstop, Devfolio, Townscript, WikiCFP, Insider.in, and institute websites
- **Result scoring** — boosts results with specific dates, institute names, and registration links
- **Beautiful CLI output** using the `rich` library
- **Filtering** by institute, event type, keyword, and date range
- **HTML dashboard** for visual browsing with category filters and search
- **Scheduler** for automatic runs with deduplication
- **GitHub Actions** workflow for weekly automated runs

## Setup

### 1. Get Google Custom Search API credentials (free)

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or use an existing one)
3. Enable the **Custom Search API**
4. Create an API key — this is your `GOOGLE_API_KEY`
5. Go to [Programmable Search Engine](https://programmablesearchengine.google.com/)
6. Create a new search engine — set it to search the **entire web**
7. Copy the **Search engine ID** — this is your `GOOGLE_CX`

> Free tier: 100 queries/day. The tool defaults to 35 queries per run.

### 2. Install

```bash
cd IndiaEventsFinder
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API key and CX
```

### 3. Run

```bash
# Full search with defaults (35 queries)
python events_finder.py

# Search for a specific keyword
python events_finder.py -k "AI hackathon"

# Limit to specific event types
python events_finder.py -t hackathon workshop

# Limit to specific sites
python events_finder.py -s unstop.com devfolio.co

# Add a location filter
python events_finder.py -k "hackathon" -l "Chennai"

# Dry run — see queries without using API quota
python events_finder.py --dry-run

# Limit number of queries
python events_finder.py -n 10
```

### 4. Filter results

```bash
# Show only IIT events
python filter.py -i "IIT"

# Show only hackathons
python filter.py -t hackathon

# Search by keyword
python filter.py -k "machine learning"

# Filter by date range
python filter.py --from-date 2025-03-01 --to-date 2025-04-30

# Combine filters and save
python filter.py -i "IIT" -t hackathon -o iit_hackathons
```

### 5. Dashboard

Open `dashboard.html` in a browser. It will try to auto-load `data/events.json`. You can also use the file picker to load any events JSON file.

For auto-loading to work, serve the directory locally:

```bash
python -m http.server 8000
# Open http://localhost:8000/dashboard.html
```

### 6. Scheduler

```bash
python scheduler.py
```

Appends new events to `data/events_master.json` with deduplication. Logs each run to `data/scheduler.log`.

## GitHub Actions (Automated Weekly Runs)

The included workflow runs every Monday morning.

### Setup:

1. Go to your repo **Settings > Secrets and variables > Actions**
2. Add two repository secrets:
   - `GOOGLE_API_KEY`
   - `GOOGLE_CX`
3. The workflow runs automatically or can be triggered manually from the Actions tab

Results are uploaded as artifacts and committed back to the repo.

## Project Structure

```
IndiaEventsFinder/
├── .env.example          # Template for API credentials
├── requirements.txt      # Python dependencies
├── events_finder.py      # Main CLI search tool
├── filter.py             # Filter saved results
├── scheduler.py          # Automated runner with dedup
├── dashboard.html        # Visual HTML dashboard
├── README.md
├── .github/
│   └── workflows/
│       └── events.yml    # GitHub Actions weekly workflow
└── data/
    ├── events_master.json  # Cumulative results
    ├── events.json         # Latest run results
    └── events.csv          # Latest run CSV export
```

## Output Format

Each event object:

```json
{
  "title": "HackIITB 2025 - India's Largest Student Hackathon",
  "url": "https://unstop.com/hackathons/hackiitb-2025",
  "source": "unstop",
  "institute": "IIT Bombay",
  "event_type": "hackathon",
  "snippet": "48-hour hackathon at IIT Bombay. Register by March 15, 2025.",
  "date_raw": "15 March 2025",
  "found_on": "2025-04-02",
  "score": 23
}
```

## Tips for Staying Within Free Tier

- Default run uses ~35 queries (out of 100/day limit)
- Use `--dry-run` to preview queries before executing
- Use `-n` to limit queries per run
- Use `-k` with a specific keyword to run targeted searches
- The scheduler is designed for once-weekly runs via GitHub Actions
