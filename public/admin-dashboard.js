// Mock data for admin stats (initially set to zero, will be updated by the backend)
let students = [];
let stats = {
    totalStudents: 0,
    feesCollected: 0,
    pendingFees: 0,
};

// Password protection on page load
const passwordCheck = () => {
    const correctPassword = "admin123"; // 
    const userInput = prompt("Enter the password to access this website:");

    if (userInput !== correctPassword) {
        alert("Incorrect password! You cannot access this page.");
        document.body.innerHTML = ""; // Clear the page content
        window.location.href = "https://www.google.com"; // Redirect to a safe page
    }
};

// Run password check when the page loads
document.addEventListener("DOMContentLoaded", () => {
    passwordCheck(); // Check password first

    // Fetch admin stats and student data from the backend
    fetchAdminData();

    // Populate months dropdown
    const monthSelect = document.getElementById("month-select");
    months.forEach((month) => {
        const option = document.createElement("option");
        option.value = month.value;
        option.textContent = month.name;
        if (month.value === String(currentMonth).padStart(2, "0")) {
            option.selected = true;
        }
        monthSelect.appendChild(option);
    });

    // Event listener for month change
    monthSelect.addEventListener("change", (e) => {
        const selectedMonth = e.target.value;
        loadStudentRecords(selectedMonth);
    });

    // Add new student functionality
    document.getElementById("add-new-student-btn").addEventListener("click", addNewStudent);

    // Logout functionality
    document.getElementById("logout-btn").addEventListener("click", () => {
        alert("Logging out...");
        window.location.href = "index.html"; // Redirect to login page
    });
});

// Populate months dropdown
const months = [
    { name: "December", value: "12" },
    { name: "January", value: "01" },
    { name: "Febuary", value: "02" },
    { name: "March", value: "03" },
    { name: "April", value: "04" },
    { name: "May", value: "05" },
];

// Set current month as default
const currentMonth = new Date().getMonth() + 1; // Get current month (1-based)

// Fetch admin stats and students from the backend
function fetchAdminData() {
    fetch("http://localhost:5000/api/students")
        .then((response) => response.json())
        .then((data) => {
            students = data;
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

            loadStudentRecords(currentMonth);
        })
        .catch((error) => console.error("Error fetching student data:", error));
}

// Function to format date into 'Day, Month Date, Year'
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
}

// Load student records based on the selected month
function loadStudentRecords(month) {
    const filteredStudents = students.filter((student) => {
        const studentMonth = new Date(student.nextFeeDate).getMonth() + 1;
        return studentMonth === parseInt(month);
    });

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

    const studentRecords = document.getElementById("student-records");
    studentRecords.innerHTML = "";

    filteredStudents.forEach((student) => {
        const row = document.createElement("tr");

        const statusColor = student.feeStatus === "Paid" ? "green" : "red";
        const rowColor = student.feeStatus === "Paid" ? "lightgreen" : "";

        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.class}</td>
            <td>${formatDate(student.nextFeeDate)}</td>
            <td class="status" style="color: ${statusColor}">
                ${student.feeStatus}
            </td>
            <td class="fee-amount">₹${student.feeAmount}</td>
            <td style="background-color: ${rowColor}">
                <button class="toggle-status-btn" data-id="${student._id}">${student.feeStatus === "Pending" ? "Mark Paid" : "Mark Unpaid"}</button>
                <button class="update-fee-btn" data-id="${student._id}">Update Fee</button>
            </td>
        `;

        studentRecords.appendChild(row);
    });

    document.querySelectorAll(".toggle-status-btn").forEach((button) => {
        button.addEventListener("click", (e) => {
            const studentId = e.target.getAttribute("data-id");
            const feeStatus = e.target.textContent === "Mark Paid" ? "Paid" : "Pending";
            toggleFeeStatus(studentId, feeStatus);
        });
    });

    document.querySelectorAll(".update-fee-btn").forEach((button) => {
        button.addEventListener("click", (e) => {
            const studentId = e.target.getAttribute("data-id");
            const newFee = prompt("Enter the new fee amount:");
            if (newFee) updateStudentFee(studentId, parseInt(newFee));
        });
    });
}

function updateStudentFee(studentId, newFee) {
    fetch("http://localhost:5000/api/update-fee", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: studentId, feeAmount: newFee }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                alert("Fee updated successfully");
                fetchAdminData();
            } else {
                alert("Failed to update fee");
            }
        })
        .catch((error) => console.error("Error updating fee:", error));
}

function toggleFeeStatus(studentId, feeStatus) {
    fetch("http://localhost:5000/api/update-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: studentId, feeStatus }),
    })
        .then((response) => response.json())
        .then(() => fetchAdminData())
        .catch((error) => console.error("Error updating fee status:", error));
}

function addNewStudent() {
    const name = prompt("Enter student name:");
    const studentClass = prompt("Enter student class:");
    const nextFeeDate = prompt("Enter next fee date (YYYY-MM-DD):");
    const feeAmount = parseInt(prompt("Enter fee amount:"));

    if (name && studentClass && nextFeeDate && !isNaN(feeAmount)) {
        const newStudent = { name, studentClass, nextFeeDate, feeAmount };

        fetch("http://localhost:5000/api/add-student", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newStudent),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    students.push(data.student);
                    loadStudentRecords(document.getElementById("month-select").value);
                    alert("New student added successfully!");
                } else {
                    alert("Failed to add new student");
                }
            })
            .catch((error) => console.error("Error adding student:", error));
    } else {
        alert("Please provide valid student information.");
    }
}
