#!/usr/bin/env python3
from __future__ import annotations

import json
import sqlite3
import sys
import uuid
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from utopia_data.db import connect, migrate_up

DB_PATH = ROOT / "db" / "utopia.sqlite"
STATIC_DIR = ROOT / "main" / "static"


def _row_to_dict(row: sqlite3.Row) -> dict:
    return {k: row[k] for k in row.keys()}


def ensure_schema(conn: sqlite3.Connection) -> None:
    migrate_up(conn)


def ensure_default_board(conn: sqlite3.Connection) -> None:
    board_count = conn.execute("SELECT COUNT(*) FROM boards").fetchone()[0]
    if board_count:
        return

    workspace_id = f"wsp_{uuid.uuid4().hex[:10]}"
    board_id = f"brd_{uuid.uuid4().hex[:10]}"
    conn.execute("INSERT INTO workspaces (id, name) VALUES (?, ?)", (workspace_id, "Default Workspace"))
    conn.execute(
        "INSERT INTO boards (id, workspace_id, name, description) VALUES (?, ?, ?, ?)",
        (board_id, workspace_id, "Utopia Board", "Default board"),
    )
    for i, name in enumerate(["Backlog", "Doing", "Done"], start=1):
        conn.execute(
            "INSERT INTO columns (id, board_id, name, position) VALUES (?, ?, ?, ?)",
            (f"col_{uuid.uuid4().hex[:10]}", board_id, name, float(i * 1000)),
        )
    conn.commit()


def list_board_payload(conn: sqlite3.Connection, board_id: str, tag: str | None = None) -> dict:
    board = conn.execute("SELECT * FROM boards WHERE id = ?", (board_id,)).fetchone()
    if not board:
        raise KeyError("Board not found")

    columns = [
        _row_to_dict(r)
        for r in conn.execute(
            "SELECT * FROM columns WHERE board_id = ? AND archived_at IS NULL ORDER BY position, id", (board_id,)
        ).fetchall()
    ]

    where = "WHERE c.board_id = ? AND c.archived_at IS NULL"
    params: list[object] = [board_id]
    if tag:
        where += " AND EXISTS (SELECT 1 FROM card_tags ct JOIN tags t ON t.id = ct.tag_id WHERE ct.card_id = c.id AND t.name = ?)"
        params.append(tag)

    cards = [
        _row_to_dict(r)
        for r in conn.execute(
            f"""
            SELECT c.* FROM cards c
            {where}
            ORDER BY c.position, c.id
            """,
            params,
        ).fetchall()
    ]

    tag_rows = conn.execute(
        """
        SELECT ct.card_id, t.id AS tag_id, t.name, t.color
        FROM card_tags ct
        JOIN tags t ON t.id = ct.tag_id
        JOIN cards c ON c.id = ct.card_id
        WHERE c.board_id = ?
        """,
        (board_id,),
    ).fetchall()

    tags_by_card: dict[str, list[dict]] = {}
    for row in tag_rows:
        tags_by_card.setdefault(row["card_id"], []).append(
            {"id": row["tag_id"], "name": row["name"], "color": row["color"]}
        )

    for card in cards:
        card["metadata"] = json.loads(card.get("metadata_json") or "{}")
        card["tags"] = tags_by_card.get(card["id"], [])

    views = [
        _row_to_dict(r)
        for r in conn.execute("SELECT * FROM saved_views WHERE board_id = ? ORDER BY name", (board_id,)).fetchall()
    ]

    return {"board": _row_to_dict(board), "columns": columns, "cards": cards, "views": views}


def create_tag(conn: sqlite3.Connection, workspace_id: str, name: str, color: str | None = None) -> str:
    row = conn.execute("SELECT id FROM tags WHERE workspace_id = ? AND name = ?", (workspace_id, name)).fetchone()
    if row:
        return row["id"]
    tag_id = f"tag_{uuid.uuid4().hex[:10]}"
    conn.execute("INSERT INTO tags (id, workspace_id, name, color) VALUES (?, ?, ?, ?)", (tag_id, workspace_id, name, color))
    return tag_id


def compute_midpoint(prev_pos: float | None, next_pos: float | None) -> float:
    if prev_pos is None and next_pos is None:
        return 1000.0
    if prev_pos is None:
        return next_pos / 2.0
    if next_pos is None:
        return prev_pos + 1000.0
    return (prev_pos + next_pos) / 2.0


class Handler(BaseHTTPRequestHandler):
    def _conn(self) -> sqlite3.Connection:
        conn = connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    def _json(self, code: int, payload: dict | list):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        return json.loads(raw.decode("utf-8"))

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/":
            html = (STATIC_DIR / "index.html").read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(html)))
            self.end_headers()
            self.wfile.write(html)
            return

        if parsed.path.startswith("/static/"):
            path = STATIC_DIR / parsed.path.removeprefix("/static/")
            if path.exists() and path.is_file():
                data = path.read_bytes()
                ctype = "application/javascript" if path.suffix == ".js" else "text/css"
                self.send_response(200)
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
                return
            self.send_error(404)
            return

        if parsed.path == "/api/bootstrap":
            conn = self._conn()
            try:
                ensure_schema(conn)
                ensure_default_board(conn)
                boards = [_row_to_dict(r) for r in conn.execute("SELECT * FROM boards ORDER BY created_at, id").fetchall()]
                self._json(200, {"boards": boards})
            finally:
                conn.close()
            return

        if parsed.path.startswith("/api/boards/") and parsed.path.endswith("/state"):
            board_id = parsed.path.split("/")[3]
            tag = parse_qs(parsed.query).get("tag", [None])[0]
            conn = self._conn()
            try:
                self._json(200, list_board_payload(conn, board_id, tag=tag))
            except KeyError:
                self._json(404, {"error": "board_not_found"})
            finally:
                conn.close()
            return

        self.send_error(404)

    def do_POST(self):
        parsed = urlparse(self.path)
        payload = self._read_json()
        conn = self._conn()
        try:
            ensure_schema(conn)
            if parsed.path == "/api/boards":
                name = payload.get("name", "New Board").strip() or "New Board"
                workspace = conn.execute("SELECT id FROM workspaces ORDER BY created_at LIMIT 1").fetchone()
                if not workspace:
                    workspace_id = f"wsp_{uuid.uuid4().hex[:10]}"
                    conn.execute("INSERT INTO workspaces (id, name) VALUES (?, ?)", (workspace_id, "Default Workspace"))
                else:
                    workspace_id = workspace["id"]
                board_id = f"brd_{uuid.uuid4().hex[:10]}"
                conn.execute("INSERT INTO boards (id, workspace_id, name) VALUES (?, ?, ?)", (board_id, workspace_id, name))
                for i, col in enumerate(["Backlog", "Doing", "Done"], start=1):
                    conn.execute(
                        "INSERT INTO columns (id, board_id, name, position) VALUES (?, ?, ?, ?)",
                        (f"col_{uuid.uuid4().hex[:10]}", board_id, col, i * 1000.0),
                    )
                conn.commit()
                self._json(201, {"id": board_id})
                return

            if parsed.path.startswith("/api/boards/") and parsed.path.endswith("/columns"):
                board_id = parsed.path.split("/")[3]
                row = conn.execute("SELECT COALESCE(MAX(position),0) AS p FROM columns WHERE board_id = ?", (board_id,)).fetchone()
                col_id = f"col_{uuid.uuid4().hex[:10]}"
                conn.execute(
                    "INSERT INTO columns (id, board_id, name, position) VALUES (?, ?, ?, ?)",
                    (col_id, board_id, payload.get("name", "New List"), float(row["p"]) + 1000.0),
                )
                conn.commit()
                self._json(201, {"id": col_id})
                return

            if parsed.path == "/api/cards":
                card_id = f"crd_{uuid.uuid4().hex[:12]}"
                board_id = payload["board_id"]
                col_id = payload["column_id"]
                row = conn.execute(
                    "SELECT COALESCE(MAX(position),0) AS p FROM cards WHERE board_id = ? AND column_id = ?",
                    (board_id, col_id),
                ).fetchone()
                conn.execute(
                    """
                    INSERT INTO cards (id, board_id, column_id, title, description, card_type, external_id, position, metadata_json)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        card_id,
                        board_id,
                        col_id,
                        payload.get("title", "Untitled"),
                        payload.get("description"),
                        payload.get("card_type", "card"),
                        payload.get("external_id"),
                        float(row["p"]) + 1000.0,
                        json.dumps(payload.get("metadata", {}), separators=(",", ":")),
                    ),
                )
                for tag in payload.get("tags", []):
                    board = conn.execute("SELECT workspace_id FROM boards WHERE id = ?", (board_id,)).fetchone()
                    tag_id = create_tag(conn, board["workspace_id"], tag)
                    conn.execute("INSERT INTO card_tags (card_id, tag_id) VALUES (?, ?)", (card_id, tag_id))
                conn.commit()
                self._json(201, {"id": card_id})
                return

            if parsed.path.startswith("/api/cards/") and parsed.path.endswith("/move"):
                card_id = parsed.path.split("/")[3]
                to_column = payload["to_column_id"]
                prev_pos = payload.get("prev_position")
                next_pos = payload.get("next_position")
                new_pos = compute_midpoint(prev_pos, next_pos)
                conn.execute("UPDATE cards SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", (to_column, new_pos, card_id))
                conn.commit()
                self._json(200, {"id": card_id, "position": new_pos, "column_id": to_column})
                return

            if parsed.path.startswith("/api/boards/") and parsed.path.endswith("/views"):
                board_id = parsed.path.split("/")[3]
                view_id = f"view_{uuid.uuid4().hex[:10]}"
                conn.execute(
                    "INSERT INTO saved_views (id, board_id, name, filter_json, sort_json) VALUES (?, ?, ?, ?, ?)",
                    (
                        view_id,
                        board_id,
                        payload.get("name", "View"),
                        json.dumps(payload.get("filter", {}), separators=(",", ":")),
                        json.dumps(payload.get("sort", {"field": "position", "direction": "asc"}), separators=(",", ":")),
                    ),
                )
                conn.commit()
                self._json(201, {"id": view_id})
                return

            self._json(404, {"error": "not_found"})
        except Exception as exc:
            conn.rollback()
            self._json(500, {"error": "server_error", "detail": str(exc)})
        finally:
            conn.close()

    def do_PATCH(self):
        parsed = urlparse(self.path)
        if not parsed.path.startswith("/api/cards/"):
            return self.send_error(404)
        card_id = parsed.path.split("/")[3]
        payload = self._read_json()
        conn = self._conn()
        try:
            card = conn.execute("SELECT board_id FROM cards WHERE id = ?", (card_id,)).fetchone()
            if not card:
                self._json(404, {"error": "card_not_found"})
                return

            conn.execute(
                "UPDATE cards SET title = ?, description = ?, metadata_json = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                (
                    payload.get("title", "Untitled"),
                    payload.get("description"),
                    json.dumps(payload.get("metadata", {}), separators=(",", ":")),
                    card_id,
                ),
            )

            if "tags" in payload:
                conn.execute("DELETE FROM card_tags WHERE card_id = ?", (card_id,))
                workspace_id = conn.execute("SELECT workspace_id FROM boards WHERE id = ?", (card["board_id"],)).fetchone()[0]
                for tag in payload["tags"]:
                    tag_id = create_tag(conn, workspace_id, tag)
                    conn.execute("INSERT INTO card_tags (card_id, tag_id) VALUES (?, ?)", (card_id, tag_id))

            conn.commit()
            self._json(200, {"id": card_id})
        except Exception as exc:
            conn.rollback()
            self._json(500, {"error": "server_error", "detail": str(exc)})
        finally:
            conn.close()


def run(port: int = 8787) -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    httpd = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"Utopia server running on http://0.0.0.0:{port}")
    httpd.serve_forever()


if __name__ == "__main__":
    run()
