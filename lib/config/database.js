import mongoose from 'mongoose';

// Parse connection string to ensure database name is correct
let MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kachatakaorg_db_user:DDFwm3r3SSNo6vgh@kachataka.gvwrrey.mongodb.net/kachataka?retryWrites=true&w=majority';

// Ensure database name is 'kachataka' in connection string
if (!MONGODB_URI.includes('/kachataka')) {
  // Extract base URI and add database name
  const uriMatch = MONGODB_URI.match(/^(mongodb\+srv:\/\/[^/]+)/);
  if (uriMatch) {
    const baseUri = uriMatch[1];
    const queryString = MONGODB_URI.includes('?') ? MONGODB_URI.split('?')[1] : 'retryWrites=true&w=majority';
    MONGODB_URI = `${baseUri}/kachataka?${queryString}`;
    console.log('[DB] Fixed connection string to use kachataka database');
  }
}

// Cache connection for serverless
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  // If already connected, check if it's the right database
  if (cached.conn) {
    const dbName = mongoose.connection.db?.databaseName;
    console.log('[DB] Using cached connection');
    console.log('[DB] Connection state:', mongoose.connection.readyState);
    console.log('[DB] Database name:', dbName);
    
    // If connected to wrong database, reconnect
    if (dbName !== 'kachataka') {
      console.warn('[DB] Connected to wrong database:', dbName, '- Reconnecting...');
      await mongoose.disconnect();
      cached.conn = null;
      cached.promise = null;
    } else {
      return cached.conn;
    }
  }

  // If connection is in progress, wait for it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      dbName: 'kachataka' // Explicitly set database name
    };

    console.log('[DB] Connecting to MongoDB...');
    console.log('[DB] URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
    console.log('[DB] Target database: kachataka');
    
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      const dbName = mongoose.connection.db?.databaseName;
      console.log('✅ MongoDB Connected');
      console.log('[DB] Connection state:', mongoose.connection.readyState);
      console.log('[DB] Database name:', dbName);
      console.log('[DB] Host:', mongoose.connection.host);
      console.log('[DB] Port:', mongoose.connection.port);
      
      if (dbName !== 'kachataka') {
        console.error('[DB] ERROR: Connected to wrong database! Expected: kachataka, Got:', dbName);
      }
      
      // Verify we can query the database
      mongoose.connection.db.admin().listDatabases().then((databases) => {
        console.log('[DB] Available databases:', databases.databases.map(d => d.name));
      }).catch(err => {
        console.error('[DB] Error listing databases:', err);
      });
      
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    const dbName = mongoose.connection.db?.databaseName;
    console.log('[DB] Connection established to database:', dbName);
    
    if (dbName !== 'kachataka') {
      console.error('[DB] CRITICAL ERROR: Connected to wrong database!');
      console.error('[DB] Expected: kachataka, Actual:', dbName);
    }
  } catch (e) {
    console.error('[DB] Connection error:', e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export default connectDB;

