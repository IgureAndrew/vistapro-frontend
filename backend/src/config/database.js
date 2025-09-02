// src/config/database.js
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Force local database for development
const isDevelopment = true;
const useLocalDB = true;

let connectionString;

// Always use local database for now
connectionString = 'postgresql://vistapro_user:vistapro_password@localhost:5433/vistapro_dev';
console.log('🔧 Using LOCAL database for development');

// Create a new PostgreSQL pool using the connection string from the environment.
// SSL disabled for local development
const pool = new Pool({
  connectionString: connectionString,
  ssl: false, // Disable SSL for local development
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
