# World Mapper

A self-contained HTML/CSS/JS app for deterministic RPG campaign region generation.

## Project Location
This project now lives in the `World Mapper/` folder.

## Tables
This version uses bundled table data from `sample-data.csv` (loaded automatically on page load).
CSV upload controls were intentionally removed so we can pivot to first-party in-app tables.

## Active Schema (bundled table source)
- `ID,Category,Label,DistrictRange,DistrictType,D6Roll,TypesPOI,MechanicalEffect,Tags,FollowUps,Persistence`
- Mixed Travel/Realm rows are detected by `Category` (`TravelEvent` / `RealmTrait`) and mapped into:
  - `ID,Category,Label,TriggerRange,MechanicalEffect,FictionText,Tags,FollowUps,Persistence`

## Generator Flow
1. Load bundled table file and validate required columns.
2. Seed deterministic PRNG from seed string.
3. Generate districts (size 1–8):
   - Pick place matching `DistrictRange` (fallback random if no match).
   - Generate 1–3 POIs and at least one NPC.
4. Generate NPCs using d100 race rarity/race, class, and motivation tables plus d6 attitude.
5. Resolve follow-ups by row ID or label; skip gracefully if missing.
6. Render map/detail panels, tag filters, and logs.
7. Export full JSON and persist notes/persistent flags in localStorage.

## Reproducibility
Same **seed + region size + bundled table data** => identical exported JSON.
