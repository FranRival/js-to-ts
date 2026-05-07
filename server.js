const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const SYSTEM_PROMPT = `You are an expert TypeScript developer. Convert JavaScript code to TypeScript with proper type annotations.
Rules:
1. Add explicit type annotations
2. Use specific types instead of 'any'
3. Use interfaces for objects
4. Add generics where appropriate
5. Use Promise<T> for async functions
6. Keep code structure identical
7. Output ONLY the converted TypeScript code`;

app.post('/api/convert', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required' });
    }

    const message = await client.messages.create({
      model: 'claude-opus-3-5-sonnet-20250514',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Convert this JavaScript to TypeScript:\n\n\`\`\`javascript\n${code}\n\`\`\``,
        },
      ],
    });

    const result = message.content[0];

    if (result.type !== 'text') {
      return res.status(500).json({ error: 'Unexpected response' });
    }

    return res.json({
      success: true,
      code: result.text,
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({
      error: 'Conversion failed',
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
