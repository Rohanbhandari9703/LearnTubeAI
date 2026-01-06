// Express server entry for Smart Study Planner (ESM)
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import geminiRouter from './routes/gemini.js';
import youtubeRouter from './routes/youtube.js';
import axios from 'axios';
import { allocateTime } from './routes/timeAllocator.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Route imports
app.use('/api/youtube', youtubeRouter);
app.use('/api/gemini',geminiRouter)
// Main chat endpoint: /api/chat
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
