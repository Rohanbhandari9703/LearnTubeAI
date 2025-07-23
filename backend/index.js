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
  try {
    // 1. Get subtopics from Gemini
    const geminiRes = await axios.post(
      `http://localhost:${PORT}/api/gemini/subtopics`,
      { topic: input }
    );
    const subtopics = geminiRes.data;
    // 2. Allocate time
    const plan = allocateTime(subtopics, totalMinutes);
    // 3. For each subtopic, get YouTube video
    const results = [];
    for (const item of plan) {
      const query = `${item.subtopic} explained in ${item.timeAllocated} minutes`;
      try {
        const ytRes = await axios.post(
          `http://localhost:${PORT}/api/youtube/search`,
          { query, maxDuration: item.timeAllocated + 10 }
        );
        results.push({
          subtopic: item.subtopic,
          importance: item.importance,
          timeAllocated: item.timeAllocated,
          videoTitle: ytRes.data.videoTitle,
          videoUrl: ytRes.data.videoUrl
        });
      } catch (e) {
        results.push({
          subtopic: item.subtopic,
          importance: item.importance,
          timeAllocated: item.timeAllocated,
          videoTitle: null,
          videoUrl: null
        });
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('Smart Study Planner Backend Running');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
