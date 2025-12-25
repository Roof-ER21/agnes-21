import { Router, Request, Response } from 'express';
import { db, schema } from '../db';
import { eq } from 'drizzle-orm';
import CryptoJS from 'crypto-js';
import { authenticateToken, generateToken, requireManager, getDivisionFilter, canAccessDivision, AuthRequest } from '../middleware/auth';

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

    // Generate token with division
    const token = generateToken(user.id, user.role, user.division);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        division: user.division,
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
    const { name, pin, role = 'trainee', avatar = '👤', division = 'insurance' } = req.body;

    if (!name || !pin) {
      return res.status(400).json({ error: 'Name and PIN are required' });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }

    // Validate division
    if (!['insurance', 'retail'].includes(division)) {
      return res.status(400).json({ error: 'Division must be insurance or retail' });
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
      division,
      pinHash: hashedPin,
      avatar,
      createdAt: new Date(),
    });

    // Generate token with division
    const token = generateToken(userId, role, division);

    res.status(201).json({
      token,
      user: {
        id: userId,
        name,
        role,
        division,
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
      division: user.division,
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

// ============================================
// ADMIN CRUD ENDPOINTS (Manager only)
// ============================================

// POST /api/auth/admin/create-user - Create new user (manager only)
router.post('/admin/create-user', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const { name, pin, role = 'trainee', avatar = '👤', division = 'insurance' } = req.body;

    if (!name || !pin) {
      return res.status(400).json({ error: 'Name and PIN are required' });
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }

    // Validate division
    if (!['insurance', 'retail'].includes(division)) {
      return res.status(400).json({ error: 'Division must be insurance or retail' });
    }

    // Division managers can only create users in their own division
    if (req.userRole !== 'manager') {
      const allowedDivision = getDivisionFilter(req.userRole!, req.userDivision!);
      if (allowedDivision && division !== allowedDivision) {
        return res.status(403).json({ error: `You can only create users in the ${allowedDivision} division` });
      }
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
      division,
      pinHash: hashedPin,
      avatar,
      createdAt: new Date(),
    });

    res.status(201).json({
      success: true,
      user: {
        id: userId,
        name,
        role,
        division,
        avatar,
        totalXp: 0,
        currentLevel: 1,
        currentStreak: 0,
        longestStreak: 0,
      },
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/auth/admin/user/:userId - Update user info (manager only)
router.put('/admin/user/:userId', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { name, role, avatar, division } = req.body;

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Division managers can only edit users in their own division
    if (req.userRole !== 'manager') {
      if (!canAccessDivision(req.userRole!, req.userDivision!, existingUser.division)) {
        return res.status(403).json({ error: 'You can only edit users in your division' });
      }
    }

    // If name is changing, check it's not taken
    if (name && name !== existingUser.name) {
      const [nameTaken] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.name, name));

      if (nameTaken) {
        return res.status(409).json({ error: 'Name already taken by another user' });
      }
    }

    // Validate division if provided
    if (division && !['insurance', 'retail'].includes(division)) {
      return res.status(400).json({ error: 'Division must be insurance or retail' });
    }

    // Division managers cannot change a user's division
    if (division && division !== existingUser.division && req.userRole !== 'manager') {
      return res.status(403).json({ error: 'Only admins can change user divisions' });
    }

    // Build update object
    const updates: Partial<typeof schema.users.$inferInsert> = {};
    if (name) updates.name = name;
    if (role) updates.role = role;
    if (avatar) updates.avatar = avatar;
    if (division) updates.division = division;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    await db
      .update(schema.users)
      .set(updates)
      .where(eq(schema.users.id, userId));

    // Fetch updated user
    const [updatedUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    res.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        role: updatedUser.role,
        division: updatedUser.division,
        avatar: updatedUser.avatar,
        totalXp: updatedUser.totalXp,
        currentLevel: updatedUser.currentLevel,
        currentStreak: updatedUser.currentStreak,
        longestStreak: updatedUser.longestStreak,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PUT /api/auth/admin/user/:userId/reset-pin - Reset user PIN (manager only)
router.put('/admin/user/:userId/reset-pin', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { newPin } = req.body;

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Division managers can only reset PINs for users in their division
    if (req.userRole !== 'manager') {
      if (!canAccessDivision(req.userRole!, req.userDivision!, existingUser.division)) {
        return res.status(403).json({ error: 'You can only reset PINs for users in your division' });
      }
    }

    // Generate random PIN if not provided
    let pin = newPin;
    if (!pin) {
      // Generate random 4-digit PIN (avoiding simple patterns)
      let attempts = 0;
      do {
        pin = Math.floor(1000 + Math.random() * 9000).toString();
        attempts++;
      } while (
        (pin === '1234' || pin === '0000' || pin === '1111' ||
         pin === '2222' || pin === '3333' || pin === '4444' ||
         /(\d)\1{3}/.test(pin)) && attempts < 10
      );
    }

    // Validate PIN format
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }

    // Hash and save new PIN
    const hashedPin = hashPin(pin, userId);
    await db
      .update(schema.users)
      .set({ pinHash: hashedPin })
      .where(eq(schema.users.id, userId));

    res.json({
      success: true,
      message: `PIN reset successfully${!newPin ? '. New PIN: ' + pin : ''}`,
      newPin: !newPin ? pin : undefined, // Only return if generated
    });
  } catch (error) {
    console.error('Reset PIN error:', error);
    res.status(500).json({ error: 'Failed to reset PIN' });
  }
});

// DELETE /api/auth/admin/user/:userId - Delete user (manager only)
router.delete('/admin/user/:userId', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.id, userId));

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting yourself
    if (userId === req.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Division managers can only delete users in their division
    if (req.userRole !== 'manager') {
      if (!canAccessDivision(req.userRole!, req.userDivision!, existingUser.division)) {
        return res.status(403).json({ error: 'You can only delete users in your division' });
      }
    }

    // Delete user's training sessions first (cascade)
    await db
      .delete(schema.trainingSessions)
      .where(eq(schema.trainingSessions.userId, userId));

    // Delete user's login history
    await db
      .delete(schema.loginHistory)
      .where(eq(schema.loginHistory.userId, userId));

    // Delete the user
    await db
      .delete(schema.users)
      .where(eq(schema.users.id, userId));

    res.json({
      success: true,
      message: `User "${existingUser.name}" deleted successfully`,
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/auth/admin/users - Get all users (manager only)
router.get('/admin/users', authenticateToken, requireManager, async (req: AuthRequest, res: Response) => {
  try {
    // Get division filter based on user's role
    const divisionFilter = getDivisionFilter(req.userRole!, req.userDivision!);

    let query = db
      .select({
        id: schema.users.id,
        name: schema.users.name,
        role: schema.users.role,
        division: schema.users.division,
        avatar: schema.users.avatar,
        totalXp: schema.users.totalXp,
        currentLevel: schema.users.currentLevel,
        currentStreak: schema.users.currentStreak,
        longestStreak: schema.users.longestStreak,
        createdAt: schema.users.createdAt,
        lastLogin: schema.users.lastLogin,
      })
      .from(schema.users);

    // Apply division filter for non-admin managers
    if (divisionFilter) {
      query = query.where(eq(schema.users.division, divisionFilter)) as typeof query;
    }

    const users = await query.orderBy(schema.users.name);

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

export default router;
