# Render Backend Deployment Guide

This guide walks you through deploying the Express API backend to Render.

## Prerequisites

- Render.com account (free tier available)
- GitHub repository connected to Render
- Supabase project with database credentials
- Node.js 24 or newer (required by this project)

## Step 1: Push Configuration to GitHub

The `render.yaml` file has been created in the repository root. Commit and push it:

```bash
git add render.yaml
git commit -m "Add Render deployment configuration"
git push origin main
```

## Step 2: Create a Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Select your GitHub repository (`Event-Photo-Sharing-Live-Gallery-App`)
4. Configure:
   - **Name**: `event-photo-gallery-api` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm ci --omit=dev && npm run build --workspace=backend`
   - **Start Command**: `node backend/dist/server.js`
   - **Plan**: Free (or Starter for production)

## Step 3: Set Environment Variables

In the Render web UI, go to your service → **Environment** and add:

| Key | Value | Note |
|-----|-------|------|
| `NODE_ENV` | `production` | Already set in render.yaml |
| `PORT` | `3001` | Already set in render.yaml |
| `DATABASE_URL` | Your Supabase connection string | From Supabase dashboard → Connect → Session pooler |
| `SUPABASE_URL` | Your Supabase project URL | From Supabase dashboard → Settings |
| `SUPABASE_SECRET_KEY` | Your Supabase secret key | From Supabase dashboard → Settings → API Keys → Secret key (starts with `sb_secret_`) |

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
- Limited to one free web service per account
- No custom domains (you'll get `*.onrender.com`)

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
- Ensure Node.js version requirement is met (24+)
- Verify `npm ci --omit=dev` succeeds locally

### "Cannot find module" errors
- Run `npm ci --omit=dev && npm run build --workspace=backend` locally
- Ensure TypeScript compilation works (`npm run build --workspace=backend`)

### Health checks returning errors
- **`/health/db` failing**: Verify `DATABASE_URL` is correct and pool connections work
- **`/health/supabase` failing**: Verify `SUPABASE_URL` and `SUPABASE_SECRET_KEY` are correct
- Check Render logs for detailed error messages

### "ENOENT" errors
- Clear Render's build cache: Dashboard → Your Service → **Environment** → scroll to **Build Cache** → Clear Cache
- Redeploy

## Next Steps

After successful backend deployment:
1. Update your frontend's API base URL to point to your Render API URL
2. Test API endpoints from the frontend
3. Set up monitoring and error tracking
4. Consider database backups for production

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render.yaml Specification](https://render.com/docs/yaml-spec)
- [Supabase Connection Strings](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
