# Shopping Cart App

This repository contains the static assets for the Merrimore boutique hospitality landing page. The full site is available from the
repository root (`index.html`) so that GitHub Pages works immediately with either the **main branch / root** or **main branch / docs
folder** configuration. The same files are also duplicated inside `docs/` for teams that prefer serving from that directory.

## Getting started

Open `index.html` directly in your browser or use a simple HTTP server such as `npx serve .` for local development. If you prefer
to work from the `docs/` folder, `docs/index.html` contains the same markup and styles.

## Deployment

The repository ships with an automated GitHub Actions workflow (`.github/workflows/deploy.yml`) that publishes the static files to
GitHub Pages whenever the `main` branch is updated. No manual build tooling is required.

1. Push your changes to `main`.
2. The workflow bundles `index.html` and the entire `docs/` directory into a `public/` folder artifact and deploys it to the
   `gh-pages` environment.
3. The site becomes available at `https://<username>.github.io/<repository>/` as soon as the deployment completes. For a user
   site, use a repository named `<username>.github.io` and the same workflow will publish to your root domain.

If you prefer to manage GitHub Pages manually, you can still point the Pages settings to either `main` + `/ (root)` or `main` +
`/docs`. The assets referenced by the page use relative paths, so they resolve correctly whether the site is served from the
repository root or from the `docs/` directory.
