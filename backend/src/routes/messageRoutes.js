const express = require('express');
const { authenticateEither } = require('../middleware/auth');
const { generalRateLimit, userMessageRateLimit } = require('../middleware/rateLimit');
const { 
  sendTextMessage, 
  sendImageMessage, 
  sendDocumentMessage, 
  sendVideoMessage,
  sendAudioMessage,
  sendLocationMessage, 
  sendContactMessage, 
  sendBulkMessages, 
  getMessageHistory,
  getMessageStats 
} = require('../controllers/messageController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { validateMessageData } = require('../middleware/validation');

const router = express.Router();

// All message routes require authentication
router.use(authenticateEither);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, documents, and audio files
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|mp4|mov|avi|mp3|wav|aac/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: File type not supported!');
    }
  }
});

// File upload endpoint
router.post('/upload', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Generate full HTTP URL for the uploaded file
    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:3001';
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;
    
    res.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        url: fileUrl
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'File upload failed',
      message: error.message
    });
  }
});

// Send text message
router.post('/send/text', userMessageRateLimit, sendTextMessage);

// Send image message
router.post('/send/image', userMessageRateLimit, sendImageMessage);

// Send document message
router.post('/send/document', userMessageRateLimit, sendDocumentMessage);

// Send video message
router.post('/send/video', userMessageRateLimit, sendVideoMessage);

// Send audio message
router.post('/send/audio', userMessageRateLimit, sendAudioMessage);

// Send location message
router.post('/send/location', userMessageRateLimit, sendLocationMessage);

// Send contact message
router.post('/send/contact', userMessageRateLimit, sendContactMessage);

// Send bulk messages
router.post('/send/bulk', userMessageRateLimit, sendBulkMessages);

// Get message history
router.get('/history/:sessionId', generalRateLimit, getMessageHistory);

// Get message statistics
router.get('/stats/:sessionId', generalRateLimit, getMessageStats);

// Legacy route for backward compatibility
router.post('/send', userMessageRateLimit, sendTextMessage);

module.exports = router; 