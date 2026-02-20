import mongoose from "mongoose";
import "dotenv/config";

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('❌ MONGO_URI is not defined in environment variables');
    }

    console.log('🔄 Connecting to MongoDB...');
    console.log('📊 MongoDB URI:', process.env.MONGO_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s
      socketTimeoutMS: 45000, // Close sockets after 45s
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
    
    // Handle connection errors after initial connection
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected');
    });

    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.error("💡 Check if:");
    console.error("   1. MongoDB URI is correct");
    console.error("   2. Network allows connection (whitelist 0.0.0.0/0 in MongoDB Atlas)");
    console.error("   3. Username and password are correct");
    process.exit(1);
  }
};

export default connectDB;