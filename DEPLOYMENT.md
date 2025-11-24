# Agnes-21 Deployment Guide

Complete guide for deploying Agnes-21 Training Platform to Railway.

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables ✅
- [ ] Get your Gemini API key from https://aistudio.google.com/app/apikey
- [ ] Test API key locally first
- [ ] Never commit API keys to Git (already protected by .gitignore)

### 2. Code Quality ✅
- [ ] All features working locally
- [ ] No console errors
- [ ] Authentication system tested
- [ ] PWA features tested
- [ ] Build completes successfully (`npm run build`)

### 3. Security ✅
- [ ] API keys in environment variables only
- [ ] .gitignore includes .env files
- [ ] Security headers configured (vercel.json)
- [ ] HTTPS will be provided by Railway

### 4. PWA Assets ✅
- [ ] manifest.json exists
- [ ] service-worker.js exists
- [ ] Icons generated (8 sizes)
- [ ] Vite config copies PWA files

### 5. Performance ✅
- [ ] Code splitting configured
- [ ] Lazy loading enabled
- [ ] Service worker caching configured
- [ ] Build size optimized

---

## 🚀 Railway Deployment Steps

### Step 1: Prepare Your Repository

Ensure your Git repository is up to date:

\`\`\`bash
# Check status
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: Add PWA support and mobile optimizations"

# Push to GitHub
git push origin main
\`\`\`

### Step 2: Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Authorize Railway to access your GitHub
5. Select your \`agnes-21\` repository

### Step 3: Configure Environment Variables

In Railway dashboard:

1. Go to your project → Settings → Variables
2. Add these environment variables:

\`\`\`
GEMINI_API_KEY=your_actual_api_key_here
VITE_GEMINI_API_KEY=your_actual_api_key_here
NODE_ENV=production
\`\`\`

**Important:** Use the same API key for both variables for compatibility.

### Step 4: Deploy!

Railway will automatically:
1. Install dependencies
2. Run the build
3. Copy PWA files (service worker, manifest)
4. Start the server
5. Assign a public URL

**First deployment takes 2-3 minutes.**

---

## 🔧 Quick Reference

### Railway Configuration

| Setting | Value |
|---------|-------|
| Build Command | \`npm ci && npm run build\` |
| Start Command | \`npx serve -s dist -l \${PORT:-3000}\` |
| Health Check | \`/\` (root path) |
| Auto-Deploy | Enabled (on push to main) |
| Node Version | Auto-detected from package.json |

### Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| \`GEMINI_API_KEY\` | Google Gemini API key | \`AIza...\` |
| \`VITE_GEMINI_API_KEY\` | Same as above (for Vite) | \`AIza...\` |
| \`NODE_ENV\` | Environment mode | \`production\` |

---

## ✅ Post-Deployment Verification

### 1. Test Core Features

- [ ] App loads successfully
- [ ] Login/registration works
- [ ] Training sessions run
- [ ] Video recording functions
- [ ] Manager dashboard accessible

### 2. Test PWA Features

- [ ] Manifest loads: \`https://your-app.railway.app/manifest.json\`
- [ ] Service worker loads: \`https://your-app.railway.app/service-worker.js\`
- [ ] Icons load: \`https://your-app.railway.app/icons/icon-192x192.png\`
- [ ] Install prompt appears (after 30s)
- [ ] App installs successfully
- [ ] Offline mode works

### 3. Test on Multiple Devices

- [ ] Desktop Chrome
- [ ] Desktop Safari
- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] iPad

---

## 🐛 Common Issues & Solutions

### Issue: Build Fails

**Error:** \`Module not found\` or \`Cannot find module\`

**Solution:**
\`\`\`bash
rm -rf node_modules package-lock.json
npm install
npm run build
git add package-lock.json
git commit -m "fix: Update dependencies"
git push
\`\`\`

### Issue: Service Worker 404

**Error:** \`Failed to register service worker: 404\`

**Solution:**
1. Verify \`vite.config.ts\` has \`copyPWAFiles()\` plugin
2. Check build output: \`ls dist/service-worker.js\`
3. Rebuild and redeploy

### Issue: API Key Not Working

**Error:** \`API key invalid\` or \`401 Unauthorized\`

**Solution:**
1. Railway Dashboard → Variables
2. Check \`GEMINI_API_KEY\` and \`VITE_GEMINI_API_KEY\` are set
3. No extra spaces or quotes
4. Redeploy after changing

### Issue: Port Binding Error

**Error:** \`Error: listen EADDRINUSE\`

**Solution:**
- Railway automatically provides \`PORT\` environment variable
- \`railway.json\` uses \`\${PORT:-3000}\` for fallback
- No code changes needed

---

## 📊 Monitoring

### View Logs

\`\`\`bash
# Install Railway CLI
npm i -g @railway/cli

# Login and link
railway login
railway link

# View logs
railway logs
\`\`\`

### Key Metrics to Monitor

- **Response Time:** Should be <500ms
- **Error Rate:** Should be <1%
- **Memory Usage:** Should be <512MB
- **CPU Usage:** Should be <50%

Check in Railway Dashboard → Metrics

---

## 🔄 Update Deployment

Simply push to GitHub:

\`\`\`bash
git add .
git commit -m "feat: Your changes"
git push origin main
\`\`\`

Railway auto-deploys in 1-2 minutes.

---

## 💰 Cost Estimation

**Free Tier:**
- $5/month credit
- ~150-200 hours of uptime
- Good for development/testing

**Typical Usage:**
- Light traffic: $0.50-$1/day
- Medium traffic: $1-$3/day
- Heavy traffic: $3-$5/day

Monitor: Railway Dashboard → Usage

---

## 🔒 Security Checklist

- ✅ API keys in environment variables
- ✅ .gitignore configured
- ✅ HTTPS enabled (automatic on Railway)
- ✅ Security headers (from vercel.json)
- ✅ Rate limiting (Gemini API)
- ✅ Input validation (in app code)
- ✅ No sensitive data in logs

---

## 📱 PWA Installation Guide

### iOS (Safari)

1. Visit your Railway URL
2. Tap Share button (bottom center)
3. Scroll down → "Add to Home Screen"
4. Tap "Add"
5. App appears on home screen

### Android (Chrome)

1. Visit your Railway URL
2. Tap menu (3 dots, top right)
3. "Install app" or "Add to Home Screen"
4. Confirm installation
5. App appears in app drawer

### Desktop (Chrome/Edge)

1. Visit your Railway URL
2. Click install icon in address bar
3. Or wait for install prompt
4. Click "Install"
5. App opens in standalone window

---

## 📞 Support

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **GitHub Issues:** Your repo issues page

---

*Last updated: November 24, 2025*
