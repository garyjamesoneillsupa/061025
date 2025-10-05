import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Rate limiting configurations
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Much higher limit for general requests (10k per 15 min)
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip static assets and frontend resources
  skip: (req) => {
    const path = req.path;
    return path.includes('.js') || 
           path.includes('.css') || 
           path.includes('.map') || 
           path.includes('.ico') ||
           path.includes('.png') ||
           path.includes('.svg') ||
           path.includes('@') ||
           path.startsWith('/assets');
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increase auth attempts (20 per 15 min)
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // Much higher for API requests (1000 per minute)
  message: 'API rate limit exceeded, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  // Only apply to actual API endpoints
  skip: (req) => !req.path.startsWith('/api')
});

// Input validation middleware
export function validateInput(allowedFields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      // Remove any fields not in allowedFields
      const sanitizedBody: any = {};
      
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          sanitizedBody[field] = req.body[field];
        }
      }
      
      req.body = sanitizedBody;
    }
    
    next();
  };
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Strict transport security (HTTPS only)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy - Production-ready
  const isProduction = process.env.NODE_ENV === 'production';
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    isProduction 
      ? "script-src 'self'" // No unsafe-inline/unsafe-eval in production
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow for development
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    "connect-src 'self' https://api.postcodes.io https://maps.googleapis.com",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; '));
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
}

// Request validation with improved limits
export function validateRequestSize(req: Request, res: Response, next: NextFunction) {
  const contentLength = req.get('Content-Length');
  
  // Different limits for different endpoints
  const maxSize = req.path.includes('/upload') || req.path.includes('/photo')
    ? 50 * 1024 * 1024  // 50MB for file uploads
    : 10 * 1024 * 1024; // 10MB for other requests
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return res.status(413).json({ 
      error: 'Request entity too large',
      maxSize: `${Math.floor(maxSize / (1024 * 1024))}MB`
    });
  }
  
  next();
}

// Enhanced input sanitization
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Enhanced SQL injection prevention
    return input
      .replace(/['";\\]/g, '') // Remove quotes and backslashes
      .replace(/--.*$/gm, '')   // Remove SQL comments
      .replace(/\/\*.*?\*\//g, '') // Remove block comments
      .replace(/\b(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b/gi, '') // Remove SQL keywords
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      // Sanitize keys as well
      const cleanKey = typeof key === 'string' ? key.replace(/[^a-zA-Z0-9_]/g, '') : key;
      sanitized[cleanKey] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// Enhanced logging for security events
export function securityLogger(event: string, details: any, req: Request) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    url: req.url,
    method: req.method,
  };
  
  console.log('🔒 Security Event:', JSON.stringify(logEntry));
  
  // In production, you might want to send this to a security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Log to external security monitoring service
  }
}