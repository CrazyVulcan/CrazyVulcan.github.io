# X-Wing Alliance Website

This rebuild is optimized for a volunteer team:

1. **Easy upkeep**: routine updates happen in `data/site-content.json`.
2. **Clear communication**: audience-first sections for players, organizers, and creators.
3. **Brand alignment**: color + type system based on the X-Wing Alliance brand book pages provided.

## Content Editing Workflow
Edit `data/site-content.json`:

- `brand.wordmarkPath`: local path to your approved logo file.
- `nav`: top navigation links.
- `hero`: headline, summary, priority, and CTA buttons.
- `audiences`: cards for key target groups.
- `updates`: date-stamped official communication list.
- `about.boilerplate`: approved organization reference text.
- `footer`: maintenance/legal lines.

## Brand Assets & Fonts
- Place approved logo files in `assets/brand/`.
- If licensed font files are available, place them in `assets/fonts/`:
  - `kimberley.woff2`
  - `eurostile.woff2`

The site uses Roboto/Roboto Condensed fallbacks if those files are not present.

## Local Preview
Because the page loads JSON via `fetch`, run a local server:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.
