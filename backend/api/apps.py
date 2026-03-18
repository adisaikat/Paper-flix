import json
import sqlite3
from pathlib import Path  # <-- Added missing import

from django.apps import AppConfig

paper_cache = []


class ApiConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "api"

    def ready(self):
        # Prevent loading twice in dev mode
        if paper_cache:
            return

        try:
            # 1. Properly indented inside the try block
            BASE_DIR = Path(__file__).resolve().parent.parent.parent
            DB_PATH = BASE_DIR / "db" / "papers.db"

            # 2. Match the exact casing of DB_PATH
            conn = sqlite3.connect(DB_PATH)

            # Ensure tables exist (just like Go)
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT
                );
                CREATE TABLE IF NOT EXISTS user_history (
                    user_id TEXT,
                    paper_id TEXT,
                    PRIMARY KEY (user_id, paper_id)
                );
                """
            )

            cursor = conn.cursor()
            cursor.execute("SELECT id, title, abstract, vector FROM papers")

            for row in cursor.fetchall():
                paper_cache.append(
                    {
                        "id": row[0],
                        "title": row[1],
                        "abstract": row[2],
                        "vector": json.loads(row[3]),
                    }
                )
            print(f"✅ Loaded {len(paper_cache)} papers into memory")
        except Exception as e:
            print("Failed to load DB on startup:", e)
