# Utopia Phase 1: Data Layer Refactor

This folder contains the normalized schema, migration/backfill scripts, and repository/service data access layer for Utopia.

## Quick start

```bash
# Build schema + backfill from legacy data
Frontiers/Utopia/migrate_utopia_data --rebuild

# Verify migrated integrity and counts
python3 Frontiers/Utopia/scripts/verify_utopia_data.py --db-path Frontiers/Utopia/db/utopia.sqlite
```

See `schema.md` for ERD, normalization rationale, indexing strategy, and migration notes.
