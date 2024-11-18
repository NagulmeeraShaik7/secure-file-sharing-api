const express = require("express");
const bodyParser = require("body-parser");
const fileUpload = require("express-fileupload");
const sqlite3 = require("sqlite3").verbose();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// Configuration
const SECRET_KEY = "your_secret_key";
const UPLOAD_FOLDER = "./uploads/";
const ALLOWED_EXTENSIONS = ["pptx", "docx", "xlsx"];

// Initialize Express app
const app = express();
app.use(bodyParser.json());
app.use(fileUpload());

// Ensure upload folder exists
if (!fs.existsSync(UPLOAD_FOLDER)) fs.mkdirSync(UPLOAD_FOLDER);

// Initialize SQLite database
const db = new sqlite3.Database("file_sharing.db");
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      isVerified INTEGER DEFAULT 0
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      uploader_id INTEGER NOT NULL,
      upload_time DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
});

// Utility functions
const encrypt = (text) => {
  const cipher = crypto.createCipher("aes-256-cbc", SECRET_KEY);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
};

const decrypt = (encryptedText) => {
  const decipher = crypto.createDecipher("aes-256-cbc", SECRET_KEY);
  let decrypted = decipher.update(encryptedText, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const user = jwt.verify(token, SECRET_KEY);
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Routes
// Ops User Login
app.post("/ops/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ? AND password = ? AND role = 'ops'", [email, password], (err, user) => {
    if (err || !user) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
  });
});

// Upload File
app.post("/ops/upload", authenticate, (req, res) => {
  if (req.user.role !== "ops") return res.status(403).json({ message: "Forbidden" });

  const file = req.files?.file;
  if (!file) return res.status(400).json({ message: "No file uploaded" });

  const extension = path.extname(file.name).substring(1);
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return res.status(400).json({ message: "File type not allowed" });
  }

  const filePath = path.join(UPLOAD_FOLDER, file.name);
  file.mv(filePath, (err) => {
    if (err) return res.status(500).json({ message: "File upload failed" });

    db.run("INSERT INTO files (filename, uploader_id) VALUES (?, ?)", [file.name, req.user.id], (err) => {
      if (err) return res.status(500).json({ message: "Database error" });
      res.json({ message: "File uploaded successfully" });
    });
  });
});

// Client User Sign Up
app.post("/client/signup", (req, res) => {
  const { email, password } = req.body;

  db.run(
    "INSERT INTO users (email, password, role) VALUES (?, ?, 'client')",
    [email, password],
    (err) => {
      if (err) return res.status(500).json({ message: "Sign up failed" });

      const verificationLink = encrypt(email);
      res.json({ verificationLink, message: "Sign up successful" });
    }
  );
});

// Client User Verify Email
app.post("/client/verify", (req, res) => {
  const { verificationLink } = req.body;
  const email = decrypt(verificationLink);

  db.run("UPDATE users SET isVerified = 1 WHERE email = ?", [email], (err) => {
    if (err) return res.status(500).json({ message: "Verification failed" });
    res.json({ message: "Email verified successfully" });
  });
});

// Client User Login
app.post("/client/login", (req, res) => {
  const { email, password } = req.body;

  db.get("SELECT * FROM users WHERE email = ? AND password = ? AND role = 'client'", [email, password], (err, user) => {
    if (err || !user) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, { expiresIn: "1h" });
    res.json({ token });
  });
});

// List Uploaded Files
app.get("/client/files", authenticate, (req, res) => {
  if (req.user.role !== "client") return res.status(403).json({ message: "Forbidden" });

  db.all("SELECT * FROM files", [], (err, files) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ files });
  });
});

// Download File
app.get("/client/download/:id", authenticate, (req, res) => {
  if (req.user.role !== "client") return res.status(403).json({ message: "Forbidden" });

  const fileId = req.params.id;
  db.get("SELECT * FROM files WHERE id = ?", [fileId], (err, file) => {
    if (err || !file) return res.status(404).json({ message: "File not found" });

    const downloadLink = encrypt(file.filename);
    res.json({ downloadLink, message: "success" });
  });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
