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

// POST /api/gemini/process-ocr
router.post('/process-ocr', async (req, res) => {
  const { ocrText, totalMinutes } = req.body;
  
  if (!ocrText) {
    return res.status(400).json({ error: 'OCR text is required' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `You are a study planning assistant. Analyze the following text extracted from an image and create a structured learning plan.

Extracted Text:
${ocrText}

Total Available Time: ${totalMinutes} minutes

Based on the content, extract all topics/subtopics and for each topic:
1. Assign an importance level: "high", "medium", or "low"
2. Suggest an appropriate time allocation in minutes based on the topic's complexity and importance

Return ONLY a JSON array in this exact format:
[
  {
    "subtopic": "Topic name",
    "importance": "high|medium|low",
    "timeAllocated": 15
  },
  ...
]

Make sure the sum of all timeAllocated values is approximately ${totalMinutes} minutes. Distribute time based on importance (high importance topics get more time).`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log('Raw Gemini OCR response:', text);

    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // Try to extract JSON from any code block
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

    res.json(json);
  } catch (err) {
    console.error('❌ Gemini OCR processing error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to process OCR text' });
  }
});

export default router;
