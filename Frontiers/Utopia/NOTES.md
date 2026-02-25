# Phase 2 Wiring Notes

## Recon + Diff map
- Current app entry path is now `main/static/index.html` + `main/static/app.js`, served by `main/server.py`.
- UI read/write now flows through REST bindings in `main/server.py` (bootstrap, board state, card/list mutations, views).
- Removed old schema assumptions from UI wiring: no category-bucket reads (`ships/captains/...`) and no denormalized single-array access in components.
- Replaced with relational assumptions: `board -> columns -> cards`, tags through `card_tags`, stable ordering by `position` with `id` tie-break.


## Updated entry points
- Added browser app entry at `main/static/index.html` and JS entry `main/static/app.js`.
- Added runtime launcher `main/run_utopia` (wraps `main/server.py`).

## Updated state/store/data hooks
- Added canonical board-state adapter `main/static/domain/adapters.js`.
- UI now boots via `/api/bootstrap` and loads board state from `/api/boards/:id/state`.
- Added API writes for create board/list/card, edit card, move card, and save views.

## Updated components/data contracts
- UI now uses canonical schema concepts: `boards`, `columns`, `cards`, `tags` (`card_tags` join), and `saved_views`.
- Legacy bucket assumptions are removed from UI wiring; rendering is column/card relational.
- Drag/drop uses numeric gap indexing (`position` midpoint strategy) and stable sort by `(position, id)`.

## Remaining known follow-ups
- Server is stdlib HTTP (no auth/multi-user session isolation yet).
- Rebalancing logic for dense `position` values is not yet implemented (midpoint strategy in place).
- Activity stream exists in schema but is not surfaced in UI yet.
