/**
 * Authentication queries.
 */

import { and, eq, sql } from 'drizzle-orm';
import type { DrizzleDatabase } from '../connection.js';
import { users, accounts, sessions } from '../schema/auth.js';
import type { User, NewUser, Account, NewAccount, Session, NewSession } from '../schema/auth.js';
import { deleteSessionByToken } from './sessions.js';

/**
 * Get user by email. Emails are matched case-insensitively: `Admin@Site.com`
 * and `admin@site.com` are the same mailbox, and a user who registered with
 * capitals must still be able to sign in typing lowercase.
 */
export async function getUserByEmail(
  db: DrizzleDatabase,
  email: string
): Promise<User | null> {
  const result = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email.trim().toLowerCase()}`)
    .limit(1);

  return result[0] ?? null;
}

/**
 * Create the first user and its credential account, atomically, only if no
 * user exists yet. Returns null when another user already exists.
 *
 * Runs as one synchronous SQLite transaction: two concurrent registrations
 * on an empty database can never both see "no users" and create two admins.
 */
export function createFirstUser(
  db: DrizzleDatabase,
  user: NewUser,
  account: NewAccount
): User | null {
  return db.$client.transaction(() => {
    const existing = db.select({ id: users.id }).from(users).limit(1).get();
    if (existing) return null;
    const created = db.insert(users).values(user).returning().get();
    db.insert(accounts).values(account).run();
    return created;
  })();
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
