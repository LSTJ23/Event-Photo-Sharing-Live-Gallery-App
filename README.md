# Event Photo Sharing & Live Gallery

Starter monorepo for a Next.js frontend and an Express API backed by PostgreSQL.

## Requirements

- Node.js 24 or newer
- npm
- PostgreSQL for the API's database integration check

## Project layout

- `frontend/` - Next.js app
- `backend/` - Express API and PostgreSQL connection

## Getting started

Install dependencies from the repository root:

```sh
npm ci
```

Run each app in a separate terminal:

```sh
npm run dev:frontend
npm run dev:backend
```

The API listens on port 3001 by default. Set `DATABASE_URL` to connect it to PostgreSQL. Its `/health` route checks the API process, and `/health/db` checks database connectivity.

## Checks

From the repository root:

```sh
npm run lint
npm test
npm run build
```

The frontend and API have unit tests. The PostgreSQL integration test runs when `DATABASE_URL` is set; CI starts a PostgreSQL service and runs that test against it.

## Continuous integration

GitHub Actions runs the checks above when code is pushed to `feature/*` or `testing`, and for pull requests targeting `testing`. Pushes to `testing` validate the integrated code. To block merges until the pull-request checks pass, configure a branch protection rule or ruleset for `testing` in GitHub and require the `CI / validate` status check; the workflow file alone does not enforce merge restrictions.

Manual QA, staging approval, and production deployment remain separate release-phase activities; this CI workflow does not deploy the application.
