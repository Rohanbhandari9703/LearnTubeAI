import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
const router = express.Router();

export async function getGeminiSubtopics(topic) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }); // Use your available model name
  const prompt = `You are a study planning assistant. Break down the topic '${topic}' into the most important subtopics a student must understand. Classify them as high, medium, or low importance. Return in JSON format like this: [ { "subtopic": "ER Model", "importance": "high" }, ... ]`;
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log('Raw Gemini response:', text); // Debug log
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // Try to extract JSON from any code block (handles ```json ... ```)
      const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) {
        try {
          json = JSON.parse(match[1]);
        } catch (err) {
          throw new Error('Gemini API error: Could not parse extracted code block as JSON');
        }
      } else {
        throw new Error('Gemini API error: Could not parse Gemini response as JSON');
      }
    }
    return json;
  } catch (err) {
    throw new Error('Gemini API error: ' + (err.message || err));
  }
}

// POST /api/gemini/subtopics
router.post('/subtopics', async (req, res) => {
  const { topic } = req.body;
  try {
    const json = await getGeminiSubtopics(topic);
    res.json(json);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
