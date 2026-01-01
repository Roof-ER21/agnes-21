/**
 * Pre-built Quick Phrases for Field Translator
 * Roofing-specific phrases for door-to-door sales
 */

import { QuickPhrase, PhraseCategory } from '../types';

/**
 * System-defined quick phrases
 */
export const SYSTEM_PHRASES: QuickPhrase[] = [
  // Greetings
  {
    id: 'sys-greeting-1',
    category: 'greeting',
    englishText: 'Hello! How are you today?',
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-greeting-2',
    category: 'greeting',
    englishText: "Hi, my name is [NAME] with Roof E-R. We're a local roofing company.",
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-greeting-3',
    category: 'greeting',
    englishText: 'Good morning! Do you have a moment to talk?',
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-greeting-4',
    category: 'greeting',
    englishText: 'Thank you for your time today.',
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },

  // Pitch
  {
    id: 'sys-pitch-1',
    category: 'pitch',
    englishText: "We specialize in helping homeowners get their roof replaced, paid for by their insurance.",
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-pitch-2',
    category: 'pitch',
    englishText: "We're offering completely free roof inspections in your neighborhood today.",
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-pitch-3',
    category: 'pitch',
    englishText: "There was a recent storm in your area that may have caused damage to your roof.",
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-pitch-4',
    category: 'pitch',
    englishText: "We've been helping several of your neighbors get their roofs approved through insurance.",
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-pitch-5',
    category: 'pitch',
    englishText: "The inspection only takes about 10-15 minutes and there's no obligation.",
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },

  // Insurance
  {
    id: 'sys-insurance-1',
    category: 'insurance',
    englishText: 'Your homeowner insurance may cover the entire cost of a new roof.',
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-insurance-2',
    category: 'insurance',
    englishText: 'Do you know who your insurance company is?',
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-insurance-3',
    category: 'insurance',
    englishText: 'We work with all major insurance companies.',
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-insurance-4',
    category: 'insurance',
    englishText: "Storm damage is typically covered under your policy at no additional cost to you.",
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-insurance-5',
    category: 'insurance',
    englishText: 'Do you know what your deductible is?',
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },

  // Objection Handling
  {
    id: 'sys-objection-1',
    category: 'objection',
    englishText: "I understand you're busy. This will only take a few minutes.",
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-objection-2',
    category: 'objection',
    englishText: "I completely understand. Is there a better time I can come back?",
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-objection-3',
    category: 'objection',
    englishText: "I'm not trying to sell you anything today, just offering a free inspection.",
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-objection-4',
    category: 'objection',
    englishText: "If there's no damage, I'll let you know and be on my way. No pressure.",
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-objection-5',
    category: 'objection',
    englishText: 'Would you like to speak with your spouse first? I can wait.',
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },

  // Scheduling
  {
    id: 'sys-scheduling-1',
    category: 'scheduling',
    englishText: 'When would be a good time for the inspection?',
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-scheduling-2',
    category: 'scheduling',
    englishText: 'Would morning or afternoon work better for you?',
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-scheduling-3',
    category: 'scheduling',
    englishText: 'I can do it right now if you have 10-15 minutes.',
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-scheduling-4',
    category: 'scheduling',
    englishText: "I'll come back tomorrow at this time. Does that work?",
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },

  // Closing
  {
    id: 'sys-closing-1',
    category: 'closing',
    englishText: 'Can I schedule an inspection for you?',
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-closing-2',
    category: 'closing',
    englishText: "I'll give you a knock when I'm finished with the inspection.",
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-closing-3',
    category: 'closing',
    englishText: 'Thank you so much! I appreciate your time.',
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-closing-4',
    category: 'closing',
    englishText: "Here's my card. Please call if you have any questions.",
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'sys-closing-5',
    category: 'closing',
    englishText: "Have a great day! I'll be in touch soon.",
    createdBy: 'system',
    scope: 'global',
    translations: {},
    createdAt: '2024-01-01T00:00:00Z',
  },
];

/**
 * Category labels for display
 */
export const PHRASE_CATEGORY_LABELS: Record<PhraseCategory, string> = {
  greeting: 'Greetings',
  pitch: 'Sales Pitch',
  insurance: 'Insurance',
  objection: 'Objection Handling',
  scheduling: 'Scheduling',
  closing: 'Closing',
};

/**
 * Category icons (lucide-react icon names)
 */
export const PHRASE_CATEGORY_ICONS: Record<PhraseCategory, string> = {
  greeting: 'Hand',
  pitch: 'Megaphone',
  insurance: 'Shield',
  objection: 'MessageSquare',
  scheduling: 'Calendar',
  closing: 'CheckCircle',
};

/**
 * Get phrases by category
 */
export const getPhrasesByCategory = (
  phrases: QuickPhrase[],
  category: PhraseCategory
): QuickPhrase[] => {
  return phrases.filter(p => p.category === category);
};

/**
 * Get all categories with phrase counts
 */
export const getCategoriesWithCounts = (
  phrases: QuickPhrase[]
): { category: PhraseCategory; count: number; label: string }[] => {
  const categories: PhraseCategory[] = ['greeting', 'pitch', 'insurance', 'objection', 'scheduling', 'closing'];

  return categories.map(category => ({
    category,
    count: phrases.filter(p => p.category === category).length,
    label: PHRASE_CATEGORY_LABELS[category],
  }));
};
