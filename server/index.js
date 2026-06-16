import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5174;

if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY not set in server environment. Exiting.');
  process.exit(1);
}

const SERVER_CLIENT_TOKEN = process.env.SERVER_CLIENT_TOKEN || null;
if (!SERVER_CLIENT_TOKEN) {
  console.warn('WARNING: SERVER_CLIENT_TOKEN not set. Requests without Authorization will be rejected.');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '128kb' }));

// Basic rate limiting per IP to mitigate abuse
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each IP to 20 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Simple auth middleware: require a bearer token that matches SERVER_CLIENT_TOKEN
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'Missing Authorization header' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Malformed Authorization header' });
  const token = parts[1];
  if (token !== SERVER_CLIENT_TOKEN) return res.status(403).json({ error: 'Forbidden' });
  next();
}

async function callGemini(prompt) {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      temperature: 0.7,
      topP: 0.95,
    }
  });
  return response.text || '';
}

app.post('/api/generate/website', requireAuth, async (req, res) => {
  try {
    const { prompt, outputFormat = 'html' } = req.body; // Default to 'html'
    if (!prompt || typeof prompt !== 'string' || prompt.length > 10000) {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    // Validate outputFormat
    const allowedFormats = ['html', 'react', 'zip']; // Enabled 'zip' support
    if (!allowedFormats.includes(outputFormat)) {
      return res.status(400).json({ error: `Unsupported output format: '${outputFormat}'. Allowed formats are: ${allowedFormats.join(', ')}` });
    }

    let geminiPrompt = prompt;
    // Prepend system instructions to guide Gemini based on the desired output format
    if (outputFormat === 'react') {
      geminiPrompt = `Generate a React functional component based on the following description. Ensure the component is self-contained and uses standard React practices. Only return the JSX/TSX code, no extra explanations or markdown formatting outside the component itself:\n\n${prompt}`;
    } else if (outputFormat === 'html') {
      geminiPrompt = `Generate a complete HTML page based on the following description. Only return the HTML code, no extra explanations or markdown formatting outside the HTML itself:\n\n${prompt}`;
    } else if (outputFormat === 'zip') {
      geminiPrompt = `Generate a complete website (HTML, CSS, and JS) based on: ${prompt}. 
      Return the result ONLY as a valid JSON object where keys are filenames and values are the file contents.
      Example format: {"index.html": "...", "styles.css": "...", "script.js": "..."}
      Do not include any explanations or markdown formatting.`;
    }

    let generatedContent = await callGemini(geminiPrompt);

    // Handle potential JSON formatting in the response for 'zip' format
    if (outputFormat === 'zip') {
      try {
        // Strip markdown code blocks if Gemini includes them
        const cleanedContent = generatedContent.replace(/```json|```/g, '').trim();
        const files = JSON.parse(cleanedContent);
        return res.json({ zip: files });
      } catch (parseErr) {
        console.error('Failed to parse ZIP JSON from Gemini', parseErr);
        // Fallback: return as raw text if parsing fails, so the client can try to handle it
        return res.json({ zip: generatedContent, warning: 'Parsed as raw text' });
      }
    }

    // Return the generated content, using the outputFormat as the key in the JSON response
    return res.json({ [outputFormat]: generatedContent.trim() });
  } catch (err) {
    console.error('Error in /api/generate/website', err);
    return res.status(500).json({ error: 'Server error' });
  }
});
app.post('/api/generate/newsletter', requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.length > 8000) {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    const text = await callGemini(prompt);
    return res.json({ text });
  } catch (err) {
    console.error('Error in /api/generate/newsletter', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/generate/analysis', requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.length > 15000) {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    const text = await callGemini(prompt);
    return res.json({ text });
  } catch (err) {
    console.error('Error in /api/generate/analysis', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`AI proxy server listening on port ${PORT}`);
});
