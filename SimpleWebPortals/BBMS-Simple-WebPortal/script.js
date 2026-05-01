const stockList = document.getElementById("stockList");
const requestList = document.getElementById("requestList");
const uploadRequests = document.getElementById("uploadRequests");

// ---------- STORAGE ----------
function getStock() {
  return JSON.parse(localStorage.getItem("bloodStock")) || {};
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

// ---------- LOAD STOCK.TXT ----------
async function loadStockFromTxt() {
  if (localStorage.getItem("bloodStock")) {
    renderStock();
    renderRequests();
    return;
  }

  try {
    const res = await fetch("stock.txt");
    const text = await res.text();

    const stock = {};

    text.trim().split("\n").forEach(line => {
      const [group, quantity] = line.split("|");
      stock[group.trim()] = parseInt(quantity.trim());
    });

    saveStock(stock);
    renderStock();
  } catch {
    stockList.innerHTML = "<p class='low'>Could not load stock.txt</p>";
  }
}

// ---------- REGISTER DONOR ----------
document.getElementById("donorForm").addEventListener("submit", e => {
  e.preventDefault();

  const name = document.getElementById("dname").value;
  const blood = document.getElementById("dblood").value.toUpperCase();
  const phone = document.getElementById("dphone").value;

  const donors = getDonors();

  donors.push({
    name,
    blood,
    phone,
    date: new Date().toLocaleDateString()
  });

  saveDonors(donors);

  alert("Donor registered successfully.");
  e.target.reset();
});

// ---------- DONATE BLOOD ----------
document.getElementById("donateForm").addEventListener("submit", e => {
  e.preventDefault();

  const group = document.getElementById("bloodGroup").value.toUpperCase();
  const units = parseInt(document.getElementById("units").value);

  const stock = getStock();
  stock[group] = (stock[group] || 0) + units;

  saveStock(stock);
  renderStock();

  alert("Blood donation added to stock.");
  e.target.reset();
});

// ---------- REQUEST BLOOD ----------
document.getElementById("requestForm").addEventListener("submit", e => {
  e.preventDefault();

  const patient = document.getElementById("rname").value;
  const group = document.getElementById("rblood").value.toUpperCase();
  const units = parseInt(document.getElementById("runits").value);

  const stock = getStock();
  const requests = getRequests();

  let status = "Rejected";

  if (stock[group] && stock[group] >= units) {
    stock[group] -= units;
    status = "Issued";
    saveStock(stock);
  }

  requests.push({
    patient,
    group,
    units,
    date: new Date().toLocaleDateString(),
    status
  });

  saveRequests(requests);
  renderStock();
  renderRequests();

  if (status === "Issued") {
    alert("Blood issued successfully.");
  } else {
    alert("Not enough blood available. Request rejected.");
  }

  e.target.reset();
});

// ---------- RENDER STOCK ----------
function renderStock() {
  const stock = getStock();

  if (Object.keys(stock).length === 0) {
    stockList.innerHTML = "<p>No stock available.</p>";
    return;
  }

  stockList.innerHTML = Object.entries(stock).map(([group, qty]) => {
    const alertText = qty <= 2 ? "LOW STOCK ALERT" : "Available";
    const className = qty <= 2 ? "low" : "safe";

    return `
      <div class="card stock-card">
        <p><b>Blood Group:</b> ${group}</p>
        <p><b>Quantity:</b> ${qty} units</p>
        <p><b>Status:</b> <span class="${className}">${alertText}</span></p>
      </div>
    `;
  }).join("");
}

// ---------- RENDER REQUESTS ----------
function renderRequests() {
  const requests = getRequests();

  if (requests.length === 0) {
    requestList.innerHTML = "<p>No blood requests yet.</p>";
    return;
  }

  requestList.innerHTML = requests.map(req => {
    const cls = req.status === "Issued" ? "issued" : "rejected";

    return `
      <div class="card">
        <p><b>Patient:</b> ${req.patient}</p>
        <p><b>Blood Group:</b> ${req.group}</p>
        <p><b>Units:</b> ${req.units}</p>
        <p><b>Date:</b> ${req.date}</p>
        <p><b>Status:</b> <span class="${cls}">${req.status}</span></p>
      </div>
    `;
  }).join("");
}

// ---------- DOWNLOAD REQUESTS.TXT ----------
function downloadRequests() {
  const requests = getRequests();

  if (requests.length === 0) {
    alert("No requests to download.");
    return;
  }

  const content = requests.map(req => {
    return [
      req.patient,
      req.group,
      req.units,
      req.date,
      req.status
    ].join("|");
  }).join("\n");

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "requests.txt";
  a.click();

  URL.revokeObjectURL(url);
}

// ---------- IMPORT REQUESTS.TXT ----------
uploadRequests.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(event) {
    const text = event.target.result.trim();

    if (!text) {
      alert("File is empty.");
      return;
    }

    const requests = text.split("\n").map(line => {
      const [patient, group, units, date, status] = line.split("|");

      return {
        patient: patient.trim(),
        group: group.trim(),
        units: parseInt(units.trim()),
        date: date.trim(),
        status: status.trim()
      };
    });

    saveRequests(requests);
    renderRequests();

    alert("requests.txt imported successfully.");
  };

  reader.readAsText(file);
});

// ---------- CLEAR REQUESTS ----------
function clearRequests() {
  if (confirm("Clear all request records?")) {
    localStorage.removeItem("bloodRequests");
    renderRequests();
  }
}

loadStockFromTxt();
renderRequests();