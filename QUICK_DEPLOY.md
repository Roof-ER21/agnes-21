# Quick Deploy Guide - Agnes-21

## Railway (Recommended) - 5 Minutes

```bash
# 1. Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/agnes-21.git
git push -u origin main

# 2. Deploy on Railway
# - Go to railway.app
# - Click "New Project" → "Deploy from GitHub"
# - Select "agnes-21" repository
# - Add environment variable: VITE_GEMINI_API_KEY
# - Deploy automatically!

# Your app will be live at:
# https://agnes-21-production.up.railway.app
```

## Vercel (Alternative) - 3 Minutes

```bash
# 1. Install and deploy
npm install -g vercel
cd /Users/a21/agnes-21
vercel login
vercel

# 2. Add environment variable
vercel env add VITE_GEMINI_API_KEY production

# 3. Deploy to production
vercel --prod

# Your app will be live at:
# https://agnes-21.vercel.app
```

## What You Need

- GitHub account
- Railway or Vercel account
- Gemini API key (get from https://aistudio.google.com/app/apikey)

## Files Created for You

- `railway.json` - Railway auto-configuration
- `vercel.json` - Vercel configuration
- `.env.example` - Environment variable template
- `DEPLOYMENT.md` - Full deployment guide
- `DEPLOYMENT_READINESS.md` - Detailed status report

## After Deployment

1. Visit your live URL
2. Test AI roleplay functionality
3. Verify all modes work
4. Check mobile responsiveness

## Need Help?

Read `DEPLOYMENT.md` for:
- Detailed step-by-step instructions
- Troubleshooting 12+ common issues
- Performance monitoring setup
- Security best practices

## Status

Build: **SUCCESS** (0 errors, 0 warnings)
Bundle Size: **119 KB gzipped** (excellent)
Ready: **YES** (deploy immediately)
