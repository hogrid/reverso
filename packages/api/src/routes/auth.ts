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
  type DrizzleDatabase,
} from '@reverso/db';
import { z } from 'zod';

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
  /**
   * POST /auth/login - Login with email and password.
   */
  fastify.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const db = (request as unknown as { db: DrizzleDatabase }).db;
    const ip = request.ip;

    // Check lockout (persistent in database)
    const lockoutKey = `login:${ip}`;
    const lockoutStatus = await isLockedOut(db, lockoutKey);
    if (lockoutStatus.locked) {
      return reply.status(429).send({
        success: false,
        error: 'Too many failed attempts',
        message: `Account temporarily locked. Try again in ${Math.ceil(lockoutStatus.remainingSeconds / 60)} minutes.`,
        retryAfter: lockoutStatus.remainingSeconds,
      });
    }

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

    // Find user
    const user = await getUserByEmail(db, email);
    if (!user) {
      await recordFailedLoginAttempt(db, lockoutKey);
      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Get account with password
    const account = await getAccountByUserId(db, user.id, 'credential');
    if (!account || !account.password) {
      await recordFailedLoginAttempt(db, lockoutKey);
      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, account.password);
    if (!passwordValid) {
      await recordFailedLoginAttempt(db, lockoutKey);
      return reply.status(401).send({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });
    }

    // Clear failed attempts on successful login
    await clearLoginAttempts(db, lockoutKey);

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
      secure: process.env.NODE_ENV === 'production',
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
      canRegister: needsSetup,
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
      secure: process.env.NODE_ENV === 'production',
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
