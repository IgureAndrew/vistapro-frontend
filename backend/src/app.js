// src/app.js
require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const helmet        = require('helmet');
const rateLimit     = require('express-rate-limit');
const session       = require('express-session');
const path          = require('path');
// Redis temporarily disabled for local development

// Import startup migration
const runStartupMigration = require('../startup_migration');

// ——— Express app
const app = express();
app.set('trust proxy', 1);

// ——— Rate limiter
app.use(rateLimit({
  windowMs: 15*60*1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  message: "Too many requests, please try again later."
}));

// ——— Body parsing with increased limits for Base64 images
app.use(express.json({ limit: '10mb' })); // Increased from default 100kb to 10mb
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ——— CORS
const allowedOrigins = [
  "https://vistapro-4xlusoclj-vistapros-projects.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://www.vistapro.ng",
  "https://vistapro.ng"
];

// Handle preflight requests manually
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (!origin || allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.status(200).end();
  } else {
    res.status(403).end();
  }
});

// Comprehensive CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    console.log('🌐 CORS request from origin:', origin);
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('✅ Allowing request with no origin');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin allowed:', origin);
      return callback(null, true);
    }
    
    console.log('❌ Origin blocked:', origin);
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'Accept', 
    'Origin', 
    'Referer',
    'Cache-Control',
    'Pragma'
  ],
  exposedHeaders: [
    'Content-Length', 
    'Content-Type', 
    'Date', 
    'Server', 
    'Transfer-Encoding',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining'
  ],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// ——— Security headers
app.use(helmet());

// ——— Session store (using memory store for local development)
// TODO: Re-enable Redis for production
app.use(session({
  secret: process.env.SESSION_SECRET || 'local-dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Disable secure for local development
    httpOnly: true,
    sameSite: 'lax'
  }
}));

// ——— Socket.IO will be attached by server.js

// ——— Jobs & cron
require('./jobs/releaseWithheld');
require('./jobs/expireStockPickups');
require('./jobs/refreshSummary');


// ——— Static file serving for uploads with comprehensive CORS headers
app.use('/uploads', (req, res, next) => {
  console.log('🔍 Static file request:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer
  });
  
  // Always set CORS headers for static files
  const origin = req.headers.origin;
  
  // Set CORS headers
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Referer');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type, Date, Server, Transfer-Encoding');
  
  // Additional headers to prevent caching issues
  res.header('Cache-Control', 'public, max-age=3600');
  res.header('Vary', 'Origin');
  
  console.log('✅ CORS headers set for origin:', origin);
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('🔄 Handling preflight request');
    return res.status(200).end();
  }
  
  next();
}, express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res, path, stat) => {
    // Ensure CORS headers are set on the actual file response
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Referer');
    res.set('Access-Control-Allow-Credentials', 'true');
    console.log('📁 Static file served with CORS headers:', path);
  }
}));

// ——— Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend is running' });
});

// ——— Disable client caching on all /api routes
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.removeHeader('ETag');
  next();
});

// ——— Mount your routes
app.use('/api/auth',           require('./routes/authRoutes'));
// MasterAdmin routes with specific CORS handling
app.use('/api/master-admin', (req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin) || !origin) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Referer');
    res.header('Access-Control-Allow-Credentials', 'true');
    console.log('🔧 MasterAdmin CORS headers set for:', origin, req.url);
  }
  next();
}, require('./routes/masterAdminRoutes'));
app.use('/api/wallets/master-admin', require('./routes/masterAdminWalletRoutes'));
app.use('/api/super-admin',    require('./routes/superAdminRoutes'));
app.use('/api/admin',          require('./routes/adminRoutes'));
app.use('/api/dealer',         require('./routes/dealerRoutes'));
app.use('/api/dealer/orders',  require('./routes/dealerOrderRoutes'));
app.use('/api/marketer',       require('./routes/marketerRoutes'));
app.use('/api/outlet',         require('./routes/outletRoutes'));
app.use('/api/products',       require('./routes/productRoutes'));
app.use('/api/manage-orders',  require('./routes/manageOrderRoutes'));
app.use('/api/profit-report',  require('./routes/profitReportRoutes'));
app.use('/api/performance',    require('./routes/performanceRoutes'));
app.use('/api/assignments',    require('./routes/assignmentRoutes'));
app.use('/api/target-management', require('./routes/targetManagementRoutes'));
app.use('/api/stock',          require('./routes/stockupdateRoutes'));
app.use('/api/verification',   require('./routes/verificationRoutes'));
// app.use('/api/verification-workflow', require('./routes/verificationWorkflowRoutes')); // DISABLED - conflicting with main verification system
app.use('/api/notifications',  require('./routes/notificationRoutes'));
app.use('/api/wallets',        require('./routes/walletRoutes'));
app.use('/api/messages',       require('./routes/messageRoutes'));
app.use('/api/targets',        require('./routes/targetRoutes'));
app.use('/api/messaging',      require('./routes/messagingRoutes'));
app.use('/api/migration',      require('./routes/migrationRoutes'));

// ——— Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// ——— Error handler
app.use(require('./middlewares/errorHandler'));

module.exports = app;
