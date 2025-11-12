import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import { app, server } from "./lib/socket.js";

dotenv.config();

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

const port = process.env.PORT || 3000;

import authRoute from "./routes/authRoute.js";
import messageRoute from "./routes/messageRoute.js";

app.use("/api/auth", authRoute);
app.use("/api/message", messageRoute);

// Root route
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to ChatApp API",
    endpoints: {
      auth: "/api/auth",
      message: "/api/message"
    }
  });
});

// MongoDB connection with better error handling
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGODB_URL;
    
    if (!mongoURI) {
      console.error("❌ MongoDB connection string not found!");
      console.error("Please set MONGODB_URI or MONGODB_URL in your .env file");
      process.exit(1);
    }

    // MongoDB connection (modern mongoose doesn't need these options)
    const conn = await mongoose.connect(mongoURI);
    
    console.log(`✅ MongoDB connected successfully: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Start server after successful connection
    server.listen(port, () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  } catch (error) {
    console.error("❌ MongoDB connection error:");
    
    // Provide specific error messages
    if (error.message.includes("authentication failed")) {
      console.error("🔐 Authentication failed!");
      console.error("Possible issues:");
      console.error("  1. Incorrect username or password");
      console.error("  2. Special characters in password need to be URL encoded");
      console.error("  3. User doesn't have proper permissions");
      console.error("\n💡 Tips:");
      console.error("  - If your password contains special characters (@, #, $, etc.),");
      console.error("    URL encode them in the connection string");
      console.error("  - Example: @ becomes %40, # becomes %23");
      console.error("  - Or use MongoDB Atlas connection string from your cluster");
    } else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
      console.error("🌐 Network connection failed!");
      console.error("Possible issues:");
      console.error("  1. Incorrect hostname or IP address");
      console.error("  2. MongoDB server is not running");
      console.error("  3. Firewall blocking the connection");
      console.error("  4. Incorrect port number");
    } else if (error.message.includes("querySrv")) {
      console.error("🔍 DNS query failed!");
      console.error("Possible issues:");
      console.error("  1. Incorrect MongoDB Atlas connection string");
      console.error("  2. Network connectivity issues");
    } else {
      console.error(`   ${error.message}`);
    }
    
    console.error("\n📝 Connection string format should be:");
    console.error("   mongodb://username:password@host:port/database");
    console.error("   OR for MongoDB Atlas:");
    console.error("   mongodb+srv://username:password@cluster.mongodb.net/database");
    
    process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on("disconnected", () => {
  console.log("⚠️  MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB connection error:", err.message);
});

// Connect to database
connectDB();