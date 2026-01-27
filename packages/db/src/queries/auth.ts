/**
 * Authentication queries.
 */

import { eq, and } from 'drizzle-orm';
import type { DrizzleDatabase } from '../connection.js';
import { users, accounts, sessions } from '../schema/auth.js';
import type { User, NewUser, Account, NewAccount, Session, NewSession } from '../schema/auth.js';
import { deleteSessionByToken } from './sessions.js';

/**
 * Get user by email.
 */
export async function getUserByEmail(
  db: DrizzleDatabase,
  email: string
): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Get first user (to check if any users exist).
 */
export async function getFirstUser(
  db: DrizzleDatabase
): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .limit(1);

  return result[0] ?? null;
}

/**
 * Create a new user.
 */
export async function createUser(
  db: DrizzleDatabase,
  data: NewUser
): Promise<User> {
  const result = await db
    .insert(users)
    .values(data)
    .returning();

  return result[0]!;
}

/**
 * Get account by user ID and provider.
 */
export async function getAccountByUserId(
  db: DrizzleDatabase,
  userId: string,
  providerId = 'credential'
): Promise<Account | null> {
  const result = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.providerId, providerId)))
    .limit(1);

  return result[0] ?? null;
}

/**
 * Create a new account (for email/password auth).
 */
export async function createAccount(
  db: DrizzleDatabase,
  data: NewAccount
): Promise<Account> {
  const result = await db
    .insert(accounts)
    .values(data)
    .returning();

  return result[0]!;
}

/**
 * Create a new session.
 */
export async function createSession(
  db: DrizzleDatabase,
  data: NewSession
): Promise<Session> {
  const result = await db
    .insert(sessions)
    .values(data)
    .returning();

  return result[0]!;
}

/**
 * Get session with user by token.
 */
export async function getSessionWithUser(
  db: DrizzleDatabase,
  token: string
): Promise<{ session: Session; user: User } | null> {
  const result = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const row = result[0]!;

  // Check if session is expired
  if (new Date(row.session.expiresAt).getTime() < Date.now()) {
    // Delete expired session
    await deleteSessionByToken(db, token);
    return null;
  }

  return { session: row.session, user: row.user };
}

// Note: Login attempt tracking is now handled by dedicated login-attempts.ts
// functions: isLockedOut, recordFailedLoginAttempt, clearLoginAttempts
