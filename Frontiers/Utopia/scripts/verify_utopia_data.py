#!/usr/bin/env python3
from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path


def fetch_int(conn: sqlite3.Connection, sql: str) -> int:
    return int(conn.execute(sql).fetchone()[0])


def verify(db_path: Path) -> None:
    conn = sqlite3.connect(db_path)
    try:
        conn.execute("PRAGMA foreign_keys = ON")

        cards = fetch_int(conn, "SELECT COUNT(*) FROM cards")
        columns = fetch_int(conn, "SELECT COUNT(*) FROM columns")
        boards = fetch_int(conn, "SELECT COUNT(*) FROM boards")
        orphan_tags = fetch_int(
            conn,
            """
            SELECT COUNT(*) FROM card_tags ct
            LEFT JOIN cards c ON c.id = ct.card_id
            LEFT JOIN tags t ON t.id = ct.tag_id
            WHERE c.id IS NULL OR t.id IS NULL
            """,
        )

        if cards <= 0:
            raise AssertionError("No cards found after migration")
        if columns <= 0 or boards <= 0:
            raise AssertionError("Missing core entities (boards/columns)")
        if orphan_tags != 0:
            raise AssertionError(f"Found {orphan_tags} orphan card_tags")

        print(f"OK: boards={boards}, columns={columns}, cards={cards}, orphan_card_tags={orphan_tags}")
    finally:
        conn.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate migrated Utopia data")
    parser.add_argument("--db-path", default="Frontiers/Utopia/db/utopia.sqlite")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    verify(Path(args.db_path))
