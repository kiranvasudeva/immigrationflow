# Staging Environment Deployment Summary

## URLs
- **Frontend (Vercel):** [TO BE FILLED AFTER VERCEL DEPLOYMENT]
- **API (Render):** [TO BE FILLED AFTER RENDER DEPLOYMENT]

## CORS Configuration
- **ALLOWED_ORIGINS:** `https://[VERCEL_URL],https://immigration-workflow-app-1yneaxuy.devinapps.com`

## API Communication
- **Method:** Vercel rewrites (frontend uses `/api/*` which Vercel proxies to Render)
- **Alternative:** Could use `VITE_API_BASE_URL` env var but rewrites are simpler
- **Configuration:** See `vercel.json` rewrites section

## Deployment Status
- ✅ **Code committed and pushed** to branch `devin/1760000904-remove-replit-refs`
- ✅ **CI checks passed** on PR #2
- ✅ **Vercel deployment completed** (preview deployment ready)
- ⏳ **Render deployment** - pending user setup (see instructions below)

## Render Deployment Instructions

### Step 1: Connect Render to GitHub
1. Log in to Render: https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub account (if not already connected)
4. Select repository: `kiranvasudeva/immigrationflow`
5. Select branch: `devin/1760000904-remove-replit-refs`

### Step 2: Configure Build Settings
Render should automatically detect the `render.yaml` file. Verify these settings:
- **Name:** immigrationflow-api
- **Root Directory:** `.` (repository root)
- **Environment:** Node
- **Build Command:** `npm ci --omit=dev=false && npm run build`
- **Start Command:** `npm run start`
- **Plan:** Free
- **Health Check Path:** `/healthz`

### Step 3: Set Environment Variables
In Render dashboard, add these environment variables:

**Required Variables:**
- `NODE_ENV` = `production`
- `DATABASE_URL` = `postgresql://postgres.oeluqgiqqemknwxettym:[YOUR_DB_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`
  - Replace `[YOUR_DB_PASSWORD]` with your Supabase database password
  - Get password from Supabase dashboard → Settings → Database
- `SUPABASE_URL` = `https://oeluqgiqqemknwxettym.supabase.co/`
- `SUPABASE_SERVICE_ROLE` = `[FROM_WORKSPACE_SECRETS]`
- `JWT_SECRET` = `[FROM_WORKSPACE_SECRETS]`
- `SESSION_SECRET` = `[FROM_WORKSPACE_SECRETS]`
- `ALLOWED_ORIGINS` = `https://[YOUR_VERCEL_URL],https://immigration-workflow-app-1yneaxuy.devinapps.com`
  - Replace `[YOUR_VERCEL_URL]` with your actual Vercel preview URL

### Step 4: Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete (~5-10 minutes)
3. Note the Render API URL (e.g., `https://immigrationflow-api.onrender.com`)

## Post-Render Deployment Steps

### Step 5: Update vercel.json with Render API URL
Once Render deployment completes:
1. Get the Render API URL from Render dashboard
2. Update `vercel.json` line 7: replace `RENDER_API_URL_PLACEHOLDER` with actual URL
3. Commit and push:
   ```bash
   git add vercel.json
   git commit -m "Wire Vercel frontend to Render backend API"
   git push origin devin/1760000904-remove-replit-refs
   ```

### Step 6: Update Vercel Environment Variables
In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Verify these variables are set:
   - `VITE_SUPABASE_URL` = `https://oeluqgiqqemknwxettym.supabase.co/`
   - `VITE_SUPABASE_ANON_KEY` = `[FROM_WORKSPACE_SECRETS]`
3. Trigger new deployment if needed

### Step 7: Update ALLOWED_ORIGINS in Render
Once you have the Vercel preview URL:
1. Go to Render dashboard → immigrationflow-api → Environment
2. Update `ALLOWED_ORIGINS` to include the Vercel URL:
   - `https://[YOUR_VERCEL_URL],https://immigration-workflow-app-1yneaxuy.devinapps.com`
3. Redeploy the service

## Verification Checklist

### Automated Checks
- ✅ Vercel deployment green (check PR #2)
- ⏳ Render API healthy (`curl https://[RENDER_URL]/healthz` returns `{"ok":true}`)
- ⏳ Dashboard loads data from API (visit Vercel URL → Dashboard)
- ⏳ CORS allows Vercel and devinapps domains

### Manual Testing
Run smoke tests after both deployments are live:
```bash
export RENDER_API_URL=https://[YOUR_RENDER_URL]
export FRONTEND_URL=https://[YOUR_VERCEL_URL]
node scripts/smoke.mjs > artifacts/deploy/smoke-output.txt
```

### Capture Verification Artifacts
1. Visit the Vercel deployment URL
2. Open browser DevTools → Network tab
3. Navigate to Dashboard
4. Capture screenshot showing successful API call
5. Save to `artifacts/deploy/network-screenshot.png`

## Local Reproduction

Required .env keys:
```
SUPABASE_URL=https://oeluqgiqqemknwxettym.supabase.co/
SUPABASE_ANON_KEY=[FROM_WORKSPACE_SECRETS]
SUPABASE_SERVICE_ROLE=[FROM_WORKSPACE_SECRETS]
SUPABASE_PROJECT_REF=oeluqgiqqemknwxettym
SUPABASE_ACCESS_TOKEN=[FROM_WORKSPACE_SECRETS]
DATABASE_URL=postgresql://postgres.oeluqgiqqemknwxettym:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
JWT_SECRET=[FROM_WORKSPACE_SECRETS]
SESSION_SECRET=[FROM_WORKSPACE_SECRETS]
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5000
```

Run locally:
```bash
npm ci
npm run dev
```

## Remaining TODOs
- [ ] Deploy backend to Render (manual step)
- [ ] Get Render API URL
- [ ] Update vercel.json with actual Render URL
- [ ] Update ALLOWED_ORIGINS in Render with Vercel URL
- [ ] Verify VITE_* environment variables in Vercel
- [ ] Run smoke tests against live deployments
- [ ] Capture network screenshot
- [ ] Commit artifacts
- [ ] Post final PR comment with all URLs and verification

## Links
- **PR #2:** https://github.com/kiranvasudeva/immigrationflow/pull/2
- **Devin Run:** https://app.devin.ai/sessions/f5d9c6d4c5a9449ea66ffe32c01d57b3
- **Branch:** `devin/1760000904-remove-replit-refs`
