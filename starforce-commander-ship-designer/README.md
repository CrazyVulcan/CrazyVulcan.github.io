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
- Shield box + shield-generator box rendering per facing (Fwd/Port/Stbd/Aft)
- Multi-line text blocks for functions/power/maneuvering
- Structure strip with repairable (gray) and permanent (red) box counts
- Save and restore drafts with `localStorage`
- Export current SSD build as JSON
