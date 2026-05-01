const doctorList = document.getElementById("doctorList");
const recordsList = document.getElementById("recordsList");

// LOAD DOCTORS
fetch("doctors.txt")
  .then(res => res.text())
  .then(data => {
    const doctors = data.split("\n");
    doctorList.innerHTML = doctors.map(d => {
      const [id, name, spec] = d.split("|");
      return `<p><b>${id}</b> - ${name} (${spec})</p>`;
    }).join("");
  });

// LOCAL STORAGE
function getAppointments() {
  return JSON.parse(localStorage.getItem("appointments")) || [];
}

function saveAppointments(data) {
  localStorage.setItem("appointments", JSON.stringify(data));
}

// PATIENT REGISTER
document.getElementById("patientForm").addEventListener("submit", e => {
  e.preventDefault();
  alert("Patient Registered");
});

// APPOINTMENT
document.getElementById("appointmentForm").addEventListener("submit", e => {
  e.preventDefault();

  const patient = document.getElementById("patientId").value;
  const doctor = document.getElementById("doctorId").value;
  const date = document.getElementById("date").value;

  let data = getAppointments();

  data.push({
    patient,
    doctor,
    date,
    status: "Pending",
    bill: 500
  });

  saveAppointments(data);
  render();

  alert("Appointment Booked");
});

// RENDER
function render() {
  const data = getAppointments();

  if (data.length === 0) {
    recordsList.innerHTML = "<p>No appointments found.</p>";
    return;
  }

  recordsList.innerHTML = data.map((d, index) => `
    <div class="card">
      <p><b>Patient:</b> ${d.patient}</p>
      <p><b>Doctor:</b> ${d.doctor}</p>
      <p><b>Date:</b> ${d.date}</p>
      <p><b>Bill:</b> ${d.bill} BDT</p>
      <p><b>Status:</b> ${d.status}</p>

      ${d.status === "Pending" ? `
        <button class="complete-btn" onclick="completeAppointment(${index})">
          Complete Appointment
        </button>

        <button class="cancel-btn" onclick="cancelAppointment(${index})">
          Cancel Appointment
        </button>
      ` : ""}
    </div>
  `).join("");
}

function completeAppointment(index) {
  const data = getAppointments();

  data[index].status = "Completed";
  data[index].bill = 500;

  saveAppointments(data);
  render();

  alert("Appointment completed.");
}

function cancelAppointment(index) {
  const data = getAppointments();
  data[index].status = "Cancelled";
  data[index].bill = 0;

  saveAppointments(data);
  render();

  alert("Appointment cancelled.");
}

function clearAllAppointments() {
  if (confirm("Are you sure you want to clear all appointments?")) {
    localStorage.removeItem("appointments");
    render();
  }
}

render();