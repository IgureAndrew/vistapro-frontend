// src/config/database.js
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Determine which database to use based on environment
const isDevelopment = process.env.NODE_ENV === 'development';
const useLocalDB = process.env.USE_LOCAL_DB === 'true';



let connectionString;

if (isDevelopment && useLocalDB) {
  // Use local database for development
  connectionString = process.env.LOCAL_DATABASE_URL || 'postgresql://localhost:5433/vistapro_dev';
  console.log('🔧 Using LOCAL database for development');
} else {
  // Use production database
  connectionString = process.env.DATABASE_URL;
  console.log('🚀 Using PRODUCTION database');
}

// Create a new PostgreSQL pool using the connection string from the environment.
// Add the SSL configuration to use SSL and disable certificate verification.
const pool = new Pool({
  connectionString: connectionString,
  ssl: isDevelopment && useLocalDB ? false : {
    rejectUnauthorized: false,
  },
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
