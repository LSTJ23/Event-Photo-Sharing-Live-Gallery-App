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

The API listens on port 3001 by default. Its `/health` route checks the API
process. See the Supabase section below for database connection checks.

## Supabase database

Database changes live in `supabase/migrations/` and are applied separately from
application deployment using the Supabase CLI. The CLI records applied
versions, so a later `db push` skips them. Do not execute migration files
directly on an existing database or run them as part of the Vercel build.

**Existing projects:** The `event-photo-sharing` production project
(`uycqypgyuutzltukdmdb`) has been verified and baselined: migration versions
`20261122150000` and `20261122150100` are recorded as applied. The baseline
records the schema and job that were installed manually; it did not rerun them.

For any other existing project, do not run `supabase db push` until an
authorized administrator has verified its schema and job against the initial
migrations and baselined them as appropriate. Marking a migration as applied
does not run or verify its SQL. Coordinate this one-time step with the project
owner and use Supabase's documented `migration list` and `migration repair`
commands. Never use repair to conceal an unverified mismatch.

For future changes, create a new timestamped migration, test it on a disposable
database, and deploy it separately with the Supabase CLI. Do not edit an
already-applied migration. Follow the
[Supabase migration guide](https://supabase.com/docs/guides/deployment/database-migrations).

The schema stores staff and event participants against Supabase Auth users.
Participants must sign in before uploading; anonymous sharing hides their name
from the gallery, but still records the participant internally. Report reasons
are fixed options, with a nonblank description required for `other`.
Photo files go in the private `event-photos` bucket. If the bucket already
exists, the script preserves its visibility setting and Storage policies:
verify that it is private and its policies do not expose photos.
Participant records restrict deletion of their Auth account until those records
are removed or otherwise handled.

Application tables and analytics views are restricted to the backend's
`service_role`; browser clients cannot read them directly or subscribe to
photo rows through Realtime. A future backend must verify the participant's
Supabase Auth session (and reject anonymous Auth sessions), authorize every
operation, use the session's user ID rather than a client-supplied identity,
and omit participant identity from anonymous public responses. It must also
provide signed photo URLs and resolve event links by `share_slug`. The frontend
and Express API are still mocks/health checks and do not implement these flows.

### Connect the backend

Copy `backend/.env.example` to `backend/.env` and set `SUPABASE_URL` and
`SUPABASE_SECRET_KEY` from the Supabase dashboard. The secret key is server-only:
do not commit it, put it in a frontend variable, or share it in chat. Start the
backend and visit `http://localhost:3001/health/supabase`. A successful response
means the backend could query the `events` table through the Supabase Data API.
Failures return HTTP 503; see the backend log for details.

This connection does not require the PostgreSQL password. For direct PostgreSQL
connections instead, set `DATABASE_URL` to an authorized session-pooler
connection string; `/health/db` checks that separate connection. The integration
test also uses `DATABASE_URL`. Neither health check connects the mock screens
or implements authentication and authorization.

The second migration enables `pg_cron` and schedules `refresh_event_statuses()`
every minute. Supabase migrations require appropriate administrative access;
the application Data API key alone is not a migration credential.

For schema checks, use a **disposable local PostgreSQL cluster**, not a Supabase
project or an existing shared database. Apply `supabase/schema.test.setup.sql`,
then `supabase/migrations/20261122150000_initial_schema.sql`, then
`supabase/schema.test.sql` using `psql` with `-v ON_ERROR_STOP=1 -f <file>`.
The first file creates minimal local Auth and Storage stubs and database roles;
the last rolls back its test data. These stubs do not test the `pg_cron` job.

## Checks

From the repository root:

```sh
npm run lint
npm test
npm run build
```

The frontend and API have unit tests. The PostgreSQL integration test runs when `DATABASE_URL` is set; CI starts a PostgreSQL service and runs that test against it.

## Continuous integration

GitHub Actions runs the checks above when code is pushed to `feature/**` or `staging`, and for pull requests targeting `staging` or `main`. Pull requests to `main` must come from `staging`. To block merges until the checks pass, configure branch protection rules or rulesets for the protected branches in GitHub and require the `CI / validate` status check; the workflow file alone does not enforce merge restrictions.

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
| `/e/<eventId>/photos/<photoId>` | 05 Single photo, with Report: pick a reason from a dropdown (Other asks for a few words); the organizer reviews it |

Display gallery (present mode for a projector or TV), in `frontend/src/app/display`:

| Route | Screen |
| --- | --- |
| `/display/<eventId>` | Presenter view, like PowerPoint's: the current photo as the audience sees it, up next, a timer, `5 / 24`, play/pause, previous/next, slideshow or grid, photo speed, show or hide the QR code, and every photo to jump to. Keys: arrows or a clicker (PageUp/PageDown), Space, G, Q. Opened from the organizer's and the admin's gallery |
| `/display/<eventId>/screen` | Audience screen for the projector or TV: just the photos and the QR code. "Open audience screen" opens it in its own window (drag it to the projector, press F); it follows the presenter view through a `BroadcastChannel` in the same browser. Opened on its own, it plays the slideshow by itself |

Organizer dashboard (phone and desktop), in `frontend/src/app/(organizer)`:

The organizer pages have a sidebar like the admin's (a menu on phones and tablets).

| Route | Screen |
| --- | --- |
| `/events` | The organizer's live and upcoming events: Gallery, Analytics, QR code, and reported photos to review |
| `/past-events` | Events that have ended: Download all photos (zip), Archive / Restore, Delete. Archived events have their own tab |
| `/events/<eventId>/analytics` | Photos, participants, photos per hour, and the photo limit |
| `/events/<eventId>/qr` | The event's QR code and share link (copy or download) |
| `/events/<eventId>/gallery` | 06 The event's gallery: all photos, with Display gallery, Manage photos and the share link (07–08) |
| `/events/<eventId>/gallery/manage` | 09 Manage gallery: details, share link and QR code, remove photos (09b confirmation) |
| `/reports` and `/reports/<id>` | Reported photos, and one report with Delete photo / Keep photo |
| `/login` | Placeholder "Logged out" page until the login page exists |

Admin dashboard (phone and desktop), in `frontend/src/app/admin`, with a sidebar (a menu on phones). Admins create events and choose the event organizer for each one (the organizer gets an email invite), and create and edit organizer accounts. They can see reported photos, but only the event's organizer can keep or remove them.

Admin pages opened from another page carry `?from=<that page>`, so Back, Cancel and Save return there (from the dashboard, back to the dashboard). Opened from the sidebar, they return to their usual list.

| Route | Screen |
| --- | --- |
| `/admin` | Home: Needs your attention (reported photos waiting for an organizer, galleries nearly full, events with no start time, unaccepted invites), Create Event, Manage Events, Create User, Manage Users, and the Report Logs overview |
| `/admin/events` | Manage Events: Current, Past events and Archived tabs, search. Current: Edit / Gallery / QR. Past and archived: Gallery, Download all photos, Archive / Restore, Delete |
| `/admin/events/<id>/gallery` | The event's photos, inside the admin: Display gallery, QR code, share link, and select photos to delete |
| `/admin/events/<id>/qr` | The event's QR code: copy the link or download the code |
| `/admin/events/create` | Create Event: name, venue, organizer, photo capacity, and when it starts and ends (date and time each; hashtag optional) |
| `/admin/events/<id>/edit` | Edit Event |
| `/admin/users` | Manage Users: search, and Edit on each organizer |
| `/admin/users/create` | Create User: organizer name, person name, email |
| `/admin/users/<id>/edit` | Edit User |
| `/admin/reports` | Report Logs: totals and reported photos (view-only). Click a photo for details in a popup |
| `/admin/analytics` | Analytics: totals (events, participants, pictures), top events by participants and by pictures, and a per-event table of participants and pictures uploaded, sorted by date, most participants or most pictures |

Until the API exists, the admin pages use sample data from `frontend/src/lib/adminData.ts`, kept in memory by `frontend/src/components/admin/AdminStore.tsx` (each action there is marked for the backend).

Who can open what is set by `getCurrentUser().role` in `frontend/src/lib/currentUser.ts` (filled in by login): admins can open everything, organizers the organizer pages, participants neither. The backend must check this too.

QR codes are drawn by `frontend/src/lib/qr.ts` (no extra packages needed).
There are no event codes: participants join by opening the share link or scanning the QR code. Safari and Firefox can't scan QR codes inside a web page, so on those browsers people scan the QR code with their phone's Camera app, which opens the share link.

Until the API exists, the frontend uses in-browser mock data from `frontend/src/lib/mockApi.ts`. Try it by opening `http://localhost:3000/e/dlsu-cso-event`. You can configure `NEXT_PUBLIC_API_URL` and set `NEXT_PUBLIC_USE_MOCK_API=true` to keep using mock data while the API is being built (see `.env.example`). When the backend implements the routes listed at the top of `frontend/src/lib/api.ts` and allows your frontend origin through CORS, unset the mock flag or set it to `false` to use the API. Without an API URL, the frontend continues to use mock data. These public variables are embedded at build time, so redeploy after changing them.

The camera only works on `https://` pages or `localhost`.
