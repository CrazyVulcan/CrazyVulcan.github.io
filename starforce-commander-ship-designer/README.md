# Starforce Commander SSD Designer

A static prototype for designing **Starforce Commander SSD-style ship cards** inspired by the Yorktown II layout.

## Run locally

```bash
cd starforce-commander-ship-designer
python3 -m http.server 4173
```

Open: `http://localhost:4173`

## Features

- SSD-focused sections: identity, engineering, shields, weapons, and systems
- Live SSD preview card while editing fields
- Weapons/system parsing from simple line-based text inputs
- Save and restore drafts with `localStorage`
- Export current SSD build as JSON
