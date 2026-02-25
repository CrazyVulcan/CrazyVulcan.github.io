from __future__ import annotations

import json
import uuid
from typing import Any

from .models import Board, Card, Column, Tag, Workspace
from .repositories import BoardRepository, CardRepository, ColumnRepository, TagRepository, WorkspaceRepository


class UtopiaBoardService:
    """Service boundary so UI/business code doesn't query raw tables directly."""

    def __init__(self, workspace_repo: WorkspaceRepository, board_repo: BoardRepository, column_repo: ColumnRepository, card_repo: CardRepository, tag_repo: TagRepository):
        self.workspace_repo = workspace_repo
        self.board_repo = board_repo
        self.column_repo = column_repo
        self.card_repo = card_repo
        self.tag_repo = tag_repo

    def create_workspace_with_board(self, workspace_name: str, board_name: str, column_names: list[str]) -> tuple[str, str, dict[str, str]]:
        workspace_id = f"wsp_{uuid.uuid4().hex[:10]}"
        board_id = f"brd_{uuid.uuid4().hex[:10]}"
        self.workspace_repo.create(Workspace(id=workspace_id, name=workspace_name))
        self.board_repo.create(Board(id=board_id, workspace_id=workspace_id, name=board_name))

        columns = []
        column_ids: dict[str, str] = {}
        position = 1000.0
        for name in column_names:
            col_id = f"col_{uuid.uuid4().hex[:10]}"
            column_ids[name] = col_id
            columns.append(Column(id=col_id, board_id=board_id, name=name, position=position))
            position += 1000.0
        self.column_repo.create_many(columns)
        return workspace_id, board_id, column_ids

    def create_card(self, board_id: str, column_id: str, title: str, card_type: str, external_id: str | None, metadata: dict[str, Any], tags: list[tuple[str, str | None]], workspace_id: str, position: float) -> str:
        card_id = f"crd_{uuid.uuid4().hex[:12]}"
        tag_ids: list[str] = []
        for tag_name, color in tags:
            tag_id = f"tag_{uuid.uuid4().hex[:10]}"
            tag = self.tag_repo.get_or_create(Tag(id=tag_id, workspace_id=workspace_id, name=tag_name, color=color))
            tag_ids.append(tag.id)

        self.card_repo.create(
            Card(
                id=card_id,
                board_id=board_id,
                column_id=column_id,
                title=title,
                description=None,
                card_type=card_type,
                external_id=external_id,
                position=position,
                metadata_json=json.dumps(metadata, separators=(",", ":")),
            ),
            tag_ids=tag_ids,
        )
        return card_id
