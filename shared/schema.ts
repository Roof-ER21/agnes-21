import { pgTable, text, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  role: text('role').notNull().default('trainee'), // 'trainee' | 'manager'
  pinHash: text('pin_hash').notNull(),
  avatar: text('avatar').notNull().default('👤'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
  totalXp: integer('total_xp').notNull().default(0),
  currentLevel: integer('current_level').notNull().default(1),
  currentStreak: integer('current_streak').notNull().default(0),
  longestStreak: integer('longest_streak').notNull().default(0),
  lastPracticeDate: text('last_practice_date'),
});

// Training sessions table
export const trainingSessions = pgTable('training_sessions', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().unique(),
  userId: text('user_id').notNull().references(() => users.id),
  mode: text('mode').notNull(), // 'COACH' | 'ROLEPLAY'
  difficulty: text('difficulty').notNull(), // 'BEGINNER' | 'ROOKIE' | 'PRO' | 'ELITE' | 'NIGHTMARE'
  scriptId: text('script_id'),
  scriptName: text('script_name'),
  isMiniModule: boolean('is_mini_module').default(false),
  duration: integer('duration'), // seconds
  finalScore: integer('final_score'),
  xpEarned: integer('xp_earned').default(0),
  transcript: jsonb('transcript'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
});

// Login history table
export const loginHistory = pgTable('login_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  loginAt: timestamp('login_at').defaultNow().notNull(),
  device: text('device'),
  ipAddress: text('ip_address'),
});

// Achievements table
export const achievements = pgTable('achievements', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  achievementId: text('achievement_id').notNull(),
  unlockedAt: timestamp('unlocked_at').defaultNow().notNull(),
});

// Streak history table
export const streakHistory = pgTable('streak_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  practiceDate: text('practice_date').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  trainingSessions: many(trainingSessions),
  loginHistory: many(loginHistory),
  achievements: many(achievements),
  streakHistory: many(streakHistory),
}));

export const trainingSessionsRelations = relations(trainingSessions, ({ one }) => ({
  user: one(users, {
    fields: [trainingSessions.userId],
    references: [users.id],
  }),
}));

export const loginHistoryRelations = relations(loginHistory, ({ one }) => ({
  user: one(users, {
    fields: [loginHistory.userId],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

export const streakHistoryRelations = relations(streakHistory, ({ one }) => ({
  user: one(users, {
    fields: [streakHistory.userId],
    references: [users.id],
  }),
}));

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type NewTrainingSession = typeof trainingSessions.$inferInsert;
export type LoginHistory = typeof loginHistory.$inferSelect;
export type Achievement = typeof achievements.$inferSelect;
export type StreakHistory = typeof streakHistory.$inferSelect;
