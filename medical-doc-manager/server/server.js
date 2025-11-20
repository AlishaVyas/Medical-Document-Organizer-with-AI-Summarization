/******************************************************************
 * 🌟 MEDICAL DOCUMENT MANAGER — BACKEND SERVER
 * Features:
 * - Connects to MongoDB
 * - Uses Google Gemini AI for document summarization
 * - Saves uploaded medical files + summaries
 * - Fetches saved documents
 ******************************************************************/

// 📦 Imports
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { GoogleGenerativeAI } from "@google/generative-ai";
import MedicalDoc from "./models/MedicalDoc.js";
import User from "./models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import auth from "./middleware/auth.js";




// 🔐 Load Environment Variables
dotenv.config();
console.log("API Key loaded:", process.env.GEMINI_API_KEY ? "✓ Yes" : "✗ No");

// 🚀 Initialize Express App
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" })); // Support large PDFs/images

/******************************************************************
 * 📡 DATABASE: MongoDB Connection
 ******************************************************************/
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

/******************************************************************
 * 🧠 GOOGLE GEMINI AI CLIENT
 ******************************************************************/
const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/******************************************************************
 * 📝 ROUTE: Summarize & Save Document
 ******************************************************************/
app.post("/summarize", auth, async (req, res) => {
  try {
    const { base64, fileType } = req.body;

    if (!base64 || !fileType)
      return res.status(400).json({ error: "Missing file data" });

    if (!process.env.GEMINI_API_KEY)
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });

    const model = client.getGenerativeModel({ model: "gemini-2.5-pro" });

    const response = await model.generateContent([
      {
        inlineData: { data: base64, mimeType: fileType },
      },
      {
        text: `Provide a concise medical summary:
1️⃣ Patient details (if visible)
2️⃣ Key diagnoses & findings
3️⃣ Treatments or medications
4️⃣ Follow-up instructions if mentioned`,
      },
    ]);

    const summary = response.response.text();

    // 📌 Save to MongoDB
    const newDoc = new MedicalDoc({
      userId: req.userId,
      name: "Medical Document",
      type: fileType,
      uploadedAt: new Date().toLocaleString(),
      summary,
      fileData: `data:${fileType};base64,${base64}`,
    });

    await newDoc.save();
    res.json(newDoc);

  } catch (error) {
    console.error("Detailed Error:", error.message);
    console.error("Full Error:", error);
    res.status(500).json({ error: "Failed to summarize & save document" });
  }
});

/******************************************************************
 * 📂 ROUTE: Fetch All Stored Documents
 ******************************************************************/
app.get("/documents",auth, async (req, res) => {
  try {
    const docs = await MedicalDoc.find({ userId: req.userId }).sort({ _id: -1 });
    res.json(docs);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});


// User Signup Route
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.json({ message: "Signup successful!" });
  } catch (error) {
    console.error("Signup Error:", error.message);
    res.status(500).json({ error: "Failed to sign up" });
  }
});

// User Login Route
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // JWT Token Create
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ error: "Login failed" });
  }
});


/******************************************************************
 * 🏁 START SERVER
 ******************************************************************/
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
