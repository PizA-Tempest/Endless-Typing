# AGENTS.md

## State
Static site: `index.html`, `styles.css`, `app.js` at root. No build, no deps, no framework. Deploys to Vercel as-is (no build command, output = root).

## Gotchas
- Do not trust `README.md` commands (`npm install`, `npm run dev`) — there is no `package.json`, so they fail.
- Tech stack is undecided: `README.md` claims plain HTML/CSS/JS but notes to update if a framework (Vue/React/TS) is chosen.
- No `LICENSE` file despite `README.md` referencing MIT.

## Working here
- Confirm intended stack with user before scaffolding anything.
- Keep it minimal per project philosophy: one page, no timers/scores/levels.
