# World Mapper

A self-contained HTML/CSS/JS app for deterministic RPG region generation.

## What changed
This version focuses on your requested **drill-down region flow** and removes CSV upload.

## Generator Flow (your table structure)
1. **Pick a theme** from:
   - Civilized, Haunted, Magical, Isolated, Frontier, Militaristic, Religious, Decaying, Ancient, Industrial.
2. **Pick population centers** (count chosen by user).
3. For each center, choose a center type template:
   - Village: `1` district, letters `A`
   - Town: `3` districts, letters `A A B`
   - City: `5` districts, letters `A A B B C`
   - Huge City: `7` districts, letters `B B C C C D E`
   - Port: `2` districts, letters `A E`
4. For each district letter, pick a broad location type:
   - A: Farming, Trade, Housing, Manor, Tower
   - B: Trade, Shops, Factory, Guilds, Mansion
   - C: University, Palace, Fortress, Temple, Historic
   - D: Guild HQ, Seat of Power
   - E: Docks, Warehouse, Trade, Bank
5. Drill down to a specific site (for example `Factory -> Magic`, `Tower -> Armory`, `Seat of Power -> King`).
6. Attach an **NPC placeholder** (race/class/motivation starter tables + d6 attitude) and generate a unique one-sentence story hook from the combination of motivation + region theme + district location.

## Reproducibility
Same **seed + population center count** gives identical output.

## Persistence + export
- District notes + persistent marks are stored in localStorage.
- Export outputs full generated JSON for centers, districts, drill-down choices, and NPC placeholders.
