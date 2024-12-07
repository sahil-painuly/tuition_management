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

// Render Students (Filter by month)
const renderStudents = (month, isFilterApplied = false) => {
    const studentRecords = document.getElementById("student-records");
    studentRecords.innerHTML = ""; // Clear previous records

    // Filter students by selected month
    const filteredStudents = students.filter(student => {
        const studentMonth = new Date(student.nextFeeDate).getMonth() + 1; // Get the month (1-based)
        return studentMonth === parseInt(month); // Match the month
    });

    // If filter is applied, show success alert
    if (isFilterApplied) {
        alert("Filter applied successfully!");
    }

    filteredStudents.forEach((student) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.class || "N/A"}</td>
            <td>${new Date(student.nextFeeDate).toLocaleDateString()}</td>
            <td>${student.feeStatus}</td>
            <td>₹${student.feeAmount}</td>
            <td>
                <button class="btn btn-custom ${
                    student.feeStatus === "Paid" ? "btn-danger" : "btn-success"
                }" onclick="markFeePaid('${student._id}')">
                    ${student.feeStatus === "Paid" ? "Unmark Paid" : "Mark Paid"}
                </button>
            </td>
        `;

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
        students.push(newStudent);
        alert("Student added successfully!");
        updateStats();
        renderStudents(currentMonth); // Render updated data
    } catch (error) {
        console.error("Error adding student:", error);
        alert("Failed to add student. Please try again.");
    }
};

// Mark Fee as Paid
const markFeePaid = async (studentId) => {
    const student = students.find(student => student._id === studentId);
    const newFeeStatus = student.feeStatus === "Paid" ? "Pending" : "Paid";

    try {
        const response = await fetch(`${API_BASE_URL}/update-status`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: studentId, feeStatus: newFeeStatus }),
        });

        const data = await response.json();
        if (data.success) {
            alert(`Fee status updated to ${newFeeStatus} successfully!`);
            students = await fetchData("students"); // Refresh data
            updateStats();
            renderStudents(currentMonth); // Render updated data
        } else {
            alert("Error updating fee status: " + data.message);
        }
    } catch (error) {
        console.error("Error updating fee status:", error);
        alert("Failed to update fee status. Please try again later.");
    }
};

// Populate Month Dropdown and Handle Filter Change
const populateMonthDropdown = () => {
    const monthSelect = document.getElementById("month-select");
    months.forEach((month) => {
        const option = document.createElement("option");
        option.value = month.value;
        option.textContent = month.name;
        if (month.value === String(currentMonth).padStart(2, "0")) option.selected = true;
        monthSelect.appendChild(option);
    });

    // Add event listener to the Apply Filter button
    document.getElementById("apply-filter-btn").addEventListener("click", () => {
        const selectedMonth = monthSelect.value; // Get selected month
        alert("Filter applied successfully!"); // This alert will trigger after applying the filter
        renderStudents(selectedMonth, true); // Render students for the selected month and show success alert
    });
};

// Update Stats for Filtered Month
const updateStatsForMonth = (month) => {
    const filteredStudents = students.filter(student => {
        const studentMonth = new Date(student.nextFeeDate).getMonth() + 1;
        return studentMonth === parseInt(month);
    });

    stats.totalStudents = filteredStudents.length;
    stats.feesCollected = filteredStudents
        .filter(student => student.feeStatus === "Paid")
        .reduce((sum, student) => sum + student.feeAmount, 0);
    stats.pendingFees = filteredStudents
        .filter(student => student.feeStatus === "Pending")
        .reduce((sum, student) => sum + student.feeAmount, 0);

    document.getElementById("total-students").textContent = stats.totalStudents;
    document.getElementById("fees-collected").textContent = `₹${stats.feesCollected}`;
    document.getElementById("pending-fees").textContent = `₹${stats.pendingFees}`;
};

// Initialize Dashboard
const initDashboard = async () => {
    if (!verifyPassword()) return;

    populateMonthDropdown(); // Populate month dropdown

    students = await fetchData("students");
    updateStats(); // Update overall stats
    renderStudents(currentMonth); // Render students for current month

    document.getElementById("add-new-student-btn").addEventListener("click", addStudent); // Add new student functionality
};

// Start the Dashboard
document.addEventListener("DOMContentLoaded", initDashboard);
