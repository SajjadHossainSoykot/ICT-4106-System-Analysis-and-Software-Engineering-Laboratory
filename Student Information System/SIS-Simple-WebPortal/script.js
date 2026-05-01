const courseList = document.getElementById("courseList");
const reportList = document.getElementById("reportList");

let courses = [];

function getStudents() {
  return JSON.parse(localStorage.getItem("students")) || [];
}

function saveStudents(students) {
  localStorage.setItem("students", JSON.stringify(students));
}

function getReports() {
  return JSON.parse(localStorage.getItem("studentReports")) || [];
}

function saveReports(reports) {
  localStorage.setItem("studentReports", JSON.stringify(reports));
}

// Load courses from courses.txt
async function loadCourses() {
  try {
    const res = await fetch("courses.txt");
    const text = await res.text();

    courses = text.trim().split("\n").map(line => {
      const [id, name, credit] = line.split("|");

      return {
        id: id.trim(),
        name: name.trim(),
        credit: Number(credit.trim())
      };
    });

    renderCourses();
  } catch {
    courseList.innerHTML = "<p>Could not load courses.txt</p>";
  }
}

function renderCourses() {
  courseList.innerHTML = courses.map(course => `
    <div class="card">
      <p><b>Course ID:</b> ${course.id}</p>
      <p><b>Course Name:</b> ${course.name}</p>
      <p><b>Credit:</b> ${course.credit}</p>
    </div>
  `).join("");
}

// Register student
document.getElementById("studentForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("sname").value.trim();
  const id = document.getElementById("sid").value.trim();
  const dept = document.getElementById("dept").value.trim();

  let students = getStudents();

  if (students.find(s => s.id === id)) {
    alert("Student already registered.");
    return;
  }

  students.push({ id, name, dept });
  saveStudents(students);

  alert("Student registered successfully.");
  this.reset();
});

// Grade calculation
function getGradePoint(marks) {
  if (marks >= 80) return { grade: "A+", point: 4.00 };
  if (marks >= 75) return { grade: "A", point: 3.75 };
  if (marks >= 70) return { grade: "A-", point: 3.50 };
  if (marks >= 65) return { grade: "B+", point: 3.25 };
  if (marks >= 60) return { grade: "B", point: 3.00 };
  if (marks >= 55) return { grade: "B-", point: 2.75 };
  if (marks >= 50) return { grade: "C+", point: 2.50 };
  if (marks >= 45) return { grade: "C", point: 2.25 };
  if (marks >= 40) return { grade: "D", point: 2.00 };
  return { grade: "F", point: 0.00 };
}

// Submit marks
document.getElementById("marksForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const studentId = document.getElementById("markStudentId").value.trim();
  const courseId = document.getElementById("courseId").value.trim();
  const marksInput = document.getElementById("marks").value;
  const marks = Number(marksInput);

  if (marksInput === "" || isNaN(marks) || marks < 0 || marks > 100) {
    alert("Please enter valid marks between 0 and 100.");
    return;
  }

  const students = getStudents();
  const student = students.find(s => s.id === studentId);
  const course = courses.find(c => c.id === courseId);

  if (!student) {
    alert("Student not found.");
    return;
  }

  if (!course) {
    alert("Course not found.");
    return;
  }

  const result = getGradePoint(marks);

  let reports = getReports();

  // Remove previous result for same student and same course
  reports = reports.filter(r => !(r.studentId === studentId && r.courseId === courseId));

  reports.push({
    studentId: student.id,
    studentName: student.name,
    department: student.dept,
    courseId: course.id,
    courseName: course.name,
    credit: Number(course.credit),
    marks: marks,
    grade: result.grade,
    point: Number(result.point)
  });

  saveReports(reports);
  renderReports();

  alert("Marks submitted successfully.");
  this.reset();
});

// GPA calculation
function calculateGPA(studentId) {
  const reports = getReports().filter(r => r.studentId === studentId);

  let totalCredit = 0;
  let totalWeightedPoint = 0;

  reports.forEach(r => {
    const credit = Number(r.credit);
    const point = Number(r.point);

    totalCredit += credit;
    totalWeightedPoint += credit * point;
  });

  if (totalCredit === 0) return "0.00";

  return (totalWeightedPoint / totalCredit).toFixed(2);
}

// Render reports
function renderReports() {
  const reports = getReports();

  if (reports.length === 0) {
    reportList.innerHTML = "<p>No reports available.</p>";
    return;
  }

  reportList.innerHTML = reports.map(r => {
    const gpa = calculateGPA(r.studentId);

    return `
      <div class="card report-card">
        <p><b>${r.studentName}</b> (${r.studentId})</p>
        <p><b>Department:</b> ${r.department}</p>
        <p><b>Course:</b> ${r.courseName}</p>
        <p><b>Marks:</b> ${r.marks}</p>
        <p><b>Grade:</b> ${r.grade}</p>
        <p><b>Point:</b> ${r.point}</p>
        <p><b>GPA:</b> ${gpa}</p>
      </div>
    `;
  }).join("");
}

// Clear reports
function clearReports() {
  localStorage.removeItem("studentReports");
  renderReports();
}

loadCourses();
renderReports();