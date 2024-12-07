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
const currentDate = new Date().getDate(); // Current date of the month

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

// Render Students (Filter by batch, status, and date)
const renderStudents = (batch, status, month, startDate, endDate) => {
    const studentRecords = document.getElementById("student-records");
    studentRecords.innerHTML = ""; // Clear previous records

    const filteredStudents = students.filter(student => {
        const studentMonth = new Date(student.nextFeeDate).getMonth() + 1; // Get the month (1-based)
        const studentDate = new Date(student.nextFeeDate).getDate(); // Get the day of the month
        const isMatchingBatch = batch ? student.batch === batch : true;
        const isMatchingStatus = status ? student.feeStatus === status : true;
        const isMatchingMonth = month ? studentMonth === parseInt(month) : true;
        const isMatchingDateRange = studentDate >= startDate && studentDate <= endDate;
        return isMatchingBatch && isMatchingStatus && isMatchingMonth && isMatchingDateRange;
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
        const selectedBatch = Array.from(document.querySelectorAll('.batch-btn:checked')).map(btn => btn.value);
        const selectedStatus = document.querySelector(".status-btn.active")?.dataset.status || null;

        // Apply the dynamic filter: Show students with pending fees from 1st to the current date of the month
        renderStudents(selectedBatch, selectedStatus, selectedMonth, 1, currentDate);
    });
};

// Setup Batch Filter Logic
const setupBatchFilter = () => {
    const batchButtons = document.querySelectorAll(".batch-btn");
    batchButtons.forEach(button => {
        button.addEventListener("click", () => {
            const batch = button.dataset.batch;
            const status = document.querySelector(".status-btn.active")?.dataset.status || null;
            const month = document.getElementById("month-select").value;
            renderStudents(batch, status, month, 1, currentDate); // Render students for the selected batch and month
        });
    });
};

// Setup Pending Filter Logic
const setupPendingFilter = () => {
    const statusButtons = document.querySelectorAll(".status-btn");
    statusButtons.forEach(button => {
        button.addEventListener("click", () => {
            const status = button.dataset.status;
            const batch = document.querySelector(".batch-btn.active")?.dataset.batch || null;
            const month = document.getElementById("month-select").value;
            renderStudents(batch, status, month, 1, currentDate); // Render students for the selected status
        });
    });
};

// Add New Student
const addStudent = async () => {
    const name = prompt("Enter student name:");
    const studentClass = prompt("Enter student class:");
    const batch = prompt("Enter student batch:");
    const nextFeeDate = prompt("Enter next fee date (YYYY-MM-DD):");
    const feeAmount = parseFloat(prompt("Enter fee amount:"));

    const nextFeeDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!name || !studentClass || !batch || !nextFeeDate || isNaN(feeAmount) || !nextFeeDateRegex.test(nextFeeDate)) {
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
            body: JSON.stringify({ name, studentClass, batch, nextFeeDate, feeAmount }),
        });
        if (!response.ok) throw new Error("Failed to add student");

        const newStudent = await response.json();
        students.push(newStudent.student);
        alert("Student added successfully!");
        updateStats();
        renderStudents(currentMonth, 1, currentDate); // Render updated data
    } catch (error) {
        console.error("Error adding student:", error);
        alert("Failed to add student. Please try again.");
    }
};

// Initialize Dashboard
const initDashboard = async () => {
    students = await fetchData("students");
    updateStats();
    renderStudents(currentMonth, 1, currentDate); // Render students for current month
    populateMonthDropdown();
    setupBatchFilter();
    setupPendingFilter();

    document.getElementById("add-new-student-btn").addEventListener("click", addStudent); // Add new student button
};

// Start the Dashboard
document.addEventListener("DOMContentLoaded", initDashboard);
