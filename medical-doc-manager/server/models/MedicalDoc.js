import mongoose from "mongoose";

const MedicalDocSchema = new mongoose.Schema({
  name: String,
  type: String,
  fileData: String,  // base64 string
  summary: String,
  uploadedAt: String,
});

export default mongoose.model("MedicalDoc", MedicalDocSchema);
