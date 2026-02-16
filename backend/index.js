// Express server entry for Smart Study Planner (ESM)
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import geminiRouter from './routes/gemini.js';
import youtubeRouter from './routes/youtube.js';
import authRouter from './routes/auth.js';
import playlistRouter from './routes/playlists.js';
import progressRouter from './routes/progress.js';
import savedVideoRouter from './routes/savedVideos.js';
import ocrRouter from './routes/ocr.js';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import axios from 'axios';
import { allocateTime } from './routes/timeAllocator.js';
import connectDB from "./config/db.js";
import { errorHandler } from './middleware/errorHandler.js';
import PlaylistCache from './models/PlaylistCache.js';
import Test from "./test.js";

// Load environment variables FIRST
dotenv.config();

// Check for required environment variables
if (!process.env.JWT_SECRET) {
  console.error("❌ ERROR: JWT_SECRET is not defined in environment variables");
  console.error("Please add JWT_SECRET to your .env file");
  process.exit(1);
}

// Connect to database and wait for connection before starting server
await connectDB();

// Test database connection
// try {
//   await Test.create({ name: "MongoDB Working" });
//   console.log("✅ Database test successful");
// } catch (error) {
//   console.error("❌ Database test failed:", error.message);
// }

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - allow credentials for cookies
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Route imports
app.use('/api/youtube', youtubeRouter);
app.use('/api/gemini', geminiRouter);
app.use('/api/auth', authRouter);
app.use('/api/playlists', playlistRouter);
app.use('/api/progress', progressRouter);
app.use('/api/saved-videos', savedVideoRouter);
app.use('/api/ocr', ocrRouter);

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Helper function to generate cache key
const generateCacheKey = (topic, totalMinutes) => {
  return `${topic.toLowerCase().trim()}_${totalMinutes}`;
};

// Main chat endpoint: /api/chat (public - no auth required for generating playlists)
app.post('/api/chat', async (req, res) => {
  const { input, totalMinutes } = req.body;
  console.log('📍 /api/chat called with:', { input, totalMinutes });

  const cacheKey = generateCacheKey(input, totalMinutes);

  try {
    // Check cache first
    const cached = await PlaylistCache.findOne({ cacheKey });
    if (cached) {
      // Update hit count and last accessed
      cached.hitCount += 1;
      cached.lastAccessed = new Date();
      await cached.save();

      console.log('✅ Cache hit! Returning cached playlist');
      return res.json(cached.playlistData);
    }

    console.log('❌ Cache miss. Generating new playlist...');

    // 1. Get subtopics from Gemini
    console.log('🔄 Calling Gemini API...');
    const geminiRes = await axios.post(
      `http://localhost:${PORT}/api/gemini/subtopics`,
      { topic: input }
    );
    const subtopics = geminiRes.data;
    console.log('✅ Gemini subtopics:', subtopics);
    // 2. Allocate time
    console.log('⏱️ Allocating time...');
    const plan = allocateTime(subtopics, totalMinutes);
    console.log('✅ Time plan:', plan);
    // 3. For each subtopic, get YouTube videos
    const results = [];
    for (const item of plan) {
      const query = `${item.subtopic} explained in ${item.timeAllocated} minutes`;
      console.log(`🔍 Searching YouTube for: "${query}"`);
      try {
        const ytRes = await axios.post(
          `http://localhost:${PORT}/api/youtube/search`,
          { query, maxDuration: item.timeAllocated }
        );
        // New format: { videos: [...], currentIndex: 0, totalVideos: N }
        const videos = ytRes.data.videos || [];
        if (videos.length > 0) {
          const firstVideo = videos[0]; // Use first video (best match) initially
          console.log(`✅ Found ${videos.length} videos, using: ${firstVideo.videoTitle}`);
          results.push({
            subtopic: item.subtopic,
            importance: item.importance,
            timeAllocated: item.timeAllocated,
            videoTitle: firstVideo.videoTitle,
            videoUrl: firstVideo.videoUrl,
            duration: firstVideo.duration,
            videoOptions: videos, // Store all video options
            currentVideoIndex: 0 // Start with first video
          });
        } else {
          throw new Error('No videos found in search results');
        }
      } catch (e) {
        console.log(`❌ Video search failed for "${item.subtopic}":`, e.message);
        console.log('📋 Error details:', e.response?.data || e.message);
        results.push({
          subtopic: item.subtopic,
          importance: item.importance,
          timeAllocated: item.timeAllocated,
          videoTitle: null,
          videoUrl: null,
          videoOptions: [],
          currentVideoIndex: 0,
          error: e.response?.data?.error || e.message
        });
      }
    }
    console.log('📦 Final results:', results);

    // Store in cache
    try {
      await PlaylistCache.findOneAndUpdate(
        { cacheKey },
        {
          cacheKey,
          topic: input,
          totalMinutes,
          playlistData: results,
          hitCount: 1,
          lastAccessed: new Date(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        },
        { upsert: true, new: true }
      );
      console.log('💾 Results cached successfully');
    } catch (cacheError) {
      console.error('⚠️ Cache storage failed:', cacheError.message);
      // Continue even if cache fails
    }

    res.json(results);
  } catch (err) {
    console.log('❌ /api/chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// OCR-based chat endpoint: /api/chat/image
app.post('/api/chat/image', upload.single('image'), async (req, res) => {
  const totalMinutes = Number(req.body.totalMinutes) || 0;
  console.log('📍 /api/chat/image called with totalMinutes:', totalMinutes);

  if (!totalMinutes || totalMinutes <= 0) {
    return res.status(400).json({ error: 'Valid totalMinutes is required' });
  }

  try {
    // Note: OCR results vary, so caching is less effective for images
    // We can still cache based on OCR text hash if needed, but for now skipping cache
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // 1. Extract text using OCR (Tesseract.js directly)
    console.log('📸 Starting OCR...');
    const { data: { text } } = await Tesseract.recognize(
      req.file.buffer,
      'eng',
      {
        logger: m => console.log(m.status || m.progress),
      }
    );
    const ocrText = text.trim();
    console.log('✅ OCR completed. Extracted text length:', ocrText.length);

    if (!ocrText || ocrText.length === 0) {
      return res.status(400).json({ error: 'No text could be extracted from the image' });
    }

    // 2. Process OCR text with Gemini to get topics with time and importance
    console.log('🔄 Calling Gemini to process OCR text...');
    const geminiRes = await axios.post(
      `http://localhost:${PORT}/api/gemini/process-ocr`,
      { ocrText, totalMinutes: Number(totalMinutes) }
    );
    const topicsWithTime = geminiRes.data;
    console.log('✅ Gemini topics:', topicsWithTime);

    // 3. For each topic, get YouTube videos
    const results = [];
    for (const item of topicsWithTime) {
      const query = `${item.subtopic} explained in ${item.timeAllocated} minutes`;
      console.log(`🔍 Searching YouTube for: "${query}"`);
      try {
        const ytRes = await axios.post(
          `http://localhost:${PORT}/api/youtube/search`,
          { query, maxDuration: item.timeAllocated }
        );
        const videos = ytRes.data.videos || [];
        if (videos.length > 0) {
          const firstVideo = videos[0];
          console.log(`✅ Found ${videos.length} videos, using: ${firstVideo.videoTitle}`);
          results.push({
            subtopic: item.subtopic,
            importance: item.importance,
            timeAllocated: item.timeAllocated,
            videoTitle: firstVideo.videoTitle,
            videoUrl: firstVideo.videoUrl,
            duration: firstVideo.duration,
            videoOptions: videos,
            currentVideoIndex: 0
          });
        } else {
          throw new Error('No videos found in search results');
        }
      } catch (e) {
        console.log(`❌ Video search failed for "${item.subtopic}":`, e.message);
        results.push({
          subtopic: item.subtopic,
          importance: item.importance,
          timeAllocated: item.timeAllocated,
          videoTitle: null,
          videoUrl: null,
          videoOptions: [],
          currentVideoIndex: 0,
          error: e.response?.data?.error || e.message
        });
      }
    }
    console.log('📦 Final results:', results);
    res.json(results);
  } catch (err) {
    console.log('❌ /api/chat/image error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Smart Study Planner Backend Running');
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
