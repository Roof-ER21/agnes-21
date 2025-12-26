import { Router, Response } from 'express';
import { db, schema } from '../db';
import { desc, sql, gte, count, avg } from 'drizzle-orm';
import { authenticateToken, requireManager, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/analytics/team - Team stats (manager only)
router.get('/team', authenticateToken, requireManager, async (_req: AuthRequest, res: Response) => {
  try {
    // Total users
    const [usersCount] = await db
      .select({ count: count() })
      .from(schema.users);

    // Total sessions
    const [sessionsCount] = await db
      .select({ count: count() })
      .from(schema.trainingSessions);

    // Average score
    const [avgScore] = await db
      .select({ avg: avg(schema.trainingSessions.finalScore) })
      .from(schema.trainingSessions);

    // Total XP earned
    const [totalXP] = await db
      .select({ sum: sql<number>`COALESCE(SUM(${schema.trainingSessions.xpEarned}), 0)` })
      .from(schema.trainingSessions);

    // Active users (practiced in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [activeUsers] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${schema.trainingSessions.userId})` })
      .from(schema.trainingSessions)
      .where(gte(schema.trainingSessions.createdAt, sevenDaysAgo));

    res.json({
      totalUsers: usersCount.count,
      totalSessions: sessionsCount.count,
      averageScore: Math.round(parseFloat(String(avgScore.avg)) || 0),
      totalXpEarned: totalXP.sum || 0,
      activeUsersLast7Days: activeUsers.count,
    });
  } catch (error) {
    console.error('Get team analytics error:', error);
    res.status(500).json({ error: 'Failed to get team analytics' });
  }
});

// GET /api/analytics/sessions - Session breakdown (manager only)
router.get('/sessions', authenticateToken, requireManager, async (_req: AuthRequest, res: Response) => {
  try {
    // Sessions by difficulty
    const byDifficulty = await db
      .select({
        difficulty: schema.trainingSessions.difficulty,
        count: count(),
        avgScore: avg(schema.trainingSessions.finalScore),
      })
      .from(schema.trainingSessions)
      .groupBy(schema.trainingSessions.difficulty);

    // Sessions by mode
    const byMode = await db
      .select({
        mode: schema.trainingSessions.mode,
        count: count(),
        avgScore: avg(schema.trainingSessions.finalScore),
      })
      .from(schema.trainingSessions)
      .groupBy(schema.trainingSessions.mode);

    // Recent sessions (last 20)
    const recentSessions = await db
      .select({
        id: schema.trainingSessions.id,
        sessionId: schema.trainingSessions.sessionId,
        userId: schema.trainingSessions.userId,
        mode: schema.trainingSessions.mode,
        difficulty: schema.trainingSessions.difficulty,
        scriptName: schema.trainingSessions.scriptName,
        finalScore: schema.trainingSessions.finalScore,
        duration: schema.trainingSessions.duration,
        createdAt: schema.trainingSessions.createdAt,
      })
      .from(schema.trainingSessions)
      .orderBy(desc(schema.trainingSessions.createdAt))
      .limit(20);

    res.json({
      byDifficulty: byDifficulty.map(d => ({
        ...d,
        avgScore: Math.round(parseFloat(String(d.avgScore)) || 0),
      })),
      byMode: byMode.map(m => ({
        ...m,
        avgScore: Math.round(parseFloat(String(m.avgScore)) || 0),
      })),
      recentSessions,
    });
  } catch (error) {
    console.error('Get session analytics error:', error);
    res.status(500).json({ error: 'Failed to get session analytics' });
  }
});

// GET /api/analytics/trends - Trend data (manager only)
router.get('/trends', authenticateToken, requireManager, async (_req: AuthRequest, res: Response) => {
  try {
    // Daily sessions for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailySessions = await db
      .select({
        date: sql<string>`DATE(${schema.trainingSessions.createdAt})`.as('date'),
        count: count(),
        avgScore: avg(schema.trainingSessions.finalScore),
        totalXp: sql<number>`COALESCE(SUM(${schema.trainingSessions.xpEarned}), 0)`,
      })
      .from(schema.trainingSessions)
      .where(gte(schema.trainingSessions.createdAt, thirtyDaysAgo))
      .groupBy(sql`DATE(${schema.trainingSessions.createdAt})`)
      .orderBy(sql`date`);

    // Top performers this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const topPerformers = await db
      .select({
        userId: schema.trainingSessions.userId,
        sessionsCount: count(),
        totalXp: sql<number>`COALESCE(SUM(${schema.trainingSessions.xpEarned}), 0)`,
        avgScore: avg(schema.trainingSessions.finalScore),
      })
      .from(schema.trainingSessions)
      .where(gte(schema.trainingSessions.createdAt, startOfMonth))
      .groupBy(schema.trainingSessions.userId)
      .orderBy(desc(sql<number>`COALESCE(SUM(${schema.trainingSessions.xpEarned}), 0)`))
      .limit(10);

    // Get user details
    const users = await db.select().from(schema.users);
    const userMap = new Map(users.map(u => [u.id, u]));

    const topPerformersWithNames = topPerformers.map(p => {
      const user = userMap.get(p.userId);
      return {
        userId: p.userId,
        name: user?.name || 'Unknown',
        avatar: user?.avatar || '👤',
        sessionsCount: p.sessionsCount,
        totalXp: p.totalXp,
        avgScore: Math.round(parseFloat(String(p.avgScore)) || 0),
      };
    });

    res.json({
      dailySessions: dailySessions.map(d => ({
        ...d,
        avgScore: Math.round(parseFloat(String(d.avgScore)) || 0),
      })),
      topPerformers: topPerformersWithNames,
    });
  } catch (error) {
    console.error('Get trends error:', error);
    res.status(500).json({ error: 'Failed to get trends' });
  }
});

// GET /api/analytics/users - All users list (manager only)
router.get('/users', authenticateToken, requireManager, async (_req: AuthRequest, res: Response) => {
  try {
    const users = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        email: schema.users.email,
        role: schema.users.role,
        division: schema.users.division,
        avatar: schema.users.avatar,
        totalXp: schema.users.totalXp,
        currentLevel: schema.users.currentLevel,
        currentStreak: schema.users.currentStreak,
        longestStreak: schema.users.longestStreak,
        lastPracticeDate: schema.users.lastPracticeDate,
        createdAt: schema.users.createdAt,
        lastLogin: schema.users.lastLogin,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.totalXp));

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

export default router;
