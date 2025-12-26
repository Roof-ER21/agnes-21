import { Router, Response } from 'express';
import { db, schema } from '../db';
import { eq, desc, sql } from 'drizzle-orm';
import { authenticateToken, AuthRequest } from '../middleware/auth';

// Valid session modes and difficulties
const VALID_MODES = ['COACH', 'ROLEPLAY', 'PRACTICE', 'QUIZ', 'SCORE_ME'];
const VALID_DIFFICULTIES = ['BEGINNER', 'ROOKIE', 'PRO', 'ELITE', 'NIGHTMARE'];

const router = Router();

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// POST /api/sessions - Create new session
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { mode, difficulty, scriptId, scriptName, isMiniModule } = req.body;

    if (!mode || !difficulty) {
      return res.status(400).json({ error: 'Mode and difficulty are required' });
    }

    // Validate mode and difficulty
    if (!VALID_MODES.includes(mode)) {
      return res.status(400).json({ error: `Invalid mode. Must be one of: ${VALID_MODES.join(', ')}` });
    }
    if (!VALID_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ error: `Invalid difficulty. Must be one of: ${VALID_DIFFICULTIES.join(', ')}` });
    }

    const sessionId = generateId();
    const id = generateId();

    await db.insert(schema.trainingSessions).values({
      id,
      sessionId,
      userId: req.userId!,
      mode,
      difficulty,
      scriptId,
      scriptName,
      isMiniModule: isMiniModule || false,
      createdAt: new Date(),
    });

    res.status(201).json({
      id,
      sessionId,
      message: 'Session created'
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// PUT /api/sessions/:sessionId - Update session (add score, duration, transcript)
router.put('/:sessionId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { finalScore, duration, xpEarned, transcript } = req.body;

    const [session] = await db
      .select()
      .from(schema.trainingSessions)
      .where(eq(schema.trainingSessions.sessionId, sessionId));

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.userId !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db
      .update(schema.trainingSessions)
      .set({
        finalScore,
        duration,
        xpEarned,
        transcript,
        completedAt: new Date(),
      })
      .where(eq(schema.trainingSessions.sessionId, sessionId));

    // Award XP to user if xpEarned is provided
    if (xpEarned && xpEarned > 0) {
      await db
        .update(schema.users)
        .set({
          totalXp: sql`${schema.users.totalXp} + ${xpEarned}`,
          lastPracticeDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        })
        .where(eq(schema.users.id, req.userId!));

      // Update streak
      const today = new Date().toISOString().split('T')[0];
      const [user] = await db
        .select({ lastPracticeDate: schema.users.lastPracticeDate, currentStreak: schema.users.currentStreak, longestStreak: schema.users.longestStreak })
        .from(schema.users)
        .where(eq(schema.users.id, req.userId!));

      if (user) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        let newStreak = 1;
        if (user.lastPracticeDate === yesterdayStr) {
          // Continue streak from yesterday
          newStreak = (user.currentStreak || 0) + 1;
        } else if (user.lastPracticeDate === today) {
          // Already practiced today, keep current streak
          newStreak = user.currentStreak || 1;
        }

        const newLongestStreak = Math.max(newStreak, user.longestStreak || 0);

        await db
          .update(schema.users)
          .set({
            currentStreak: newStreak,
            longestStreak: newLongestStreak,
          })
          .where(eq(schema.users.id, req.userId!));
      }
    }

    res.json({ message: 'Session updated' });
  } catch (error) {
    console.error('Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// GET /api/sessions - List user sessions
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;

    const sessions = await db
      .select()
      .from(schema.trainingSessions)
      .where(eq(schema.trainingSessions.userId, req.userId!))
      .orderBy(desc(schema.trainingSessions.createdAt))
      .limit(limit)
      .offset(offset);

    res.json(sessions);
  } catch (error) {
    console.error('List sessions error:', error);
    res.status(500).json({ error: 'Failed to list sessions' });
  }
});

// GET /api/sessions/:sessionId - Get session detail
router.get('/:sessionId', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    const [session] = await db
      .select()
      .from(schema.trainingSessions)
      .where(eq(schema.trainingSessions.sessionId, sessionId));

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Allow managers to view any session
    if (session.userId !== req.userId && req.userRole !== 'manager') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(session);
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

export default router;
