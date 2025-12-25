import { Router, Response } from 'express';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Calculate level from XP
const getLevelForXP = (totalXP: number): number => {
  if (totalXP <= 0) return 1;
  let level = 1;
  while (50 * Math.pow(level + 1, 2) <= totalXP) {
    level++;
  }
  return level;
};

// Calculate XP needed for next level
const getXPForLevel = (level: number): number => {
  if (level <= 1) return 0;
  return 50 * Math.pow(level, 2);
};

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// GET /api/progress - Get user progress (XP, level, streak)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentLevel = getLevelForXP(user.totalXp);
    const xpToNextLevel = getXPForLevel(currentLevel + 1) - user.totalXp;
    const currentLevelXP = getXPForLevel(currentLevel);
    const nextLevelXP = getXPForLevel(currentLevel + 1);
    const xpInCurrentLevel = user.totalXp - currentLevelXP;
    const xpNeededForLevel = nextLevelXP - currentLevelXP;
    const progressPercentage = Math.round((xpInCurrentLevel / xpNeededForLevel) * 100);

    res.json({
      totalXp: user.totalXp,
      currentLevel,
      xpToNextLevel,
      progressPercentage,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastPracticeDate: user.lastPracticeDate,
    });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to get progress' });
  }
});

// PUT /api/progress/xp - Award XP
router.put('/xp', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { xp } = req.body;

    if (typeof xp !== 'number' || xp < 0) {
      return res.status(400).json({ error: 'Valid XP amount required' });
    }

    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const previousLevel = getLevelForXP(user.totalXp);
    const newTotalXP = user.totalXp + xp;
    const newLevel = getLevelForXP(newTotalXP);
    const leveledUp = newLevel > previousLevel;

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    let newStreak = user.currentStreak;
    let newLongestStreak = user.longestStreak;

    if (user.lastPracticeDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (user.lastPracticeDate === yesterdayStr) {
        newStreak = user.currentStreak + 1;
      } else if (!user.lastPracticeDate) {
        newStreak = 1;
      } else {
        newStreak = 1; // Reset streak
      }

      if (newStreak > newLongestStreak) {
        newLongestStreak = newStreak;
      }

      // Record streak history
      await db.insert(schema.streakHistory).values({
        id: generateId(),
        userId: req.userId!,
        practiceDate: today,
        createdAt: new Date(),
      });
    }

    // Update user
    await db
      .update(schema.users)
      .set({
        totalXp: newTotalXP,
        currentLevel: newLevel,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastPracticeDate: today,
      })
      .where(eq(schema.users.id, req.userId!));

    res.json({
      xpAwarded: xp,
      totalXp: newTotalXP,
      previousLevel,
      newLevel,
      leveledUp,
      currentStreak: newStreak,
      longestStreak: newLongestStreak,
    });
  } catch (error) {
    console.error('Award XP error:', error);
    res.status(500).json({ error: 'Failed to award XP' });
  }
});

export default router;
