import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import session from "express-session";
// import csrf from "csurf"; // Temporarily disabled for Replit compatibility
import MemoryStore from "memorystore";
import connectPgSimple from "connect-pg-simple";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { validateEnvironmentSecurity, sanitizeErrorForClient } from "./security-check";
import { pool } from "./db";

const app = express();

// Run security validation on startup
try {
  validateEnvironmentSecurity();
} catch (error) {
  console.error('Security validation failed:', error);
  process.exit(1);
}

// Security middleware with comprehensive Firebase-friendly CSP
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", 
        "'unsafe-eval'",
        "https://*.googleapis.com",
        "https://*.google.com", 
        "https://*.gstatic.com",
        "https://www.gstatic.com",
        "https://apis.google.com",
        "https://*.firebaseapp.com",
        "https://firebase.googleapis.com",
        "https://replit.com"
      ],
      connectSrc: [
        "'self'",
        "https://*.googleapis.com",
        "https://*.firebaseapp.com",
        "https://firebase.googleapis.com",
        "https://firestore.googleapis.com",
        "https://identitytoolkit.googleapis.com",
        "https://securetoken.googleapis.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com"
      ],
      imgSrc: ["'self'", "data:", "https://*"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      frameSrc: [
        "https://*.firebaseapp.com",
        "https://*.google.com",
        "https://accounts.google.com"
      ],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.REPLIT_DEV_DOMAIN || '', 
        /\.replit\.app$/,
        'https://dmgine.com',
        'https://www.dmgine.com'
      ].filter(Boolean)
    : ['http://localhost:5173', 'http://localhost:5000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: { 
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 60 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to specific routes
app.use('/api/generate-dm', apiLimiter);
app.use('/api/generate', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Session store configuration
const PgSession = connectPgSimple(session);
const memoryStoreInstance = MemoryStore(session);

const sessionStore = process.env.NODE_ENV === "production"
  ? new PgSession({ 
      pool, // Use existing PostgreSQL pool
      tableName: 'session' // Optional: customize table name
    })
  : new memoryStoreInstance({
      checkPeriod: 86400000 // Prune expired entries every 24h to prevent memory leaks
    });

// Session configuration with environment-appropriate store
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  name: 'dmgine.sid', // Custom session name for security
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  },
  rolling: true // Reset expiration on each request
}));

// CSRF protection completely disabled for Replit environment compatibility
// The session handling in Replit's containerized environment causes issues with csurf
// TODO: Implement alternative security measures like request origin validation

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
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    
    // Sanitize error message for client to prevent information leakage
    const sanitizedMessage = sanitizeErrorForClient(err);
    
    // Log full error on server for debugging (server-side only)
    console.error('Server error:', {
      status,
      message: err.message,
      stack: err.stack,
      url: _req.url,
      method: _req.method
    });

    res.status(status).json({ 
      message: sanitizedMessage,
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
  });

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
    validateEnvironmentSecurity();
    
    // Log session store type for debugging
    log(`Session store: ${process.env.NODE_ENV === 'production' ? 'PostgreSQL' : 'Memory'}`);
    log(`serving on port ${port}`);
  });
})();
