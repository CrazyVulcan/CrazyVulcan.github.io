# Utopia Phase 1+2: Data Layer + App Wiring

This folder now contains:
- normalized schema/migrations/backfill tooling,
- repository/service data access layer,
- and a wired app shell that runs end-to-end against the new schema.

## Run app

```bash
Frontiers/Utopia/main/run_utopia
```

Open `http://127.0.0.1:8787`.

## Data setup

```bash
# Build schema + backfill from legacy data
Frontiers/Utopia/migrate_utopia_data --rebuild

# Verify migrated integrity and counts
python3 Frontiers/Utopia/scripts/verify_utopia_data.py --db-path Frontiers/Utopia/db/utopia.sqlite
```

## Smoke test

```bash
python3 Frontiers/Utopia/tests/smoke_phase2.py
```

See `schema.md` for ERD, normalization rationale, indexing strategy, and migration notes.
See `NOTES.md` for Phase 2 wiring details and known follow-ups.
