import { Router, Request, Response } from 'express';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import CryptoJS from 'crypto-js';
import { authenticateToken, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Hash PIN using PBKDF2 (same as frontend)
const hashPin = (pin: string, salt: string): string => {
  return CryptoJS.PBKDF2(pin, salt, { keySize: 256 / 32, iterations: 1000 }).toString();
};

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { name, pin } = req.body;

    if (!name || !pin) {
      return res.status(400).json({ error: 'Name and PIN are required' });
    }

    // Find user by name (case insensitive)
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.name, name));

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Verify PIN
    const hashedPin = hashPin(pin, user.id);
    if (hashedPin !== user.pinHash) {
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // Update last login
    await db
      .update(schema.users)
      .set({ lastLogin: new Date() })
      .where(eq(schema.users.id, user.id));

    // Log login
    await db.insert(schema.loginHistory).values({
      id: generateId(),
      userId: user.id,
      loginAt: new Date(),
      device: req.headers['user-agent'] || 'unknown',
      ipAddress: req.ip || 'unknown',
    });

    // Generate token
    const token = generateToken(user.id, user.role);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        totalXp: user.totalXp,
        currentLevel: user.currentLevel,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, pin, role = 'trainee', avatar = '👤' } = req.body;

    if (!name || !pin) {
      return res.status(400).json({ error: 'Name and PIN are required' });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.name, name));

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create user
    const userId = generateId();
    const hashedPin = hashPin(pin, userId);

    await db.insert(schema.users).values({
      id: userId,
      name,
      role,
      pinHash: hashedPin,
      avatar,
      createdAt: new Date(),
    });

    // Generate token
    const token = generateToken(userId, role);

    res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        role,
        avatar,
        totalXp: 0,
        currentLevel: 1,
        currentStreak: 0,
        longestStreak: 0,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const [user] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, req.userId!));

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      totalXp: user.totalXp,
      currentLevel: user.currentLevel,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
