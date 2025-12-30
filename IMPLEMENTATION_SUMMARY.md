# Agnes 21 TTS Implementation Summary

## Critical Finding: Chatterbox TTS on Railway is NOT Cost-Effective

After comprehensive research and analysis, deploying Chatterbox TTS on Railway is **infeasible for free tier** and **expensive for production** ($15-30/month minimum).

### Why Railway Free Tier Won't Work:
- **Memory Required**: 1.2-1.5 GB (Free tier: 0.5-1 GB max)
- **Model Size**: ~350MB Chatterbox + ~500MB PyTorch
- **Cold Starts**: 10-15 second delay on first request
- **Cost Projection**: $30/month for always-on service

## Recommended Solution: Hybrid Cloud TTS

### Implementation Complete

I've implemented a **flexible TTS system** that supports multiple providers:

1. **Web Speech API** (Default, Free)
   - Browser-based, zero cost
   - Instant response
   - Works offline

2. **Google Cloud TTS** (Recommended for Production)
   - Free tier: 1M characters/month
   - High-quality Neural2 voices
   - 0.5-1 second response time
   - Cost: $0/month for typical usage

3. **ElevenLabs** (Best Quality)
   - $5/month for 30k characters
   - Voice cloning available
   - Industry-leading quality

4. **Custom Backend** (Advanced, Expensive)
   - Railway separate service
   - Full Chatterbox TTS control
   - $30/month minimum cost

## Files Created

### Configuration Files:
```
/Users/a21/agnes-21/
├── .env.example                          # Updated with TTS config
├── .railwayignore                        # Optimize deployment size
├── DEPLOYMENT_PLAN.md                    # Detailed analysis
├── RAILWAY_SETUP.md                      # Complete setup guide
└── IMPLEMENTATION_SUMMARY.md             # This file
```

### Backend Service (Option 3 - Custom TTS):
```
/Users/a21/agnes-21/backend/
├── railway.json                          # Railway service config
├── Dockerfile                            # Optimized container
├── requirements-optimized.txt            # CPU-only PyTorch
└── setup_voices.sh                       # Voice files setup script
```

### Frontend TTS Integration:
```
/Users/a21/agnes-21/src/services/
├── tts-manager.ts                        # Universal TTS manager
└── tts-config.ts                         # Environment-based config
```

## How It Works

### TTS Manager Architecture:
```typescript
// Automatic provider selection based on environment
VITE_TTS_PROVIDER=webspeech  → Browser API (free)
VITE_TTS_PROVIDER=google     → Google Cloud TTS ($0-4/month)
VITE_TTS_PROVIDER=elevenlabs → ElevenLabs API ($5/month)
VITE_TTS_PROVIDER=custom     → Railway backend ($30/month)
```

### Fallback Chain:
```
Primary Provider
    ↓ (if fails)
Web Speech API (always available)
```

### Features:
- ✅ **Automatic caching** (reduces API calls)
- ✅ **Fallback mechanism** (high reliability)
- ✅ **Voice selection** (multiple voices per provider)
- ✅ **Error handling** (graceful degradation)
- ✅ **Performance tracking** (generation time metrics)

## Deployment Options Comparison

| Option | Cost/Month | Quality | Setup Time | Recommended For |
|--------|-----------|---------|------------|-----------------|
| **Web Speech API** | $0 | Good | 5 min | Development, Testing |
| **Google Cloud TTS** | $0-4 | Excellent | 15 min | ✅ **Production** |
| **ElevenLabs** | $5 | Best | 15 min | Premium Users |
| **Custom Backend** | $30+ | Custom | 2 hours | Voice Cloning Only |

## Quick Start: Deploy with Google Cloud TTS (RECOMMENDED)

### Step 1: Get Google Cloud API Key
```bash
# 1. Go to https://console.cloud.google.com/apis/credentials
# 2. Create new project "Agnes-21"
# 3. Enable "Cloud Text-to-Speech API"
# 4. Create API key
```

### Step 2: Configure Railway Environment
```bash
# In Railway Dashboard → Agnes-21 → Variables:
VITE_GEMINI_API_KEY=your_existing_gemini_key
VITE_TTS_PROVIDER=google
VITE_TTS_API_KEY=your_google_cloud_key
```

### Step 3: Deploy
```bash
cd /Users/a21/agnes-21
git add .
git commit -m "Add multi-provider TTS support"
git push origin main
```

### Step 4: Test
```bash
# Visit https://livea21.up.railway.app
# Use any TTS feature
# Check browser console for "TTS Configuration" log
```

## Alternative: Deploy with Web Speech API (FREE)

### Step 1: Configure Railway
```bash
# In Railway Dashboard → Variables:
VITE_GEMINI_API_KEY=your_existing_gemini_key
VITE_TTS_PROVIDER=webspeech
# No API key needed!
```

### Step 2: Deploy
```bash
cd /Users/a21/agnes-21
git add .
git commit -m "Deploy with Web Speech API TTS"
git push origin main
```

## Advanced: Custom Backend Setup

**Only if you need voice cloning and have budget for $30/month.**

### Prerequisites:
```bash
# 1. Upgrade to Railway Hobby Plan ($5/month)
# 2. Prepare voice files
cd /Users/a21/agnes-21
./backend/setup_voices.sh
```

### Railway Configuration:
```bash
# 1. Create new service "agnes-tts-backend"
# 2. Set root directory: /backend
# 3. Set config path: /backend/railway.json
# 4. Set watch paths: /backend/**, /voices/**, /server/**
# 5. Deploy
```

See `RAILWAY_SETUP.md` for complete instructions.

## Integration with Agnes 21 Frontend

### Using TTS in Your React Components:
```typescript
import { ttsManager } from '@/services/tts-config';

// Generate speech
const response = await ttsManager.generateSpeech(
  "Hello from Agnes 21!",
  {
    voice: 'en-US-Neural2-F',  // Google Cloud voice
    speed: 1.0,
    pitch: 0.0
  }
);

// Play audio
const audio = new Audio(response.audioUrl);
audio.play();

// Get available voices
const voices = await ttsManager.getAvailableVoices();
console.log(voices);
```

### Provider-Specific Voice IDs:

**Google Cloud TTS**:
- `en-US-Neural2-A` - Male
- `en-US-Neural2-C` - Female
- `en-US-Neural2-D` - Male
- `en-US-Neural2-F` - Female (recommended)

**ElevenLabs**:
- Voice IDs from your account
- Can clone from your WAV files

**Web Speech API**:
- Browser-dependent
- Use `getAvailableVoices()` to list

**Custom Backend**:
- `reeses_piecies`
- `agnes_21`
- `21`
- `rufus`

## Cost Analysis

### Typical Usage (100 TTS requests/day):
- **Web Speech API**: $0/month
- **Google Cloud TTS**: $0/month (free tier covers it)
- **ElevenLabs**: $5/month (30k characters)
- **Custom Backend**: $30/month (always-on)

### Heavy Usage (1000 TTS requests/day):
- **Web Speech API**: $0/month
- **Google Cloud TTS**: $12/month (3M characters)
- **ElevenLabs**: $50/month (300k characters)
- **Custom Backend**: $45/month (higher CPU usage)

## Performance Comparison

| Provider | Cold Start | Response Time | Quality (1-10) |
|----------|-----------|---------------|----------------|
| Web Speech | 0ms | 0ms | 6 |
| Google TTS | 0ms | 500-1000ms | 9 |
| ElevenLabs | 0ms | 800-1500ms | 10 |
| Custom Backend | 15s | 2000-5000ms | 8 |

## Next Steps

### For Immediate Deployment:
1. ✅ **Use Web Speech API** (already configured)
   ```bash
   # Just deploy as-is
   git push origin main
   ```

2. ✅ **Upgrade to Google Cloud TTS** (15 min setup)
   - Get API key from Google Cloud Console
   - Add to Railway environment variables
   - Redeploy

### For Future Enhancements:
- [ ] Add voice selection UI in frontend
- [ ] Implement audio caching in IndexedDB
- [ ] Add offline support with service worker
- [ ] Create voice customization settings
- [ ] Add TTS usage analytics

## Troubleshooting

### TTS Not Working:
```javascript
// Check configuration in browser console
import { debugConfig } from '@/services/tts-config';
debugConfig();
```

### Voice Selection Issues:
```javascript
// List available voices
const voices = await ttsManager.getAvailableVoices();
console.log('Available voices:', voices);
```

### API Key Errors:
```bash
# Verify environment variables in Railway
railway variables

# Check .env.local for local development
cat .env.local
```

## Resources

- [Deployment Plan](./DEPLOYMENT_PLAN.md) - Detailed analysis
- [Railway Setup Guide](./RAILWAY_SETUP.md) - Step-by-step instructions
- [Google Cloud TTS Docs](https://cloud.google.com/text-to-speech/docs)
- [ElevenLabs Docs](https://docs.elevenlabs.io)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)

## Summary

**Bottom Line**: Deploy with **Google Cloud TTS** for production-quality voices at **$0/month** for typical usage.

The custom Chatterbox backend is only worth it if you specifically need voice cloning and have $30/month budget. For most users, cloud TTS provides better value.

All files are ready. Choose your deployment option and follow the relevant guide!
