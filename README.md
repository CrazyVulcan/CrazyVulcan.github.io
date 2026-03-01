# RPG Campaign Region Generator

A self-contained HTML/CSS/JS app for deterministic RPG campaign region generation.

## CSV Inputs
The UI supports **two client-side CSV inputs**:

1. **Places/Shops CSV** (required)
   - `ID,Category,Label,DistrictRange,DistrictType,D6Roll,TypesPOI,MechanicalEffect,Tags,FollowUps,Persistence`
2. **Travel/Realm CSV** (optional if mixed rows are included in place file)
   - `ID,Category,Label,TriggerRange,MechanicalEffect,FictionText,Tags,FollowUps,Persistence`

`TypesPOI`, `Tags`, and `FollowUps` support comma or semicolon lists.

## Generator Flow
1. Parse CSV files and validate required columns.
2. Seed deterministic PRNG from seed string.
3. Generate districts (size 1–8):
   - Pick a place matching district index by `DistrictRange`.
   - Fallback to random place if no match.
   - Generate 1–3 POIs, at least one NPC, and one quest hook.
4. Generate NPCs using your d100-inspired race rarity -> race table, class table, and motivation table, plus d6 attitude.
5. Queue follow-ups from Place/Travel rows and resolve by table row name or ID.
6. Render map/detail panels, tag filters, and logs.
7. Export full JSON and persist notes/persistence flags in localStorage.

## Notes on Table Variants
The app normalizes common table typos/aliases from hand-authored tables (for example: `vilage -> village`, `milteristic -> militaristic`, `universty -> university`).

## Reproducibility
Same **seed + region size + CSV data** => identical exported JSON.
