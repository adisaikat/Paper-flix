import json
import sqlite3
import time  # Add this at the top with your other imports
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.error import HTTPError  # Add this too

from sentence_transformers import SentenceTransformer

# 1. Connect to the absolute path we established earlier
home_dir = Path.home()
db_folder = home_dir / "Paper-flix" / "db"
db_path = db_folder / "papers.db"

# Ensure the directory exists before trying to connect
db_folder.mkdir(parents=True, exist_ok=True)

print(f"Connecting to database at: {db_path}")
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()
print(f"Connecting to database at: {db_path}")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Ensure table exists
cursor.execute(
    """
    CREATE TABLE IF NOT EXISTS papers (
        id TEXT PRIMARY KEY, 
        title TEXT, 
        abstract TEXT, 
        vector JSON
    )
"""
)


print("Fetching latest 200 diverse CS papers from arXiv API...")
# url = "http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.SE+OR+cat:cs.LG+OR+cat:cs.CV+OR+cat:cs.CR&start=0&max_results=200&sortBy=submittedDate&sortOrder=descending"
url = "http://export.arxiv.org/api/query?search_query=cat:cs.AI+OR+cat:cs.SE+OR+cat:cs.LG+OR+cat:cs.CV+OR+cat:cs.CR&start=400&max_results=200&sortBy=submittedDate&sortOrder=descending"
# Create a request object with a fake User-Agent
req = urllib.request.Request(
    url,
    headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    },
)

try:
    data = urllib.request.urlopen(req).read()
except HTTPError as e:
    if e.code == 429:
        print(
            "Got hit with a 429 Rate Limit! arXiv is angry. Waiting 15 seconds and trying one more time..."
        )
        time.sleep(15)
        data = urllib.request.urlopen(req).read()  # Try again
    else:
        raise e

# Parse the XML response
# ... [the rest of your XML parsing and embedding code stays the same] ...

# Parse the XML response
root = ET.fromstring(data)
namespace = {"atom": "http://www.w3.org/2005/Atom"}

papers = []
for entry in root.findall("atom:entry", namespace):
    # Clean up the raw strings (arXiv adds a lot of weird newline characters)
    raw_id = entry.find("atom:id", namespace).text
    # Extracts just '2403.12345'
    paper_id = raw_id.split("/abs/")[-1].split("v")[0]

    title = entry.find("atom:title", namespace).text.replace("\n", " ").strip()
    abstract = entry.find("atom:summary", namespace).text.replace("\n", " ").strip()

    papers.append({"id": paper_id, "title": title, "abstract": abstract})

print(f"Successfully downloaded {len(papers)} papers. Loading ML model...")

# 3. Load Model
model = SentenceTransformer("all-MiniLM-L6-v2")

# 4. Embed and Save to SQLite
print("Generating vectors and saving to database. This might take a few seconds...")
for i, p in enumerate(papers):
    # Print progress every 10 papers
    if i % 10 == 0 and i > 0:
        print(f"  ...processed {i}/{len(papers)} papers")

    # Generate the 768-dimensional vector
    vector = model.encode(p["abstract"]).tolist()

    # INSERT OR REPLACE handles duplicates cleanly if you run this script multiple times
    cursor.execute(
        "INSERT OR REPLACE INTO papers VALUES (?, ?, ?, ?)",
        (p["id"], p["title"], p["abstract"], json.dumps(vector)),
    )

conn.commit()
conn.close()
print("🎉 Database successfully populated with real arXiv data!")
