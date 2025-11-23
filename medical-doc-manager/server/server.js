/******************************************************************
 * BACKEND SERVER — Medical Document Manager
 ******************************************************************/

// Imports
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

// Load .env
dotenv.config();
console.log("API Key loaded:", process.env.GEMINI_API_KEY ? "✓ Yes" : "✗ No");

// App Setup
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

/******************************************************************
 * DATABASE CONNECTION
 ******************************************************************/
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

/******************************************************************
 * GOOGLE GEMINI AI CLIENT
 ******************************************************************/
const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/******************************************************************
 * SUMMARIZE + SAVE DOCUMENT
 ******************************************************************/
app.post("/summarize", auth, async (req, res) => {
  try {
    const { base64, fileType } = req.body;

    const model = client.getGenerativeModel({ model: "gemini-2.5-pro" });

    const response = await model.generateContent([
      {
        inlineData: { data: base64, mimeType: fileType },
      },
      {
        text: `Provide a concise medical summary...`,
      },
    ]);

    const summary = response.response.text();

    const newDoc = await MedicalDoc.create({
      userId: req.userId,
      name: "Medical Document",
      type: fileType,
      summary,
      uploadedAt: new Date().toLocaleString(),
      fileData: `data:${fileType};base64,${base64}`,
    });

    res.json(newDoc);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to summarize document" });
  }
});

/******************************************************************
 * GET USER DOCUMENTS
 ******************************************************************/
app.get("/documents", auth, async (req, res) => {
  try {
    const docs = await MedicalDoc.find({ userId: req.userId }).sort({ _id: -1 });
    res.json(docs);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

/******************************************************************
 * USER SIGNUP
 ******************************************************************/
app.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(409).json({ error: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashedPassword,
    });

    res.json({ message: "Signup successful!" });
  } catch (error) {
    console.error("Signup Error:", error.message);
    res.status(500).json({ error: "Failed to sign up" });
  }
});

/******************************************************************
 * USER LOGIN
 ******************************************************************/
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({ error: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ error: "Login failed" });
  }
});

/******************************************************************
 * DELETE DOCUMENT
 ******************************************************************/
app.delete("/documents/:id", auth, async (req, res) => {
  try {
    await MedicalDoc.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete" });
  }
});

/******************************************************************
 * START SERVER
 ******************************************************************/
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
