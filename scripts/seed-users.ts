/**
 * Database Seed Script
 * Creates default users for testing
 *
 * Run with: npm run db:seed
 */

import 'dotenv/config';
import { db, schema } from '../server/db';
import CryptoJS from 'crypto-js';
import { eq } from 'drizzle-orm';

// Hash PIN using PBKDF2 (same as server)
const hashPin = (pin: string, salt: string): string => {
  return CryptoJS.PBKDF2(pin, salt, { keySize: 256 / 32, iterations: 1000 }).toString();
};

// Generate unique ID
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Default users to seed
const defaultUsers = [
  {
    name: 'Admin',
    pin: '1234',
    role: 'manager' as const,
    avatar: '👔',
    email: 'admin@theroofdocs.com',
  },
  {
    name: 'Manager',
    pin: '1234',
    role: 'manager' as const,
    avatar: '👨‍💼',
    email: 'manager@theroofdocs.com',
  },
  {
    name: 'Trainee',
    pin: '5678',
    role: 'trainee' as const,
    avatar: '🎓',
    email: null,
  },
  {
    name: 'Demo User',
    pin: '0000',
    role: 'trainee' as const,
    avatar: '⭐',
    email: null,
  },
];

async function seedUsers() {
  console.log('🌱 Starting database seed...\n');

  for (const userData of defaultUsers) {
    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.name, userData.name));

    if (existingUser) {
      console.log(`⏭️  User "${userData.name}" already exists, skipping...`);
      continue;
    }

    // Create new user
    const userId = generateId();
    const pinHash = hashPin(userData.pin, userId);

    await db.insert(schema.users).values({
      id: userId,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      pinHash: pinHash,
      avatar: userData.avatar,
      createdAt: new Date(),
      totalXp: 0,
      currentLevel: 1,
      currentStreak: 0,
      longestStreak: 0,
    });

    console.log(`✅ Created user "${userData.name}" (${userData.role}) - PIN: ${userData.pin}`);
  }

  console.log('\n🎉 Seed complete!\n');
  console.log('Default logins:');
  console.log('  Admin    / 1234 (manager)');
  console.log('  Manager  / 1234 (manager)');
  console.log('  Trainee  / 5678 (trainee)');
  console.log('  Demo User / 0000 (trainee)');
}

// Run the seed
seedUsers()
  .then(() => {
    console.log('\nExiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  });
