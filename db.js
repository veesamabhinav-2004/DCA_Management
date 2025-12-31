const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./dca.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS cases (
      id INTEGER PRIMARY KEY,
      customer TEXT,
      amount INTEGER,
      status TEXT,
      assignedDCA TEXT,
      assignedDate TEXT,
      dueDate TEXT,
      priority INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      caseId INTEGER,
      action TEXT,
      user TEXT,
      timestamp TEXT
    )
  `);
});

module.exports = db;
db.run(`
  INSERT OR IGNORE INTO cases
  (id, customer, amount, status, assignedDCA, assignedDate, dueDate, priority)
  VALUES
  (101, 'ABC Corp', 50000, 'Open', 'John', '2025-12-01', '2025-12-31', 1),
  (102, 'XYZ Ltd', 75000, 'In Progress', 'Mary', '2025-12-05', '2026-01-05', 2),
  (103, 'Global Tech', 30000, 'Recovered', 'David', '2025-11-20', '2025-12-20', 3)
`);

db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    password TEXT,
    role TEXT
  )
`);
db.run(`
  INSERT OR IGNORE INTO users (name, email, password, role)
  VALUES ('Admin', 'admin@dca.com', 'admin123', 'Admin')
`);

