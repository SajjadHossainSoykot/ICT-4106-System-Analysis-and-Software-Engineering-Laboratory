const bookList = document.getElementById("bookList");
const searchInput = document.getElementById("searchInput");

const issueForm = document.getElementById("issueForm");
const returnForm = document.getElementById("returnForm");
const issueMsg = document.getElementById("issueMsg");
const returnMsg = document.getElementById("returnMsg");
const recordList = document.getElementById("recordList");
const clearAllBtn = document.getElementById("clearAllBtn");

const downloadIssuedBtn = document.getElementById("downloadIssuedBtn");
const uploadIssuedFile = document.getElementById("uploadIssuedFile");

const totalTitles = document.getElementById("totalTitles");
const totalBooks = document.getElementById("totalBooks");
const issuedCount = document.getElementById("issuedCount");
const availableCount = document.getElementById("availableCount");

let books = [];

// Load books from books.txt
async function loadBooks() {
  try {
    const res = await fetch("books.txt");
    const text = await res.text();

    books = text
      .trim()
      .split("\n")
      .map((line) => {
        const [id, title, author, category, quantity] = line.split("|");
        return {
          id: id.trim(),
          title: title.trim(),
          author: author.trim(),
          category: category.trim(),
          quantity: parseInt(quantity.trim(), 10)
        };
      });

    renderBooks(books);
    updateStats();
  } catch (error) {
    bookList.innerHTML = `<p class="error">Could not load books.txt. If needed, run with a local server.</p>`;
  }
}

function getRecords() {
  return JSON.parse(localStorage.getItem("issuedBooks")) || [];
}

function saveRecords(records) {
  localStorage.setItem("issuedBooks", JSON.stringify(records));
}

function getIssuedCountForBook(bookId) {
  const records = getRecords();
  return records.filter(
    (record) => record.bookId === bookId && record.status === "Issued"
  ).length;
}

function getAvailableQuantity(bookId) {
  const book = books.find((b) => b.id === bookId);
  if (!book) return 0;
  return book.quantity - getIssuedCountForBook(bookId);
}

function getBadgeClass(available) {
  if (available <= 0) return "out";
  if (available <= 2) return "low";
  return "available";
}

function getBadgeText(available) {
  if (available <= 0) return "Out of Stock";
  if (available <= 2) return `Low Stock: ${available}`;
  return `Available: ${available}`;
}

function renderBooks(bookArray) {
  if (!bookArray.length) {
    bookList.innerHTML = `<p class="error">No books found.</p>`;
    return;
  }

  bookList.innerHTML = bookArray
    .map((book) => {
      const available = getAvailableQuantity(book.id);
      return `
        <div class="book-card">
          <h3>${book.title}</h3>
          <p><strong>Book ID:</strong> ${book.id}</p>
          <p><strong>Author:</strong> ${book.author}</p>
          <p><strong>Category:</strong> ${book.category}</p>
          <p><strong>Total Quantity:</strong> ${book.quantity}</p>
          <p><strong>Available Quantity:</strong> ${available}</p>
          <span class="badge ${getBadgeClass(available)}">${getBadgeText(available)}</span>
        </div>
      `;
    })
    .join("");
}

searchInput.addEventListener("input", () => {
  const term = searchInput.value.toLowerCase().trim();
  const filtered = books.filter(
    (book) =>
      book.title.toLowerCase().includes(term) ||
      book.author.toLowerCase().includes(term) ||
      book.category.toLowerCase().includes(term) ||
      book.id.toLowerCase().includes(term)
  );
  renderBooks(filtered);
});

function calculateFine(dueDate, returnDate = null) {
  const due = new Date(dueDate);
  const compareDate = returnDate ? new Date(returnDate) : new Date();

  due.setHours(0, 0, 0, 0);
  compareDate.setHours(0, 0, 0, 0);

  const diffTime = compareDate - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const finePerDay = 10; // 10 BDT per day
  return diffDays > 0 ? diffDays * finePerDay : 0;
}

function getLiveFine(record) {
  if (record.status === "Issued") {
    return calculateFine(record.dueDate);
  }
  return record.fine || 0;
}

function getLiveStatus(record) {
  if (record.status === "Issued") {
    const fine = calculateFine(record.dueDate);
    if (fine > 0) {
      return "Overdue";
    }
    return "Issued";
  }
  return "Returned";
}

function renderRecords() {
  const records = getRecords();

  if (!records.length) {
    recordList.innerHTML = `<p>No issued books yet.</p>`;
    updateStats();
    renderBooks(books);
    return;
  }

  recordList.innerHTML = records
    .map((record) => {
      const liveFine = getLiveFine(record);
      const liveStatus = getLiveStatus(record);
      const overdueClass = liveStatus === "Overdue" ? "error" : "success";

      return `
      <div class="record-card">
        <p><strong>Member Name:</strong> ${record.memberName}</p>
        <p><strong>Member ID:</strong> ${record.memberId}</p>
        <p><strong>Book ID:</strong> ${record.bookId}</p>
        <p><strong>Issue Date:</strong> ${record.issueDate}</p>
        <p><strong>Due Date:</strong> ${record.dueDate}</p>
        <p><strong>Return Date:</strong> ${record.returnDate || "Not Returned Yet"}</p>
        <p><strong>Fine:</strong> ${liveFine} BDT</p>
        <p><strong>Status:</strong> <span class="${overdueClass}">${liveStatus}</span></p>
      </div>
    `;
    })
    .join("");

  updateStats();
  renderBooks(books);
}

issueForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const memberName = document.getElementById("memberName").value.trim();
  const memberId = document.getElementById("memberId").value.trim();
  const bookId = document.getElementById("issueBookId").value.trim();
  const issueDate = document.getElementById("issueDate").value;
  const dueDate = document.getElementById("dueDate").value;

  issueMsg.textContent = "";
  issueMsg.className = "message";

  const book = books.find((b) => b.id === bookId);

  if (!book) {
    issueMsg.textContent = "Book ID not found in catalog.";
    issueMsg.classList.add("error");
    return;
  }

  const available = getAvailableQuantity(bookId);
  if (available <= 0) {
    issueMsg.textContent = "No copy available for issue.";
    issueMsg.classList.add("error");
    return;
  }

  if (new Date(dueDate) < new Date(issueDate)) {
    issueMsg.textContent = "Due date cannot be earlier than issue date.";
    issueMsg.classList.add("error");
    return;
  }

  const records = getRecords();

  records.push({
    memberName,
    memberId,
    bookId,
    issueDate,
    dueDate,
    returnDate: "",
    fine: 0,
    status: "Issued"
  });

  saveRecords(records);
  renderRecords();

  issueMsg.textContent = "Book issued successfully.";
  issueMsg.classList.add("success");
  issueForm.reset();
});

returnForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const memberId = document.getElementById("returnMemberId").value.trim();
  const bookId = document.getElementById("returnBookId").value.trim();
  const returnDate = document.getElementById("returnDate").value;

  returnMsg.textContent = "";
  returnMsg.className = "message";

  let records = getRecords();

  const recordIndex = records.findIndex(
    (record) =>
      record.memberId === memberId &&
      record.bookId === bookId &&
      record.status === "Issued"
  );

  if (recordIndex === -1) {
    returnMsg.textContent = "No active issued record found.";
    returnMsg.classList.add("error");
    return;
  }

  const fine = calculateFine(records[recordIndex].dueDate, returnDate);

  records[recordIndex].returnDate = returnDate;
  records[recordIndex].fine = fine;
  records[recordIndex].status = "Returned";

  saveRecords(records);
  renderRecords();

  returnMsg.textContent =
    fine > 0
      ? `Book returned successfully. Fine = ${fine} BDT`
      : "Book returned successfully. No fine.";
  returnMsg.classList.add("success");

  returnForm.reset();
});

function updateStats() {
  const records = getRecords();
  const currentlyIssued = records.filter((r) => r.status === "Issued").length;
  const totalCopies = books.reduce((sum, book) => sum + book.quantity, 0);

  totalTitles.textContent = books.length;
  totalBooks.textContent = totalCopies;
  issuedCount.textContent = currentlyIssued;
  availableCount.textContent = totalCopies - currentlyIssued;
}

clearAllBtn.addEventListener("click", () => {
  localStorage.removeItem("issuedBooks");
  renderRecords();
});

downloadIssuedBtn.addEventListener("click", () => {
  const records = getRecords();

  if (!records.length) {
    alert("No issued records to export.");
    return;
  }

  const content = records
    .map((record) => {
      const fineToSave = record.status === "Issued"
        ? calculateFine(record.dueDate)
        : (record.fine || 0);

      return [
        record.memberName,
        record.memberId,
        record.bookId,
        record.issueDate,
        record.dueDate,
        record.status,
        record.returnDate || "",
        fineToSave
      ].join("|");
    })
    .join("\n");

  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "issued_records.txt";
  a.click();

  URL.revokeObjectURL(url);
});

uploadIssuedFile.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(event) {
    const text = event.target.result.trim();

    if (!text) {
      alert("Selected file is empty.");
      return;
    }

    const importedRecords = text.split("\n").map((line) => {
      const [
        memberName,
        memberId,
        bookId,
        issueDate,
        dueDate,
        status,
        returnDate,
        fine
      ] = line.split("|");

      return {
        memberName: (memberName || "").trim(),
        memberId: (memberId || "").trim(),
        bookId: (bookId || "").trim(),
        issueDate: (issueDate || "").trim(),
        dueDate: (dueDate || "").trim(),
        status: (status || "Issued").trim(),
        returnDate: (returnDate || "").trim(),
        fine: parseInt((fine || "0").trim(), 10) || 0
      };
    });

    saveRecords(importedRecords);
    renderRecords();
    alert("Issued records imported successfully.");
  };

  reader.readAsText(file);
});

loadBooks();
renderRecords();