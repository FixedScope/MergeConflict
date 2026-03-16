# Merge Conflict

A couples' budget planner for NYC professionals. Track combined income, taxes, home costs, expenses, and big purchases — all in the browser with no account required.

**[Live demo →](https://fixedscope.github.io/MergeConflict/)**

## Features

- NYC tax calculation (Federal, NY State, NYC local, FICA) for both partners
- Configurable contribution percentages — split household expenses however you like
- Home affordability: mortgage, HOA, property tax
- Investment income and stock portfolio tracking
- Living expenses (children, health, food, clubs, etc.)
- Big purchase fund with a priority queue and payoff timeline
- All inputs saved automatically in your browser via localStorage — no account, no server

## Running locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

## Deploying to GitHub Pages

1. Update `REPO_NAME` in [vite.config.js](vite.config.js) to match your GitHub repo name
2. Run:

```bash
GITHUB_PAGES=true npm run deploy
```

This builds the app and pushes `dist/` to the `gh-pages` branch. Then in your repo **Settings → Pages**, set the source branch to `gh-pages`.

## Tech stack

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Recharts](https://recharts.org/)

## License

[MIT](LICENSE)
