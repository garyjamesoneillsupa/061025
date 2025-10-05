import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'driver';
  isActive: boolean;
}

interface AuthRequest extends Request {
  user?: User;
}

const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
  console.warn('⚠️ Using default JWT secret in development - DO NOT use in production');
  return 'dev-only-jwt-secret-' + Math.random().toString(36).slice(2);
})();
const JWT_EXPIRES_IN = '365d'; // 1 year token for drivers

export class AuthService {
  static generateToken(user: User): string {
    const payload = { 
      id: user.id, 
      username: user.username, 
      role: user.role,
      iat: Math.floor(Date.now() / 1000)
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  static generateSecurePassword(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Middleware to check if user is authenticated
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const user = AuthService.verifyToken(token);
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Middleware to check if user has admin role
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }

  next();
};

// Middleware to check if user has driver role or is admin
export const requireDriver = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role !== 'driver' && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Driver access required' });
  }

  next();
};

// Rate limiting for login attempts
interface LoginAttempt {
  count: number;
  lastAttempt: Date;
  blockedUntil?: Date;
}

const loginAttempts = new Map<string, LoginAttempt>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW = 60 * 1000; // 1 minute

export const rateLimitLogin = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = new Date();
  
  const attempt = loginAttempts.get(ip);
  
  if (attempt) {
    // Check if user is currently blocked
    if (attempt.blockedUntil && now < attempt.blockedUntil) {
      const remainingTime = Math.ceil((attempt.blockedUntil.getTime() - now.getTime()) / 1000);
      return res.status(429).json({ 
        message: `Too many login attempts. Try again in ${remainingTime} seconds.`,
        retryAfter: remainingTime 
      });
    }
    
    // Reset attempts if the window has passed
    if (now.getTime() - attempt.lastAttempt.getTime() > ATTEMPT_WINDOW) {
      loginAttempts.delete(ip);
    } else if (attempt.count >= MAX_LOGIN_ATTEMPTS) {
      // Block the user
      attempt.blockedUntil = new Date(now.getTime() + LOCKOUT_TIME);
      return res.status(429).json({ 
        message: `Too many login attempts. Try again in 15 minutes.`,
        retryAfter: LOCKOUT_TIME / 1000
      });
    }
  }
  
  next();
};

export const recordLoginAttempt = (req: Request, success: boolean) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = new Date();
  
  if (success) {
    // Clear attempts on successful login
    loginAttempts.delete(ip);
  } else {
    // Record failed attempt
    const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: now };
    attempt.count++;
    attempt.lastAttempt = now;
    loginAttempts.set(ip, attempt);
  }
};

// Session security headers
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self';");
  
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  
  next();
};

export { AuthRequest };