# Optimized Dockerfile for Chatterbox TTS on Railway
# This configuration minimizes memory usage while maintaining functionality

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies (minimal)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for layer caching)
COPY server/requirements.txt .

# Install Python dependencies with CPU-only PyTorch
RUN pip install --no-cache-dir \
    fastapi>=0.109.0 \
    uvicorn[standard]>=0.27.0 \
    pydantic>=2.0.0 \
    python-multipart>=0.0.6 \
    && pip install --no-cache-dir \
    torch==2.3.1+cpu \
    torchaudio==2.3.1+cpu \
    -f https://download.pytorch.org/whl/torch_stable.html

# Install Chatterbox TTS
# Note: This assumes chatterbox-tts is available via pip
# If not, you'll need to include the package or install from source
RUN pip install --no-cache-dir chatterbox-tts || \
    echo "WARNING: chatterbox-tts not available via pip. Manual installation required."

# Copy application code
COPY server/ ./server/

# Copy voice files
COPY voices/ ./voices/

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV VOICES_DIR=/app/voices
ENV OUTPUT_DIR=/tmp/tts_cache
ENV AUTO_LOAD_MODEL=false

# Create output directory
RUN mkdir -p /tmp/tts_cache

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/tts/health')"

# Run the application
CMD ["uvicorn", "server.tts_service:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
