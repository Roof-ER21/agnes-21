# Railway Multi-Service Deployment Guide

## Overview

This guide covers deploying Agnes 21 with optional TTS backend on Railway.

## Deployment Options

### Option 1: Frontend Only (FREE - RECOMMENDED)
Deploy just the React frontend with Web Speech API for TTS.

**Cost**: $0 (uses Railway free trial $5 credits)
**Setup Time**: 5 minutes
**Features**: Full Agnes 21 functionality with browser-based TTS

### Option 2: Frontend + Cloud TTS (LOW COST)
Frontend with Google Cloud TTS or ElevenLabs API.

**Cost**: $0-5/month
**Setup Time**: 15 minutes
**Features**: High-quality cloud voices with fast response

### Option 3: Frontend + Custom TTS Backend (EXPENSIVE)
Full deployment with Chatterbox TTS service on Railway.

**Cost**: $15-30/month minimum
**Setup Time**: 1-2 hours
**Features**: Self-hosted voice cloning with custom voices

## Option 1: Frontend Only Deployment

### Steps:

1. **Push to GitHub**:
   ```bash
   cd /Users/a21/agnes-21
   git add .
   git commit -m "Add TTS support with Web Speech API"
   git push origin main
   ```

2. **Railway Configuration** (already done):
   - `railway.json` configured for frontend
   - `nixpacks.toml` configured for Node.js
   - No additional setup needed

3. **Environment Variables in Railway Dashboard**:
   ```
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_TTS_PROVIDER=webspeech
   ```

4. **Deploy**: Railway auto-deploys on push to main

### Testing:
Visit `https://livea21.up.railway.app` and use TTS features (browser voices).

---

## Option 2: Cloud TTS Deployment

### 2A: Google Cloud TTS

1. **Get API Key**:
   - Go to https://console.cloud.google.com/apis/credentials
   - Create new API key
   - Enable Cloud Text-to-Speech API

2. **Configure Environment Variables in Railway**:
   ```
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_TTS_PROVIDER=google
   VITE_TTS_API_KEY=your_google_cloud_key
   ```

3. **Push and Deploy**:
   ```bash
   git push origin main
   ```

**Cost**:
- Free tier: 1M characters/month (WaveNet)
- Paid: $4/1M characters (Neural2 voices)

### 2B: ElevenLabs

1. **Get API Key**:
   - Sign up at https://elevenlabs.io
   - Get API key from Settings
   - (Optional) Clone voices from your WAV files

2. **Configure Environment Variables in Railway**:
   ```
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_TTS_PROVIDER=elevenlabs
   VITE_TTS_API_KEY=your_elevenlabs_key
   ```

3. **Push and Deploy**:
   ```bash
   git push origin main
   ```

**Cost**:
- Free: 10k characters/month
- Starter: $5/month for 30k characters (voice cloning included)

---

## Option 3: Custom TTS Backend (Advanced)

### Prerequisites:
- Railway Pro Plan ($5/month minimum)
- Chatterbox TTS package installed
- Voice files ready

### Steps:

1. **Prepare Voice Files**:
   ```bash
   cd /Users/a21/agnes-21
   chmod +x backend/setup_voices.sh
   ./backend/setup_voices.sh
   ```

2. **Create Backend Service in Railway**:
   - Go to Railway Dashboard → Project
   - Click "New Service"
   - Select "Empty Service"
   - Name it "agnes-tts-backend"

3. **Configure Backend Service**:
   - Settings → Root Directory: `/backend`
   - Settings → Config as Code: `/backend/railway.json`
   - Settings → Watch Paths: `/backend/**`, `/voices/**`, `/server/**`

4. **Configure Frontend Service**:
   - Settings → Watch Paths: `/src/**`, `/public/**`, `/index.html`, `/package.json`, `/vite.config.ts`, `/nixpacks.toml`
   - This prevents frontend rebuilds when backend changes

5. **Set Environment Variables**:

   **Frontend Service**:
   ```
   VITE_GEMINI_API_KEY=your_gemini_key
   VITE_TTS_PROVIDER=custom
   VITE_TTS_ENDPOINT=https://agnes-tts-backend.railway.app
   ```

   **Backend Service**:
   ```
   PORT=8000
   AUTO_LOAD_MODEL=false
   VOICES_DIR=/app/voices
   OUTPUT_DIR=/tmp/tts_cache
   ```

6. **Deploy**:
   ```bash
   git add .
   git commit -m "Add TTS backend service"
   git push origin main
   ```

7. **Test Backend**:
   ```bash
   curl https://agnes-tts-backend.railway.app/api/tts/health
   ```

### Expected Costs:
- **Hobby Plan**: $5/month base
- **Memory**: ~1.5GB RAM × 0.00000386/GB/sec × 2,592,000 sec/month = **~$15/month**
- **CPU**: ~0.5 vCPU × 0.00000772/vCPU/sec × 2,592,000 sec/month = **~$10/month**
- **Total**: **$30/month** (minimum)

### Optimization Tips:
1. Set `AUTO_LOAD_MODEL=false` to avoid loading model on startup
2. Use lazy loading (model loads on first request)
3. Consider suspending service when not in use
4. Use Railway's sleep mode for development

---

## Troubleshooting

### Frontend Deployment Issues

**Issue**: Build fails with cache errors
**Solution**: Railway handles Vite cache automatically. If issues persist:
```bash
# Clear local cache
rm -rf node_modules/.vite
npm run build
```

**Issue**: Environment variables not loading
**Solution**: Ensure all variables are prefixed with `VITE_` and set in Railway dashboard

### Backend Deployment Issues

**Issue**: Model loading timeout
**Solution**: Increase `healthcheckTimeout` in `backend/railway.json` to 120 seconds

**Issue**: Out of memory errors
**Solution**:
1. Verify you're on Hobby plan (8GB max)
2. Check memory usage in Railway metrics
3. Consider using CPU-only PyTorch
4. Reduce worker count to 1

**Issue**: Voice files not found
**Solution**:
1. Run `./backend/setup_voices.sh` locally
2. Commit voice files to git
3. Verify paths in `server/tts_service.py`

### TTS API Issues

**Issue**: Google Cloud TTS 403 errors
**Solution**:
1. Verify API key is correct
2. Enable Cloud Text-to-Speech API in Google Cloud Console
3. Check billing is enabled

**Issue**: ElevenLabs rate limits
**Solution**: Implement caching in frontend (already done in tts-manager.ts)

---

## Monitoring

### Railway Metrics:
- Memory usage: Should stay under 1.5GB for backend
- CPU usage: Spikes during TTS generation
- Bandwidth: ~1MB per TTS request

### Logs:
```bash
# View frontend logs
railway logs --service agnes-21

# View backend logs
railway logs --service agnes-tts-backend
```

---

## Cost Optimization

### Reduce Backend Costs:
1. **Use Sleep Mode**: Backend only wakes on requests
2. **Implement Caching**: Cache frequently requested TTS
3. **Batch Requests**: Generate multiple phrases at once
4. **Use Fallback**: Fallback to Web Speech API when backend sleeping

### Free Tier Optimization:
1. Deploy frontend only (Option 1)
2. Use Web Speech API for basic TTS
3. Add cloud TTS later if needed

---

## Migration Path

### Start Free → Add Features:
1. **Week 1**: Deploy frontend only (free)
2. **Week 2**: Add Google Cloud TTS (free tier)
3. **Week 3**: Upgrade to ElevenLabs if needed ($5/month)
4. **Later**: Add custom backend only if voice cloning needed ($30/month)

---

## Recommended Setup for Production

**For Most Users**:
- **Option 2A**: Google Cloud TTS
- **Cost**: $0/month (free tier covers typical usage)
- **Quality**: High-quality Neural2 voices
- **Reliability**: 99.9% uptime

**For Advanced Users**:
- **Option 2B**: ElevenLabs
- **Cost**: $5/month
- **Features**: Voice cloning from your WAV files
- **Quality**: Industry-leading voice quality

**For Development Only**:
- **Option 3**: Custom TTS Backend
- **Use Case**: Testing Chatterbox, full control
- **Not recommended for production** due to cost

---

## Quick Start Commands

```bash
# Deploy frontend only (recommended)
cd /Users/a21/agnes-21
git add .
git commit -m "Deploy Agnes 21 with Web Speech API"
git push origin main

# Add cloud TTS (Google)
# 1. Get API key from Google Cloud Console
# 2. Add to Railway env vars:
#    VITE_TTS_PROVIDER=google
#    VITE_TTS_API_KEY=your_key

# Add cloud TTS (ElevenLabs)
# 1. Get API key from ElevenLabs
# 2. Add to Railway env vars:
#    VITE_TTS_PROVIDER=elevenlabs
#    VITE_TTS_API_KEY=your_key

# Setup custom backend (advanced)
./backend/setup_voices.sh
# Then follow "Option 3" steps above
```

---

## Support Resources

- Railway Docs: https://docs.railway.com
- Google Cloud TTS: https://cloud.google.com/text-to-speech/docs
- ElevenLabs Docs: https://docs.elevenlabs.io
- Agnes 21 Issues: https://github.com/Roof-ER21/agnes-21/issues
