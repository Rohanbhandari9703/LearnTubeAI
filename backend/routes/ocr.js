import express from 'express';
import multer from 'multer';
import Tesseract from 'tesseract.js';

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// POST /api/ocr/extract
router.post('/extract', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('📸 Starting OCR for image...');
    
    // Perform OCR using Tesseract.js
    const { data: { text } } = await Tesseract.recognize(
      req.file.buffer,
      'eng',
      {
        logger: m => console.log(m.status || m.progress),
      }
    );

    console.log('✅ OCR completed. Extracted text length:', text.length);
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'No text could be extracted from the image' });
    }

    res.json({
      success: true,
      text: text.trim(),
    });
  } catch (err) {
    console.error('❌ OCR error:', err.message);
    res.status(500).json({ error: err.message || 'OCR processing failed' });
  }
});

export default router;
