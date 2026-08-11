# TDEE Weight Planner

A client-side TDEE and weight-planning application built with React, TypeScript and Vite. It supports quick projections, formal plans, daily food and exercise records, actual weight measurements, achievements, multiple local users and JSON backup or restore.

## Privacy

The application has no backend and does not transmit profile, diary or weight data. User data is stored in the browser's Local Storage for the current site origin.

Exported JSON files may contain personal health and diary information. Keep exported files private and do not commit them to this repository.

## Local development

Requirements:

- Node.js LTS
- npm

```sh
npm ci
npm run dev
```

Run the complete quality check:

```sh
npm run check
```

Create a production build:

```sh
npm run build
```

The generated site is written to `dist/`.

## GitHub Pages

The included workflow checks formatting, lint, types and tests on pushes and pull requests. A successful `main` build is then deployed to GitHub Pages.

1. Push this repository to GitHub.
2. Open **Settings → Pages** in the GitHub repository.
3. Set **Build and deployment → Source** to **GitHub Actions**.
4. Push to `main`, or run the workflow manually from the **Actions** tab.

The Vite build uses relative asset paths, so the site works as either a user site or a project site without a repository-specific base path.

## Data portability

Use the workspace drawer to export or import a JSON backup. Import validation rejects malformed or incompatible workspace data. Importing a backup replaces the current local workspace.

## Photo credits

- [Starry mountains](https://unsplash.com/photos/a-starry-night-sky-over-a-mountain-range-6YcKNe4yOwE) on Unsplash
- [Fireworks night](https://unsplash.com/photos/a-large-fireworks-display-in-the-night-sky-YAsH6mUQLr0) on Unsplash

The application is an estimation tool and is not medical advice.
