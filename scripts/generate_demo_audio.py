#!/usr/bin/env python3
"""
Generate pre-recorded demo audio files for Agnes 21 Roleplay Demos
Uses Chatterbox TTS with voice cloning.
"""

import os
import sys
from pathlib import Path

# Add chatterbox-env to path
sys.path.insert(0, str(Path.home() / "chatterbox-env/lib/python3.10/site-packages"))

print("Loading Chatterbox TTS model...")
from chatterbox.tts_turbo import ChatterboxTurboTTS
import torchaudio as ta

# Paths
VOICES_DIR = Path.home() / "chatterbox_outputs" / "voices"
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "demos"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Voices
SALESPERSON_VOICE = VOICES_DIR / "21.wav"  # 21 voice for salesperson
HOMEOWNER_VOICE = VOICES_DIR / "agnes_21.wav"  # Agnes 21 for homeowner

# Demo scripts
DEMO_SCRIPTS = {
    "excellent": {
        "salesperson": [
            "Good morning! My name is Marcus with Roof E-R. How are you today?",
            "I totally understand - I'll be quick! I'm just out here because we're doing free storm damage inspections in the neighborhood after last week's hail. Your neighbor across the street, the Johnsons, actually just had their roof inspected and we found some damage their insurance is covering completely.",
            "Yeah, it's pretty common after storms like we had. The damage isn't always visible from the ground. Would you mind if I took a quick 10-minute look at your roof? Totally free, no obligation. I just want to make sure you're protected."
        ],
        "homeowner": [
            "Oh, I'm alright. A bit busy though.",
            "Oh really? I didn't know there was hail damage around here.",
            "Sure, go ahead and take a look."
        ]
    },
    "good": {
        "salesperson": [
            "Hi there! I'm Marcus from Roof E-R. We're out doing roof inspections in the neighborhood.",
            "Well, there was a storm last week and we're checking for damage. Your neighbor mentioned they might have some issues so we're going around to help everyone out.",
            "That's good! Most storm damage isn't visible from the ground though. Would it be okay if I just took a quick look? It's free and only takes about 10 minutes."
        ],
        "homeowner": [
            "Okay... what for?",
            "I see. We haven't noticed anything wrong with our roof.",
            "I guess that would be alright."
        ]
    },
    "bad": {
        "salesperson": [
            "Hey there. So we're doing roof inspections today. You interested?",
            "Oh yeah, Roof E-R. Anyway, there was a storm and your roof probably has damage. Can I check it out?",
            "It'll only take a few minutes. You really should get it looked at before it gets worse."
        ],
        "homeowner": [
            "Uh, who are you with?",
            "I don't know, we're pretty busy right now...",
            "Maybe another time."
        ]
    },
    "awful": {
        "salesperson": [
            "Hey, you need a new roof. We're the best company around.",
            "Doesn't matter. Your roof is definitely damaged. Everyone in this neighborhood is getting work done. Sign up now before spots fill up.",
            "Come on, everyone's doing it. You'd be crazy to pass this up. Your roof is definitely damaged, trust me.",
            "But—"
        ],
        "homeowner": [
            "Excuse me? Who are you?",
            "No thanks, I'm not interested.",
            "Please leave. I said I'm not interested.",
            "Door slams."
        ]
    }
}

def generate_audio(text: str, voice_path: Path, output_path: Path, model: ChatterboxTurboTTS, exaggeration: float = 0.4):
    """Generate audio for a single line."""
    print(f"  Generating: {text[:50]}...")
    wav = model.generate(
        text=text,
        audio_prompt_path=str(voice_path),
        exaggeration=exaggeration
    )
    ta.save(str(output_path), wav, model.sr)
    print(f"  Saved: {output_path.name}")

def main():
    # Load model
    print("Loading Chatterbox TTS model (this may take a moment)...")
    model = ChatterboxTurboTTS.from_pretrained(device="cpu")
    print("Model loaded!")

    # Check voice files
    if not SALESPERSON_VOICE.exists():
        print(f"ERROR: Salesperson voice not found: {SALESPERSON_VOICE}")
        sys.exit(1)
    if not HOMEOWNER_VOICE.exists():
        print(f"ERROR: Homeowner voice not found: {HOMEOWNER_VOICE}")
        sys.exit(1)

    print(f"\nUsing voices:")
    print(f"  Salesperson: {SALESPERSON_VOICE}")
    print(f"  Homeowner: {HOMEOWNER_VOICE}")
    print(f"\nOutput directory: {OUTPUT_DIR}\n")

    # Generate audio for each demo level
    for level, scripts in DEMO_SCRIPTS.items():
        print(f"\n{'='*50}")
        print(f"Generating {level.upper()} level demos")
        print(f"{'='*50}")

        # Generate salesperson lines
        for i, line in enumerate(scripts["salesperson"], 1):
            output_file = OUTPUT_DIR / f"{level}_salesperson_{i}.wav"
            # Use slightly different exaggeration for different levels
            exaggeration = 0.5 if level in ["excellent", "good"] else 0.6
            generate_audio(line, SALESPERSON_VOICE, output_file, model, exaggeration)

        # Generate homeowner lines
        for i, line in enumerate(scripts["homeowner"], 1):
            output_file = OUTPUT_DIR / f"{level}_homeowner_{i}.wav"
            # Homeowner emotions vary by level
            exaggeration = 0.4 if level in ["excellent", "good"] else 0.5
            if level == "awful" and i >= 3:
                exaggeration = 0.7  # More emotional for angry/door slam
            generate_audio(line, HOMEOWNER_VOICE, output_file, model, exaggeration)

    print(f"\n{'='*50}")
    print("Demo audio generation complete!")
    print(f"Files saved to: {OUTPUT_DIR}")
    print(f"{'='*50}\n")

    # List generated files
    files = list(OUTPUT_DIR.glob("*.wav"))
    print(f"Generated {len(files)} audio files:")
    for f in sorted(files):
        print(f"  - {f.name}")

if __name__ == "__main__":
    main()
