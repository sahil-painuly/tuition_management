// Mock data for admin stats (initially set to zero, will be updated by the backend)
let students = [];
let stats = {
    totalStudents: 0,
    feesCollected: 0,
    pendingFees: 0,
};

// Password protection on page load
const passwordCheck = () => {
    const correctPassword = "admin123";
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
    fetchAdminData(); // Fetch admin data
    loadStudentRecords(12);
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
    { name: "February", value: "02" },
    { name: "March", value: "03" },
    { name: "April", value: "04" },
    { name: "May", value: "05" },
];

// Set current month as default
const currentMonth = new Date().getMonth() + 1; // Get current month (1-based)

// Fetch admin stats and students from the backend
function fetchAdminData() {
    fetch("https://tuition-management.onrender.com/api/students")
        .then((response) => response.json())
        .then((data) => {
            console.log(data); // Log the response to check data
            students = data;
            stats.totalStudents = students.length;
            stats.feesCollected = students
                .filter((student) => student.feeStatus === "Paid")
                .reduce((sum, student) => sum + student.feeAmount, 0);
            stats.pendingFees = students
                .filter((student) => student.feeStatus === "Pending")
                .reduce((sum, student) => sum + student.feeAmount, 0);

            // Update the stats on the page
            document.getElementById("total-students").textContent = stats.totalStudents;
            document.getElementById("fees-collected").textContent = `₹${stats.feesCollected}`;
            document.getElementById("pending-fees").textContent = `₹${stats.pendingFees}`;

            loadStudentRecords(currentMonth);
        })
        .catch((error) => console.error("Error fetching student data:", error));
}

// Load student records based on the selected month
function loadStudentRecords(month) {
    const filteredStudents = students.filter((student) => {
        const studentMonth = new Date(student.nextFeeDate).getMonth() + 1; // Get the month from date
        return studentMonth === parseInt(month);
    });
    console.log(filteredStudents); // Log filtered students to check if they're correct

    // Display filtered students in the table
    const tableBody = document.getElementById("student-records");
    tableBody.innerHTML = ""; // Clear existing rows
    filteredStudents.forEach((student) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.studentClass}</td>
            <td>${new Date(student.nextFeeDate).toLocaleDateString()}</td>
            <td>${student.feeStatus}</td>
            <td>₹${student.feeAmount}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Add new student form handler
function addNewStudent() {
    const name = prompt("Enter student name:");
    const studentClass = prompt("Enter student class:");
    const nextFeeDate = prompt("Enter next fee date (YYYY-MM-DD):");
    const feeAmount = parseFloat(prompt("Enter fee amount:"));

    if (name && studentClass && nextFeeDate && feeAmount) {
        fetch("https://tuition-management.onrender.com/api/add-student", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name,
                studentClass,
                nextFeeDate,
                feeAmount,
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            alert("New student added!");

            // Add new student to the existing students array directly
            students.push(data);
            stats.totalStudents += 1; // Update total students count
            // Re-render the student records for the current month
            loadStudentRecords(currentMonth);
        })
        .catch(error => console.error('Error adding student:', error));
    } else {
        alert("Please fill all fields.");
    }
}