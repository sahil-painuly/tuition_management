// Backend API URL
const API_URL = "https://tuition-management.onrender.com/api/students"; // Update with your backend URL

// Fetch and display all student records
async function fetchAndDisplayStudents() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error("Failed to fetch student records.");
        }
        const students = await response.json();

        // Update stats
        document.getElementById("total-students").textContent = students.length;
        document.getElementById("fees-collected").textContent = `₹${students
            .filter((student) => student.feeStatus === "Paid")
            .reduce((total, student) => total + student.feeAmount, 0)}`;
        document.getElementById("pending-fees").textContent = `₹${students
            .filter((student) => student.feeStatus === "Pending")
            .reduce((total, student) => total + student.feeAmount, 0)}`;

        // Populate student table
        const tableBody = document.getElementById("student-records");
        tableBody.innerHTML = ""; // Clear table

        students.forEach((student) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${student.name}</td>
                <td>${student.class}</td>
                <td>${new Date(student.nextFeeDate).toLocaleDateString()}</td>
                <td>${student.feeStatus}</td>
                <td>₹${student.feeAmount}</td>
                <td>
                    <button onclick="deleteStudent('${student._id}')">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching student records:", error);
        document.body.innerHTML = `<h2>Error loading student records. Please try again later.</h2>`;
    }
}

// Delete a student
async function deleteStudent(studentId) {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
        const response = await fetch(`${API_URL}/remove-student`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id: studentId }),
        });

        if (!response.ok) {
            throw new Error("Failed to delete student.");
        }
        alert("Student deleted successfully.");
        fetchAndDisplayStudents(); // Refresh the table
    } catch (error) {
        console.error("Error deleting student:", error);
        alert("Failed to delete student. Please try again.");
    }
}

// Add new student
document.getElementById("add-new-student-btn").addEventListener("click", async () => {
    const name = prompt("Enter student's name:");
    const studentClass = prompt("Enter student's class:");
    const nextFeeDate = prompt("Enter next fee date (YYYY-MM-DD):");
    const feeAmount = parseFloat(prompt("Enter fee amount:"));

    if (!name || !studentClass || !nextFeeDate || isNaN(feeAmount)) {
        alert("All fields are required!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/add-student`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, studentClass, nextFeeDate, feeAmount }),
        });

        if (!response.ok) {
            throw new Error("Failed to add student.");
        }

        alert("Student added successfully.");
        fetchAndDisplayStudents(); // Refresh the table
    } catch (error) {
        console.error("Error adding student:", error);
        alert("Failed to add student. Please try again.");
    }
});

// Load data on page load
document.addEventListener("DOMContentLoaded", fetchAndDisplayStudents);