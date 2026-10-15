/**
 * ========================================================
 * Expense Tracker App — main.js
 * ========================================================
 */

/* ========================================================
   DATA TRANSAKSI
   ======================================================== */

// Array untuk menyimpan seluruh transaksi.
let transactions = [];

// ID transaksi unik berdasarkan waktu saat ini.
const generateId = () => +new Date();

/**
 * ========================================================
 * DOM ELEMENT
 * ========================================================
 */

// Kontainer daftar transaksi.
const incomeList = document.getElementById("incomeList");
const expenseList = document.getElementById("expenseList");

// Form transaksi.
const transactionForm = document.getElementById("transactionForm");
const titleInput = document.getElementById("transactionFormTitleInput");
const amountInput = document.getElementById("transactionFormAmountInput");
const dateInput = document.getElementById("transactionFormDateInput");
const typeSelect = document.getElementById("transactionFormTypeSelect");
const submitButton = document.querySelector(
  '[data-testid="transactionFormSubmitButton"]',
);

// Dashboard.
const balanceElement = document.querySelector(
  ".tracker-summary__balance-amount",
);
const incomeElement = document.querySelector(
  ".tracker-summary__stat-amount--income",
);
const expenseElement = document.querySelector(
  ".tracker-summary__stat-amount--expense",
);

// Form pencarian.
const searchForm = document.getElementById("searchTransactionForm");
const searchInput = document.getElementById("searchTransactionFormTitleInput");

/**
 * ========================================================
 * WEB STORAGE
 * ========================================================
 */

const STORAGE_KEY = "expenseTrackerTransactions";

/**
 * Menyimpan seluruh transaksi ke localStorage.
 */
function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

/**
 * Memuat transaksi dari localStorage.
 */
function loadTransactions() {
  const savedTransactions = localStorage.getItem(STORAGE_KEY);

  if (savedTransactions) {
    try {
      transactions = JSON.parse(savedTransactions);

      // Pastikan hasil JSON berupa array.
      if (!Array.isArray(transactions)) {
        transactions = [];
      }
    } catch (error) {
      transactions = [];
    }
  }
}

/**
 * ========================================================
 * FORMAT NOMINAL
 * ========================================================
 */

function formatRupiah(amount) {
  return `Rp${Number(amount).toLocaleString("id-ID")}`;
}

/**
 * ========================================================
 * RENDER TRANSAKSI
 * ========================================================
 */

function renderTransactions(transactionData = transactions) {
  // Kosongkan daftar terlebih dahulu.
  incomeList.replaceChildren();
  expenseList.replaceChildren();

  transactionData.forEach((transaction) => {
    const transactionItem = document.createElement("div");
    transactionItem.setAttribute("data-testid", "transactionItem");
    transactionItem.classList.add("tracker-transaction-item");

    // Ikon transaksi.
    const icon = document.createElement("div");
    icon.classList.add(
      "tracker-transaction-item__icon",
      `tracker-transaction-item__icon--${transaction.type}`,
    );
    icon.textContent = transaction.type === "income" ? "↗" : "↘";

    // Detail transaksi.
    const detail = document.createElement("div");
    detail.classList.add("tracker-transaction-item__detail");

    const title = document.createElement("h3");
    title.setAttribute("data-testid", "transactionItemTitle");
    title.classList.add("tracker-transaction-item__title");
    title.textContent = transaction.title;

    const date = document.createElement("p");
    date.setAttribute("data-testid", "transactionItemDate");
    date.classList.add("tracker-transaction-item__date");
    date.textContent = `Tanggal: ${transaction.date}`;

    detail.appendChild(title);
    detail.appendChild(date);

    // Bagian kanan kartu.
    const right = document.createElement("div");
    right.classList.add("tracker-transaction-item__right");

    const amount = document.createElement("p");
    amount.setAttribute("data-testid", "transactionItemAmount");
    amount.classList.add(
      "tracker-transaction-item__amount",
      `tracker-transaction-item__amount--${transaction.type}`,
    );

    const sign = transaction.type === "income" ? "+" : "-";
    amount.textContent = `${sign}${formatRupiah(transaction.amount)}`;

    const transactionType = document.createElement("p");
    transactionType.setAttribute("data-testid", "transactionItemType");
    transactionType.classList.add("tracker-transaction-item__date");
    transactionType.textContent = `Tipe: ${
      transaction.type === "income" ? "Pemasukan" : "Pengeluaran"
    }`;

    // Tombol aksi.
    const actions = document.createElement("div");
    actions.classList.add("tracker-transaction-item__actions");

    // Tombol ubah tipe.
    const editTypeButton = document.createElement("button");
    editTypeButton.setAttribute("data-testid", "transactionItemEditTypeButton");
    editTypeButton.classList.add("tracker-transaction-item__btn");
    editTypeButton.type = "button";
    editTypeButton.textContent = "Ubah Tipe";

    editTypeButton.addEventListener("click", () => {
      toggleTransactionType(transaction.id);
    });

    // Tombol edit.
    const editButton = document.createElement("button");
    editButton.classList.add("tracker-transaction-item__btn");
    editButton.type = "button";
    editButton.textContent = "Edit";

    editButton.addEventListener("click", () => {
      editTransaction(transaction.id);
    });

    // Tombol hapus.
    const deleteButton = document.createElement("button");
    deleteButton.setAttribute("data-testid", "transactionItemDeleteButton");
    deleteButton.classList.add("tracker-transaction-item__btn");
    deleteButton.type = "button";
    deleteButton.textContent = "Hapus";

    deleteButton.addEventListener("click", () => {
      deleteTransaction(transaction.id);
    });

    actions.appendChild(editTypeButton);
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    right.appendChild(amount);
    right.appendChild(transactionType);
    right.appendChild(actions);

    transactionItem.appendChild(icon);
    transactionItem.appendChild(detail);
    transactionItem.appendChild(right);

    // Masukkan ke daftar sesuai tipe.
    if (transaction.type === "income") {
      incomeList.appendChild(transactionItem);
    } else {
      expenseList.appendChild(transactionItem);
    }
  });
}

/**
 * ========================================================
 * DASHBOARD
 * ========================================================
 */

function updateDashboard() {
  const totalIncome = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const totalExpense = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + Number(transaction.amount), 0);

  const balance = totalIncome - totalExpense;

  balanceElement.textContent = formatRupiah(balance);
  incomeElement.textContent = formatRupiah(totalIncome);
  expenseElement.textContent = formatRupiah(totalExpense);
}

/**
 * ========================================================
 * CUSTOM EVENT
 * ========================================================
 */

/*
 * Setiap perubahan data akan mengirim custom event.
 * Satu listener di bawah ini bertugas memperbarui
 * seluruh tampilan.
 */
function notifyTransactionUpdated() {
  document.dispatchEvent(new Event("transaction:updated"));
}

/*
 * Satu listener untuk merender transaksi dan dashboard.
 */
document.addEventListener("transaction:updated", () => {
  saveTransactions();
  renderTransactions();
  updateDashboard();
});

/**
 * ========================================================
 * TAMBAH / EDIT TRANSAKSI
 * ========================================================
 */

let editingTransactionId = null;

transactionForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const amount = Number(amountInput.value);
  const date = dateInput.value;
  const type = typeSelect.value;

  // Validasi judul.
  if (title === "") {
    alert("Judul transaksi tidak boleh kosong.");
    return;
  }

  // Validasi nominal.
  if (amount < 1 || Number.isNaN(amount)) {
    alert("Nominal transaksi harus minimal Rp1.");
    return;
  }

  // Mode edit.
  if (editingTransactionId !== null) {
    const transactionIndex = transactions.findIndex(
      (transaction) => transaction.id === editingTransactionId,
    );

    if (transactionIndex !== -1) {
      transactions[transactionIndex] = {
        ...transactions[transactionIndex],
        title,
        amount,
        date,
        type,
      };
    }

    editingTransactionId = null;

    submitButton.textContent = "Simpan";

    const heading = document.querySelector(".tracker-form-section__heading");

    heading.textContent = "Tambah Pencatatan Baru";

    transactionForm.reset();

    notifyTransactionUpdated();
    return;
  }

  // Mode tambah.
  const newTransaction = {
    id: generateId(),
    title,
    amount,
    date,
    type,
  };

  transactions.push(newTransaction);

  transactionForm.reset();

  notifyTransactionUpdated();
});

/**
 * ========================================================
 * EDIT TRANSAKSI
 * ========================================================
 */

function editTransaction(id) {
  const transaction = transactions.find((item) => item.id === id);

  if (!transaction) {
    return;
  }

  editingTransactionId = id;

  titleInput.value = transaction.title;
  amountInput.value = transaction.amount;
  dateInput.value = transaction.date;
  typeSelect.value = transaction.type;

  submitButton.textContent = "Perbarui";

  const heading = document.querySelector(".tracker-form-section__heading");

  heading.textContent = "Edit Pencatatan";

  titleInput.focus();
}

/**
 * ========================================================
 * HAPUS TRANSAKSI
 * ========================================================
 */

function deleteTransaction(id) {
  transactions = transactions.filter((transaction) => transaction.id !== id);

  // Jika sedang mengedit transaksi yang dihapus,
  // kembalikan form ke mode tambah.
  if (editingTransactionId === id) {
    resetForm();
  }

  notifyTransactionUpdated();
}

/**
 * ========================================================
 * UBAH TIPE TRANSAKSI
 * ========================================================
 */

function toggleTransactionType(id) {
  const transaction = transactions.find((item) => item.id === id);

  if (!transaction) {
    return;
  }

  transaction.type = transaction.type === "income" ? "expense" : "income";

  notifyTransactionUpdated();
}

/**
 * ========================================================
 * RESET FORM
 * ========================================================
 */

function resetForm() {
  editingTransactionId = null;

  transactionForm.reset();

  submitButton.textContent = "Simpan";

  const heading = document.querySelector(".tracker-form-section__heading");

  heading.textContent = "Tambah Pencatatan Baru";
}

/**
 * ========================================================
 * PENCARIAN TRANSAKSI
 * ========================================================
 */

/*
 * Search dilakukan secara real-time setiap kali
 * pengguna mengetik.
 */
searchInput.addEventListener("input", () => {
  const keyword = searchInput.value.trim().toLowerCase();

  // Jika kosong, tampilkan seluruh transaksi.
  if (keyword === "") {
    renderTransactions(transactions);
    return;
  }

  const filteredTransactions = transactions.filter((transaction) =>
    transaction.title.toLowerCase().includes(keyword),
  );

  renderTransactions(filteredTransactions);
});

/*
 * Mencegah form pencarian melakukan reload halaman
 * ketika tombol "Cari" ditekan.
 */
searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
});

/**
 * ========================================================
 * INISIALISASI APLIKASI
 * ========================================================
 */

loadTransactions();
renderTransactions();
updateDashboard();
