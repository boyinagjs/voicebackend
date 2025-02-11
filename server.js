const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require('mongoose');
const WebSocket = require('ws');
const compression = require('compression');

// Import routes
const login = require("./auth.js");
const allusers = require('./allusers.js');

// MongoDB setup
const mongoURI = 'mongodb+srv://voice:voice@cluster0.ylh3h.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
  .then(() => console.log('🔥 MongoDB Connected'))
  .catch((error) => console.error('❌ MongoDB Connection Error:', error));

// Create Express app
const app = express();

// Middleware
app.use(compression());
app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

// WebSocket setup
const server = app.listen(5000, () => {
  console.log('Server running on port 5000');
});

const wss = new WebSocket.Server({ server });

// FAQ Schema
const faqSchema = new mongoose.Schema({
  question: String,
  answer: String,
  id: { type: Number, unique: true, index: true }
});
const Faq = mongoose.model('Faq', faqSchema);

// Routes
app.get('/test', (req, res) => res.send('Server is running'));
app.use("/api", login);
app.use("/api/users", allusers);

// Updated FAQ Endpoint with WebSocket broadcast
app.put("/updateFaq", async (req, res) => {
  try {
    const { question, answer, id } = req.body;
    const updatedFaq = await Faq.findOneAndUpdate(
      { id },
      { question, answer },
      { new: true, upsert: true }
    );

    // Broadcast update to all WebSocket clients
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({
          type: 'FAQ_UPDATE',
          data: updatedFaq
        }));
      }
    });

    res.status(200).json({
      message: "FAQ updated successfully!",
      response: updatedFaq,
      status: true
    });
  } catch (error) {
    console.error("Error updating FAQ:", error);
    res.status(500).json({ error: "Failed to update FAQ" });
  }
});

// Optimized FAQ Endpoint with caching
app.get('/getFaqs', async (req, res) => {
  try {
    const faqs = await Faq.find().lean().cache('faqs');
    res.set('Cache-Control', 'no-cache');
    res.status(200).json({
      message: "FAQ data retrieved successfully!",
      response: faqs,
      status: true
    });
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    res.status(500).json({ error: "Failed to fetch FAQs" });
  }
});

// File upload setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${Date.now()}${ext}`);
  }
});

const upload = multer({ storage });

app.post("/upload-image", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const filePath = path.join(__dirname, "uploads", req.file.filename);
  res.status(200).json({ filePath });
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New client connected');
  ws.on('close', () => console.log('Client disconnected'));
});