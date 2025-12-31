let barChart = null;
let pieChart = null;

const API = "http://localhost:5000/api";

/* ---------- LOGIN ---------- */
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
    alert(data.message);   // ❌ Invalid user
    return;               // ⛔ STOP HERE
  }

  // ✅ Only signed-up users reach here
  localStorage.setItem("user", JSON.stringify(data.user));
  window.location.href = "dashboard.html";
};

window.signup = async function () {
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const role = document.getElementById("role").value;

  const res = await fetch("/api/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password, role })
  });

  const data = await res.json();
  alert(data.message);

  if (res.ok) {
    window.location.href = "index.html";
  }
};


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
    const res = await fetch("http://localhost:5000/api/cases");
    const data = await res.json();

    const table = document.getElementById("casesTable");
    table.innerHTML = "";

    data.forEach(c => {
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
          </td>
        </tr>
      `;
    });
  } catch (err) {
    console.error(err);
  }
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

