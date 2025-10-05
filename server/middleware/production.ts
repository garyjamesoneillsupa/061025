import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// Production rate limiting
export const createRateLimiter = (windowMs: number, max: number, message: string) => 
  rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });

// API rate limiting
export const apiLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // limit each IP to 100 requests per windowMs
  'Too many API requests from this IP, please try again later'
);

// Strict rate limiting for auth endpoints
export const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // limit each IP to 5 requests per windowMs
  'Too many authentication attempts from this IP, please try again later'
);

// File upload rate limiting
export const uploadLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  10, // limit each IP to 10 uploads per windowMs
  'Too many file uploads from this IP, please try again later'
);

// Health check endpoint
export const healthCheck = (req: Request, res: Response) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: process.memoryUsage(),
    database: 'connected', // Could be enhanced with actual DB health check
  };
  
  res.status(200).json(healthData);
};

// Error handling for production
export const productionErrorHandler = (
  error: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  console.error('Production error:', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
  });

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({
      error: 'Internal server error',
      requestId: req.get('x-request-id') || 'unknown',
    });
  } else {
    res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
};

// Request logging for production
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    };
    
    // Log to console or external service
    console.log(JSON.stringify(logData));
  });
  
  next();
};