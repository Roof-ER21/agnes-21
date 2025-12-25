#!/usr/bin/env python3
"""
Chatterbox TTS Backend Service for Agnes 21
FastAPI service providing voice cloning TTS capabilities.
"""

import os
import io
import time
import logging
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Chatterbox TTS Service",
    description="Voice cloning TTS API for Agnes 21",
    version="1.0.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
VOICES_DIR = Path.home() / "chatterbox_outputs" / "voices"
OUTPUT_DIR = Path.home() / "chatterbox_outputs" / "tts_cache"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Available voices
VOICES = {
    "reeses_piecies": {
        "name": "Reeses Piecies",
        "file": str(VOICES_DIR / "reeses_piecies.wav"),
        "description": "Custom voice with varied pitches",
        "duration": "91 sec"
    },
    "agnes_21": {
        "name": "Agnes 21",
        "file": str(VOICES_DIR / "agnes_21.wav"),
        "description": "AI female voice (Gemini Kore)",
        "duration": "27 sec"
    },
    "21": {
        "name": "21",
        "file": str(VOICES_DIR / "21.wav"),
        "description": "21 voice from leaderboard",
        "duration": "106 sec"
    },
    "rufus": {
        "name": "Rufus",
        "file": str(VOICES_DIR / "rufus.wav"),
        "description": "Rufus AI voice character",
        "duration": "46 sec"
    }
}

# Lazy-loaded TTS model
_tts_model = None

def get_tts_model():
    """Lazy load the Chatterbox TTS model."""
    global _tts_model
    if _tts_model is None:
        logger.info("Loading Chatterbox TTS model...")
        start = time.time()
        try:
            from chatterbox.tts_turbo import ChatterboxTurboTTS
            _tts_model = ChatterboxTurboTTS.from_pretrained(device="cpu")
            logger.info(f"Model loaded in {time.time() - start:.2f}s")
        except ImportError as e:
            logger.error(f"Failed to import Chatterbox: {e}")
            raise HTTPException(status_code=500, detail="TTS model not available")
    return _tts_model

# Request/Response models
class TTSRequest(BaseModel):
    text: str
    voice: str = "reeses_piecies"
    exaggeration: float = 0.4

class VoiceInfo(BaseModel):
    id: str
    name: str
    description: str
    duration: str
    available: bool

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    voices_available: int

# API Endpoints
@app.get("/api/tts/health", response_model=HealthResponse)
async def health_check():
    """Check service health and model status."""
    model_loaded = _tts_model is not None
    voices_available = sum(1 for v in VOICES.values() if Path(v["file"]).exists())
    return HealthResponse(
        status="healthy",
        model_loaded=model_loaded,
        voices_available=voices_available
    )

@app.get("/api/tts/voices")
async def list_voices():
    """List all available voices."""
    result = []
    for voice_id, info in VOICES.items():
        result.append(VoiceInfo(
            id=voice_id,
            name=info["name"],
            description=info["description"],
            duration=info["duration"],
            available=Path(info["file"]).exists()
        ))
    return result

@app.post("/api/tts/generate")
async def generate_speech(request: TTSRequest):
    """Generate speech using voice cloning."""
    # Validate voice
    if request.voice not in VOICES:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown voice: {request.voice}. Available: {list(VOICES.keys())}"
        )

    voice_info = VOICES[request.voice]
    voice_path = Path(voice_info["file"])

    if not voice_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Voice file not found: {voice_path}"
        )

    # Validate text
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    if len(request.text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long (max 5000 chars)")

    # Generate speech
    try:
        import torchaudio as ta

        model = get_tts_model()
        logger.info(f"Generating speech for: '{request.text[:50]}...' with voice '{request.voice}'")

        start = time.time()
        wav = model.generate(
            text=request.text,
            audio_prompt_path=str(voice_path),
            exaggeration=request.exaggeration
        )
        gen_time = time.time() - start
        logger.info(f"Generated in {gen_time:.2f}s")

        # Convert to WAV bytes
        buffer = io.BytesIO()
        ta.save(buffer, wav, model.sr, format="wav")
        buffer.seek(0)

        return Response(
            content=buffer.read(),
            media_type="audio/wav",
            headers={
                "X-Generation-Time": str(gen_time),
                "X-Voice-Used": request.voice
            }
        )

    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {str(e)}")

@app.post("/api/tts/preload")
async def preload_model():
    """Pre-load the TTS model (called at startup)."""
    try:
        get_tts_model()
        return {"status": "model_loaded"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Startup event
@app.on_event("startup")
async def startup_event():
    """Load model on startup if AUTO_LOAD is set."""
    if os.environ.get("AUTO_LOAD_MODEL", "false").lower() == "true":
        logger.info("Auto-loading TTS model...")
        try:
            get_tts_model()
        except Exception as e:
            logger.warning(f"Failed to auto-load model: {e}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--host", type=str, default="0.0.0.0")
    parser.add_argument("--reload", action="store_true")
    parser.add_argument("--preload", action="store_true", help="Preload TTS model on startup")
    args = parser.parse_args()

    if args.preload:
        os.environ["AUTO_LOAD_MODEL"] = "true"

    uvicorn.run(
        "tts_service:app",
        host=args.host,
        port=args.port,
        reload=args.reload
    )
