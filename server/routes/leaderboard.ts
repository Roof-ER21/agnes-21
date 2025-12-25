import { Router, Response } from 'express';
import { db, schema } from '../db';
import { desc, sql, gte } from 'drizzle-orm';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/leaderboard - Get current rankings with session stats
router.get('/', authenticateToken, async (_req: AuthRequest, res: Response) => {
  try {
    // Get users with their session stats
    const usersWithStats = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        avatar: schema.users.avatar,
        totalXp: schema.users.totalXp,
        currentLevel: schema.users.currentLevel,
        currentStreak: schema.users.currentStreak,
        longestStreak: schema.users.longestStreak,
        totalSessions: sql<number>`(
          SELECT COUNT(*)
          FROM ${schema.trainingSessions}
          WHERE ${schema.trainingSessions.userId} = ${schema.users.id}
        )`.as('total_sessions'),
        avgScore: sql<number>`(
          SELECT COALESCE(ROUND(AVG(${schema.trainingSessions.finalScore})), 0)
          FROM ${schema.trainingSessions}
          WHERE ${schema.trainingSessions.userId} = ${schema.users.id}
          AND ${schema.trainingSessions.finalScore} IS NOT NULL
        )`.as('avg_score'),
      })
      .from(schema.users)
      .orderBy(desc(schema.users.totalXp))
      .limit(50);

    // Add rank to each user
    const rankedUsers = usersWithStats.map((user, index) => ({
      ...user,
      rank: index + 1,
    }));

    res.json(rankedUsers);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
});

// GET /api/leaderboard/weekly - Get weekly rankings
router.get('/weekly', authenticateToken, async (_req: AuthRequest, res: Response) => {
  try {
    // Get start of current week (Sunday)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Aggregate XP earned this week from sessions
    const weeklyStats = await db
      .select({
        userId: schema.trainingSessions.userId,
        weeklyXp: sql<number>`COALESCE(SUM(${schema.trainingSessions.xpEarned}), 0)`.as('weekly_xp'),
        sessionsCount: sql<number>`COUNT(*)`.as('sessions_count'),
      })
      .from(schema.trainingSessions)
      .where(gte(schema.trainingSessions.createdAt, startOfWeek))
      .groupBy(schema.trainingSessions.userId)
      .orderBy(sql`weekly_xp DESC`)
      .limit(50);

    // Get user details for each entry
    const userIds = weeklyStats.map(s => s.userId);
    if (userIds.length === 0) {
      return res.json([]);
    }

    const users = await db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        avatar: schema.users.avatar,
        currentLevel: schema.users.currentLevel,
      })
      .from(schema.users);

    const userMap = new Map(users.map(u => [u.id, u]));

    const rankedWeekly = weeklyStats.map((stat, index) => {
      const user = userMap.get(stat.userId);
      return {
        rank: index + 1,
        id: stat.userId,
        name: user?.name || 'Unknown',
        avatar: user?.avatar || '👤',
        currentLevel: user?.currentLevel || 1,
        weeklyXp: stat.weeklyXp,
        sessionsCount: stat.sessionsCount,
      };
    });

    res.json(rankedWeekly);
  } catch (error) {
    console.error('Get weekly leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get weekly leaderboard' });
  }
});

export default router;
