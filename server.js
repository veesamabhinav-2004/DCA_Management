const express = require("express");
const cors = require("cors");
const db = require("./db");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

/* Get all cases */
app.get("/api/cases", (req, res) => {
  db.all("SELECT * FROM cases", [], (err, rows) => {
    if (err) {
      res.status(500).json(err);
    } else {
      res.json(rows);
    }
  });
});

/* Get single case */
app.get("/api/cases/:id", (req, res) => {
  db.get(
    "SELECT * FROM cases WHERE id = ?",
    [req.params.id],
    (err, row) => {
      if (err) {
        res.status(500).json(err);
      } else {
        res.json(row);
      }
    }
  );
});

/* Update case status */
app.post("/api/cases/:id/status", (req, res) => {
  const { status } = req.body;
  const id = req.params.id;

  db.run(
    "UPDATE cases SET status = ? WHERE id = ?",
    [status, id],
    function (err) {
      if (err) {
        return res.status(500).json({ message: "DB error" });
      }
      res.json({ message: "Status updated successfully" });
    }
  );
});

// Signup
app.post("/api/signup", (req, res) => {
  const { name, email, password, role } = req.body;

  db.run(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, password, role],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "User already exists" });
      }
      res.json({ message: "Signup successful" });
    }
  );
});

// Login
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: "Server error" });
      }

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          name: user.name,
          role: user.role
        }
      });
    }
  );
});


app.listen(PORT, () => {
  console.log("Backend running on http://localhost:5000");
});

// AI Prediction API
app.post("/api/ai/predict", (req, res) => {
  const { amount, status } = req.body;

  let priority = "Low";
  let probability = 0.8;

  if (amount >= 50000) {
    priority = "High";
    probability = 0.35;
  } else if (amount >= 20000) {
    priority = "Medium";
    probability = 0.6;
  }

  res.json({
    priority,
    recovery_probability: probability
  });
});

app.post("/api/cases", (req, res) => {
  if (!["Admin", "Manager"].includes(req.headers.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  const { customer, amount, status } = req.body;

  db.run(
    "INSERT INTO cases (customer, amount, status) VALUES (?, ?, ?)",
    [customer, amount, status],
    () => res.json({ message: "Case added" })
  );
});
app.put("/api/cases/:id", (req, res) => {
  if (!["Admin", "Manager"].includes(req.headers.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  db.run(
    "UPDATE cases SET amount = ? WHERE id = ?",
    [req.body.amount, req.params.id],
    () => res.json({ message: "Case updated" })
  );
});
app.delete("/api/cases/:id", (req, res) => {
  if (!["Admin", "Manager"].includes(req.headers.role)) {
    return res.status(403).json({ message: "Access denied" });
  }

  db.run(
    "DELETE FROM cases WHERE id = ?",
    [req.params.id],
    () => res.json({ message: "Case deleted" })
  );
});
