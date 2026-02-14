# Starforce Commander Ship Designer (Starter)

Simple static web app prototype for creating custom ships, validating power usage, saving drafts locally, and exporting JSON builds.

## Run locally

```bash
cd starforce-commander-ship-designer
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Included features

- Ship chassis form (name, faction, class, size, stats)
- Module slot selection (weapon/engine/utility)
- Power budget validation
- Live JSON preview
- Save drafts to `localStorage`
- Export current build as JSON
