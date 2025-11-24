# 🚀 Railway Deployment - Quick Start

**5-minute guide to deploy Agnes-21 to Railway**

---

## ✅ Pre-Deployment Checklist

Run this command to verify everything is ready:

```bash
./scripts/pre-deploy-check.sh
```

**All checks should pass** (except Git if not initialized yet).

---

## 🔑 Get Your API Key

1. Visit: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)
4. **Keep it safe!** You'll need it for Railway

---

## 📦 Deploy to Railway

### Option 1: Deploy from GitHub (Recommended)

**Step 1:** Initialize Git (if not already done)

```bash
git init
git add .
git commit -m "Initial commit: Agnes-21 Training Platform"
```

**Step 2:** Push to GitHub

```bash
# Create repo on GitHub first, then:
git remote add origin https://github.com/YOUR_USERNAME/agnes-21.git
git branch -M main
git push -u origin main
```

**Step 3:** Deploy on Railway

1. Go to https://railway.app/new
2. Click "Deploy from GitHub repo"
3. Authorize Railway → Select your repo
4. Click "Deploy Now"

**Step 4:** Add Environment Variables

1. In Railway Dashboard → Variables
2. Click "New Variable"
3. Add:
   - `GEMINI_API_KEY` = Your API key
   - `VITE_GEMINI_API_KEY` = Your API key (same)
4. Click "Deploy"

**Done!** Railway will provide a URL like: `https://your-app.railway.app`

---

### Option 2: Deploy from CLI

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Add environment variables
railway variables set GEMINI_API_KEY=your_api_key_here
railway variables set VITE_GEMINI_API_KEY=your_api_key_here

# Deploy
railway up

# Get URL
railway open
```

---

## 🧪 Test Your Deployment

1. **Open your Railway URL**
2. **Test login** - Create account with PIN
3. **Test training** - Complete a session
4. **Test PWA** - Wait 30s for install prompt
5. **Test mobile** - Visit on phone, install app

---

## 📊 Monitor Your App

### View Logs

```bash
railway logs
```

### Check Metrics

Railway Dashboard → Your Project → Metrics

### Update App

Just push to GitHub - Railway auto-deploys!

```bash
git add .
git commit -m "Update: Your changes"
git push
```

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Run `npm run build` locally, fix errors |
| API key error | Check Railway variables, no spaces/quotes |
| 404 errors | Verify `dist/` has all files after build |
| PWA not working | Check manifest.json and service-worker.js copied |

---

## 💰 Cost Estimate

**Free Tier:**
- $5/month credit
- Sufficient for development/testing
- ~150-200 hours runtime

**Typical Usage:**
- Light: $0.50-$1/day
- Medium: $1-$3/day

Monitor: Railway Dashboard → Usage

---

## 📖 Full Documentation

See `DEPLOYMENT.md` for complete guide including:
- Security best practices
- Performance optimization
- Mobile testing
- Troubleshooting
- Monitoring

---

## ✅ You're Ready!

Your app is production-ready with:
- ✅ Authentication & role-based access
- ✅ Data isolation per user
- ✅ Progressive Web App support
- ✅ Offline functionality
- ✅ Mobile-first design
- ✅ Security headers
- ✅ Automatic scaling

**Deploy with confidence!** 🚀

---

*Questions? Check Railway docs: https://docs.railway.app*
