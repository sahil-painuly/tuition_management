// Global Variables
const API_BASE_URL = "https://tuition-management.onrender.com/api";
let students = [];
let stats = {
    totalStudents: 0,
    feesCollected: 0,
    pendingFees: 0,
};
const months = [
    { name: "December", value: "12" },
    { name: "January", value: "01" },
    { name: "February", value: "02" },
    { name: "March", value: "03" },
    { name: "April", value: "04" },
    { name: "May", value: "05" },
];
const currentMonth = new Date().getMonth() + 1; // 1-based month

// Password Protection
const verifyPassword = () => {
    const correctPassword = "admin123";
    const userInput = prompt("Enter the password to access this website:");
    if (!userInput || userInput !== correctPassword) {
        alert("Incorrect password!");
        document.body.innerHTML = "";
        window.location.href = "https://www.google.com";
        return false;
    }
    return true;
};

// Fetch Data from Backend
const fetchData = async (endpoint) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${endpoint}`);
        if (!response.ok) throw new Error("Network response was not ok");
        return await response.json();
    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to fetch data. Please try again later.");
        return [];
    }
};

// Update Stats
const updateStats = () => {
    stats.totalStudents = students.length;
    stats.feesCollected = students
        .filter((student) => student.feeStatus === "Paid")
        .reduce((sum, student) => sum + student.feeAmount, 0);
    stats.pendingFees = students
        .filter((student) => student.feeStatus === "Pending")
        .reduce((sum, student) => sum + student.feeAmount, 0);

    document.getElementById("total-students").textContent = stats.totalStudents;
    document.getElementById("fees-collected").textContent = `₹${stats.feesCollected}`;
    document.getElementById("pending-fees").textContent = `₹${stats.pendingFees}`;
};

const renderStudents = (month) => {
    const studentRecords = document.getElementById("student-records");
    studentRecords.innerHTML = ""; // Clear previous records

    // Filter students whose 'nextFeeDate' month matches the selected month
    const filteredStudents = students.filter(student => {
        const studentMonth = new Date(student.nextFeeDate).getMonth() + 1; // Get the month (1-based)
        return studentMonth === parseInt(month); // Match the month
    });

    filteredStudents.forEach((student) => {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = student.name;
        row.appendChild(nameCell);

        const classCell = document.createElement("td");
        classCell.textContent = student.class || "N/A"; // Default to "N/A" if class is undefined
        row.appendChild(classCell);

        const feeDateCell = document.createElement("td");
        feeDateCell.textContent = new Date(student.nextFeeDate).toLocaleDateString();
        row.appendChild(feeDateCell);

        const statusCell = document.createElement("td");
        statusCell.textContent = student.feeStatus;
        row.appendChild(statusCell);

        const feeAmountCell = document.createElement("td");
        feeAmountCell.textContent = `₹${student.feeAmount}`;
        row.appendChild(feeAmountCell);

        const actionCell = document.createElement("td");
        const toggleBtn = document.createElement("button");
        toggleBtn.textContent = student.feeStatus === "Paid" ? "Unmark Paid" : "Mark Paid";
        toggleBtn.classList.add("btn", student.feeStatus === "Paid" ? "btn-danger" : "btn-success");

        toggleBtn.addEventListener("click", () => {
            markFeePaid(student._id);  // Directly call the markFeePaid function with the student ID
        });

        actionCell.appendChild(toggleBtn);
        row.appendChild(actionCell);

        studentRecords.appendChild(row);
    });
};

// Add New Student
const addStudent = async () => {
    const name = prompt("Enter student name:");
    const studentClass = prompt("Enter student class:");
    const nextFeeDate = prompt("Enter next fee date (YYYY-MM-DD):");
    const feeAmount = parseFloat(prompt("Enter fee amount:"));

    const nextFeeDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!name || !studentClass || !nextFeeDate || isNaN(feeAmount) || !nextFeeDateRegex.test(nextFeeDate)) {
        alert("All fields are required, and the date must be in YYYY-MM-DD format!");
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/add-student`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, studentClass, nextFeeDate, feeAmount }),
        });
        if (!response.ok) throw new Error("Failed to add student");

        const newStudent = await response.json();
        students.push(newStudent); // Update the local students array
        alert("Student added successfully!");
        updateStats(); // Update stats and re-render table
        renderStudents(currentMonth);
    } catch (error) {
        console.error("Error adding student:", error);
        alert("Failed to add student. Please try again.");
    }
};

// Mark Fee as Paid
const markFeePaid = async (studentId) => {
    const student = students.find(student => student._id === studentId); // Get the student by ID
    const newFeeStatus = student.feeStatus === "Paid" ? "Pending" : "Paid"; // Toggle the status

    try {
        const response = await fetch(`${API_BASE_URL}/update-status`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                id: studentId,
                feeStatus: newFeeStatus,
            }),
        });

        const data = await response.json();
        if (data.success) {
            alert(`Fee status updated to ${newFeeStatus} successfully!`);
            // Refresh the student data and re-render
            students = await fetchData("students");
            updateStats();
            renderStudents(currentMonth);  // Ensure updated student list
        } else {
            alert("Error updating fee status: " + data.message);
        }
    } catch (error) {
        console.error("Error updating fee status:", error);
        alert("Failed to update fee status. Please try again later.");
    }
};

// Populate Month Dropdown
const populateMonthDropdown = () => {
    const monthSelect = document.getElementById("month-select");
    months.forEach((month) => {
        const option = document.createElement("option");
        option.value = month.value;
        option.textContent = month.name;
        if (month.value === String(currentMonth).padStart(2, "0")) option.selected = true;
        monthSelect.appendChild(option);
    });

    monthSelect.addEventListener("change", async (e) => {
        const selectedMonth = e.target.value;
        await updateStatsForMonth(selectedMonth); // Update stats
        renderStudents(selectedMonth); // Render students for the selected month
    });
};

// Function to update stats based on selected month
const updateStatsForMonth = async (month) => {
    // Filter students by month
    const filteredStudents = students.filter(student => {
        const studentMonth = new Date(student.nextFeeDate).getMonth() + 1; // Get the month (1-based)
        return studentMonth === parseInt(month); // Match the month
    });

    // Update stats
    const totalStudents = filteredStudents.length;
    const feesCollected = filteredStudents
        .filter((student) => student.feeStatus === "Paid")
        .reduce((sum, student) => sum + student.feeAmount, 0);
    const pendingFees = filteredStudents
        .filter((student) => student.feeStatus === "Pending")
        .reduce((sum, student) => sum + student.feeAmount, 0);

    document.getElementById("total-students").textContent = totalStudents;
    document.getElementById("fees-collected").textContent = `₹${feesCollected}`;
    document.getElementById("pending-fees").textContent = `₹${pendingFees}`;
};

// Initialize Dashboard
const initDashboard = async () => {
    if (!verifyPassword()) return;

    populateMonthDropdown();

    // Fetch and display student data
    students = await fetchData("students");
    updateStats();
    renderStudents(currentMonth);

    // Attach Event Listeners
    document.getElementById("add-new-student-btn").addEventListener("click", addStudent);
    document.getElementById("logout-btn").addEventListener("click", () => {
        alert("Logging out...");
        window.location.href = "index.html";
    });
};

// Start the Dashboard
document.addEventListener("DOMContentLoaded", initDashboard);
