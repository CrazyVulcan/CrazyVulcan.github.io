from __future__ import annotations

import json
import sqlite3
from dataclasses import asdict
from typing import Iterable

from .models import Board, Card, Column, Tag, Workspace


class WorkspaceRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def create(self, workspace: Workspace) -> None:
        self.conn.execute(
            "INSERT INTO workspaces (id, name, owner_user_id) VALUES (:id, :name, :owner_user_id)",
            asdict(workspace),
        )


class BoardRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def create(self, board: Board) -> None:
        self.conn.execute(
            "INSERT INTO boards (id, workspace_id, name, description) VALUES (:id, :workspace_id, :name, :description)",
            asdict(board),
        )


class ColumnRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def create_many(self, columns: Iterable[Column]) -> None:
        self.conn.executemany(
            "INSERT INTO columns (id, board_id, name, position) VALUES (:id, :board_id, :name, :position)",
            [asdict(col) for col in columns],
        )


class TagRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def get_or_create(self, tag: Tag) -> Tag:
        row = self.conn.execute(
            "SELECT id, workspace_id, name, color FROM tags WHERE workspace_id = ? AND name = ?",
            (tag.workspace_id, tag.name),
        ).fetchone()
        if row:
            return Tag(**dict(row))
        self.conn.execute(
            "INSERT INTO tags (id, workspace_id, name, color) VALUES (:id, :workspace_id, :name, :color)",
            asdict(tag),
        )
        return tag


class CardRepository:
    def __init__(self, conn: sqlite3.Connection):
        self.conn = conn

    def create(self, card: Card, tag_ids: list[str] | None = None) -> None:
        payload = asdict(card)
        payload["metadata_json"] = card.metadata_json if isinstance(card.metadata_json, str) else json.dumps(card.metadata_json)
        self.conn.execute(
            """
            INSERT INTO cards
              (id, board_id, column_id, title, description, card_type, external_id, position, metadata_json)
            VALUES
              (:id, :board_id, :column_id, :title, :description, :card_type, :external_id, :position, :metadata_json)
            """,
            payload,
        )
        if tag_ids:
            self.conn.executemany(
                "INSERT INTO card_tags (card_id, tag_id) VALUES (?, ?)",
                [(card.id, tag_id) for tag_id in tag_ids],
            )

    def count(self) -> int:
        return int(self.conn.execute("SELECT COUNT(*) FROM cards").fetchone()[0])

    def list_for_board(self, board_id: str) -> list[sqlite3.Row]:
        return list(
            self.conn.execute(
                """
                SELECT c.*, col.name AS column_name
                FROM cards c
                JOIN columns col ON col.id = c.column_id
                WHERE c.board_id = ? AND c.archived_at IS NULL
                ORDER BY col.position, c.position
                """,
                (board_id,),
            ).fetchall()
        )
