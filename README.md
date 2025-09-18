# Shopping Cart App

This repository contains the static assets for the Merrimore boutique hospitality landing page. The full site is available from the repository root (`index.html`) so that GitHub Pages works immediately with the **main branch / root** setting, while the same files are also kept inside `docs/` for teams that prefer the **main branch / docs folder** configuration.

## Getting started

Open `index.html` directly in your browser or use a simple HTTP server such as `npx serve .` for local development. If you prefer to work from the `docs/` folder, `docs/index.html` contains the same markup and styles.

## Deployment

1. Go to the repository settings on GitHub.
2. In **Pages**, choose either `main` + `/ (root)` or `main` + `/docs`.
3. Save the settings – GitHub Pages will serve the contents of the selected location at `https://<username>.github.io/shopping-cart-app/`.

The assets referenced by the page use relative paths, so they resolve correctly whether the site is served from the repository root or from the `docs/` directory.
