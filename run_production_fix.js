// run_production_fix.js
// This script runs the production database fix

require('dotenv').config();
const { fixProductionDatabase } = require('./fix_production_database');

console.log('🚀 Starting production database fix...');
console.log('📊 Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

fixProductionDatabase()
  .then(() => {
    console.log('✅ Production database fix completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Production database fix failed:', error);
    process.exit(1);
  });
