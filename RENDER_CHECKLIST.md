# Render Deployment Checklist

## Pre-Deployment Setup

- [ ] Read [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) completely
- [ ] Have your Supabase credentials ready:
  - [ ] `DATABASE_URL` (from Supabase → Connect → Session pooler)
  - [ ] `SUPABASE_URL` (from Supabase → Settings)
  - [ ] `SUPABASE_SECRET_KEY` (from Supabase → Settings → API Keys)
- [ ] GitHub account with repository access
- [ ] Render.com account created

## Deployment Steps

- [ ] Commit and push deployment changes to the branch connected to Render

- [ ] Go to [Render Dashboard](https://dashboard.render.com)
- [ ] Connect GitHub repository to Render (if not already done)
- [ ] Sync the Blueprint, or configure the existing/new Web Service manually:
  - [ ] Select this repository
  - [ ] Service name: `event-photo-gallery-api`
  - [ ] Environment: `Node`
  - [ ] Root directory: blank (repository root)
  - [ ] Build Command: `bash build.sh`
  - [ ] Start Command: `cd backend && npm start`

- [ ] Add Environment Variables in Render:
  - [ ] `NODE_ENV` = `production`
  - [ ] Node version is 24 (from `.nvmrc`, unless overridden by `NODE_VERSION`)
  - [ ] `PORT` = `3001`
  - [ ] `DATABASE_URL` = your PostgreSQL connection string
  - [ ] `SUPABASE_URL` = your Supabase project URL
  - [ ] `SUPABASE_SECRET_KEY` = your Supabase secret key

## Post-Deployment Verification

- [ ] Wait for deployment to complete (check Render logs)
- [ ] Test health check: `curl https://[your-service].onrender.com/health`
- [ ] Test database: `curl https://[your-service].onrender.com/health/db`
- [ ] Test Supabase: `curl https://[your-service].onrender.com/health/supabase`
- [ ] All endpoints return success status

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Build fails | Check logs for Node.js version; ensure Node 24+ requirement |
| Missing TypeScript or types | Run `npm ci --include=dev && npm run build --workspace=backend` locally to verify |
| Database health check fails | Verify DATABASE_URL format and test connection locally |
| Supabase health check fails | Verify SUPABASE_URL and SUPABASE_SECRET_KEY are correct |
| Service keeps restarting | Check logs for runtime errors; verify all env vars are set |

## Configuration Files Created

- **[render.yaml](./render.yaml)** - Render deployment configuration
- **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)** - Detailed deployment guide
- **[build.sh](./build.sh)** - Installs dependencies and builds the backend

## Next Steps After Deployment

The service deploys only the backend health checks; it does not deploy or
connect the mock frontend. See the [README](./README.md) for current app status.

## Support

- Render Docs: https://render.com/docs
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: Check this repository's issues for similar problems
