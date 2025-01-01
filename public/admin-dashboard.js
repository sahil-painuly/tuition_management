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
const currentDate = new Date();

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
const updateStats = (selectedMonth = null) => {
    const filteredStudents = selectedMonth
        ? students.filter(student => {
            const studentMonth = new Date(student.nextFeeDate).getMonth() + 1; // 1-based month
            return studentMonth === parseInt(selectedMonth);
        })
        : students;

    stats.totalStudents = filteredStudents.length;
    stats.feesCollected = filteredStudents
        .filter((student) => student.feeStatus === "Paid")
        .reduce((sum, student) => sum + student.feeAmount, 0);
    stats.pendingFees = filteredStudents
        .filter((student) => student.feeStatus === "Pending")
        .reduce((sum, student) => sum + student.feeAmount, 0);

    document.getElementById("total-students").textContent = stats.totalStudents;
    document.getElementById("fees-collected").textContent = `₹${stats.feesCollected}`;
    document.getElementById("pending-fees").textContent = `₹${stats.pendingFees}`;
};


document.getElementById("addStudentForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const studentData = {
        name: document.getElementById("studentName").value.trim(),
        class: document.getElementById("studentClass").value.trim(),
        feeAmount: parseInt(document.getElementById("feeAmount").value),
        nextFeeDate: document.getElementById("nextFeeDate").value,
        batch: document.getElementById("batch").value.trim(),
    };

    try {
        // Send the data to the backend
        const response = await fetch("/add-student", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(studentData),
        });

        if (response.ok) {
            alert("Student added successfully!");
            // Optionally refresh stats and table
            updateStats();
            renderStudents();
        } else {
            const error = await response.json();
            alert(`Error: ${error.message}`);
        }
    } catch (err) {
        console.error("Error adding student:", err);
        alert("Failed to add student. Please try again later.");
    }

    // Reset the form and close the modal
    document.getElementById("addStudentForm").reset();
    const addStudentModal = bootstrap.Modal.getInstance(document.getElementById("addStudentModal"));
    addStudentModal.hide();
});

// Render Students (Filter by batch, status, and date range)
const renderStudents = (batch, status, month, startDate, endDate) => {
    const studentRecords = document.getElementById("student-records");
    studentRecords.innerHTML = ""; // Clear previous records

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1); // 1st day of current month
    const currentDay = currentDate.getDate(); // Current day of the month

    const filteredStudents = students.filter(student => {
        const studentMonth = new Date(student.nextFeeDate).getMonth(); // Get the month (0-based)
        const studentDay = new Date(student.nextFeeDate).getDate(); // Get the day (1-based)
        const feeDate = new Date(student.nextFeeDate);
        
        // Check if the date is in the range (start date to end date)
        const isInDateRange = (startDate && feeDate >= new Date(startDate)) && (endDate && feeDate <= new Date(endDate));

        // Other filters
        const isMatchingBatch = batch ? student.batch === batch : true;
        const isMatchingStatus = status ? student.feeStatus === status : true;
        const isMatchingMonth = month ? studentMonth + 1 === parseInt(month) : true;

        return isInDateRange && isMatchingBatch && isMatchingStatus && isMatchingMonth;
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
            renderStudents();  // Re-render students after update
        } else {
            alert("Failed to update fee status.");
        }
    } catch (error) {
        console.error("Error updating fee status:", error);
        alert("Failed to update fee status. Please try again later.");
    }
};

// Populate Batch Filter
const populateBatchFilter = () => {
    const batchButtonsContainer = document.getElementById("batch-buttons-container");
    const batches = ["1", "2", "3"]; // Assuming batches are 1, 2, 3
    batches.forEach(batch => {
        const button = document.createElement("button");
        button.classList.add("batch-btn", "btn", "btn-outline-success");
        button.textContent = `Batch ${batch}`;
        button.value = batch;
        button.onclick = () => {
            const status = document.querySelector(".status-btn:checked")?.value || null;
            const month = document.getElementById("month-select").value;
            const startDate = document.getElementById("start-date").value;
            const endDate = document.getElementById("end-date").value;
            renderStudents(batch, status, month, startDate, endDate);
        };
        batchButtonsContainer.appendChild(button);
    });
};

// Populate Month Filter
const populateMonthFilter = () => {
    const monthSelect = document.getElementById("month-select");
    months.forEach(month => {
        const option = document.createElement("option");
        option.value = month.value;
        option.textContent = month.name;
        monthSelect.appendChild(option);
    });

    // Set the default value to the current month
    monthSelect.value = currentMonth.toString().padStart(2, "0");

    // Add event listener to update stats dynamically on month change
    monthSelect.addEventListener("change", (event) => {
        const selectedMonth = event.target.value;
        updateStats(selectedMonth);
        renderStudents(null, null, selectedMonth); // Re-render students for the selected month
    });
};

// Setup Filters and Apply Button
const setupFilters = () => {
    document.getElementById("apply-filter-btn").addEventListener("click", () => {
        const batch = document.querySelector(".batch-btn.active")?.value || null;
        const status = document.querySelector(".status-btn:checked")?.value || null;
        const month = document.getElementById("month-select").value;
        const startDate = document.getElementById("start-date").value;
        const endDate = document.getElementById("end-date").value;
        renderStudents(batch, status, month, startDate, endDate);
    });
};

// Initial Setup and Fetch Data
const initializeDashboard = async () => {
    if (!verifyPassword()) return;
    students = await fetchData("students");
    updateStats(currentMonth); // Initial stats for the current month
    populateMonthFilter();
    populateBatchFilter();
    renderStudents(null, null, currentMonth); // Initial render for the current month
    setupFilters();
};

// Initialize Dashboard on Load
initializeDashboard();
