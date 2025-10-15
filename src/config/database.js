// src/config/database.js
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Check if we're in production or development
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = !isProduction;

let connectionString;

if (isProduction) {
  // Production: Use DATABASE_URL from environment
  connectionString = process.env.DATABASE_URL;
  console.log('🔧 Using PRODUCTION database');
} else {
  // Development: Use individual environment variables or defaults
  const dbUser = process.env.DB_USER || 'vistapro_user';
  const dbPassword = process.env.DB_PASSWORD || 'vistapro_password';
  const dbHost = process.env.DB_HOST || 'localhost';
  const dbPort = process.env.DB_PORT || '5433';
  const dbName = process.env.DB_NAME || 'vistapro_dev';
  
  connectionString = `postgresql://${dbUser}:${dbPassword}@${dbHost}:${dbPort}/${dbName}`;
  console.log('🔧 Using LOCAL database for development');
}

// Create a new PostgreSQL pool using the connection string from the environment
const pool = new Pool({
  connectionString: connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false, // Enable SSL for production
});

/**
 * connectDB - Connects to the PostgreSQL database.
 * @returns {Promise} Resolves if the connection is successful, otherwise throws an error.
 */
const connectDB = async () => {
  try {
    // Test the connection by acquiring a client from the pool
    await pool.connect();
    console.log("✅ Connected to PostgreSQL database");
  } catch (err) {
    console.error("❌ Database connection error:", err);
    throw err;
  }
};

module.exports = { pool, connectDB };
