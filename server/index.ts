import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { registerCollectionRoutes } from "./routes/collection";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// 🔒 PRODUCTION SECURITY: Load production middleware dynamically to avoid module issues
if (process.env.NODE_ENV === 'production') {
  // Dynamic import for production middleware to prevent loading issues
  import("./middleware/security").then(({ securityHeaders, generalLimiter }) => {
    app.use(securityHeaders);
    app.use(generalLimiter);
  }).catch(err => console.warn('Production middleware not loaded:', err));
  
  import("./middleware/production").then(({ requestLogger }) => {
    app.use(requestLogger);
  }).catch(err => console.warn('Production request logger not loaded:', err));
}

// Reasonable limits to prevent DoS attacks - increased for photo-heavy auto-save
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // 🔒 PRODUCTION ENDPOINTS: Health check for production monitoring
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      memory: process.memoryUsage(),
    });
  });
  app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      memory: process.memoryUsage(),
    });
  });

  const server = await registerRoutes(app);
  
  // Initialize Sunday/Monday email scheduling system (GMT timezone)
  // Automation removed - manual admin control preferred
  
  // Collection routes already registered in registerRoutes

  // 🔒 PRODUCTION ERROR HANDLING: Use production-ready error handler
  if (process.env.NODE_ENV === 'production') {
    // Dynamic import for production error handler
    import("./middleware/production").then(({ productionErrorHandler }) => {
      app.use(productionErrorHandler);
    }).catch(err => {
      console.warn('Production error handler not loaded:', err);
      // Fallback error handler
      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        res.status(status).json({ error: 'Internal server error' });
      });
    });
  } else {
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });
  }

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();

