# Nextcite

Landing page for **Nextcite**, an IT solutions company that designs and ships
software using AI-powered coding tools.

## Products

- [Spender](https://spender.nextcite.app) — a fast, focused personal finance tracker.

## Stack

Static site — plain HTML, CSS, and JS (no build step required).

- `index.html` — page markup
- `css/style.css` — styling
- `js/script.js` — nav toggle + scroll reveal animations

## Deployment

The site deploys to GitHub Pages automatically via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) whenever changes
are pushed to the `release` branch. It can also be triggered manually from the
Actions tab.

To ship a change:

```bash
git checkout release
git merge main   # or your working branch
git push origin release
```

GitHub Actions will build and publish the site to GitHub Pages automatically.
Make sure Pages is configured to deploy via **GitHub Actions** in the repo's
Settings → Pages.
