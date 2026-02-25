#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import shutil
import sys
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from utopia_data import (
    BoardRepository,
    CardRepository,
    ColumnRepository,
    TagRepository,
    UtopiaBoardService,
    WorkspaceRepository,
    connect,
    migrate_down,
    migrate_up,
)

DEFAULT_DB_PATH = ROOT / "db" / "utopia.sqlite"
DEFAULT_LEGACY_PATH = ROOT.parent / "src" / "data" / "backup" / "data.json"


def backup_db(db_path: Path) -> Path | None:
    if not db_path.exists():
        return None
    ts = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    backup_path = db_path.with_suffix(f".sqlite.bak.{ts}")
    shutil.copy2(db_path, backup_path)
    return backup_path


def load_legacy_data(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as fp:
        return json.load(fp)


def source_buckets() -> list[str]:
    return ["ships", "captains", "admirals", "ambassadors", "upgrades", "resources", "others"]


def migrate(args: argparse.Namespace) -> None:
    db_path = Path(args.db_path)
    legacy_path = Path(args.legacy_path)

    if not legacy_path.exists():
        raise FileNotFoundError(f"Legacy source does not exist: {legacy_path}")

    backup_path = backup_db(db_path)
    db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = connect(db_path)
    try:
        if args.rebuild:
            migrate_down(conn)
        migrate_up(conn)

        service = UtopiaBoardService(
            WorkspaceRepository(conn),
            BoardRepository(conn),
            ColumnRepository(conn),
            CardRepository(conn),
            TagRepository(conn),
        )
        card_repo = CardRepository(conn)
        legacy = load_legacy_data(legacy_path)

        workspace_id, board_id, columns = service.create_workspace_with_board(
            workspace_name="Legacy Utopia Import",
            board_name="Imported Card Catalog",
            column_names=[bucket.capitalize() for bucket in source_buckets()],
        )

        seen_keys: dict[tuple[str, str | None], int] = {}

        for bucket in source_buckets():
            position = 1000.0
            for item in legacy.get(bucket, []):
                metadata = {
                    "legacy_source": bucket,
                    "set": item.get("set"),
                    "factions": item.get("factions", []),
                    "cost": item.get("cost"),
                    "raw": item,
                }
                tags = [(bucket[:-1] if bucket.endswith("s") else bucket, "#64748b")]
                for faction in item.get("factions", []) or []:
                    tags.append((f"faction:{faction}", None))

                card_type = item.get("type", bucket[:-1])
                base_external_id = str(item.get("id")) if item.get("id") is not None else None
                key = (card_type, base_external_id)
                dedupe_count = seen_keys.get(key, 0)
                seen_keys[key] = dedupe_count + 1
                external_id = base_external_id if dedupe_count == 0 else f"{base_external_id}::dup{dedupe_count}"

                service.create_card(
                    board_id=board_id,
                    column_id=columns[bucket.capitalize()],
                    title=item.get("name") or f"{bucket}:{item.get('id', 'unknown')}",
                    card_type=card_type,
                    external_id=external_id,
                    metadata=metadata,
                    tags=tags,
                    workspace_id=workspace_id,
                    position=position,
                )
                position += 1000.0

        conn.commit()
        print(f"Migration completed: {db_path}")
        print(f"Imported {card_repo.count()} cards from {legacy_path}")
        if backup_path:
            print(f"Backup: {backup_path}")
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Migrate legacy Utopia data to normalized schema.")
    parser.add_argument("--db-path", default=str(DEFAULT_DB_PATH), help="Target sqlite database path")
    parser.add_argument("--legacy-path", default=str(DEFAULT_LEGACY_PATH), help="Legacy data.json path")
    parser.add_argument("--rebuild", action="store_true", help="Drop v2 tables before migrating")
    return parser.parse_args()


if __name__ == "__main__":
    migrate(parse_args())
