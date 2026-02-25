from __future__ import annotations

import sqlite3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS_DIR = ROOT / "db" / "migrations"


def connect(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def apply_sql_file(conn: sqlite3.Connection, sql_path: Path) -> None:
    conn.executescript(sql_path.read_text(encoding="utf-8"))


def migrate_up(conn: sqlite3.Connection) -> None:
    apply_sql_file(conn, MIGRATIONS_DIR / "001_create_utopia_v2_up.sql")


def migrate_down(conn: sqlite3.Connection) -> None:
    apply_sql_file(conn, MIGRATIONS_DIR / "001_create_utopia_v2_down.sql")
