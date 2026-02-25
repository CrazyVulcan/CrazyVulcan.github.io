from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class Workspace:
    id: str
    name: str
    owner_user_id: Optional[str] = None


@dataclass(frozen=True)
class Board:
    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None


@dataclass(frozen=True)
class Column:
    id: str
    board_id: str
    name: str
    position: float


@dataclass(frozen=True)
class Card:
    id: str
    board_id: str
    column_id: str
    title: str
    description: Optional[str]
    card_type: Optional[str]
    external_id: Optional[str]
    position: float
    metadata_json: str


@dataclass(frozen=True)
class Tag:
    id: str
    workspace_id: str
    name: str
    color: Optional[str] = None
