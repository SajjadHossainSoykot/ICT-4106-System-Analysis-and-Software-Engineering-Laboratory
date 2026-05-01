const stockList = document.getElementById("stockList");
const requestList = document.getElementById("requestList");

// Default blood stock
const defaultStock = {
  "A+": 5,
  "A-": 3,
  "B+": 4,
  "B-": 2,
  "O+": 6,
  "O-": 2,
  "AB+": 3,
  "AB-": 1
};

// ---------- STORAGE ----------
function getStock() {
  let stock = localStorage.getItem("bloodStock");

  if (stock) {
    return JSON.parse(stock);
  } else {
    localStorage.setItem("bloodStock", JSON.stringify(defaultStock));
    return defaultStock;
  }
}

function saveStock(stock) {
  localStorage.setItem("bloodStock", JSON.stringify(stock));
}

function getRequests() {
  return JSON.parse(localStorage.getItem("bloodRequests")) || [];
}

function saveRequests(requests) {
  localStorage.setItem("bloodRequests", JSON.stringify(requests));
}

function getDonors() {
  return JSON.parse(localStorage.getItem("donors")) || [];
}

function saveDonors(donors) {
  localStorage.setItem("donors", JSON.stringify(donors));
}

// ---------- REGISTER DONOR ----------
document.getElementById("donorForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const name = document.getElementById("dname").value;
  const blood = document.getElementById("dblood").value.toUpperCase();
  const phone = document.getElementById("dphone").value;

  const donors = getDonors();

  donors.push({
    name: name,
    blood: blood,
    phone: phone,
    date: new Date().toLocaleDateString()
  });

  saveDonors(donors);

  alert("Donor registered successfully.");
  e.target.reset();
});

// ---------- DONATE BLOOD ----------
document.getElementById("donateForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const group = document.getElementById("bloodGroup").value.toUpperCase();
  const units = parseInt(document.getElementById("units").value);

  const stock = getStock();

  stock[group] = (stock[group] || 0) + units;

  saveStock(stock);
  renderStock();

  alert("Blood added to stock.");
  e.target.reset();
});

// ---------- REQUEST BLOOD ----------
document.getElementById("requestForm").addEventListener("submit", function(e) {
  e.preventDefault();

  const patient = document.getElementById("rname").value;
  const group = document.getElementById("rblood").value.toUpperCase();
  const units = parseInt(document.getElementById("runits").value);

  const stock = getStock();
  const requests = getRequests();

  let status = "Rejected";

  if (stock[group] && stock[group] >= units) {
    stock[group] = stock[group] - units;
    status = "Issued";
    saveStock(stock);
  }

  requests.push({
    patient: patient,
    group: group,
    units: units,
    date: new Date().toLocaleDateString(),
    status: status
  });

  saveRequests(requests);
  renderStock();
  renderRequests();

  if (status === "Issued") {
    alert("Blood issued successfully.");
  } else {
    alert("Not enough blood. Request rejected.");
  }

  e.target.reset();
});

// ---------- SHOW STOCK ----------
function renderStock() {
  const stock = getStock();

  stockList.innerHTML = "";

  for (let group in stock) {
    let qty = stock[group];

    let statusText = "Available";
    let statusClass = "safe";

    if (qty <= 2) {
      statusText = "Low Stock Alert";
      statusClass = "low";
    }

    stockList.innerHTML += `
      <div class="card stock-card">
        <p><b>Blood Group:</b> ${group}</p>
        <p><b>Quantity:</b> ${qty} units</p>
        <p><b>Status:</b> <span class="${statusClass}">${statusText}</span></p>
      </div>
    `;
  }
}

// ---------- SHOW REQUEST HISTORY ----------
function renderRequests() {
  const requests = getRequests();

  if (requests.length === 0) {
    requestList.innerHTML = "<p>No request history available.</p>";
    return;
  }

  requestList.innerHTML = "";

  requests.forEach(function(req) {
    let cls = req.status === "Issued" ? "issued" : "rejected";

    requestList.innerHTML += `
      <div class="card">
        <p><b>Patient:</b> ${req.patient}</p>
        <p><b>Blood Group:</b> ${req.group}</p>
        <p><b>Units:</b> ${req.units}</p>
        <p><b>Date:</b> ${req.date}</p>
        <p><b>Status:</b> <span class="${cls}">${req.status}</span></p>
      </div>
    `;
  });
}

// ---------- CLEAR REQUEST HISTORY ----------
function clearRequests() {
  localStorage.removeItem("bloodRequests");
  renderRequests();
  alert("Request history cleared.");
}

function clearAllData() {
  localStorage.setItem("bloodStock", JSON.stringify(defaultStock));
  localStorage.removeItem("bloodRequests");
  localStorage.removeItem("donors");

  renderStock();
  renderRequests();

  alert("All data reset successfully.");
}

// ---------- INITIAL LOAD ----------
renderStock();
renderRequests();