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

The API listens on port 3001 by default. Set `DATABASE_URL` to connect it to PostgreSQL. Its `/health` route checks the API process, and `/health/db` checks database connectivity. `/version` returns the API name and version.

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

Organizer dashboard (phone and desktop), in `frontend/src/app/(organizer)`:

| Route | Screen |
| --- | --- |
| `/events` | The organizer's events: Gallery, Analytics, QR code, and reported photos to review |
| `/events/<eventId>/analytics` | Photos, participants, photos per hour, and the photo limit |
| `/events/<eventId>/qr` | The event's QR code and share link (copy or download) |
| `/events/<eventId>/gallery` | 06 The event's gallery (All Photos / Live Gallery), with 07–08 the share-link dialog and QR code |
| `/events/<eventId>/gallery/manage` | 09 Manage gallery: details, share link and QR code, remove photos (09b confirmation) |
| `/reports` and `/reports/<id>` | Reported photos, and one report with Delete photo / Keep photo |
| `/login` | Placeholder "Logged out" page until the login page exists |

Admin dashboard (phone and desktop), in `frontend/src/app/admin`, with a sidebar (a menu on phones). Admins create events and choose the event organizer for each one (the organizer gets an email invite), and create and edit organizer accounts. They can see reported photos, but only the event's organizer can keep or remove them.

| Route | Screen |
| --- | --- |
| `/admin` | Home: Needs your attention (reported photos waiting for an organizer, galleries nearly full, events with no start time, unaccepted invites), Create Event, Manage Events, Create User, Manage Users, and the Report Logs overview |
| `/admin/events` | Manage Events: Current and Past events tabs, search, and Edit / Gallery / QR on each event |
| `/admin/events/<id>/gallery` | The event's photos and share link, inside the admin (view-only) |
| `/admin/events/<id>/qr` | The event's QR code: copy the link or download the code |
| `/admin/events/create` | Create Event: name, venue, organizer, photo capacity, and when it starts and ends (date and time each; hashtag optional) |
| `/admin/events/<id>/edit` | Edit Event |
| `/admin/users` | Manage Users: search, and Edit on each organizer |
| `/admin/users/create` | Create User: organizer name, person name, email |
| `/admin/users/<id>/edit` | Edit User |
| `/admin/reports` | Report Logs: totals and reported photos (view-only). Click a photo for details in a popup |
| `/admin/analytics` | Analytics: photos shared, Top Organizers (click one for details) and photos per event |

Until the API exists, the admin pages use sample data from `frontend/src/lib/adminData.ts`, kept in memory by `frontend/src/components/admin/AdminStore.tsx` (each action there is marked for the backend).

Who can open what is set by `getCurrentUser().role` in `frontend/src/lib/currentUser.ts` (filled in by login): admins can open everything, organizers the organizer pages, participants neither. The backend must check this too.

QR codes are drawn by `frontend/src/lib/qr.ts` (no extra packages needed).
There are no event codes: participants join by opening the share link or scanning the QR code. Safari and Firefox can't scan QR codes inside a web page, so on those browsers people scan the QR code with their phone's Camera app, which opens the share link.

Until the API exists, the frontend uses in-browser mock data from `frontend/src/lib/mockApi.ts`. Try it by opening `http://localhost:3000/e/dlsu-cso-event`. To use the real API, set `NEXT_PUBLIC_API_URL` in `frontend/.env.local` (see `.env.example`); the routes it expects are listed at the top of `frontend/src/lib/api.ts`.

The camera only works on `https://` pages or `localhost`.
