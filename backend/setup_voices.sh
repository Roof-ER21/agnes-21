#!/bin/bash
# Voice Files Setup Script for Railway Deployment
# This script copies voice files from local system to deployment directory

set -e

VOICES_DIR="$(dirname "$0")/../voices"
SOURCE_DIR="$HOME/chatterbox_outputs/voices"

echo "Setting up voice files for deployment..."

# Create voices directory if it doesn't exist
mkdir -p "$VOICES_DIR"

# Copy voice files
echo "Copying voice files from $SOURCE_DIR..."

if [ -f "$SOURCE_DIR/reeses_piecies.wav" ]; then
    cp "$SOURCE_DIR/reeses_piecies.wav" "$VOICES_DIR/"
    echo "  ✓ reeses_piecies.wav ($(du -h "$VOICES_DIR/reeses_piecies.wav" | cut -f1))"
fi

if [ -f "$SOURCE_DIR/agnes_21.wav" ]; then
    cp "$SOURCE_DIR/agnes_21.wav" "$VOICES_DIR/"
    echo "  ✓ agnes_21.wav ($(du -h "$VOICES_DIR/agnes_21.wav" | cut -f1))"
fi

if [ -f "$SOURCE_DIR/21.wav" ]; then
    cp "$SOURCE_DIR/21.wav" "$VOICES_DIR/"
    echo "  ✓ 21.wav ($(du -h "$VOICES_DIR/21.wav" | cut -f1))"
fi

if [ -f "$SOURCE_DIR/rufus.wav" ]; then
    cp "$SOURCE_DIR/rufus.wav" "$VOICES_DIR/"
    echo "  ✓ rufus.wav ($(du -h "$VOICES_DIR/rufus.wav" | cut -f1))"
fi

echo ""
echo "Voice files setup complete!"
echo "Total size: $(du -sh "$VOICES_DIR" | cut -f1)"
echo ""
echo "Note: These files will be included in the Docker image."
echo "Total deployment size will be approximately 1.5GB with model + voices."
