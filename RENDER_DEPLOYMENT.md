# Render Backend Deployment Guide

This guide walks you through deploying the Express API backend to Render.

## Prerequisites

- Render.com account (free tier available)
- GitHub repository connected to Render
- Supabase project with database credentials
- Node.js 24 or newer (required by this project)

## Step 1: Push Configuration to GitHub

Commit and push the deployment changes to the branch connected to Render.
Render builds from the repository, not from local uncommitted changes.

## Step 2: Configure the Web Service on Render

The `render.yaml` file is a Blueprint configuration. For a Blueprint-managed
service, sync the Blueprint after pushing the changes. For an existing service
that is not managed by a Blueprint, changing the file alone will not update its
settings; configure the service in the Render dashboard instead:

1. Go to the service in the [Render Dashboard](https://dashboard.render.com),
   or create a new **Web Service** connected to this repository.
2. Set the root directory to the repository root (leave it blank).
3. Configure:
   - **Name**: `event-photo-gallery-api` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `bash build.sh`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Free (or Starter for production)

The build script installs development dependencies explicitly because TypeScript
and its type definitions are required to compile even when `NODE_ENV` is
`production`.

## Step 3: Set Environment Variables

In the Render web UI, go to your service → **Environment** and add:

| Key | Value | Note |
|-----|-------|------|
| `NODE_ENV` | `production` | Already set in render.yaml |
| `PORT` | `3001` | Already set in render.yaml |
| `DATABASE_URL` | Your Supabase connection string | From Supabase dashboard → Connect → Session pooler |
| `SUPABASE_URL` | Your Supabase project URL | From Supabase dashboard → Settings |
| `SUPABASE_SECRET_KEY` | Your Supabase secret key | From Supabase dashboard → Settings → API Keys → Secret key (starts with `sb_secret_`) |

Render uses Node 24 from the root `.nvmrc` unless a higher-priority
`NODE_VERSION` environment variable overrides it.

### Where to Find These Credentials

**DATABASE_URL:**
- Go to Supabase dashboard
- Navigate to your project
- Click **Connect**
- Select **Session pooler** tab
- Copy the connection string
- Replace `[YOUR-PASSWORD]` with your actual database password

**SUPABASE_URL:**
- Go to Supabase dashboard → **Settings** → **Configuration**
- Copy the **Project URL**

**SUPABASE_SECRET_KEY:**
- Go to Supabase dashboard → **Settings** → **API Keys**
- Copy the **secret key** (the one starting with `sb_secret_`, NOT the anon public key)

## Step 4: Deploy

1. After setting environment variables, Render will automatically build and deploy
2. Watch the deployment logs in Render dashboard
3. Once deployed, you'll get a URL like `https://event-photo-gallery-api.onrender.com`

## Step 5: Verify Deployment

Test your API:

```bash
# Basic health check
curl https://event-photo-gallery-api.onrender.com/health

# Database health check (requires DATABASE_URL)
curl https://event-photo-gallery-api.onrender.com/health/db

# Supabase health check (requires SUPABASE_URL and SUPABASE_SECRET_KEY)
curl https://event-photo-gallery-api.onrender.com/health/supabase
```

Expected responses:
- `/health` → `{"status":"ok"}`
- `/health/db` → `{"status":"ok","database":"connected"}`
- `/health/supabase` → `{"status":"ok","database":"connected"}`

## Important Notes

### Free Tier Limitations
- Services spin down after 15 minutes of inactivity
- See [Render's free tier documentation](https://render.com/docs/free) for current limits

### Production Deployment
For production, consider upgrading to a Starter plan:
- Always-on services (no spin-down)
- More reliable performance
- Support for auto-deployment from GitHub

### Auto-Deployment
Once your GitHub repository is connected:
- **Automatic deployments** trigger on `git push` to `main` branch
- You can manually redeploy from Render dashboard if needed
- Failed deployments can be debugged in the logs

### Database Connections
- The backend uses PostgreSQL via two methods:
  1. **Direct connection** (`DATABASE_URL`) - for health checks and integration tests
  2. **Supabase Data API** (`SUPABASE_URL` + `SUPABASE_SECRET_KEY`) - for health checks

Both are optional but recommended for full health check coverage.

### Security
- **Never commit** `.env` or credentials to GitHub
- **Always use environment variables** in Render dashboard
- The `SUPABASE_SECRET_KEY` is sensitive - keep it secure
- Render's environment variables are encrypted at rest

## Troubleshooting

### "Build failed" errors
- Check the build logs in Render dashboard
- Check that the root directory, build command, and Node version match Step 2
- Verify `npm ci --include=dev` and `npm run build --workspace=backend` succeed locally

### "Cannot find module" errors
- Run `npm ci --include=dev && npm run build --workspace=backend` locally
- Ensure TypeScript compilation works (`npm run build --workspace=backend`)

### Health checks returning errors
- **`/health/db` failing**: Verify `DATABASE_URL` is correct and pool connections work
- **`/health/supabase` failing**: Verify `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are correct
- Check Render logs for detailed error messages

### "ENOENT" errors
- Clear Render's build cache: Dashboard → Your Service → **Environment** → scroll to **Build Cache** → Clear Cache
- Redeploy

## Next Steps

The Render service deploys only the backend health checks. To configure its URL
in Vercel without breaking the mock photo screens:

1. Push the frontend changes that support `NEXT_PUBLIC_USE_MOCK_API`.
2. In your Vercel project settings, add `NEXT_PUBLIC_API_URL` with the Render
   service's HTTPS URL (without `/health`) and `NEXT_PUBLIC_USE_MOCK_API` with
   the value `true` for the relevant deployment environments.
3. Redeploy Vercel with the new commit and variables. The URL is configured,
   but photo requests remain in the browser mock; they do not reach Render.

When the backend implements the event and photo routes listed in
`frontend/src/lib/api.ts`, supports the required authentication and
authorization, and allows the Vercel origin through CORS, set
`NEXT_PUBLIC_USE_MOCK_API` to `false` or remove it and redeploy Vercel.
Test the real API before switching production. Other mock screens may need
separate integration; see the [README](./README.md) for current app status.

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render.yaml Specification](https://render.com/docs/yaml-spec)
- [Supabase Connection Strings](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
