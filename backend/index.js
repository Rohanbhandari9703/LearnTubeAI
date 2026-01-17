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
import axios from 'axios';
import { allocateTime } from './routes/timeAllocator.js';
import connectDB from "./config/db.js";
import { errorHandler } from './middleware/errorHandler.js';
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

// Main chat endpoint: /api/chat (public - no auth required for generating playlists)
app.post('/api/chat', async (req, res) => {
  const { input, totalMinutes } = req.body;
  console.log('📍 /api/chat called with:', { input, totalMinutes });
  try {
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
    // 3. For each subtopic, get YouTube video
    const results = [];
    for (const item of plan) {
      const query = `${item.subtopic} explained in ${item.timeAllocated} minutes`;
      console.log(`🔍 Searching YouTube for: "${query}"`);
      try {
        const ytRes = await axios.post(
          `http://localhost:${PORT}/api/youtube/search`,
          { query, maxDuration: item.timeAllocated + 10 }
        );
        console.log(`✅ Video found: ${ytRes.data.videoTitle}`);
        results.push({
          subtopic: item.subtopic,
          importance: item.importance,
          timeAllocated: item.timeAllocated,
          videoTitle: ytRes.data.videoTitle,
          videoUrl: ytRes.data.videoUrl
        });
      } catch (e) {
        console.log(`❌ Video search failed for "${item.subtopic}":`, e.message);
        console.log('📋 Error details:', e.response?.data || e.message);
        results.push({
          subtopic: item.subtopic,
          importance: item.importance,
          timeAllocated: item.timeAllocated,
          videoTitle: null,
          videoUrl: null,
          error: e.response?.data?.error || e.message
        });
      }
    }
    console.log('📦 Final results:', results);
    res.json(results);
  } catch (err) {
    console.log('❌ /api/chat error:', err.message);
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
