/**
 * RoleplayDemo Component
 * Plays pre-generated AI-to-AI roleplay demonstrations showing different quality levels
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Star,
  Award,
  TrendingUp,
  TrendingDown,
  XCircle,
  CheckCircle,
  ArrowLeft,
  MessageCircle,
  Lightbulb
} from 'lucide-react';

// Demo quality levels with scoring info
const DEMO_LEVELS = [
  {
    id: 'excellent',
    name: 'Excellent',
    score: '90/100',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500',
    icon: Award,
    description: 'Perfect delivery - handles multiple objections with ease',
    lines: 20,
    characteristics: [
      'Warm intro with name and company in first 5 seconds',
      'Builds rapport by relating to homeowner (has kids too)',
      'Specific neighbor reference with address (the Johnsons at 1842)',
      'Handles "roof is new" objection by explaining warranty benefits',
      'Handles "have a guy" objection by offering value to their relationship',
      'Transparent about business model when asked "what\'s the catch"',
      'Strong but pressure-free close with practical next steps'
    ]
  },
  {
    id: 'good',
    name: 'Good',
    score: '70/100',
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500',
    icon: TrendingUp,
    description: 'Solid approach with room to improve on objection handling',
    lines: 18,
    characteristics: [
      'Good intro but could be warmer',
      'Vague neighbor reference (could be more specific)',
      'Handles time objection with flexibility',
      'Offers ground-level check as alternative',
      'Gets appointment but lacks the personal touch',
      'Could build more rapport before going for close'
    ]
  },
  {
    id: 'bad',
    name: 'Needs Work',
    score: '40/100',
    color: 'from-yellow-500 to-orange-600',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500',
    icon: TrendingDown,
    description: 'Poor objection handling leads to lost appointment',
    lines: 16,
    characteristics: [
      'Skips proper introduction - too casual',
      'Assumes damage without evidence',
      'Gets defensive when homeowner pushes back',
      'Uses fear tactics instead of value proposition',
      'Doesn\'t acknowledge homeowner\'s concerns',
      'Poor exit - "don\'t say I didn\'t warn you"'
    ]
  },
  {
    id: 'awful',
    name: 'Door Slam',
    score: '15/100',
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500',
    icon: XCircle,
    description: 'High pressure tactics result in complete rejection',
    lines: 12,
    characteristics: [
      'No introduction at all - starts with pressure',
      'Makes false claims about damage',
      'Ignores multiple clear "no" responses',
      'Uses manipulative peer pressure ("everyone\'s doing it")',
      'Becomes hostile when rejected',
      'Insults homeowner on the way out - burns all bridges'
    ]
  }
];

// Objection-focused demo levels
const OBJECTION_LEVELS = [
  {
    id: 'too-busy',
    name: '"Too Busy"',
    score: 'Objection',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500',
    icon: TrendingUp,
    description: 'How to handle "I\'m busy right now"',
    lines: 10,
    characteristics: [
      'Immediately respects their time constraint',
      'Offers to schedule for a better time',
      'Delivers quick 30-second pitch',
      'Gets specific callback time confirmed',
      'Leaves card with personal touch'
    ]
  },
  {
    id: 'not-interested',
    name: '"Not Interested"',
    score: 'Objection',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500',
    icon: TrendingUp,
    description: 'Turning an immediate "no" into curiosity',
    lines: 10,
    characteristics: [
      'Acknowledges they get many salespeople',
      'Pivots with an intriguing question',
      'Explains the free inspection value',
      'Addresses "what\'s in it for you" honestly',
      'Low-commitment close'
    ]
  },
  {
    id: 'have-a-guy',
    name: '"Have a Roofer"',
    score: 'Objection',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500',
    icon: TrendingUp,
    description: 'Working with their existing contractor relationship',
    lines: 10,
    characteristics: [
      'Validates their relationship with their contractor',
      'Asks if their guy has checked for storm damage',
      'Offers to provide documentation they can share',
      'Positions self as helpful, not competitive',
      'Gets phone number naturally for photo sharing'
    ]
  },
  {
    id: 'no-money',
    name: '"Can\'t Afford It"',
    score: 'Objection',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500',
    icon: TrendingUp,
    description: 'Explaining the insurance-paid model',
    lines: 10,
    characteristics: [
      'Immediately acknowledges money concerns',
      'Explains this costs them nothing',
      'Addresses deductible concern with real example',
      'Simple risk/reward breakdown',
      'Removes financial barrier to inspection'
    ]
  },
  {
    id: 'spouse-not-home',
    name: '"Spouse Not Home"',
    score: 'Objection',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500',
    icon: TrendingUp,
    description: 'Working with whoever is home',
    lines: 10,
    characteristics: [
      'Removes pressure for any decision',
      'Explains the photo documentation process',
      'Empowers them to be the informed one',
      'Offers to answer spouse\'s questions later',
      'Gets contact info for follow-up'
    ]
  }
];

// Demo scripts with transcript - Expanded with multiple objections and handling techniques
const DEMO_SCRIPTS: Record<string, Array<{ speaker: 'salesperson' | 'homeowner'; text: string; emotion?: string; note?: string }>> = {
  excellent: [
    // Opening with rapport building (1-4)
    { speaker: 'salesperson', text: "Good morning! My name is Marcus with Roof-ER. How are you doing today?", note: "Friendly intro with name and company" },
    { speaker: 'homeowner', text: "I'm alright, just busy with the kids right now." },
    { speaker: 'salesperson', text: "Oh I totally get it - I've got two little ones myself! I'll keep this super quick, I promise.", note: "Builds rapport, acknowledges their time" },
    { speaker: 'homeowner', text: "Okay, what's this about?" },

    // Value proposition with social proof (5-8)
    { speaker: 'salesperson', text: "We're out here doing free storm damage inspections after last Tuesday's hail. Your neighbor across the street, the Johnsons at 1842, just had us out and we found damage their insurance is covering 100%.", note: "Specific neighbor reference, insurance benefit" },
    { speaker: 'homeowner', text: "Really? I didn't even know we had hail." },
    { speaker: 'salesperson', text: "Yeah, it came through around 2am - most people slept right through it. But it hit this area pretty hard.", note: "Provides context, establishes expertise" },
    { speaker: 'homeowner', text: "Hmm, our roof is only like 8 years old though...", emotion: 'hesitant' },

    // First objection - Roof age (9-10)
    { speaker: 'salesperson', text: "That's actually when it matters most! Newer roofs can still get damaged, and you want to catch it before your warranty runs out or it causes leaks. An 8-year-old roof has plenty of life left if we protect it now.", note: "Turns objection into benefit" },
    { speaker: 'homeowner', text: "I don't know... we've got a guy we usually use for stuff like this.", emotion: 'hesitant' },

    // Second objection - Have a guy (11-14)
    { speaker: 'salesperson', text: "That's great you have someone! Here's the thing though - this inspection is completely free, takes about 10 minutes, and I'll show you exactly what I find with photos on your phone. If there's nothing, you'll have peace of mind. And if there is damage, you can have your guy do the work - no pressure from me.", note: "Removes risk, offers value regardless" },
    { speaker: 'homeowner', text: "So you're not going to try to sell me something?" },
    { speaker: 'salesperson', text: "Look, here's my card. My job today is just to document any storm damage and show you what I find. If your roof is fine, I shake your hand and move on. If there's damage, I'll explain your options and you can decide what makes sense for your family.", note: "Transparent, gives control to homeowner" },
    { speaker: 'homeowner', text: "That's... actually fair. How long did you say it takes?" },

    // Close with convenience (15-18)
    { speaker: 'salesperson', text: "About 10 minutes tops. I can do it right now while you get back to the kids, and I'll knock when I'm done to show you the photos.", note: "Makes it easy, respects their time" },
    { speaker: 'homeowner', text: "And it's really free? What's the catch?" },
    { speaker: 'salesperson', text: "No catch - we're here because insurance companies are paying for storm damage repairs right now. The more roofs we inspect, the more families we can help. If we find something, you file a claim; if not, you're all set.", note: "Explains the business model honestly" },
    { speaker: 'homeowner', text: "Alright, go ahead and take a look.", emotion: 'positive' },

    // Confirmation and next steps (19-20)
    { speaker: 'salesperson', text: "Perfect! I'll head up now. One quick thing - is there a ladder in the backyard or should I use mine?", note: "Practical, professional transition" },
    { speaker: 'homeowner', text: "There's one by the garage. Thanks for being upfront about everything.", emotion: 'positive' }
  ],

  good: [
    // Opening - adequate but less warm (1-4)
    { speaker: 'salesperson', text: "Hi there! I'm Marcus from Roof-ER. We're out doing roof inspections in the neighborhood.", note: "Good intro, could be warmer" },
    { speaker: 'homeowner', text: "Okay... what for?" },
    { speaker: 'salesperson', text: "Well, there was a storm last week and we're checking for damage. Your neighbor mentioned they might have some issues so we're going around to help everyone out.", note: "Good reason, vague neighbor reference" },
    { speaker: 'homeowner', text: "I see. We haven't noticed anything wrong with our roof.", emotion: 'hesitant' },

    // Handling initial skepticism (5-8)
    { speaker: 'salesperson', text: "That's actually normal - most storm damage isn't visible from the ground. That's why we do the inspection.", note: "Good response but could be more conversational" },
    { speaker: 'homeowner', text: "How long does it take?" },
    { speaker: 'salesperson', text: "About 10 minutes. We take photos and show you exactly what we find.", note: "Good details" },
    { speaker: 'homeowner', text: "I'm not sure... we're kind of busy today." },

    // Handling time objection (9-12)
    { speaker: 'salesperson', text: "I understand. Would it help if I just did a quick visual check from the ground first? That way you don't have to wait around.", note: "Good flexibility" },
    { speaker: 'homeowner', text: "I guess that would be okay." },
    { speaker: 'salesperson', text: "Great. And if I see anything concerning, I can come back when it's more convenient for a full inspection.", note: "Respects their time" },
    { speaker: 'homeowner', text: "What exactly are you looking for?" },

    // Building credibility (13-16)
    { speaker: 'salesperson', text: "Mainly hail damage - dents in the shingles, cracked tiles, things like that. The storm last week was significant enough that a lot of homes in this zip code are getting new roofs through insurance.", note: "Good specifics" },
    { speaker: 'homeowner', text: "And this is all free?" },
    { speaker: 'salesperson', text: "Completely free. We only make money if you decide to use us for repairs, and that's your choice.", note: "Honest and direct" },
    { speaker: 'homeowner', text: "Okay, go ahead and take a look then.", emotion: 'neutral' },

    // Wrap up (17-18)
    { speaker: 'salesperson', text: "Thanks! I'll be quick and come back to show you what I find.", note: "Good professional close" },
    { speaker: 'homeowner', text: "Sounds good.", emotion: 'neutral' }
  ],

  bad: [
    // Weak opening (1-4)
    { speaker: 'salesperson', text: "Hey there. So we're doing roof inspections today. You interested?", note: "No introduction, too casual" },
    { speaker: 'homeowner', text: "Uh, who are you with?" },
    { speaker: 'salesperson', text: "Oh yeah, Roof-ER. Anyway, there was a storm and your roof probably has damage. Can I check it out?", note: "Skipped rapport, assumed damage" },
    { speaker: 'homeowner', text: "I don't know, we're pretty busy right now..." },

    // Poor objection handling (5-8)
    { speaker: 'salesperson', text: "It'll only take a few minutes. You really should get it looked at before it gets worse.", note: "Pushy, doesn't acknowledge their concern" },
    { speaker: 'homeowner', text: "What company did you say you were with?", emotion: 'suspicious' },
    { speaker: 'salesperson', text: "Roof-ER. We do a lot of work in this area. So can I get up there or...?", note: "Impatient, skipping trust building" },
    { speaker: 'homeowner', text: "I'm not comfortable with that. We don't even know if there's damage." },

    // Getting defensive (9-12)
    { speaker: 'salesperson', text: "There's definitely damage. Every house on this street got hit by the storm.", note: "Making claims without evidence" },
    { speaker: 'homeowner', text: "How do you know our roof is damaged?", emotion: 'skeptical' },
    { speaker: 'salesperson', text: "Because the storm was really bad. Look, I'm just trying to help you out here.", note: "Getting defensive" },
    { speaker: 'homeowner', text: "I appreciate it, but we'll call someone if we notice any issues." },

    // Losing the appointment (13-16)
    { speaker: 'salesperson', text: "By then it might be too late. Water damage can cost thousands.", note: "Fear tactics" },
    { speaker: 'homeowner', text: "That's a bit dramatic. I think we're good.", emotion: 'annoyed' },
    { speaker: 'salesperson', text: "Okay, but don't say I didn't warn you. Here's my card at least.", note: "Poor exit" },
    { speaker: 'homeowner', text: "Maybe another time.", emotion: 'dismissive' }
  ],

  awful: [
    // Terrible opening (1-4)
    { speaker: 'salesperson', text: "Hey, you need a new roof. We're the best company around.", note: "No intro, immediate pressure" },
    { speaker: 'homeowner', text: "Excuse me? Who are you?" },
    { speaker: 'salesperson', text: "Doesn't matter. Your roof is definitely damaged. Everyone in this neighborhood is getting work done. Sign up now before spots fill up.", note: "High pressure, making false claims" },
    { speaker: 'homeowner', text: "No thanks, I'm not interested.", emotion: 'annoyed' },

    // Ignoring clear no (5-8)
    { speaker: 'salesperson', text: "Come on, everyone's doing it. You'd be crazy to pass this up. Your roof is definitely damaged, trust me.", note: "Pushy, manipulative language" },
    { speaker: 'homeowner', text: "I said no. We're not interested.", emotion: 'angry' },
    { speaker: 'salesperson', text: "Look, I'm doing you a favor here. Your neighbors already signed up. Don't be the one house on the block with a leaky roof.", note: "Peer pressure tactics" },
    { speaker: 'homeowner', text: "Please leave. I'm not going to ask again.", emotion: 'angry' },

    // Complete failure (9-12)
    { speaker: 'salesperson', text: "Fine, but when your roof caves in, don't come crying to me.", note: "Insulting response" },
    { speaker: 'homeowner', text: "Get off my property.", emotion: 'angry' },
    { speaker: 'salesperson', text: "Whatever. You're making a huge mistake.", note: "Burning bridges" },
    { speaker: 'homeowner', text: "[Door slams]", emotion: 'door_slam' }
  ]
};

// Objection-specific demo scenarios for focused training
const OBJECTION_DEMOS: Record<string, Array<{ speaker: 'salesperson' | 'homeowner'; text: string; emotion?: string; note?: string }>> = {
  'too-busy': [
    { speaker: 'salesperson', text: "Hi! I'm Marcus with Roof-ER. Is now a good time?" },
    { speaker: 'homeowner', text: "Actually, I'm really busy right now. We're about to leave.", emotion: 'rushed' },
    { speaker: 'salesperson', text: "No problem at all! I just need 30 seconds to explain why I'm here, and if you're interested, we can schedule a time that works better.", note: "Respects time, offers alternative" },
    { speaker: 'homeowner', text: "Okay, what is it?", emotion: 'hesitant' },
    { speaker: 'salesperson', text: "Quick version: storm last week, free inspections, your neighbor at 1847 just got their whole roof covered by insurance. When would be a good time for a 10-minute check?" },
    { speaker: 'homeowner', text: "Maybe tomorrow morning?" },
    { speaker: 'salesperson', text: "Perfect. 9 AM work for you? I'll bring my ladder and be in and out.", note: "Confirms specific time" },
    { speaker: 'homeowner', text: "Yeah, 9 is fine.", emotion: 'neutral' },
    { speaker: 'salesperson', text: "Great! Here's my card - call me Marcus. See you tomorrow!", note: "Leaves card, personal touch" },
    { speaker: 'homeowner', text: "Okay, thanks.", emotion: 'neutral' }
  ],

  'not-interested': [
    { speaker: 'salesperson', text: "Good morning! I'm Marcus with Roof-ER..." },
    { speaker: 'homeowner', text: "Not interested, thanks.", emotion: 'dismissive' },
    { speaker: 'salesperson', text: "Totally understand - you must get a lot of people at your door! Quick question though: did you know the storm last Tuesday actually qualified this area for free roof inspections?", note: "Acknowledges, pivots with question" },
    { speaker: 'homeowner', text: "Free? What do you mean free?", emotion: 'curious' },
    { speaker: 'salesperson', text: "Insurance companies are covering storm damage right now. We inspect, document any damage, and if there's a claim, you get it fixed at no cost. If not, you're all set.", note: "Explains value" },
    { speaker: 'homeowner', text: "And what do you get out of it?" },
    { speaker: 'salesperson', text: "Fair question - we get to do the repair work if you choose us. But there's no obligation; some folks use their own contractor. We just want to make sure you know about the damage before it causes bigger problems.", note: "Honest answer" },
    { speaker: 'homeowner', text: "I guess it can't hurt to look.", emotion: 'neutral' },
    { speaker: 'salesperson', text: "That's all I ask. 10 minutes and you'll have peace of mind either way.", note: "Low commitment close" },
    { speaker: 'homeowner', text: "Alright, go ahead.", emotion: 'neutral' }
  ],

  'have-a-guy': [
    { speaker: 'salesperson', text: "Hey there! I'm Marcus with Roof-ER, doing free storm inspections..." },
    { speaker: 'homeowner', text: "Oh, we already have a roofer we use. Thanks though.", emotion: 'polite' },
    { speaker: 'salesperson', text: "That's great! Having a trusted contractor is important. Has your guy had a chance to check for storm damage from last week's hail?", note: "Validates their choice, asks question" },
    { speaker: 'homeowner', text: "No, we haven't called him yet." },
    { speaker: 'salesperson', text: "Makes sense - he's probably swamped right now. Here's what I can offer: I'll do the free inspection and document everything with photos. You can share those with your guy, and he can give you a quote. That way you're not waiting.", note: "Offers to help their existing relationship" },
    { speaker: 'homeowner', text: "That's actually not a bad idea.", emotion: 'interested' },
    { speaker: 'salesperson', text: "And if he's too busy, you've got options. Either way, you'll know exactly what's going on with your roof.", note: "No pressure" },
    { speaker: 'homeowner', text: "Yeah, okay. Let's do it.", emotion: 'positive' },
    { speaker: 'salesperson', text: "Perfect. I'll take the photos and text them to you - what's the best number?", note: "Gets contact info naturally" },
    { speaker: 'homeowner', text: "Sure, it's 555-0123.", emotion: 'positive' }
  ],

  'no-money': [
    { speaker: 'salesperson', text: "Hi! I'm Marcus with Roof-ER..." },
    { speaker: 'homeowner', text: "Look, whatever you're selling, we can't afford it right now.", emotion: 'stressed' },
    { speaker: 'salesperson', text: "I hear you - times are tough. But here's the thing: I'm not asking you to spend a dime.", note: "Acknowledges concern immediately" },
    { speaker: 'homeowner', text: "Nothing's ever really free.", emotion: 'skeptical' },
    { speaker: 'salesperson', text: "You're right to be skeptical. Here's exactly how it works: I check your roof for free. If there's storm damage, your insurance pays for repairs - not you. If there's no damage, you've lost nothing but 10 minutes.", note: "Explains the model clearly" },
    { speaker: 'homeowner', text: "But our deductible is probably high." },
    { speaker: 'salesperson', text: "That's a good point. What's your deductible? Because if the damage is significant, the insurance payout often covers way more than that. I had a customer last week with a $1,000 deductible who got a $15,000 roof.", note: "Addresses concern with example" },
    { speaker: 'homeowner', text: "Ours is $1,500 I think.", emotion: 'hesitant' },
    { speaker: 'salesperson', text: "Okay, so worst case: there's no damage and you've lost nothing. Best case: you get a new roof for $1,500 instead of $15,000. Worth a 10-minute look?", note: "Simple risk/reward" },
    { speaker: 'homeowner', text: "When you put it that way... okay, take a look.", emotion: 'cautious' }
  ],

  'spouse-not-home': [
    { speaker: 'salesperson', text: "Good afternoon! I'm Marcus with Roof-ER..." },
    { speaker: 'homeowner', text: "My husband handles all that stuff and he's at work.", emotion: 'unsure' },
    { speaker: 'salesperson', text: "No problem! I don't need anyone to make a decision today. I'm just here to do a free inspection and take photos after last week's storm.", note: "Removes pressure for decision" },
    { speaker: 'homeowner', text: "Well, what would I do with the photos?", emotion: 'curious' },
    { speaker: 'salesperson', text: "Great question - I'll text them to you, and you can show your husband when he gets home. That way he has all the information and can decide if he wants to pursue an insurance claim.", note: "Makes her the informed one" },
    { speaker: 'homeowner', text: "He does like to have all the facts before making decisions." },
    { speaker: 'salesperson', text: "Sounds like a smart guy! And honestly, most of the time the homeowner who's here during the inspection ends up being the one who understands the situation best to explain it.", note: "Empowers her" },
    { speaker: 'homeowner', text: "That's true. Okay, go ahead. What number should I give you for the photos?", emotion: 'positive' },
    { speaker: 'salesperson', text: "Perfect - and feel free to have your husband call me with any questions. I'm Marcus.", note: "Professional close" },
    { speaker: 'homeowner', text: "Great, thank you!", emotion: 'positive' }
  ]
};

interface Props {
  onBack?: () => void;
}

// Audio files only exist for quality demos (excellent, good, bad, awful)
const QUALITY_DEMO_IDS = ['excellent', 'good', 'bad', 'awful'];

// Helper to check if audio is available for a demo
const hasAudioFiles = (level: string): boolean => {
  return QUALITY_DEMO_IDS.includes(level);
};

// Helper to get audio file path for a script line
const getAudioPath = (level: string, speaker: 'salesperson' | 'homeowner', index: number): string => {
  return `/demos/${level}_${speaker}_${index + 1}.wav`;
};

const RoleplayDemo: React.FC<Props> = ({ onBack }) => {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [demoType, setDemoType] = useState<'quality' | 'objection'>('quality');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speakerCountRef = useRef<{ salesperson: number; homeowner: number }>({ salesperson: 0, homeowner: 0 });

  // Find the selected demo from either quality or objection levels
  const selectedDemo = demoType === 'quality'
    ? DEMO_LEVELS.find(d => d.id === selectedLevel)
    : OBJECTION_LEVELS.find(d => d.id === selectedLevel);

  // Get script from appropriate source
  const script = selectedLevel
    ? (demoType === 'quality' ? DEMO_SCRIPTS[selectedLevel] : OBJECTION_DEMOS[selectedLevel]) || []
    : [];

  // Handle level selection with type tracking
  const handleSelectLevel = (levelId: string, type: 'quality' | 'objection') => {
    setDemoType(type);
    setSelectedLevel(levelId);
    setCurrentLine(0);
    setProgress(0);
    setIsPlaying(false);
    setAudioError(null);
  };

  // Play audio for current line (or advance without audio for objection demos)
  const playCurrentLine = (lineIndex: number) => {
    if (!selectedLevel || lineIndex >= script.length) {
      setIsPlaying(false);
      return;
    }

    const line = script[lineIndex];
    const speaker = line.speaker;

    // For objection demos (no audio files), just auto-advance through lines
    if (!hasAudioFiles(selectedLevel)) {
      setCurrentLine(lineIndex);
      setProgress(((lineIndex + 1) / script.length) * 100);

      // Auto-advance to next line after a delay (simulating reading time)
      const readingTime = Math.max(2000, line.text.length * 50); // ~50ms per character, min 2s
      setTimeout(() => {
        const nextLine = lineIndex + 1;
        if (nextLine < script.length) {
          playCurrentLine(nextLine);
        } else {
          setIsPlaying(false);
          setProgress(100);
        }
      }, readingTime);
      return;
    }

    // Count how many times this speaker has spoken (for file indexing)
    let speakerIndex = 0;
    for (let i = 0; i <= lineIndex; i++) {
      if (script[i].speaker === speaker) {
        speakerIndex++;
      }
    }

    const audioPath = getAudioPath(selectedLevel, speaker, speakerIndex - 1);
    console.log(`Playing audio: ${audioPath}`);

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(audioPath);
    audio.muted = isMuted;
    audioRef.current = audio;

    audio.onended = () => {
      const nextLine = lineIndex + 1;
      if (nextLine < script.length) {
        setCurrentLine(nextLine);
        setProgress((nextLine / script.length) * 100);
        playCurrentLine(nextLine);
      } else {
        setIsPlaying(false);
        setProgress(100);
      }
    };

    audio.onerror = (e) => {
      console.error(`Audio error for ${audioPath}:`, e);
      setAudioError(`Could not load audio: ${audioPath}`);
      // Continue to next line even on error
      const nextLine = lineIndex + 1;
      if (nextLine < script.length) {
        setTimeout(() => {
          setCurrentLine(nextLine);
          setProgress((nextLine / script.length) * 100);
          playCurrentLine(nextLine);
        }, 500);
      } else {
        setIsPlaying(false);
      }
    };

    audio.play().catch(err => {
      console.error('Audio play failed:', err);
      setAudioError(`Playback failed: ${err.message}`);
    });
  };

  // Handle mute changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handlePlay = () => {
    setAudioError(null);
    setIsPlaying(true);
    setCurrentLine(0);
    setProgress(0);
    playCurrentLine(0);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handleResume = () => {
    if (audioRef.current && audioRef.current.paused) {
      setIsPlaying(true);
      audioRef.current.play().catch(console.error);
    } else {
      handlePlay();
    }
  };

  const handleRestart = () => {
    setAudioError(null);
    setCurrentLine(0);
    setProgress(0);
    setIsPlaying(true);
    playCurrentLine(0);
  };

  const handleSkip = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const nextLine = Math.min(currentLine + 1, script.length - 1);
    setCurrentLine(nextLine);
    setProgress((nextLine / script.length) * 100);
    if (isPlaying) {
      playCurrentLine(nextLine);
    }
  };

  if (!selectedLevel) {
    // Level selection view
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Training
            </button>
          )}

          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Roleplay Demonstrations
            </h1>
            <p className="text-gray-400 text-lg">
              Watch AI-to-AI examples of pitches and objection handling
            </p>
          </div>

          {/* Quality Level Demos Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">Quality Level Demos</h2>
              <span className="text-sm text-gray-500">Full pitch demonstrations rated by effectiveness</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {DEMO_LEVELS.map((level) => {
                const Icon = level.icon;
                return (
                  <button
                    key={level.id}
                    onClick={() => handleSelectLevel(level.id, 'quality')}
                    className={`p-6 rounded-2xl border-2 ${level.borderColor} ${level.bgColor}
                      hover:scale-[1.02] transition-all duration-300 text-left group`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl bg-gradient-to-br ${level.color}`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-right">
                        <span className={`text-2xl font-bold bg-gradient-to-r ${level.color} bg-clip-text text-transparent`}>
                          {level.score}
                        </span>
                        <div className="text-xs text-gray-500">{level.lines} lines</div>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">{level.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{level.description}</p>

                    <div className="flex items-center gap-2 text-sm text-gray-500 group-hover:text-gray-400 transition-colors">
                      <Play className="w-4 h-4" />
                      <span>Click to watch demo</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Objection Handling Demos Section */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">Objection Handling</h2>
              <span className="text-sm text-gray-500">Master responses to common pushbacks</span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {OBJECTION_LEVELS.map((level) => {
                const Icon = level.icon;
                return (
                  <button
                    key={level.id}
                    onClick={() => handleSelectLevel(level.id, 'objection')}
                    className={`p-5 rounded-2xl border-2 ${level.borderColor} ${level.bgColor}
                      hover:scale-[1.02] transition-all duration-300 text-left group`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2.5 rounded-xl bg-gradient-to-br ${level.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs px-2 py-1 bg-purple-500/30 text-purple-300 rounded-full">
                        {level.lines} lines
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-1">{level.name}</h3>
                    <p className="text-gray-400 text-xs mb-3">{level.description}</p>

                    <div className="flex items-center gap-2 text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                      <Play className="w-3 h-3" />
                      <span>Watch handling</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* How to use section */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                How to Use Quality Demos
              </h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  Watch each level to understand the scoring criteria
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  Notice the difference in approach between levels
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  Practice matching the "Excellent" level in your own training
                </li>
              </ul>
            </div>

            <div className="p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-400" />
                How to Use Objection Demos
              </h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  Learn specific responses for common objections
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  Understand the psychology behind each technique
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                  Adapt these patterns to your own conversational style
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Demo playback view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setSelectedLevel(null)}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to All Demos
        </button>

        {/* Header with score/type */}
        <div className={`p-6 rounded-2xl ${selectedDemo?.bgColor} border-2 ${selectedDemo?.borderColor} mb-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {selectedDemo && (
                <div className={`p-3 rounded-xl bg-gradient-to-br ${selectedDemo.color}`}>
                  <selectedDemo.icon className="w-8 h-8 text-white" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    demoType === 'quality' ? 'bg-yellow-500/30 text-yellow-300' : 'bg-purple-500/30 text-purple-300'
                  }`}>
                    {demoType === 'quality' ? 'Quality Demo' : 'Objection Handling'}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white">
                  {demoType === 'quality' ? `${selectedDemo?.name} Level` : selectedDemo?.name}
                </h2>
                <p className="text-gray-400">{selectedDemo?.description}</p>
              </div>
            </div>
            <div className={`text-4xl font-bold bg-gradient-to-r ${selectedDemo?.color} bg-clip-text text-transparent`}>
              {selectedDemo?.score}
            </div>
          </div>
        </div>

        {/* Transcript */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 mb-6 overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Conversation Transcript</h3>
            <span className="text-sm text-gray-500">{script.length} lines</span>
          </div>
          <div className="p-4 max-h-[400px] overflow-y-auto space-y-4">
            {script.map((line, index) => (
              <div
                key={index}
                className={`flex flex-col ${line.speaker === 'salesperson' ? 'items-end' : 'items-start'}
                  transition-all duration-300 ${currentLine === index && isPlaying ? 'scale-[1.02]' : currentLine > index ? 'opacity-40' : 'opacity-70'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl ${
                    line.speaker === 'salesperson'
                      ? 'bg-blue-600/30 border border-blue-500/50 rounded-br-sm'
                      : 'bg-purple-600/30 border border-purple-500/50 rounded-bl-sm'
                  } ${currentLine === index && isPlaying ? 'ring-2 ring-white/50 opacity-100' : ''}`}
                >
                  <div className="text-xs text-gray-400 mb-1 flex items-center gap-2">
                    <span className="font-semibold">
                      {line.speaker === 'salesperson' ? '21 (Salesperson)' : 'Agnes (Homeowner)'}
                    </span>
                    {line.emotion && (
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        line.emotion === 'positive' ? 'bg-green-500/30 text-green-300' :
                        line.emotion === 'angry' || line.emotion === 'door_slam' ? 'bg-red-500/30 text-red-300' :
                        line.emotion === 'hesitant' || line.emotion === 'skeptical' ? 'bg-yellow-500/30 text-yellow-300' :
                        line.emotion === 'curious' || line.emotion === 'interested' ? 'bg-cyan-500/30 text-cyan-300' :
                        'bg-gray-500/30 text-gray-300'
                      }`}>
                        {line.emotion}
                      </span>
                    )}
                  </div>
                  <p className="text-white">{line.text}</p>
                </div>
                {/* Teaching note - shown below salesperson messages */}
                {line.note && line.speaker === 'salesperson' && (
                  <div className={`mt-1 max-w-[85%] flex items-center gap-2 text-xs transition-opacity ${
                    currentLine === index && isPlaying ? 'opacity-100' : 'opacity-50'
                  }`}>
                    <Lightbulb className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                    <span className="text-yellow-300/80 italic">{line.note}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Playback controls */}
        <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6">
          {/* Audio error display */}
          {audioError && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
              ⚠️ {audioError}
            </div>
          )}

          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${selectedDemo?.color} transition-all duration-300`}
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Line {currentLine + 1} of {script.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleRestart}
              className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
              title="Restart"
            >
              <SkipBack className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={isPlaying ? handlePause : handleResume}
              className={`p-4 rounded-full bg-gradient-to-r ${selectedDemo?.color} hover:opacity-90 transition-opacity`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8 text-white" />
              ) : (
                <Play className="w-8 h-8 text-white" />
              )}
            </button>

            <button
              onClick={handleSkip}
              className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
              title="Skip"
            >
              <SkipForward className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors ml-4"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white" />
              ) : (
                <Volume2 className="w-5 h-5 text-white" />
              )}
            </button>
          </div>

          <p className="text-center text-gray-500 text-sm mt-4">
            {isPlaying
              ? `Playing: ${script[currentLine]?.speaker === 'salesperson' ? '21 (Salesperson)' : 'Agnes (Homeowner)'}`
              : progress > 0
                ? 'Paused - Click play to resume'
                : 'Click play to start the demonstration'}
          </p>
        </div>

        {/* Key characteristics */}
        <div className="mt-6 p-6 bg-slate-800/50 rounded-2xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">What to Notice</h3>
          <ul className="space-y-2">
            {selectedDemo?.characteristics.map((char, index) => (
              <li key={index} className="flex items-start gap-2 text-gray-400">
                {selectedDemo.id === 'excellent' || selectedDemo.id === 'good' ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                {char}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RoleplayDemo;
