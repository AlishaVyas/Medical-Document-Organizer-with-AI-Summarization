import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mongoose from "mongoose";
import MedicalDoc from "./models/MedicalDoc.js";




dotenv.config();

console.log("API Key loaded:", process.env.GEMINI_API_KEY ? "✓ Yes" : "✗ No");

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" })); // allow large PDFs/images


mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB Connected Successfully"))
  .catch((err) => console.error("MongoDB Connection Error:", err));



const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


// Route to handle AI summarization
app.post("/summarize", async (req, res) => {
  try {
    const { base64, fileType } = req.body;

    if (!base64 || !fileType) {
      return res.status(400).json({ error: "Missing file data" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY not configured" });
    }

    const model = client.getGenerativeModel({ model: "gemini-2.5-pro" });

    const response = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType: fileType,
        },
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

    // 👉 NEW: Save to MongoDB
    const newDoc = new MedicalDoc({
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


// Route: Get all saved documents
app.get("/documents", async (req, res) => {
  try {
    const docs = await MedicalDoc.find().sort({ _id: -1 }); // newest first
    res.json(docs);
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});




// Start the backend server
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
