#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import time
import urllib.request
from pathlib import Path

BASE = "http://127.0.0.1:8787"
ROOT = Path(__file__).resolve().parents[1]


def req(path: str, method: str = "GET", payload: dict | None = None) -> dict:
    data = None
    headers = {"Content-Type": "application/json"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    r = urllib.request.Request(f"{BASE}{path}", method=method, data=data, headers=headers)
    with urllib.request.urlopen(r, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> None:
    proc = subprocess.Popen(["python3", str(ROOT / "main" / "server.py")])
    try:
        time.sleep(1.2)
        req("/api/bootstrap")
        created = req("/api/boards", "POST", {"name": "Smoke Board"})
        board_id = created["id"]

        col_resp = req(f"/api/boards/{board_id}/columns", "POST", {"name": "QA"})
        assert col_resp["id"]

        state = req(f"/api/boards/{board_id}/state")
        columns = state["columns"]
        first_col, second_col = columns[0]["id"], columns[1]["id"]

        card = req(
            "/api/cards",
            "POST",
            {"board_id": board_id, "column_id": first_col, "title": "Smoke Card", "description": "hello", "tags": ["test"]},
        )
        card_id = card["id"]

        req(f"/api/cards/{card_id}", "PATCH", {"title": "Smoke Card Edited", "description": "edited", "tags": ["test", "smoke"]})
        req(f"/api/cards/{card_id}/move", "POST", {"to_column_id": second_col, "prev_position": None, "next_position": None})

        filtered = req(f"/api/boards/{board_id}/state?tag=smoke")
        assert any(c["id"] == card_id for c in filtered["cards"]), "Tag filtering failed"

        req(f"/api/boards/{board_id}/views", "POST", {"name": "Smoke View", "filter": {"tag": "smoke"}})
        persisted = req(f"/api/boards/{board_id}/state")
        assert any(v["name"] == "Smoke View" for v in persisted["views"]), "Saved view not persisted"

        print("Smoke OK")
    finally:
        proc.terminate()
        proc.wait(timeout=5)


if __name__ == "__main__":
    main()
