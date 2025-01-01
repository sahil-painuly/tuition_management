const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();

// Enable CORS and JSON Parsing
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection string
const mongoURI =
  "mongodb+srv://shlpainuly:0TTJx8Z3jQXhNqxQ@tuition.4yy9m.mongodb.net/tuition_management?retryWrites=true&w=majority&appName=tuition";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("Could not connect to MongoDB...", err));

// Serve static files for the frontend
app.use(express.static(path.join(__dirname, "public")));

// Root route serves index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// MongoDB Student Schema and Model
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  class: { type: String, required: true },
  nextFeeDate: { type: Date, required: true },
  feeStatus: { type: String, enum: ["Pending", "Paid"], default: "Pending" },
  feeAmount: { type: Number, required: true },
});

const Student = mongoose.model("Student", studentSchema);

// API Endpoints

// Get all students with optional month filtering
app.get("/api/students", async (req, res) => {
  const { month } = req.query;

  try {
    let query = {};

    if (month) {
      const startDate = new Date(`${new Date().getFullYear()}-${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(startDate.getMonth() + 1);
      query.nextFeeDate = { $gte: startDate, $lt: endDate };
    }

    const students = await Student.find(query);
    res.json(students);
  } catch (err) {
    console.error("Error retrieving students:", err);
    res.status(500).json({ message: "Error retrieving students" });
  }
});

// Add a new student
app.post("/api/add-student", async (req, res) => {
  const { name, studentClass, nextFeeDate, feeAmount } = req.body;

  if (!name || !studentClass || !nextFeeDate || !feeAmount) {
    return res
      .status(400)
      .json({ success: false, message: "All fields are required" });
  }

  try {
    const newStudent = new Student({
      name,
      class: studentClass,
      nextFeeDate: new Date(nextFeeDate),
      feeAmount,
    });
    await newStudent.save();
    res.status(201).json({ success: true, student: newStudent });
  } catch (err) {
    console.error("Error adding student:", err);
    res
      .status(500)
      .json({ success: false, message: "Error adding student", error: err });
  }
});

// Update student fee status
app.post("/api/update-status", async (req, res) => {
  const { id, feeStatus } = req.body;

  if (!id || !feeStatus) {
    return res
      .status(400)
      .json({ success: false, message: "Student ID and fee status are required" });
  }

  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      { feeStatus },
      { new: true }
    );

    if (!updatedStudent) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, student: updatedStudent });
  } catch (err) {
    console.error("Error updating fee status:", err);
    res
      .status(500)
      .json({ success: false, message: "Error updating fee status", error: err });
  }
});

// Filter students by next fee month (Optional)
app.get("/api/students-by-month", async (req, res) => {
  const { month } = req.query;

  if (!month || !/^\d{2}$/.test(month)) {
    return res
      .status(400)
      .json({ success: false, message: "Valid month (MM) is required" });
  }

  try {
    const startDate = new Date(`${new Date().getFullYear()}-${month}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(startDate.getMonth() + 1);

    const students = await Student.find({
      nextFeeDate: { $gte: startDate, $lt: endDate },
    });
    res.json(students);
  } catch (err) {
    console.error("Error filtering students by month:", err);
    res
      .status(500)
      .json({ message: "Error filtering students by month", error: err });
  }
});

// Handle unknown API routes
app.use((req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
