
import dotenv from "dotenv";
import connectDB from "./configs/db.js";
import User from "./models/User.js";

dotenv.config();

const seedUser = async () => {
  await connectDB();

  await User.create({
    _id: "test123",
    email: "test@example.com",
    name: "Test User",
    image: "https://example.com/image.png",
  });

  console.log("✅ Test user inserted into QuickShow.users");
  process.exit(); // close script
};

seedUser();
