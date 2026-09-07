const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "change-me";

const DATA_FILE = path.join(__dirname, "data", "content.json");
const UPLOAD_DIR = path.join(__dirname, "public", "uploads");

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, `${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ok = file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/");
    if (!ok) {
      return cb(new Error("Only image/video files are allowed."));
    }
    cb(null, true);
  }
});

function readData() {
  const content = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(content);
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function nowIso() {
  return new Date().toISOString();
}

function generateId(prefix) {
  return `${prefix}_${crypto.randomBytes(4).toString("hex")}_${Date.now()}`;
}

function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ message: "Admin authentication failed." });
  }
  next();
}

app.get("/api/site-data", (req, res) => {
  const data = readData();
  res.json(data);
});

app.get("/api/content/:section", (req, res) => {
  const data = readData();
  const section = req.params.section;
  if (!data.content[section]) {
    return res.status(404).json({ message: "Section not found." });
  }
  res.json(data.content[section]);
});

app.post("/api/inquiries", (req, res) => {
  const { name, phone, message, type } = req.body;
  if (!name || !phone || !type) {
    return res.status(400).json({ message: "name, phone, type are required." });
  }

  const data = readData();
  const inquiry = {
    id: generateId("inq"),
    name,
    phone,
    message: message || "",
    type,
    createdAt: nowIso(),
    status: "new"
  };
  data.operations.inquiries.push(inquiry);
  writeData(data);

  res.status(201).json({ message: "Inquiry submitted successfully.", inquiry });
});

app.get("/api/admin/overview", requireAdmin, (req, res) => {
  const data = readData();
  res.json({
    inquiries: data.operations.inquiries,
    content: data.content
  });
});

app.put("/api/admin/content/:section", requireAdmin, (req, res) => {
  const section = req.params.section;
  const { value } = req.body;
  const data = readData();

  if (!(section in data.content)) {
    return res.status(404).json({ message: "Section not found." });
  }

  data.content[section] = value;
  writeData(data);
  res.json({ message: "Content updated.", section });
});

app.patch("/api/admin/inquiries/:id", requireAdmin, (req, res) => {
  const { status } = req.body;
  const data = readData();
  const inquiry = data.operations.inquiries.find((item) => item.id === req.params.id);

  if (!inquiry) {
    return res.status(404).json({ message: "Inquiry not found." });
  }

  if (!status) {
    return res.status(400).json({ message: "status is required." });
  }

  inquiry.status = status;
  writeData(data);
  res.json({ message: "Inquiry status updated.", inquiry });
});

app.post("/api/admin/upload", requireAdmin, upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ message: "Upload successful.", url });
});

app.use((err, req, res, next) => {
  if (err && (err.message === "Only image/video files are allowed." || err.name === "MulterError")) {
    return res.status(400).json({ message: err.message });
  }
  return next(err);
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Hanxiu website server running at http://localhost:${PORT}`);
});
