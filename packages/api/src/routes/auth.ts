/**
 * Authentication routes.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import {
  getUserByEmail,
  getFirstUser,
  getAccountByUserId,
  createUser,
  createAccount,
  createSession,
  deleteSessionByToken,
  getSessionWithUser,
  isLockedOut,
  recordFailedLoginAttempt,
  clearLoginAttempts,
  cleanupOldLoginAttempts,
  type DrizzleDatabase,
} from '@reverso/db';
import { z } from 'zod';
import { cookieSecure } from '../utils/security.js';

/** Failed logins from one address (any account) within the window before it is locked. */
const IP_MAX_FAILED_LOGINS = 20;

/** How often expired login-attempt rows are pruned. */
const LOGIN_ATTEMPTS_CLEANUP_INTERVAL_MS = 6 * 60 * 60 * 1000;

const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/**
 * May this request create the very first admin?
 *
 * The first account is created without presenting any credential, so on a
 * server whose database is still empty — a fresh volume, a mistyped
 * REVERSO_DB_PATH — whoever asks first would own the CMS. Bootstrapping is
 * therefore limited to the machine running the server (where `reverso init`
 * and `reverso dev` seed it), unless the operator opens it deliberately.
 */
export function bootstrapAllowed(request: FastifyRequest): boolean {
  if ((process.env.REVERSO_ALLOW_BOOTSTRAP ?? '').toLowerCase() === 'true') return true;
  return LOOPBACK_ADDRESSES.has(request.ip);
}

const SALT_ROUNDS = 12;
const SESSION_DURATION_DAYS = 30;

/**
 * Generate a secure session token.
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

export default async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // Failed logins are recorded per address and per account, including for
  // addresses that never come back. Prune expired rows so the table cannot
  // grow without bound.
  const cleanupTimer = setInterval(() => {
    void cleanupOldLoginAttempts(fastify.db).catch((error: unknown) => {
      fastify.log.warn({ err: error }, 'Could not prune old login attempts');
    });
  }, LOGIN_ATTEMPTS_CLEANUP_INTERVAL_MS);
  cleanupTimer.unref();
  fastify.addHook('onClose', async () => clearInterval(cleanupTimer));

  /**
   * POST /auth/login - Login with email and password.
   */
  fastify.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const db = (request as unknown as { db: DrizzleDatabase }).db;
      if (!db) {
        console.error('[AUTH] Database not available on request');
        return reply.status(500).send({
          success: false,
          error: 'Database not available',
          message: 'Internal server error - database connection failed',
        });
      }
      const ip = request.ip;

    // Validate input
    const parseResult = loginSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: parseResult.error.issues,
      });
    }

    const { email, password } = parseResult.data;

    // Two independent lockout buckets (persistent in database):
    //  - per account *and source*: one address cannot try unlimited passwords
    //    on one user. Keying it by address as well is what keeps the lockout
    //    from becoming a denial of service: a stranger who guesses wrong five
    //    times locks only their own path to that account, never the real
    //    owner signing in from somewhere else;
    //  - per IP, with a higher ceiling for offices behind one NAT: one source
    //    cannot spray a few guesses across arbitrarily many accounts.
    const accountKey = `login:account:${email.toLowerCase()}:${ip}`;
    const ipKey = `login:ip:${ip}`;
    const [accountLock, ipLock] = await Promise.all([
      isLockedOut(db, accountKey),
      isLockedOut(db, ipKey),
    ]);
    const lock = accountLock.locked ? accountLock : ipLock.locked ? ipLock : null;
    if (lock) {
      const minutes = Math.ceil(lock.remainingSeconds / 60);
      return reply.status(429).send({
        success: false,
        error: 'Too many failed attempts',
        message: `Too many failed logins from this address. Try again in ${minutes} minutes.`,
        retryAfter: lock.remainingSeconds,
      });
    }
    const recordFailure = () =>
      Promise.all([
        recordFailedLoginAttempt(db, accountKey),
        recordFailedLoginAttempt(db, ipKey, IP_MAX_FAILED_LOGINS),
      ]);

    // Find user
    const user = await getUserByEmail(db, email);
    if (!user) {
      await recordFailure();
      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Get account with password
    const account = await getAccountByUserId(db, user.id, 'credential');
    if (!account || !account.password) {
      await recordFailure();
      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, account.password);
    if (!passwordValid) {
      await recordFailure();
      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Clear failed attempts on successful login
    // A correct password clears this address's bucket for the account; the
    // broader per-IP bucket simply ages out.
    await clearLoginAttempts(db, accountKey);

    // Create session
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const session = await createSession(db, {
      id: crypto.randomUUID(),
      userId: user.id,
      token,
      expiresAt,
      ipAddress: ip,
      userAgent: request.headers['user-agent'] ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Set cookie
    reply.setCookie('reverso_session', token, {
      httpOnly: true,
      secure: cookieSecure(request),
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return reply.send({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
      },
      session: {
        token,
        expiresAt: session.expiresAt.toISOString(),
      },
    });
    } catch (error) {
      console.error('[AUTH LOGIN ERROR]', error);
      return reply.status(500).send({
        success: false,
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV !== 'production' && error instanceof Error ? error.stack : undefined,
      });
    }
  });

  /**
   * POST /auth/logout - Logout and invalidate session.
   */
  fastify.post('/auth/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    const db = (request as unknown as { db: DrizzleDatabase }).db;

    // Get token from cookie or header
    const token =
      request.cookies.reverso_session ||
      request.headers.authorization?.replace('Bearer ', '');

    if (token) {
      await deleteSessionByToken(db, token);
    }

    // Clear cookie
    reply.clearCookie('reverso_session', { path: '/' });

    return reply.send({
      success: true,
      message: 'Logged out successfully',
    });
  });

  /**
   * GET /auth/me - Get current authenticated user.
   */
  fastify.get('/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const db = (request as unknown as { db: DrizzleDatabase }).db;

    // Get token from cookie or header
    const token =
      request.cookies.reverso_session ||
      request.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return reply.status(401).send({
        success: false,
        error: 'Not authenticated',
        message: 'No session token provided',
      });
    }

    const result = await getSessionWithUser(db, token);
    if (!result) {
      reply.clearCookie('reverso_session', { path: '/' });
      return reply.status(401).send({
        success: false,
        error: 'Invalid session',
        message: 'Session expired or invalid',
      });
    }

    return reply.send({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        image: result.user.image,
      },
    });
  });

  /**
   * GET /auth/setup-status - Check if initial setup is needed (no users exist).
   */
  fastify.get('/auth/setup-status', async (request: FastifyRequest, reply: FastifyReply) => {
    const db = (request as unknown as { db: DrizzleDatabase }).db;

    const firstUser = await getFirstUser(db);
    const needsSetup = !firstUser;

    return reply.send({
      success: true,
      needsSetup,
      // Setup can be needed while this particular caller may not perform it.
      canRegister: needsSetup && bootstrapAllowed(request),
    });
  });

  /**
   * POST /auth/register - Register a new user (only allowed when no users exist yet).
   * This is WordPress-like behavior: registration is only open for the first admin setup.
   */
  fastify.post('/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const db = (request as unknown as { db: DrizzleDatabase }).db;

    // Validate input
    const parseResult = registerSchema.safeParse(request.body);
    if (!parseResult.success) {
      return reply.status(400).send({
        success: false,
        error: 'Validation error',
        details: parseResult.error.issues,
      });
    }

    const { email, password, name } = parseResult.data;

    // WordPress-like behavior: only allow registration when no users exist yet
    const firstUser = await getFirstUser(db);
    if (firstUser) {
      return reply.status(403).send({
        success: false,
        error: 'Registration closed',
        message: 'An admin account already exists. Please sign in instead.',
      });
    }

    if (!bootstrapAllowed(request)) {
      return reply.status(403).send({
        success: false,
        error: 'Registration closed',
        message:
          'The first admin can only be created from the machine running Reverso. Run `reverso init` there, or set REVERSO_ALLOW_BOOTSTRAP=true to open registration.',
      });
    }

    // Check if user already exists (double-check, shouldn't happen if firstUser is null)
    const existingUser = await getUserByEmail(db, email);
    if (existingUser) {
      return reply.status(409).send({
        success: false,
        error: 'User exists',
        message: 'A user with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const userId = crypto.randomUUID();
    const now = new Date();

    const user = await createUser(db, {
      id: userId,
      email,
      name,
      role: 'admin', // First user is admin
      createdAt: now,
      updatedAt: now,
    });

    // Create credential account
    await createAccount(db, {
      id: crypto.randomUUID(),
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: hashedPassword,
      createdAt: now,
      updatedAt: now,
    });

    // Auto-login: create session
    const token = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

    await createSession(db, {
      id: crypto.randomUUID(),
      userId: user.id,
      token,
      expiresAt,
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'] ?? null,
      createdAt: now,
      updatedAt: now,
    });

    // Set cookie
    reply.setCookie('reverso_session', token, {
      httpOnly: true,
      secure: cookieSecure(request),
      sameSite: 'lax',
      path: '/',
      expires: expiresAt,
    });

    return reply.status(201).send({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      session: {
        token,
        expiresAt: expiresAt.toISOString(),
      },
    });
  });
}
