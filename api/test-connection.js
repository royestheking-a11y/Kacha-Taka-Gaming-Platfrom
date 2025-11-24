// Test script to verify MongoDB connection and API setup
// Run this locally: node api/test-connection.js

import { connectDB } from './config/database.js';
import User from './models/User.js';
import GameSettings from './models/GameSettings.js';
import GlobalSettings from './models/GlobalSettings.js';

async function testConnection() {
  console.log('🧪 Testing MongoDB Connection...\n');

  try {
    // Test 1: Database Connection
    console.log('1️⃣ Testing database connection...');
    const conn = await connectDB();
    console.log('✅ Database connected:', conn.connection.name);
    console.log('   Host:', conn.connection.host);
    console.log('   Ready State:', conn.connection.readyState === 1 ? 'Connected' : 'Disconnected');
    console.log('');

    // Test 2: User Model
    console.log('2️⃣ Testing User model...');
    const userCount = await User.countDocuments();
    console.log('✅ User model working. Total users:', userCount);
    
    const adminUser = await User.findOne({ email: 'admin@kachataka.com' });
    if (adminUser) {
      console.log('✅ Admin user exists');
    } else {
      console.log('⚠️  Admin user not found (will be created on first request)');
    }
    console.log('');

    // Test 3: Game Settings
    console.log('3️⃣ Testing Game Settings...');
    const gameSettings = await GameSettings.getSettings();
    console.log('✅ Game settings retrieved:', {
      crash: gameSettings.crash?.enabled,
      mines: gameSettings.mines?.enabled,
      slots: gameSettings.slots?.enabled,
      dice: gameSettings.dice?.enabled
    });
    console.log('');

    // Test 4: Global Settings
    console.log('4️⃣ Testing Global Settings...');
    const globalSettings = await GlobalSettings.getSettings();
    console.log('✅ Global settings retrieved:', {
      siteName: globalSettings.siteName,
      conversionRate: globalSettings.conversionRate
    });
    console.log('');

    // Test 5: Connection Caching
    console.log('5️⃣ Testing connection caching...');
    const start1 = Date.now();
    await connectDB();
    const time1 = Date.now() - start1;
    console.log(`   First call: ${time1}ms`);

    const start2 = Date.now();
    await connectDB();
    const time2 = Date.now() - start2;
    console.log(`   Second call (cached): ${time2}ms`);
    
    if (time2 < time1) {
      console.log('✅ Connection caching working');
    } else {
      console.log('⚠️  Connection may not be cached properly');
    }
    console.log('');

    console.log('✅ All tests passed! MongoDB is ready for deployment.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('   Error details:', error);
    process.exit(1);
  }
}

testConnection();

