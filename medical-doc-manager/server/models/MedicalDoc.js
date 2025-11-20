import mongoose from "mongoose";

const MedicalDocSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: String,
  type: String,
  fileData: String,
  summary: String,
  uploadedAt: String,
});


export default mongoose.model("MedicalDoc", MedicalDocSchema);
