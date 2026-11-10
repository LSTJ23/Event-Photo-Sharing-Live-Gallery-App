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

## Participant flow (frontend)

Routes in `frontend/src/app`:

| Route | Screen |
| --- | --- |
| `/e/<eventId>` | The event's public share link (also what its QR code holds). Goes straight to the camera. |
| `/scan` | 01 QR scanner (reads the event's QR code, then goes to the camera) |
| `/e/<eventId>/camera` | Camera: take a photo or choose one from the album |
| `/e/<eventId>/preview` | 02 Photo preview |
| `/e/<eventId>/share` | 03 Share photo (with name or anonymously), then 03b "Photo shared!" |
| `/e/<eventId>/gallery` | 04 Event gallery (All Photos / Live Gallery; `?view=live` opens Live Gallery) |
| `/e/<eventId>/photos/<photoId>` | 05 Single photo |

Organizer gallery pages (phone and desktop), in `frontend/src/app/admin`:

| Route | Screen |
| --- | --- |
| `/admin/e/<eventId>` | 06 Admin gallery (All Photos / Live Gallery), with 07–08 the share-link dialog. The share-link dialog also shows the event's QR code, with a Download QR Code button. |
| `/admin/e/<eventId>/manage` | 09 Manage gallery: gallery details, share link and QR code (with download), remove photos (09b confirmation) |

Organizer dashboard (phone and desktop), in `frontend/src/app/(organizer)` with its own top bar and styles:

| Route | Screen |
| --- | --- |
| `/events` | The organizer's events: Gallery, Analytics, QR code, and reported photos to review |
| `/events/<eventId>/analytics` | Photos, participants, photos per hour, and the photo limit |
| `/events/<eventId>/qr` | The event's QR code and share link (copy or download) |
| `/reports` and `/reports/<id>` | Reported photos, and one report with Delete photo / Keep photo |
| `/login` | Placeholder "Logged out" page until the login page exists |

QR codes are drawn by `frontend/src/lib/qr.ts` (no extra packages needed). Only organizers can open the organizer pages (`getCurrentUser().role` in `frontend/src/lib/currentUser.ts`, set by login). The backend must check this too.

There are no event codes: participants join by opening the share link or scanning the QR code. Safari and Firefox can't scan QR codes inside a web page, so on those browsers people scan the QR code with their phone's Camera app, which opens the share link.

Until the API exists, the frontend uses in-browser mock data from `frontend/src/lib/mockApi.ts`. Try it by opening `http://localhost:3000/e/dlsu-cso-event`. To use the real API, set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` (see `.env.example`); the routes it expects are listed at the top of `frontend/src/lib/api.ts`.

The camera only works on `https://` pages or `localhost`.
