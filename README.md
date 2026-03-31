# X-Wing Alliance Website Rebuild

A lightweight static rebuild focused on three goals:

1. **Easy volunteer upkeep** (content comes from one JSON file).
2. **Clear audience communication** (hero, quick links, updates).
3. **Brand-aligned presentation** (XWA-inspired palette and visual hierarchy).

## How to Update Content
Most updates happen in `data/site-content.json`:

- `hero`: top-of-page summary, milestone, buttons.
- `nav`: primary navigation links.
- `quickLinks`: featured destinations.
- `updates`: latest communications.
- `footer`: maintenance guidance.

No HTML/CSS changes are required for normal content updates.

## Local Preview
Because `app.js` fetches JSON, use a local server (instead of opening `index.html` directly):

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Brand Notes
This implementation encodes brand color tokens in `styles.css` and links to the official brand book page for current guidance:

- https://www.xwing.life/resources/xwa-brand-book

If the PR team releases updated guidance, update the CSS variables and any typography choices to match.
