# Frontiers

This repo includes the refactored Utopia app in `Frontiers/Utopia`.

## Run the refactored Utopia app

From the `Frontiers` folder:

```bash
./run_utopia_refactored
```

The script will:
1. Ensure the Utopia runner exists.
2. Auto-run migration/backfill once if `Utopia/db/utopia.sqlite` is missing.
3. Start the app server at `http://127.0.0.1:8787`.

## Alternative npm script workflow

```bash
npm run utopia:migrate
npm run utopia:verify
npm run utopia:run
```

Additional check:

```bash
npm run utopia:smoke
```
