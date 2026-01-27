/**
 * Session queries.
 */

import { eq } from 'drizzle-orm';
import type { DrizzleDatabase } from '../connection.js';
import { sessions, users } from '../schema/auth.js';
import type { Session, User } from '../schema/auth.js';

export interface SessionWithUser extends Session {
  user: User;
}

/**
 * Get session by token.
 */
export async function getSessionByToken(
  db: DrizzleDatabase,
  token: string
): Promise<SessionWithUser | null> {
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

  const row = result[0];
  if (!row) return null;

  return {
    ...row.session,
    user: row.user,
  };
}

/**
 * Delete session by token.
 */
export async function deleteSessionByToken(
  db: DrizzleDatabase,
  token: string
): Promise<boolean> {
  const result = await db.delete(sessions).where(eq(sessions.token, token));
  return (result.changes ?? 0) > 0;
}

/**
 * Delete all sessions for a user.
 */
export async function deleteUserSessions(
  db: DrizzleDatabase,
  userId: string
): Promise<number> {
  const result = await db.delete(sessions).where(eq(sessions.userId, userId));
  return result.changes ?? 0;
}

/**
 * Get user by ID.
 */
export async function getUserById(
  db: DrizzleDatabase,
  id: string
): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}
