import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be set');
}

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
  userDivision?: string;
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; role: string; division?: string };
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    req.userDivision = decoded.division || 'insurance'; // Default for legacy tokens
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Check if user has manager-level access (any type of manager or admin)
export const requireManager = (req: AuthRequest, res: Response, next: NextFunction) => {
  const managerRoles = ['manager', 'insurance_manager', 'retail_manager'];
  if (!managerRoles.includes(req.userRole || '')) {
    return res.status(403).json({ error: 'Manager access required' });
  }
  next();
};

// Check if user is admin (full access to all divisions)
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.userRole !== 'manager') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Helper to check if user can access a specific division
export const canAccessDivision = (userRole: string, userDivision: string, targetDivision: string): boolean => {
  // Admin (manager role) can access all divisions
  if (userRole === 'manager') return true;

  // Division managers can only access their own division
  if (userRole === 'insurance_manager' && targetDivision === 'insurance') return true;
  if (userRole === 'retail_manager' && targetDivision === 'retail') return true;

  // Trainees can only access their own division
  if (userRole === 'trainee' && userDivision === targetDivision) return true;

  return false;
};

// Helper to get division filter for queries
export const getDivisionFilter = (userRole: string, userDivision: string): string | null => {
  // Admin sees all
  if (userRole === 'manager') return null;

  // Division managers see their division
  if (userRole === 'insurance_manager') return 'insurance';
  if (userRole === 'retail_manager') return 'retail';

  // Trainees see their own division
  return userDivision;
};

export const generateToken = (userId: string, role: string, division: string = 'insurance'): string => {
  return jwt.sign({ userId, role, division }, JWT_SECRET, { expiresIn: '7d' });
};
