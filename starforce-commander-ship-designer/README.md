# Starforce Commander SSD Designer

A static prototype for designing **Starforce Commander SSD-style ship cards** inspired by Yorktown-style layout blocks.

## Run locally

```bash
cd starforce-commander-ship-designer
python3 -m http.server 4173
```

Open: `http://localhost:4173`

## Features

- Left-side stat editor with right-side live SSD template preview
- Template sections for engineering, shields, weapons, systems, and structure footer
- Single shield-generator value that renders black generator boxes + matching green boxes on each facing
- Multi-line text blocks for functions/power/maneuvering
- Structure strip with repairable (gray) and permanent (red) box counts
- Custom ship art upload rendered in the shield center
- Save and restore drafts with `localStorage`
- Export current SSD build as JSON

## Balance note: Aquila Bellum II (Aurelian heavy cruiser)

For the current glass-cannon configuration (cloak access, one high-spike plasma-torpedo strike profile, and low sustained durability), a good starting point is:

- **Recommended point value: 30 PV**
- **Playtest range: 29–31 PV**

Rationale:

- Keep it close to York II heavy-cruiser parity while charging a small premium for reliable cloak-enabled approach vectors.
- Avoid pricing for theoretical best-case alpha damage every round; the ship's power and survivability profile makes that burst intermittent.
- Reward high-risk hit-and-run play without letting failed disengage attempts become too punishing from a list-building perspective.

Practical tuning after 6–10 games:

- Raise to **31 PV** if cloak-first strike consistently decides games by turn 2–3.
- Lower to **29 PV** if it frequently trades down before a second meaningful torpedo window.
