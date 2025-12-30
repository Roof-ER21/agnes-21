# Agnes 21 TTS Deployment Plan

## Critical Assessment

### Chatterbox TTS on Railway: INFEASIBLE for Free/Hobby Tier

**Why Railway Free Tier Won't Work:**
1. **Memory Constraints**:
   - Free Trial: 1 GB RAM max (then 0.5 GB after trial)
   - Hobby: 8 GB RAM max at $5/month
   - Chatterbox model: ~350MB + PyTorch runtime (~500MB) + voice files (~13MB) = **~900MB minimum**
   - With FastAPI overhead and inference: **1.2-1.5 GB RAM needed**

2. **CPU Constraints**:
   - Free Trial: Shared vCPU (very slow)
   - Hobby: Up to 8 vCPU but billed per second
   - TTS inference on CPU: 2-5 seconds per generation
   - Cost: $0.00000772 per vCPU/sec = **~$0.20-$0.50 per day** for moderate usage

3. **Cold Start Issues**:
   - Model loading takes 10-15 seconds
   - Railway may kill idle services
   - Poor user experience on first request

4. **Monthly Cost Estimate**:
   - Hobby Plan: $5 base + usage
   - With TTS service: **$15-30/month** for light usage
   - **Not suitable for free deployment**

## Recommended Solutions (Ranked)

### Option 1: Hybrid Cloud TTS (RECOMMENDED)
**Status**: Best user experience, minimal cost
**Implementation**: Use cloud TTS APIs with voice customization

#### Benefits:
- Zero infrastructure costs (pay-per-use)
- Instant response, no cold starts
- Scalable and reliable
- Easy to implement

#### Implementation:
1. **Primary**: Google Cloud Text-to-Speech (you already use Google GenAI)
   - Cost: $4 per 1M characters (Neural2 voices)
   - Free tier: 1M characters/month for WaveNet
   - Custom voice cloning available (extra cost)

2. **Alternative**: ElevenLabs API
   - Cost: $5/month for 30k characters (voice cloning included)
   - High-quality voices
   - Easy voice cloning from your WAV files

3. **Fallback**: Browser Web Speech API
   - Free, client-side
   - Lower quality but instant
   - No server needed

### Option 2: Separate Railway Service (EXPENSIVE)
**Status**: Technically feasible, costly
**Cost**: $15-30/month minimum

#### Setup:
- Create separate Railway service for TTS
- Use monorepo structure
- Configure internal networking
- Use Railway Volumes for voice files

#### Pros:
- Full control over Chatterbox
- Custom voice cloning
- Self-hosted

#### Cons:
- High monthly cost
- Complex deployment
- Cold start issues
- Maintenance overhead

### Option 3: External TTS Hosting (MODERATE COST)
**Status**: Good middle ground
**Cost**: $5-15/month

#### Options:
1. **Hugging Face Inference Endpoints**
   - Host Chatterbox model
   - $0.60/hour (CPU) = ~$430/month 24/7
   - Better: Serverless inference (pay per request)

2. **Modal Labs**
   - Serverless GPU/CPU functions
   - $0.00010/second CPU
   - Perfect for ML inference
   - Automatic scaling

3. **Replicate**
   - Deploy Chatterbox as public/private model
   - Pay per inference
   - $0.0002/second CPU

### Option 4: Client-Side TTS (FREE, LIMITED)
**Status**: Works, but limited quality
**Cost**: $0

#### Implementation:
- Use browser Web Speech API
- WASM-based TTS (e.g., piper-tts compiled to WASM)
- Trade-off: Lower quality, limited voices

## Implementation Strategy

### Phase 1: Quick Win (Cloud TTS)
**Timeline**: 1-2 hours
**Cost**: $0-5/month

1. Integrate Google Cloud TTS or ElevenLabs
2. Update Agnes 21 frontend to use cloud API
3. Keep voice selection UI
4. Deploy immediately

### Phase 2: Optional Self-Hosting (If Needed)
**Timeline**: 1-2 days
**Cost**: $15-30/month

1. Set up separate Railway service
2. Configure monorepo deployment
3. Implement voice file storage
4. Add internal networking

### Phase 3: Advanced (Voice Cloning)
**Timeline**: 3-5 days
**Cost**: Varies by provider

1. Upload voice samples to cloud provider
2. Train custom voices (ElevenLabs, Google Custom Voice)
3. Use cloned voices in production
4. Compare quality with Chatterbox

## Recommended Implementation: Hybrid Approach

### Architecture:
```
Agnes 21 Frontend (Railway)
    ↓
TTS Manager (client-side)
    ↓
├── Primary: Google Cloud TTS (Neural2 voices)
├── Fallback 1: ElevenLabs API (if Google fails)
└── Fallback 2: Web Speech API (offline)
```

### Cost Breakdown:
- Google Cloud TTS: Free tier covers ~10k messages/month
- ElevenLabs: $5/month (optional, for custom voices)
- Total: **$0-5/month**

### User Experience:
- Fast response (0.5-1 second)
- No cold starts
- High quality voices
- Reliable service

## Files to Create

### For Cloud TTS (Option 1 - RECOMMENDED):
1. `/Users/a21/agnes-21/src/services/tts-manager.ts` - TTS abstraction layer
2. `/Users/a21/agnes-21/src/services/google-tts.ts` - Google Cloud TTS
3. `/Users/a21/agnes-21/src/services/elevenlabs-tts.ts` - ElevenLabs API
4. Update `.env` with API keys

### For Railway Multi-Service (Option 2):
1. `/Users/a21/agnes-21/backend/railway.json` - Backend service config
2. `/Users/a21/agnes-21/backend/Dockerfile` - Optimized Python container
3. `/Users/a21/agnes-21/backend/requirements.txt` - Minimal dependencies
4. `/Users/a21/agnes-21/voices/` - Embedded voice files
5. Update frontend `railway.json` with watch paths

## Next Steps

**Recommended**: Implement Option 1 (Hybrid Cloud TTS)

Would you like me to:
1. ✅ **Implement Google Cloud TTS integration** (fastest, free tier)
2. ✅ **Implement ElevenLabs integration** (custom voices, $5/month)
3. ⚠️ **Set up Railway multi-service** (expensive, $15-30/month)
4. ⚠️ **Explore external hosting** (Modal/Replicate, variable cost)

## Resources
- [Railway Monorepo Deployment](https://docs.railway.com/guides/monorepo)
- [FastAPI Railway Guide](https://docs.railway.com/guides/fastapi)
- [Railway Pricing](https://docs.railway.com/reference/pricing/plans)
- [Google Cloud TTS Pricing](https://cloud.google.com/text-to-speech/pricing)
- [ElevenLabs Pricing](https://elevenlabs.io/pricing)
