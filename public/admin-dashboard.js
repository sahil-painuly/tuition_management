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

// Render Students (Filter by batch and status)
const renderStudents = (batch, status, month) => {
    const studentRecords = document.getElementById("student-records");
    studentRecords.innerHTML = ""; // Clear previous records

    const filteredStudents = students.filter(student => {
        const studentMonth = new Date(student.nextFeeDate).getMonth() + 1; // Get the month (1-based)
        const isMatchingBatch = batch ? student.studentClass === batch : true;
        const isMatchingStatus = status ? student.feeStatus === status : true;
        const isMatchingMonth = month ? studentMonth === parseInt(month) : true;
        return isMatchingBatch && isMatchingStatus && isMatchingMonth;
    });

    if (filteredStudents.length === 0) {
        studentRecords.innerHTML = "<tr><td colspan='6'>No students found.</td></tr>";
        return;
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
                <button class="btn btn-custom ${student.feeStatus === "Paid" ? "btn-danger" : "btn-success"}" onclick="markFeePaid('${student._id}')">
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

    const nextFeeDateObj = new Date(nextFeeDate);
    if (nextFeeDateObj <= new Date()) {
        alert("The next fee date must be a future date.");
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
        students.push(newStudent.student);
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
            student.feeStatus = newFeeStatus;  // Update local student status
            alert(`Fee status updated to ${newFeeStatus} successfully!`);
            updateStats();
            renderStudents(currentMonth); // Re-render students
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
        renderStudents(null, null, selectedMonth); // Render students for the selected month
    });
};

// Batch and Pending Filter Logic
const setupBatchFilter = () => {
    const batchButtons = document.querySelectorAll(".batch-btn");
    batchButtons.forEach(button => {
        button.addEventListener("click", () => {
            const batch = button.dataset.batch;
            const status = document.querySelector(".status-btn.active")?.dataset.status || null;
            const month = document.getElementById("month-select").value;
            renderStudents(batch, status, month);
        });
    });
};

// Pending Filter Logic
const setupPendingFilter = () => {
    const statusButtons = document.querySelectorAll(".status-btn");
    statusButtons.forEach(button => {
        button.addEventListener("click", () => {
            const status = button.dataset.status;
            const batch = document.querySelector(".batch-btn.active")?.dataset.batch || null;
            const month = document.getElementById("month-select").value;
            renderStudents(batch, status, month);
        });
    });
};

// Initialize Dashboard
const initDashboard = async () => {
    if (!verifyPassword()) return;

    populateMonthDropdown(); // Populate month dropdown
    setupBatchFilter(); // Set up batch filters
    setupPendingFilter(); // Set up pending status filters

    students = await fetchData("students");
    updateStats(); // Update overall stats
    renderStudents(currentMonth); // Render students for current month

    document.getElementById("add-new-student-btn").addEventListener("click", addStudent); // Add new student functionality
};

// Start the Dashboard
document.addEventListener("DOMContentLoaded", initDashboard);
