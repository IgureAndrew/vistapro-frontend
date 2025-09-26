// src/app.js
require('dotenv').config();
const express       = require('express');
const cors          = require('cors');
const helmet        = require('helmet');
const rateLimit     = require('express-rate-limit');
const session       = require('express-session');
const path          = require('path');
// Redis temporarily disabled for local development

// ——— Express app
const app = express();
app.set('trust proxy', 1);

// ——— Rate limiter
app.use(rateLimit({
  windowMs: 15*60*1000,
  max: process.env.NODE_ENV === 'development' ? 1000 : 100,
  message: "Too many requests, please try again later."
}));

// ——— Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

app.use(cors({
  origin: (origin, cb) => {
    console.log('CORS request from origin:', origin);
    if (!origin) {
      console.log('No origin header, allowing request');
      return cb(null, true);
    }
    if (allowedOrigins.includes(origin)) {
      console.log('Origin allowed:', origin);
      return cb(null, true);
    }
    console.log('Origin blocked:', origin);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
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


// ——— Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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
app.use('/api/master-admin',   require('./routes/masterAdminRoutes'));
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
app.use('/api/enhanced-verification', require('./routes/enhancedVerificationRoutes'));
// app.use('/api/verification-workflow', require('./routes/verificationWorkflowRoutes')); // DISABLED - conflicting with main verification system
app.use('/api/notifications',  require('./routes/notificationRoutes'));
app.use('/api/wallets',        require('./routes/walletRoutes'));
app.use('/api/messages',       require('./routes/messageRoutes'));
app.use('/api/targets',        require('./routes/targetRoutes'));
app.use('/api/messaging',      require('./routes/messagingRoutes'));

// ——— Error handler
app.use(require('./middlewares/errorHandler'));

module.exports = app;
