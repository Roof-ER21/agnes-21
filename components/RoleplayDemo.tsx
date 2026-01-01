/**
 * RoleplayDemo Component
 * Plays AI-generated roleplay demonstrations showing different quality levels
 * Uses Gemini TTS for dynamic audio generation
 */

import React, { useState, useEffect, useMemo } from 'react';
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
  Lightbulb,
  Search,
  Filter
} from 'lucide-react';
import { agnesVoiceSpeak, agnesVoiceStop } from '../utils/geminiTTS';

// Demo division type
type DemoDivision = 'insurance' | 'retail';

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

// Demo scripts with transcript - Full demonstrations using Gemini TTS
// Each demo shows the complete pitch flow to demonstrate why it earns that score
const DEMO_SCRIPTS: Record<string, Array<{ speaker: 'salesperson' | 'homeowner'; text: string; emotion?: string; note?: string }>> = {
  excellent: [
    // Opening - Hits all 5 non-negotiables perfectly (50 pts)
    { speaker: 'salesperson', text: "Good morning! My name is Marcus with Roof-ER. How are you doing today?", note: "Non-negotiable #1 & #2: Name + Company intro" },
    { speaker: 'homeowner', text: "I'm alright, just busy with the kids right now." },
    { speaker: 'salesperson', text: "Oh I totally get it - I've got two little ones myself! I'll keep this super quick, I promise.", note: "Builds rapport, acknowledges their time" },
    { speaker: 'homeowner', text: "Okay, what's this about?" },
    // Value proposition with social proof
    { speaker: 'salesperson', text: "We're out here doing free storm damage inspections after last Tuesday's hail. Your neighbor across the street, the Johnsons at 1842, just had us out and we found damage their insurance is covering 100%.", note: "Non-negotiable #3 & #4: Storm context + Free inspection offer" },
    { speaker: 'homeowner', text: "Really? I didn't even know we had hail." },
    { speaker: 'salesperson', text: "Yeah, it came through around 2am - most people slept right through it. But it hit this area pretty hard.", note: "Provides context, establishes expertise" },
    { speaker: 'homeowner', text: "Hmm, our roof is only like 8 years old though..." },
    // Handles objection smoothly
    { speaker: 'salesperson', text: "That's actually when it matters most! Newer roofs can still get damaged, and you want to catch it before your warranty runs out. An 8-year-old roof has plenty of life left if we protect it now.", note: "Turns objection into benefit (+10 objection handling)" },
    { speaker: 'homeowner', text: "I don't know... we've got a guy we usually use for stuff like this." },
    // Second objection - still smooth
    { speaker: 'salesperson', text: "That's great you have someone! Here's the thing - this inspection is completely free, takes about 10 minutes, and I'll show you exactly what I find with photos. If there's nothing, you'll have peace of mind. And if there is damage, you can have your guy do the work - no pressure from me.", note: "Removes risk, offers value regardless (+10 objection handling)" },
    { speaker: 'homeowner', text: "So you're not going to try to sell me something?" },
    { speaker: 'salesperson', text: "My job today is just to document any storm damage and show you what I find. If your roof is fine, I shake your hand and move on. If there's damage, I'll explain your options and you decide what makes sense for your family.", note: "Transparent, gives control to homeowner" },
    { speaker: 'homeowner', text: "That's... actually fair. How long did you say it takes?" },
    // Close - Gets the yes
    { speaker: 'salesperson', text: "About 10 minutes tops. I can do it right now while you get back to the kids, and I'll knock when I'm done to show you the photos. Sound good?", note: "Non-negotiable #5: Goes for the close" },
    { speaker: 'homeowner', text: "Alright, go ahead and take a look. Thanks for being upfront about everything.", emotion: 'positive' }
  ],

  good: [
    // Opening - Hits most non-negotiables but less warmth
    { speaker: 'salesperson', text: "Hi there! I'm Marcus from Roof-ER. We're out doing roof inspections in the neighborhood after last week's storm.", note: "Good intro but could be warmer" },
    { speaker: 'homeowner', text: "Okay... what for?" },
    { speaker: 'salesperson', text: "Well, there was a storm last week and we're checking for damage. Your neighbor mentioned they might have some issues so we're going around to help everyone out.", note: "Good reason, vague neighbor reference" },
    { speaker: 'homeowner', text: "I see. We haven't noticed anything wrong with our roof." },
    // Handles skepticism adequately
    { speaker: 'salesperson', text: "That's actually normal - most storm damage isn't visible from the ground. That's why we do the inspection.", note: "Good response but could be more conversational" },
    { speaker: 'homeowner', text: "How long does it take?" },
    { speaker: 'salesperson', text: "About 10 minutes. We take photos and show you exactly what we find.", note: "Good details" },
    { speaker: 'homeowner', text: "I'm not sure... we're kind of busy today." },
    // Handles time objection
    { speaker: 'salesperson', text: "I understand. Would it help if I just did a quick visual check from the ground first? That way you don't have to wait around.", note: "Good flexibility" },
    { speaker: 'homeowner', text: "What exactly are you looking for?" },
    { speaker: 'salesperson', text: "Mainly hail damage - dents in the shingles, cracked tiles, things like that. The storm last week was significant enough that a lot of homes in this zip code are getting new roofs through insurance.", note: "Good specifics" },
    { speaker: 'homeowner', text: "And this is all free?" },
    { speaker: 'salesperson', text: "Completely free. We only make money if you decide to use us for repairs, and that's your choice.", note: "Honest and direct" },
    { speaker: 'homeowner', text: "Okay, go ahead and take a look then.", emotion: 'neutral' }
  ],

  bad: [
    // Weak opening - misses non-negotiables
    { speaker: 'salesperson', text: "Hey there. So we're doing roof inspections today. You interested?", note: "No introduction, too casual - loses 20 pts" },
    { speaker: 'homeowner', text: "Uh, who are you with?" },
    { speaker: 'salesperson', text: "Oh yeah, Roof-ER. Anyway, there was a storm and your roof probably has damage. Can I check it out?", note: "Skipped rapport, assumed damage" },
    { speaker: 'homeowner', text: "I don't know, we're pretty busy right now..." },
    // Poor objection handling
    { speaker: 'salesperson', text: "It'll only take a few minutes. You really should get it looked at before it gets worse.", note: "Pushy, doesn't acknowledge their concern - loses 10 pts" },
    { speaker: 'homeowner', text: "What company did you say you were with?", emotion: 'suspicious' },
    { speaker: 'salesperson', text: "Roof-ER. We do a lot of work in this area. So can I get up there or...?", note: "Impatient, skipping trust building" },
    { speaker: 'homeowner', text: "I'm not comfortable with that. We don't even know if there's damage." },
    // Getting defensive
    { speaker: 'salesperson', text: "There's definitely damage. Every house on this street got hit by the storm.", note: "Making claims without evidence - loses trust" },
    { speaker: 'homeowner', text: "How do you know our roof is damaged?", emotion: 'skeptical' },
    { speaker: 'salesperson', text: "Because the storm was really bad. Look, I'm just trying to help you out here.", note: "Getting defensive - loses 10 pts" },
    { speaker: 'homeowner', text: "I appreciate it, but we'll call someone if we notice any issues." },
    // Uses fear tactics instead of value
    { speaker: 'salesperson', text: "By then it might be too late. Water damage can cost thousands.", note: "Fear tactics - loses 15 pts" },
    { speaker: 'homeowner', text: "That's a bit dramatic. I think we're good. Maybe another time.", emotion: 'dismissive' }
  ],

  awful: [
    // Terrible opening - aggressive
    { speaker: 'salesperson', text: "Hey, you need a new roof. We're the best company around.", note: "No intro, immediate pressure - loses all 20 pts" },
    { speaker: 'homeowner', text: "Excuse me? Who are you?" },
    { speaker: 'salesperson', text: "Doesn't matter. Your roof is definitely damaged. Everyone in this neighborhood is getting work done. Sign up now before spots fill up.", note: "High pressure, false claims" },
    { speaker: 'homeowner', text: "No thanks, I'm not interested.", emotion: 'annoyed' },
    // Ignores clear no - pushy
    { speaker: 'salesperson', text: "Come on, everyone's doing it. You'd be crazy to pass this up. Your roof is definitely damaged, trust me.", note: "Pushy, manipulative - loses 30 pts" },
    { speaker: 'homeowner', text: "I said no. We're not interested.", emotion: 'angry' },
    { speaker: 'salesperson', text: "Look, I'm doing you a favor here. Your neighbors already signed up. Don't be the one house on the block with a leaky roof.", note: "Peer pressure tactics" },
    { speaker: 'homeowner', text: "Please leave. I'm not going to ask again.", emotion: 'angry' },
    // Complete failure - insulting
    { speaker: 'salesperson', text: "Fine, but when your roof caves in, don't come crying to me.", note: "Insulting response - automatic fail" },
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

// ============================================
// RETAIL DIVISION DEMOS - Based on Official Roof ER Pitch
// ============================================

// Retail Quality Level Demos
const RETAIL_DEMO_LEVELS = [
  {
    id: 'retail-excellent',
    name: 'Excellent',
    score: '95/100',
    color: 'from-green-500 to-emerald-600',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500',
    icon: Award,
    description: 'Perfect Roof ER retail pitch - all 5 non-negotiables hit',
    lines: 14,
    characteristics: [
      'Warm greeting with "Hello, how are you?"',
      'Ice breaker showing respect for their time',
      'Clear name introduction',
      'Neighbor hook with POINT gesture',
      'Free quotes framing - no pressure',
      'Alternative close (afternoons vs evenings)',
      'Three steps explained clearly',
      'Perfect objection handling using official rebuttals'
    ]
  },
  {
    id: 'retail-good',
    name: 'Good',
    score: '75/100',
    color: 'from-blue-500 to-cyan-600',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500',
    icon: TrendingUp,
    description: 'Solid approach but missing some pitch elements',
    lines: 12,
    characteristics: [
      'Good intro but skipped ice breaker',
      'Neighbor hook present but no POINT',
      'Got to free quotes',
      'Missed alternative close - asked directly',
      'Three steps rushed at the end',
      'Could build more rapport first'
    ]
  },
  {
    id: 'retail-bad',
    name: 'Needs Work',
    score: '35/100',
    color: 'from-yellow-500 to-orange-600',
    bgColor: 'bg-yellow-500/20',
    borderColor: 'border-yellow-500',
    icon: TrendingDown,
    description: 'Skipped key elements, too pushy',
    lines: 10,
    characteristics: [
      'No ice breaker - jumped straight to pitch',
      'No neighbor hook - generic approach',
      'Pushy about getting appointment',
      'Didn\'t use official rebuttals',
      'Made homeowner defensive',
      'Burned the opportunity'
    ]
  },
  {
    id: 'retail-awful',
    name: 'Door Slam',
    score: '10/100',
    color: 'from-red-500 to-rose-600',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500',
    icon: XCircle,
    description: 'Completely wrong approach - aggressive and pushy',
    lines: 8,
    characteristics: [
      'No greeting at all',
      'No name introduction',
      'Aggressive pitch from first word',
      'Ignored multiple "no" responses',
      'Insulted homeowner when rejected',
      'Burned all future opportunities in neighborhood'
    ]
  }
];

// Retail Objection Demos - Based on Official "Stop Signs"
const RETAIL_OBJECTION_LEVELS = [
  {
    id: 'retail-busy',
    name: '"I\'m Busy"',
    score: 'Stop Sign',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500',
    icon: TrendingUp,
    description: 'Official Roof ER rebuttal for busy objection',
    lines: 8,
    characteristics: [
      'Acknowledges their time immediately',
      'Uses official "My job is simple" rebuttal',
      'Three steps make it feel quick',
      'Gets name and time for callback',
      'Leaves flyer as promised'
    ]
  },
  {
    id: 'retail-no-money',
    name: '"No Money"',
    score: 'Stop Sign',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500',
    icon: TrendingUp,
    description: 'Official Roof ER rebuttal for money objection',
    lines: 10,
    characteristics: [
      'Validates their concern with empathy',
      'Uses "wait for a little while" empathy line',
      'Not looking to rip anything out today (lol)',
      'Frames as free info for when they\'re ready',
      'Price on file for shopping around'
    ]
  },
  {
    id: 'retail-not-interested',
    name: '"Not Interested"',
    score: 'Stop Sign',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500',
    icon: TrendingUp,
    description: 'Pivoting to other products when rejected',
    lines: 8,
    characteristics: [
      'Accepts rejection gracefully: "Totally fair"',
      'Pivots to full product range',
      'Asks what they might want to update',
      'Opens new conversation opportunity',
      'No pressure, just curiosity'
    ]
  },
  {
    id: 'retail-have-guy',
    name: '"Have a Guy"',
    score: 'Stop Sign',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500',
    icon: TrendingUp,
    description: 'Working with their existing relationship',
    lines: 8,
    characteristics: [
      'Validates their existing contractor',
      'Offers second opinion/price check',
      'No harm in seeing options',
      'Positions as helpful, not competitive',
      'May still get the appointment'
    ]
  },
  {
    id: 'retail-spouse',
    name: '"Talk to Spouse"',
    score: 'Stop Sign',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500',
    icon: TrendingUp,
    description: 'Including both decision makers',
    lines: 8,
    characteristics: [
      'Recommends both be involved',
      'Gets time for both of them',
      'Uses three steps for simplicity',
      'Respects the decision-making process',
      'Sets appointment when spouse is home'
    ]
  },
  {
    id: 'retail-just-ideas',
    name: '"Just Ideas"',
    score: 'Stop Sign',
    color: 'from-purple-500 to-violet-600',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500',
    icon: TrendingUp,
    description: 'Meeting them where they are',
    lines: 6,
    characteristics: [
      'Validates their timeline',
      'Frames as useful info gathering',
      'Real pricing for when ready',
      'No-obligation positioning',
      'Easy yes for information'
    ]
  }
];

// Retail Demo Scripts - Based on Official Roof ER Pitch Flow
const RETAIL_DEMO_SCRIPTS: Record<string, Array<{ speaker: 'salesperson' | 'homeowner'; text: string; emotion?: string; note?: string }>> = {
  'retail-excellent': [
    // Opening with ice breaker (1-4)
    { speaker: 'salesperson', text: "Hello! How are you?", note: "Warm greeting" },
    { speaker: 'homeowner', text: "I'm doing alright, just got home from work." },
    { speaker: 'salesperson', text: "You look like you're winding down - I'll be quick! My name is Marcus.", note: "Ice breaker + time acknowledgment + name" },
    { speaker: 'homeowner', text: "Okay, what's this about?" },

    // Neighbor hook with context (5-6)
    { speaker: 'salesperson', text: "I'm just giving the neighbors a heads up - our company Roof ER is about to do the windows for the Miller's right there. (POINTS) So before we get going, we're coming by to do free quotes.", note: "Neighbor hook with POINT + free quotes" },
    { speaker: 'homeowner', text: "Free quotes for windows?" },

    // Value and alternative close (7-8)
    { speaker: 'salesperson', text: "Windows, siding, roofing, solar - whatever you've been thinking about. So far we're coming by for everybody in the afternoons - or are the evenings better for you?", note: "Alternative close - assumes appointment" },
    { speaker: 'homeowner', text: "I don't know... I'm pretty busy these days.", emotion: 'hesitant' },

    // Objection handling with official rebuttal (9-10)
    { speaker: 'salesperson', text: "Totally get it - most people are these days. My job is really simple: I just get your name, find a time that ACTUALLY works around your busy schedule, and leave you with a flyer.", note: "Official 'busy' rebuttal + three steps" },
    { speaker: 'homeowner', text: "That's it? You're not going to try to sell me something today?", emotion: 'curious' },

    // Reassurance and close (11-14)
    { speaker: 'salesperson', text: "We're not looking to rip out anyone's windows today! (laughs) Just while the team is in the area, we're leaving everyone with free information on styles and prices. That way when you ARE ready, you'll have a price on file.", note: "No pressure framing" },
    { speaker: 'homeowner', text: "That actually makes sense. Evenings work better.", emotion: 'positive' },
    { speaker: 'salesperson', text: "Perfect! What day works best - Tuesday or Thursday evening?", note: "Narrows to specific days" },
    { speaker: 'homeowner', text: "Thursday would work. I'm Sarah by the way.", emotion: 'positive' }
  ],

  'retail-good': [
    // Opening - adequate but less warm (1-3)
    { speaker: 'salesperson', text: "Hi there! I'm Marcus from Roof ER.", note: "Good intro but no 'How are you?'" },
    { speaker: 'homeowner', text: "Okay... what are you selling?" },
    { speaker: 'salesperson', text: "We're doing the windows for your neighbor down the street, so I wanted to let you know we're offering free quotes.", note: "Has neighbor hook but no POINT" },

    // Value communication (4-6)
    { speaker: 'homeowner', text: "Free quotes for what exactly?" },
    { speaker: 'salesperson', text: "Windows, siding, roofing - basically anything on the outside of your home.", note: "Good product range" },
    { speaker: 'homeowner', text: "I'm not really in the market right now." },

    // Handling objection (7-10)
    { speaker: 'salesperson', text: "I understand. It's just free information so when you are ready, you'll know what it costs.", note: "OK rebuttal but not official wording" },
    { speaker: 'homeowner', text: "I guess that makes sense." },
    { speaker: 'salesperson', text: "Great! When would be a good time for us to stop by?", note: "Direct ask - missed alternative close" },
    { speaker: 'homeowner', text: "Maybe next week sometime?", emotion: 'neutral' },

    // Close (11-12)
    { speaker: 'salesperson', text: "Works for me. My job is simple - I get your name, find a time, leave a flyer.", note: "Three steps but rushed" },
    { speaker: 'homeowner', text: "Alright, I'm Tom. Give me a call.", emotion: 'neutral' }
  ],

  'retail-bad': [
    // Weak opening (1-3)
    { speaker: 'salesperson', text: "Hey, we're out doing window quotes in the neighborhood. Interested?", note: "No greeting, no name, no ice breaker" },
    { speaker: 'homeowner', text: "Who are you with?" },
    { speaker: 'salesperson', text: "Roof ER. Anyway, your windows look pretty old. You should probably get them replaced.", note: "Assumed problem, no rapport" },

    // Poor handling (4-6)
    { speaker: 'homeowner', text: "I'm not interested, thanks.", emotion: 'annoyed' },
    { speaker: 'salesperson', text: "Come on, it's a free quote. What do you have to lose?", note: "Pushy, didn't acknowledge objection" },
    { speaker: 'homeowner', text: "I said I'm not interested. I'm busy.", emotion: 'annoyed' },

    // Making it worse (7-10)
    { speaker: 'salesperson', text: "It'll only take a few minutes. Everyone in the neighborhood is doing it.", note: "Pressure tactics" },
    { speaker: 'homeowner', text: "I don't care what everyone else is doing.", emotion: 'angry' },
    { speaker: 'salesperson', text: "Fine, but don't complain when your heating bill goes up.", note: "Passive aggressive" },
    { speaker: 'homeowner', text: "Please leave.", emotion: 'angry' }
  ],

  'retail-awful': [
    // Terrible opening (1-3)
    { speaker: 'salesperson', text: "Your windows are a mess. You need new ones.", note: "No intro, immediate criticism" },
    { speaker: 'homeowner', text: "Excuse me? Who are you?", emotion: 'shocked' },
    { speaker: 'salesperson', text: "Doesn't matter. Point is, your house needs work and we can fix it. Sign up now.", note: "Aggressive, no rapport" },

    // Ignoring objections (4-6)
    { speaker: 'homeowner', text: "No thanks. Please leave.", emotion: 'angry' },
    { speaker: 'salesperson', text: "You're making a mistake. Everyone else in the neighborhood already signed up.", note: "Lying and manipulative" },
    { speaker: 'homeowner', text: "I don't believe you. Leave my property.", emotion: 'angry' },

    // Complete failure (7-8)
    { speaker: 'salesperson', text: "Whatever, enjoy your drafty windows.", note: "Insulting exit" },
    { speaker: 'homeowner', text: "[Door slams]", emotion: 'door_slam' }
  ]
};

// Retail Objection Demo Scripts - Using Official "Stop Signs" Rebuttals
const RETAIL_OBJECTION_DEMOS: Record<string, Array<{ speaker: 'salesperson' | 'homeowner'; text: string; emotion?: string; note?: string }>> = {
  'retail-busy': [
    { speaker: 'salesperson', text: "Hello! How are you? My name is Marcus with Roof ER.", note: "Warm greeting with name" },
    { speaker: 'homeowner', text: "I'm really busy right now.", emotion: 'rushed' },
    { speaker: 'salesperson', text: "Totally get it - most people are these days. My job is really simple: I just get your name, find a time that ACTUALLY works around your busy schedule, and leave you with a flyer.", note: "Official 'busy' rebuttal" },
    { speaker: 'homeowner', text: "That's it?", emotion: 'curious' },
    { speaker: 'salesperson', text: "That's it! I'm just giving the neighbors a heads up - we're about to do the windows for the family right there (POINTS). So what works better for you - afternoons or evenings?", note: "Neighbor hook + alternative close" },
    { speaker: 'homeowner', text: "Evenings I guess." },
    { speaker: 'salesperson', text: "Perfect. I'm Marcus - what's your name so I can leave this flyer with you?", note: "Gets name naturally" },
    { speaker: 'homeowner', text: "It's Jennifer. Thanks for being quick about this.", emotion: 'positive' }
  ],

  'retail-no-money': [
    { speaker: 'salesperson', text: "Hello! How are you? I'm Marcus, giving the neighbors a heads up...", note: "Standard opening" },
    { speaker: 'homeowner', text: "Look, I don't have the money for that right now.", emotion: 'stressed' },
    { speaker: 'salesperson', text: "Makes sense - the windows are going to have to wait for a little while, huh?", note: "Empathy first" },
    { speaker: 'homeowner', text: "Yeah, exactly." },
    { speaker: 'salesperson', text: "To be totally honest with you, that's exactly why we're coming by. We're not looking to rip out anyone's windows today (laughs) - just while the team is in the area, we're leaving everyone with free information on styles and prices.", note: "Official 'no money' rebuttal" },
    { speaker: 'homeowner', text: "So it's just information?", emotion: 'curious' },
    { speaker: 'salesperson', text: "Exactly! That way when you ARE ready, you'll have a price on file and can use it to shop around and see who gives you the best deal. No pressure, just useful info.", note: "Price on file framing" },
    { speaker: 'homeowner', text: "Alright, that actually makes sense.", emotion: 'neutral' },
    { speaker: 'salesperson', text: "Great! Afternoons or evenings work better for you?", note: "Alternative close" },
    { speaker: 'homeowner', text: "Afternoons are fine.", emotion: 'neutral' }
  ],

  'retail-not-interested': [
    { speaker: 'salesperson', text: "Hello! How are you today?", note: "Warm greeting" },
    { speaker: 'homeowner', text: "I'm not interested, thanks.", emotion: 'dismissive' },
    { speaker: 'salesperson', text: "Totally fair. We do a lot more than just roofs – windows, siding, doors, solar, gutters. If there's a part of the home you've thought about updating, what do you think will be next for you guys?", note: "Official 'not interested' pivot rebuttal" },
    { speaker: 'homeowner', text: "Well... I have been thinking about the siding. It's looking pretty rough.", emotion: 'curious' },
    { speaker: 'salesperson', text: "Siding's a big one! We actually just finished a siding job for your neighbor at 1847. My job is simple - I get your name, find a time that works, and leave you with info on styles and prices.", note: "Pivot to new product + three steps" },
    { speaker: 'homeowner', text: "I guess it couldn't hurt to get some information.", emotion: 'neutral' },
    { speaker: 'salesperson', text: "No pressure at all. Afternoons or evenings better for you?", note: "Alternative close" },
    { speaker: 'homeowner', text: "Afternoons work.", emotion: 'neutral' }
  ],

  'retail-have-guy': [
    { speaker: 'salesperson', text: "Hello! How are you? I'm Marcus with Roof ER, giving neighbors a heads up...", note: "Standard opening" },
    { speaker: 'homeowner', text: "Oh, we already have a guy who does that.", emotion: 'polite' },
    { speaker: 'salesperson', text: "That's great – always smart to have someone you trust. We'd still love to give you a second opinion and a competitive quote.", note: "Official 'have a guy' rebuttal" },
    { speaker: 'homeowner', text: "I don't want to be disloyal to him though." },
    { speaker: 'salesperson', text: "Totally understand. Worst case, you get a price check and some new ideas. No harm in seeing options, right? You can even share our quote with your guy.", note: "Positions as helping relationship" },
    { speaker: 'homeowner', text: "That's true. He might even match it.", emotion: 'curious' },
    { speaker: 'salesperson', text: "Exactly! My job is simple - I get your name, find a time, and leave you with a flyer. No pressure.", note: "Three steps" },
    { speaker: 'homeowner', text: "Alright, I'm David. What works for you?", emotion: 'positive' }
  ],

  'retail-spouse': [
    { speaker: 'salesperson', text: "Hello! How are you? I'm Marcus with Roof ER...", note: "Standard opening" },
    { speaker: 'homeowner', text: "I have to talk to my spouse about anything like this.", emotion: 'unsure' },
    { speaker: 'salesperson', text: "Of course – we always recommend both decision-makers are involved. Makes sense, that's usually something you guys talk about together, right?", note: "Official 'spouse' rebuttal" },
    { speaker: 'homeowner', text: "Yeah, we make all big decisions together." },
    { speaker: 'salesperson', text: "Smart! My job is simple - I just get your name, find a time that works for BOTH of you, and leave you with a flyer. We'll lay out all the options so you two can decide together.", note: "Include spouse in appointment" },
    { speaker: 'homeowner', text: "That sounds reasonable.", emotion: 'neutral' },
    { speaker: 'salesperson', text: "When's your spouse usually home? Afternoons or evenings?", note: "Gets time for both" },
    { speaker: 'homeowner', text: "Evenings after 6. I'm Karen.", emotion: 'positive' }
  ],

  'retail-just-ideas': [
    { speaker: 'salesperson', text: "Hello! How are you? I'm Marcus, giving neighbors a heads up...", note: "Standard opening" },
    { speaker: 'homeowner', text: "We're just getting ideas right now. Not ready for anything.", emotion: 'casual' },
    { speaker: 'salesperson', text: "Perfect! Our goal is to give you real pricing and recommendations so you're ready when the time comes.", note: "Official 'just ideas' rebuttal" },
    { speaker: 'homeowner', text: "So no pressure to buy anything?" },
    { speaker: 'salesperson', text: "None at all. That's exactly what this is for - useful info and professional insight on your home. When you're ready, you'll have everything you need.", note: "Frames as valuable info gathering" },
    { speaker: 'homeowner', text: "Okay, that works for me.", emotion: 'positive' }
  ]
};

interface Props {
  onBack?: () => void;
}

// All demos now use Gemini TTS - no pre-recorded audio files needed
const QUALITY_DEMO_IDS = ['excellent', 'good', 'bad', 'awful'];

// Helper to check if this is a quality demo (has voice audio)
const hasVoiceAudio = (level: string): boolean => {
  return QUALITY_DEMO_IDS.includes(level);
};

type CategoryFilter = 'all' | 'quality' | 'objection';

const RoleplayDemo: React.FC<Props> = ({ onBack }) => {
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [demoType, setDemoType] = useState<'quality' | 'objection'>('quality');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [divisionFilter, setDivisionFilter] = useState<DemoDivision>('insurance');

  // Select demo levels based on division
  const currentQualityLevels = divisionFilter === 'insurance' ? DEMO_LEVELS : RETAIL_DEMO_LEVELS;
  const currentObjectionLevels = divisionFilter === 'insurance' ? OBJECTION_LEVELS : RETAIL_OBJECTION_LEVELS;
  const currentDemoScripts = divisionFilter === 'insurance' ? DEMO_SCRIPTS : RETAIL_DEMO_SCRIPTS;
  const currentObjectionScripts = divisionFilter === 'insurance' ? OBJECTION_DEMOS : RETAIL_OBJECTION_DEMOS;

  // Filter demos based on search query
  const filteredQualityDemos = useMemo(() => {
    return currentQualityLevels.filter(demo =>
      demo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      demo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      demo.characteristics.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, currentQualityLevels]);

  const filteredObjectionDemos = useMemo(() => {
    return currentObjectionLevels.filter(demo =>
      demo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      demo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      demo.characteristics.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, currentObjectionLevels]);

  // Find the selected demo from either quality or objection levels (check both divisions)
  const selectedDemo = demoType === 'quality'
    ? (DEMO_LEVELS.find(d => d.id === selectedLevel) || RETAIL_DEMO_LEVELS.find(d => d.id === selectedLevel))
    : (OBJECTION_LEVELS.find(d => d.id === selectedLevel) || RETAIL_OBJECTION_LEVELS.find(d => d.id === selectedLevel));

  // Get script from appropriate source (check both divisions)
  const script = selectedLevel
    ? (demoType === 'quality'
        ? (DEMO_SCRIPTS[selectedLevel] || RETAIL_DEMO_SCRIPTS[selectedLevel])
        : (OBJECTION_DEMOS[selectedLevel] || RETAIL_OBJECTION_DEMOS[selectedLevel])) || []
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

  // Play audio for current line using Gemini TTS
  const playCurrentLine = async (lineIndex: number) => {
    if (!selectedLevel || lineIndex >= script.length) {
      setIsPlaying(false);
      return;
    }

    const line = script[lineIndex];
    setCurrentLine(lineIndex);
    setProgress(((lineIndex + 1) / script.length) * 100);

    // Skip door slam sound effect
    if (line.text === '[Door slams]') {
      setTimeout(() => {
        const nextLine = lineIndex + 1;
        if (nextLine < script.length) {
          playCurrentLine(nextLine);
        } else {
          setIsPlaying(false);
          setProgress(100);
        }
      }, 1000);
      return;
    }

    // For demos with voice audio, use Gemini TTS
    if (hasVoiceAudio(selectedLevel) && !isMuted) {
      console.log(`🎤 Speaking line ${lineIndex + 1}: "${line.text.substring(0, 50)}..."`);

      try {
        await agnesVoiceSpeak(line.text, 'en', {
          onEnd: () => {
            // Move to next line after speech completes
            const nextLine = lineIndex + 1;
            if (nextLine < script.length) {
              // Small pause between lines
              setTimeout(() => {
                playCurrentLine(nextLine);
              }, 500);
            } else {
              setIsPlaying(false);
              setProgress(100);
            }
          },
          onError: (error) => {
            console.error('TTS error:', error);
            setAudioError(`Speech failed: ${error}`);
            // Continue anyway
            const nextLine = lineIndex + 1;
            if (nextLine < script.length) {
              setTimeout(() => playCurrentLine(nextLine), 500);
            } else {
              setIsPlaying(false);
            }
          }
        });
      } catch (error) {
        console.error('TTS exception:', error);
        // Fallback to timed advance if TTS fails
        const readingTime = Math.max(2000, line.text.length * 50);
        setTimeout(() => {
          const nextLine = lineIndex + 1;
          if (nextLine < script.length) {
            playCurrentLine(nextLine);
          } else {
            setIsPlaying(false);
            setProgress(100);
          }
        }, readingTime);
      }
    } else {
      // For muted or non-voice demos, just auto-advance
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
    }
  };

  // Handle mute changes - stop TTS if muted mid-playback
  useEffect(() => {
    if (isMuted) {
      agnesVoiceStop();
    }
  }, [isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      agnesVoiceStop();
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
    agnesVoiceStop();
  };

  const handleResume = () => {
    // Resume from current line
    setIsPlaying(true);
    playCurrentLine(currentLine);
  };

  const handleRestart = () => {
    agnesVoiceStop();
    setAudioError(null);
    setCurrentLine(0);
    setProgress(0);
    setIsPlaying(true);
    playCurrentLine(0);
  };

  const handleSkip = () => {
    agnesVoiceStop();
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

          {/* Division Toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-slate-800/50 rounded-xl p-1 border border-slate-700">
              <button
                onClick={() => setDivisionFilter('insurance')}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  divisionFilter === 'insurance'
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                🏠 Insurance Division
              </button>
              <button
                onClick={() => setDivisionFilter('retail')}
                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  divisionFilter === 'retail'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                🏪 Retail Division
              </button>
            </div>
          </div>

          {/* Division Description */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500">
              {divisionFilter === 'insurance'
                ? 'Storm damage inspections • Insurance claims • Free roof inspections'
                : 'Door-to-door appointment setting • Windows, Siding, Roofing, Solar • Free quotes'}
            </p>
          </div>

          {/* Search and Filter Bar */}
          <div className="mb-8 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search demos by name, description, or techniques..."
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <div className="flex gap-2">
                {([
                  { id: 'all', label: 'All Demos', count: currentQualityLevels.length + currentObjectionLevels.length },
                  { id: 'quality', label: 'Quality Levels', count: filteredQualityDemos.length },
                  { id: 'objection', label: divisionFilter === 'retail' ? 'Stop Signs' : 'Objection Handling', count: filteredObjectionDemos.length }
                ] as { id: CategoryFilter; label: string; count: number }[]).map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setCategoryFilter(tab.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      categoryFilter === tab.id
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800/50 text-gray-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {tab.label}
                    <span className="ml-2 text-xs opacity-70">({tab.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results Count */}
            {searchQuery && (
              <p className="text-sm text-gray-500">
                Found {filteredQualityDemos.length + filteredObjectionDemos.length} demos matching "{searchQuery}"
              </p>
            )}
          </div>

          {/* Quality Level Demos Section */}
          {(categoryFilter === 'all' || categoryFilter === 'quality') && filteredQualityDemos.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Award className="w-6 h-6 text-yellow-400" />
              <h2 className="text-xl font-bold text-white">
                {divisionFilter === 'retail' ? 'Roof ER Retail Quality Demos' : 'Quality Level Demos'}
              </h2>
              <span className="text-sm text-gray-500">
                {divisionFilter === 'retail'
                  ? 'Door-to-door pitch demonstrations using official Roof ER flow'
                  : 'Full pitch demonstrations rated by effectiveness'}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {filteredQualityDemos.map((level) => {
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
          )}

          {/* Objection Handling Demos Section */}
          {(categoryFilter === 'all' || categoryFilter === 'objection') && filteredObjectionDemos.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <MessageCircle className="w-6 h-6 text-purple-400" />
              <h2 className="text-xl font-bold text-white">
                {divisionFilter === 'retail' ? 'Roof ER "Stop Signs" Rebuttals' : 'Objection Handling'}
              </h2>
              <span className="text-sm text-gray-500">
                {divisionFilter === 'retail'
                  ? 'Official Roof ER rebuttals for common door-to-door objections'
                  : 'Master responses to common pushbacks'}
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredObjectionDemos.map((level) => {
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
          )}

          {/* No Results Message */}
          {searchQuery && filteredQualityDemos.length === 0 && filteredObjectionDemos.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No demos found</h3>
              <p className="text-gray-400 mb-4">Try a different search term or clear the filter</p>
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white transition-colors"
              >
                Clear Search
              </button>
            </div>
          )}

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
