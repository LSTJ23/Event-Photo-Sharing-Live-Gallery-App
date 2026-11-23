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

- [ ] Commit and push changes to GitHub:
  ```bash
  git add render.yaml RENDER_DEPLOYMENT.md backend/package.json
  git commit -m "Add Render deployment configuration"
  git push origin main
  ```

- [ ] Go to [Render Dashboard](https://dashboard.render.com)
- [ ] Connect GitHub repository to Render (if not already done)
- [ ] Create new Web Service:
  - [ ] Select this repository
  - [ ] Service name: `event-photo-gallery-api`
  - [ ] Environment: `Node`
  - [ ] Build Command: `npm ci --omit=dev && npm run build --workspace=backend`
  - [ ] Start Command: `npm start --workspace=backend`

- [ ] Add Environment Variables in Render:
  - [ ] `NODE_ENV` = `production`
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
| "Cannot find module" | Run `npm ci --omit=dev && npm run build --workspace=backend` locally to verify |
| Database health check fails | Verify DATABASE_URL format and test connection locally |
| Supabase health check fails | Verify SUPABASE_URL and SUPABASE_SECRET_KEY are correct |
| Service keeps restarting | Check logs for runtime errors; verify all env vars are set |

## Configuration Files Created

- **[render.yaml](./render.yaml)** - Render deployment configuration
- **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)** - Detailed deployment guide
- **[backend/package.json](./backend/package.json)** - Added `start` script

## Next Steps After Deployment

1. **Update Frontend**: Point frontend API calls to your Render service URL
2. **Monitor**: Watch Render logs for any errors
3. **Test**: Run end-to-end tests through the frontend
4. **Production**: Consider upgrading to paid Render plan for always-on service
5. **Database**: Set up backups for your Supabase database

## Support

- Render Docs: https://render.com/docs
- Supabase Docs: https://supabase.com/docs
- GitHub Issues: Check this repository's issues for similar problems
