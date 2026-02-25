# Utopia Data Layer (Phase 1)

## Repo Recon (Current State)

### Where schema/data lives today
- Utopia currently loads a single denormalized JSON payload from `data/data.json` via Angular `$http` in `utopia-card-loader`. There is no relational DB/ORM layer yet.
- Source records are authored in category-specific JS modules (`ships`, `captains`, `upgrades`, etc.) and merged into one payload by `src/data/index.js`.
- User state is mostly browser-local (`localStorage.defaults`) and fleet serialization in URL hash.

### Where data is accessed
- `src/js/common/utopia-card-loader.js` performs direct category iteration, duplicate checks, enrichment, and merges all cards into one in-memory array.
- `src/js/utopia-fleet-builder.js` mutates nested fleet objects directly in controllers/directives.

### Current pain points
1. **No persistence boundary**: UI code and data-transform logic are tightly coupled.
2. **Denormalized payload**: all card categories are loaded as large arrays; query/index constraints are not enforceable.
3. **Inconsistent ownership/lifecycle**: rules, data loading, and mutation are interwoven.
4. **Stringly-typed identifiers and category buckets**: category keys drive behavior implicitly.
5. **No referential integrity or migration safety**: duplicates are runtime-checked only.

---

## Proposed Schema (ERD style)

- **users** (optional actor identity)
- **workspaces** (root ownership boundary)
- **boards** (list-building spaces inside a workspace)
- **columns** (ordered lanes/list buckets per board)
- **cards** (ordered items in a column; typed; extensible metadata)
- **tags** + **card_tags** (many-to-many labels)
- **card_links** (external reference URLs)
- **saved_views** (persisted filters/sorts)
- **activities** (audit/event stream)

Relationships:
- `workspace 1..n boards`
- `board 1..n columns`
- `board 1..n cards`
- `column 1..n cards`
- `cards n..m tags` via `card_tags`
- `card 1..n card_links`
- `board 1..n saved_views`
- `board 1..n activities` and optionally `card 0..n activities`

### Normalized vs embedded JSON
- **Normalized**: workspace/board/column/card/tag/link/view/activity relations, because these are queried/joined frequently and need integrity guarantees.
- **Embedded JSON**: `cards.metadata_json`, `saved_views.filter_json`, `saved_views.sort_json`, `activities.payload_json` for flexible, evolving payloads without schema churn.

### Ordering strategy
- Uses **fractional/numeric positions with gaps** (`REAL`, seeded with `1000, 2000, ...`).
- Rationale: simple drag/drop insertions without full reindex in common operations; easy to rebalance later.

### Integrity and indexing
- FK cascades on board/column/card ownership.
- Unique constraints for:
  - `boards(workspace_id, name)`
  - `columns(board_id, name)`
  - `tags(workspace_id, name)`
  - `cards(board_id, card_type, external_id)`
- Indexes for board/column ordering, tags, card lookup, and activity feed recency.

---

## Migration + Backfill Plan

1. Apply `001_create_utopia_v2_up.sql`.
2. Back up existing sqlite DB file (if any).
3. Import legacy `src/data/backup/data.json` into:
   - one workspace (`Legacy Utopia Import`)
   - one board (`Imported Card Catalog`)
   - columns by legacy bucket (`Ships`, `Captains`, ...)
   - one card row per legacy record with raw data in `metadata_json`
   - tags for source bucket and factions
4. Run verification script to confirm row counts + no orphan join rows.

Rollback:
- `--rebuild` option runs down migration before rebuilding.
- DB file backup is written before mutation for recovery.

---

## Developer Ergonomics

### Migration command
```bash
Frontiers/Utopia/migrate_utopia_data --rebuild
```

### Validation command
```bash
python3 Frontiers/Utopia/scripts/verify_utopia_data.py --db-path Frontiers/Utopia/db/utopia.sqlite
```

### Data access boundary
Use `utopia_data/repositories.py` + `utopia_data/services.py` for read/write paths instead of direct SQL from app/business logic.

---

## Assumptions
- This repo currently has no running server-side DB integration for Utopia; Phase 1 therefore introduces a DB layer in parallel without forcing immediate UI rewrites.
- Legacy source-of-truth for migration is `src/data/backup/data.json` (JSON-safe and deterministic).
- Soft-delete behavior is retained as optional fields (`archived_at`) only where list/card archival semantics are expected.
