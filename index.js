const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

// Enable CORS and parse JSON
app.use(cors());
app.use(bodyParser.json());


const str = 'mongodb+srv://shlpainuly:0TTJx8Z3jQXhNqxQ@tuition.4yy9m.mongodb.net/tuition_management?retryWrites=true&w=majority&appName=tuition';

mongoose.connect(str)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('Could not connect to MongoDB...', err));


// // Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/tuition_management')
//     .then(() => console.log('Connected to MongoDB'))
//     .catch((err) => console.log('Error connecting to MongoDB:', err));

// Create Student Schema and Model
const studentSchema = new mongoose.Schema({
    name: String,
    class: String,
    nextFeeDate: Date,
    feeStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    feeAmount: Number,
});

const Student = mongoose.model('Student', studentSchema);

// Endpoint to get all students
app.get('/api/students', async (req, res) => {
    try {
        const students = await Student.find(); // Fetch all students from DB
        res.json(students);
    } catch (err) {
        console.error('Error retrieving students:', err);
        res.status(500).json({ message: 'Error retrieving students' });
    }
});

// Endpoint to update the fee status of a student
app.post('/api/update-status', async (req, res) => {
    const { id, feeStatus } = req.body;
    if (!id || !feeStatus) {
        return res.status(400).json({ success: false, message: 'Student ID and fee status are required' });
    }
    try {
        const student = await Student.findById(id);
        if (student) {
            student.feeStatus = feeStatus;
            await student.save(); // Save the updated student
            res.json({ success: true, student });
        } else {
            res.status(404).json({ success: false, message: 'Student not found' });
        }
    } catch (err) {
        console.error('Error updating fee status:', err);
        res.status(500).json({ success: false, message: 'Error updating fee status' });
    }
});

// Endpoint to add a new student
app.post('/api/add-student', async (req, res) => {
    const { name, studentClass, nextFeeDate, feeAmount } = req.body;
    if (!name || !studentClass || !nextFeeDate || !feeAmount) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        const newStudent = new Student({
            name,
            class: studentClass,
            nextFeeDate: new Date(nextFeeDate),
            feeAmount,
        });
        await newStudent.save(); // Save the new student to DB
        res.json({ success: true, student: newStudent });  // Send back the added student
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Error adding student', error: err });
    }
});

// Endpoint to update fee amount for a student
app.post('/api/update-fee', async (req, res) => {
    const { id, feeAmount } = req.body;
    if (!id || !feeAmount) {
        return res.status(400).json({ success: false, message: 'Student ID and fee amount are required' });
    }

    try {
        const student = await Student.findById(id);
        if (student) {
            student.feeAmount = feeAmount;
            await student.save(); // Save the updated student
            res.json({ success: true, student });
        } else {
            res.status(404).json({ success: false, message: 'Student not found' });
        }
    } catch (err) {
        console.error('Error updating fee amount:', err);
        res.status(500).json({ success: false, message: 'Error updating fee amount' });
    }
});

// Endpoint to remove a student
app.post('/api/remove-student', async (req, res) => {
    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ success: false, message: 'Student ID is required' });
    }
    try {
        const student = await Student.findByIdAndDelete(id); // Remove the student by ID
        if (student) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Student not found' });
        }
    } catch (err) {
        console.error('Error removing student:', err);
        res.status(500).json({ success: false, message: 'Error removing student' });
    }
});



// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
