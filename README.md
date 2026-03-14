# Peusepage Desktop Site

Static, GitHub Pages-friendly website scaffold using plain HTML/CSS/JS.

## Why this setup

- Full control over visuals to match concept art closely.
- No framework lock-in.
- Easy maintenance: editable text/config is in `content/landing.json` and `content/main.json`.

## Project structure

- `index.html`: landing page (monitor + screensaver + transition).
- `main.html`: desktop-style main page shell.
- `assets/css/landing.css`: landing visuals and transitions.
- `assets/js/landing.js`: landing controls (dark mode/theme/language/enter).
- `assets/css/main.css`: desktop/popup style layer.
- `assets/js/main.js`: office scene behavior, popups, and controls.
- `content/landing.json`: editable landing text/themes/languages/transition config.
- `content/main.json`: editable main page language content, app popups, and links.
- `.github/workflows/pages.yml`: deploys to GitHub Pages.

## Updating text and configuration

Edit `content/landing.json`:

- `certificate`: name and card label.
- `languages`: title, sentence, and translated welcome text.
- `themes`: selectable screensaver backgrounds.
- `fonts`: welcome text font rotation.
- `transition`: message and transition duration to `main.html`.

Edit `content/main.json`:

- `themes`: CRT monitor screensaver themes.
- `languages`: per-language text for certificate, controls, and all popups.
- `contactLinks`: external profile and contact URLs shown in the certificate popup.

## GitHub Pages deployment

1. Push this repository to GitHub.
2. In repo settings, enable **Pages** and set source to **GitHub Actions**.
3. The included workflow publishes every push to `main`.

## Custom domain

1. Replace the value inside `CNAME` with your real domain (example: `site.example.com`).
2. In your DNS provider:
   - For root domain: add `A`/`AAAA` records for GitHub Pages.
   - For subdomain: add a `CNAME` record to `<username>.github.io`.
3. In GitHub Pages settings, confirm the custom domain and enable HTTPS.
