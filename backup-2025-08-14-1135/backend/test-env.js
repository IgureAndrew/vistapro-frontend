require('dotenv').config();

console.log('🔍 Environment Variables Test:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('USE_LOCAL_DB:', process.env.USE_LOCAL_DB);
console.log('LOCAL_DATABASE_URL:', process.env.LOCAL_DATABASE_URL);
console.log('PORT:', process.env.PORT);
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
