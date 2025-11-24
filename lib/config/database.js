import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://kachatakaorg_db_user:DDFwm3r3SSNo6vgh@kachataka.gvwrrey.mongodb.net/kachataka?retryWrites=true&w=majority';

// Cache connection for serverless
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  // If already connected, return cached connection
  if (cached.conn) {
    console.log('[DB] Using cached connection');
    console.log('[DB] Connection state:', mongoose.connection.readyState);
    console.log('[DB] Database name:', mongoose.connection.db?.databaseName);
    return cached.conn;
  }

  // If connection is in progress, wait for it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    console.log('[DB] Connecting to MongoDB...');
    console.log('[DB] URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials
    
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB Connected');
      console.log('[DB] Connection state:', mongoose.connection.readyState);
      console.log('[DB] Database name:', mongoose.connection.db?.databaseName);
      console.log('[DB] Host:', mongoose.connection.host);
      console.log('[DB] Port:', mongoose.connection.port);
      
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
    console.log('[DB] Connection established');
  } catch (e) {
    console.error('[DB] Connection error:', e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
};

export default connectDB;

