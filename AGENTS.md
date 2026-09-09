# Project notes

## Workflow
- After completing a meaningful change, commit and push to `main` automatically — the user prefers that deploys happen automatically when needed.
- Push to `main` triggers a production deployment on Vercel (project `bio-schedule`).
- Run `npm run build` (or `npx tsc --noEmit`) to verify before committing.

## Commands
- Build: `npm run build`
- Typecheck: `npx tsc --noEmit`
