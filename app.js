let allCases = [];
let barChart = null;
let pieChart = null;

const API = "http://localhost:5000/api";

/* ---------- LOGIN ---------- */
window.login = async function (e) {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message);
    return;
  }

  localStorage.setItem("user", JSON.stringify(data.user));
  window.location.href = "dashboard.html";
};



window.signup = async function () {
  const name = document.getElementById("s_name").value;
  const email = document.getElementById("s_email").value;
  const password = document.getElementById("s_password").value;
  const role = document.getElementById("s_role").value;

  if (!name || !email || !password) {
    alert("Fill all fields");
    return;
  }

  const res = await fetch("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role })
  });

  const data = await res.json();
  alert(data.message);

  if (res.ok) {
    showLogin();
  }
};
console.log("app.js loaded");

/* ---------- DASHBOARD ---------- */
async function loadDashboard() {
  try {
    const res = await fetch(API + "/cases");
    const data = await res.json();

    document.getElementById("total").innerText = data.length;
    document.getElementById("open").innerText =
      data.filter(c => c.status !== "Recovered").length;
    document.getElementById("done").innerText =
      data.filter(c => c.status === "Recovered").length;
  } catch (err) {
    console.error(err);
  }
}

/* ---------- CASE LIST ---------- */
async function loadCases() {
  try {
    const res = await fetch("/api/cases");
    allCases = await res.json();   // ⭐ VERY IMPORTANT
    renderCases(allCases);         // ⭐ VERY IMPORTANT
  } catch (err) {
    console.error(err);
  }
}

function renderCases(cases) {
  const table = document.getElementById("casesTable");
  table.innerHTML = "";

  cases.forEach(c => {
    table.innerHTML += `
      <tr>
        <td>${c.id}</td>
        <td>${c.customer}</td>
        <td>₹${c.amount}</td>
        <td>${c.status}</td>
        <td>${c.assignedDCA || "-"}</td>

        <td>
          <a href="case-detail.html?id=${c.id}"
             class="btn btn-sm btn-primary">
            View
          </a>

          ${isManagerOrAdmin() ? `
            <button class="btn btn-sm btn-warning ms-1"
                    onclick="editCase(${c.id})">
              Edit
            </button>

            <button class="btn btn-sm btn-danger ms-1"
                    onclick="deleteCase(${c.id})">
              Delete
            </button>
          ` : ""}
        </td>
      </tr>
    `;
  });
}

/* ---------- CASE DETAIL ---------- */
async function loadCase() {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) return;

  const res = await fetch(`/api/cases/${id}`);
  const data = await res.json();

  document.getElementById("title").innerText = "Case #" + data.id;
  document.getElementById("customer").innerText = data.customer;
  document.getElementById("amount").innerText = data.amount;
  document.getElementById("status").value = data.status;
}

async function updateStatus() {
  const id = new URLSearchParams(window.location.search).get("id");
  const statusEl = document.getElementById("status");

  if (!id || !statusEl) {
    alert("Case ID or status not found");
    return;
  }

  const status = statusEl.value;

  const res = await fetch(`/api/cases/${id}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });

  const data = await res.json();
  alert(data.message);

  if (res.ok) {
    // reload case details
    loadCase();
  }
}

/* ---------- AUTO LOAD ---------- */
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("casesTable")) {
    loadCases();
  }
});

window.barChart = null;
window.pieChart = null;

window.showChart = async function () {
  const id = new URLSearchParams(window.location.search).get("id");

  const res = await fetch("/api/cases/" + id);
  const data = await res.json();

  console.log("CASE DATA:", data); // debug

  const amount = Number(data.amount);
  const priority = Number(data.priority);

  const ctx = document.getElementById("caseChart").getContext("2d");

  if (window.barChart) window.barChart.destroy();

  window.barChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Amount", "Priority"],
      datasets: [{
        label: "Case Metrics",
        data: [amount, priority],
        backgroundColor: ["#0d6efd", "#198754"]
      }]
    },
    options: {
      responsive: false
    }
  });
};

window.showPieChart = async function () {
  const id = new URLSearchParams(window.location.search).get("id");

  const res = await fetch("/api/cases/" + id);
  const data = await res.json();

  console.log("STATUS:", data.status); // debug

  const ctx = document.getElementById("statusChart").getContext("2d");

  if (window.pieChart) window.pieChart.destroy();

  window.pieChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: ["Open", "In Progress", "Recovered"],
      datasets: [{
        data: [
          data.status === "Open" ? 1 : 0,
          data.status === "In Progress" ? 1 : 0,
          data.status === "Recovered" ? 1 : 0
        ],
        backgroundColor: ["#dc3545", "#ffc107", "#198754"]
      }]
    },
    options: {
      responsive: false
    }
  });
};


document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("case-detail.html")) {
    loadCase();
  }
});

async function predictAI() {
  const id = new URLSearchParams(window.location.search).get("id");

  const caseRes = await fetch(`/api/cases/${id}`);
  const caseData = await caseRes.json();

  const aiRes = await fetch("/api/ai/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: caseData.amount,
      status: caseData.status
    })
  });

  const ai = await aiRes.json();

  document.getElementById("aiResult").innerText =
    `AI Priority: ${ai.priority} | Recovery Probability: ${ai.recovery_probability * 100}%`;
}

function showSignup() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("signupBox").style.display = "block";
}

function showLogin() {
  document.getElementById("signupBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
}

function searchCases() {
  if (!allCases.length) return;

  const query = document.getElementById("searchInput").value.toLowerCase();

  const filtered = allCases.filter(c =>
    c.id.toString().includes(query) ||
    c.customer.toLowerCase().includes(query) ||
    c.status.toLowerCase().includes(query) ||
    (c.assignedDCA && c.assignedDCA.toLowerCase().includes(query))
  );

  renderCases(filtered);
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("casesTable")) {
    loadCases();
  }
});

function isManagerOrAdmin() {
  const user = JSON.parse(localStorage.getItem("user"));
  return user && (user.role === "Admin" || user.role === "Manager");
}

async function editCase(id) { /* ... */ }
async function deleteCase(id) { /* ... */ }

async function showAddCase() {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || (user.role !== "Admin" && user.role !== "Manager")) {
    alert("Only Admin or Manager can add cases");
    return;
  }

  const customer = prompt("Enter customer name:");
  const amount = prompt("Enter amount:");

  if (!customer || !amount) {
    alert("All fields required");
    return;
  }

  const res = await fetch("/api/cases", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      role: user.role
    },
    body: JSON.stringify({
      customer,
      amount,
      status: "Open"
    })
  });

  const data = await res.json();
  alert(data.message);
  loadCases();
}

async function editCase(id) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || (user.role !== "Admin" && user.role !== "Manager")) {
    alert("Access denied");
    return;
  }

  const newAmount = prompt("Enter new amount:");
  if (!newAmount) return;

  const res = await fetch(`/api/cases/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      role: user.role
    },
    body: JSON.stringify({ amount: newAmount })
  });

  const data = await res.json();
  alert(data.message);
  loadCases();
}
async function deleteCase(id) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user || (user.role !== "Admin" && user.role !== "Manager")) {
    alert("Access denied");
    return;
  }

  if (!confirm("Delete this case?")) return;

  const res = await fetch(`/api/cases/${id}`, {
    method: "DELETE",
    headers: { role: user.role }
  });

  const data = await res.json();
  alert(data.message);
  loadCases();
}
