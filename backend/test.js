import mongoose from "mongoose";

const testSchema = new mongoose.Schema({
  name: String
});

export default mongoose.model("Test", testSchema);
