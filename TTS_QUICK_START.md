# Agnes 21 TTS - Quick Start Guide

## TL;DR

**Problem**: Chatterbox TTS on Railway costs $30/month minimum
**Solution**: Use Google Cloud TTS for $0/month

## 3 Deployment Options

### 1. Free (Web Speech API) ⭐ FASTEST
```bash
# Already configured! Just deploy:
cd /Users/a21/agnes-21
git add .
git commit -m "Add TTS support"
git push origin main

# In Railway Dashboard → Variables:
# (Keep existing VITE_GEMINI_API_KEY)
# Add: VITE_TTS_PROVIDER=webspeech
```
**Cost**: $0/month | **Quality**: Good | **Setup**: 5 min

### 2. Production (Google Cloud TTS) ⭐ RECOMMENDED
```bash
# 1. Get API key: https://console.cloud.google.com/apis/credentials
#    - Create project
#    - Enable "Cloud Text-to-Speech API"
#    - Create API key

# 2. In Railway Dashboard → Variables:
#    VITE_TTS_PROVIDER=google
#    VITE_TTS_API_KEY=your_google_key

# 3. Deploy:
git push origin main
```
**Cost**: $0-4/month | **Quality**: Excellent | **Setup**: 15 min

### 3. Premium (ElevenLabs)
```bash
# 1. Get API key: https://elevenlabs.io/app/settings

# 2. In Railway Dashboard → Variables:
#    VITE_TTS_PROVIDER=elevenlabs
#    VITE_TTS_API_KEY=your_elevenlabs_key

# 3. Deploy:
git push origin main
```
**Cost**: $5/month | **Quality**: Best | **Setup**: 15 min

## Advanced: Custom Backend ($30/month)

**Only if you need voice cloning**

```bash
# 1. Setup voice files
cd /Users/a21/agnes-21
./backend/setup_voices.sh

# 2. Create new Railway service "agnes-tts-backend"
#    - Root directory: /backend
#    - Config path: /backend/railway.json
#    - Watch paths: /backend/**, /voices/**, /server/**

# 3. Environment variables:
#    Frontend: VITE_TTS_PROVIDER=custom
#              VITE_TTS_ENDPOINT=https://agnes-tts-backend.railway.app
#    Backend:  AUTO_LOAD_MODEL=false
#              VOICES_DIR=/app/voices

# 4. Deploy
git add .
git commit -m "Add custom TTS backend"
git push origin main
```

See [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) for complete instructions.

## Files Created

```
/Users/a21/agnes-21/
├── .env.example                     # Updated with TTS variables
├── .railwayignore                   # Deployment optimization
├── backend/
│   ├── railway.json                 # Backend service config
│   ├── Dockerfile                   # Optimized container
│   ├── requirements-optimized.txt   # CPU-only PyTorch
│   └── setup_voices.sh              # Voice setup script
├── src/services/
│   ├── tts-manager.ts              # Universal TTS manager
│   └── tts-config.ts               # Environment config
├── DEPLOYMENT_PLAN.md              # Detailed analysis
├── RAILWAY_SETUP.md                # Complete setup guide
├── IMPLEMENTATION_SUMMARY.md       # Full implementation details
└── TTS_QUICK_START.md              # This file
```

## Cost Comparison

| Option | Monthly Cost | Use Case |
|--------|--------------|----------|
| Web Speech API | $0 | Development, testing |
| Google Cloud TTS | $0-4 | ✅ **Production** (recommended) |
| ElevenLabs | $5 | Premium quality |
| Custom Backend | $30+ | Voice cloning only |

## What to Do Next

**For most users**: Option 2 (Google Cloud TTS)

1. Get Google Cloud API key (5 min)
2. Add to Railway environment variables (2 min)
3. Deploy (`git push origin main`)
4. Test at https://livea21.up.railway.app

**Questions?** See:
- [DEPLOYMENT_PLAN.md](./DEPLOYMENT_PLAN.md) - Why Chatterbox won't work
- [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) - Detailed setup instructions
- [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Technical details
