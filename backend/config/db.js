import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Check if MONGO_URI is set
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables. Please check your .env file.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected successfully");
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error("❌ MongoDB connection error:", err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn("⚠️ MongoDB disconnected");
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
