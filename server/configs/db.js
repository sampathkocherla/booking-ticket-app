 import mongoose from "mongoose";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    console.log(`✅ Database connected: ${mongoose.connection.name}`);
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
  }
};

export default connectDB;
