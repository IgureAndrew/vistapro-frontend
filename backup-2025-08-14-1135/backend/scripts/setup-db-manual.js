const { Pool } = require('pg');
require('dotenv').config();

async function setupDatabase() {
  console.log('🚀 Setting up database manually...');
  
  const pool = new Pool({
    host: 'localhost',
    port: 5433,
    user: 'vistapro_user',
    password: 'vistapro_password',
    database: 'vistapro_dev',
    ssl: false
  });

  try {
    // Create basic tables
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        is_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock_quantity INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        total_amount DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        balance DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await pool.query(table);
      console.log('✅ Table created successfully');
    }

    // Insert some sample data
    const sampleData = [
      `INSERT INTO users (email, password, role, is_verified) VALUES 
        ('admin@vistapro.com', '$2b$10$dummyhash', 'admin', true),
        ('user@vistapro.com', '$2b$10$dummyhash', 'user', true)
      ON CONFLICT (email) DO NOTHING`,
      
      `INSERT INTO products (name, description, price, stock_quantity) VALUES 
        ('Sample Product 1', 'This is a sample product', 99.99, 100),
        ('Sample Product 2', 'Another sample product', 149.99, 50)
      ON CONFLICT DO NOTHING`
    ];

    for (const data of sampleData) {
      await pool.query(data);
      console.log('✅ Sample data inserted');
    }

    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await pool.end();
  }
}

setupDatabase();
