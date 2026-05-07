const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const apiKey = process.env.CLAUDE_API_KEY;
console.log('API Key length:', apiKey ? apiKey.length : 'NOT SET');
console.log('API Key starts with:', apiKey ? apiKey.substring(0, 10) : 'NONE');

const client = new Anthropic({
  apiKey: apiKey,
});


const SYSTEM_PROMPT = `You are an expert TypeScript developer. Convert JavaScript code to TypeScript with proper type annotations.

Rules:
1. Add explicit type annotations to function parameters and return types
2. Use specific types (string, number, boolean) instead of 'any' when possible
3. Use interfaces or types for objects
4. Add generics where appropriate (T[], Record<K, V>, etc)
5. Use Promise<T> for async functions
6. Keep the code structure and logic identical - only add types
7. Use union types when appropriate (string | number)
8. Add helpful comments for complex type annotations
9. Generate proper class properties with types
10. Output ONLY the converted TypeScript code, no explanations or markdown

Important: The code should be production-ready and follow TypeScript best practices.`;

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.post('/api/convert', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Code is required' });
    }

    if (code.trim().length === 0) {
      return res.status(400).json({ error: 'Code cannot be empty' });
    }

    const message = await client.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Convert this JavaScript code to TypeScript:\n\n\`\`\`javascript\n${code}\n\`\`\``,
        },
      ],
    });

    const result = message.content[0];

    if (result.type !== 'text') {
      return res.status(500).json({ error: 'Unexpected response type' });
    }

    return res.json({
      success: true,
      code: result.text,
    });
 
  } catch (error) {
    console.error('Error:', error);
    console.error('API Key:', process.env.CLAUDE_API_KEY ? 'SET' : 'NOT SET');
    return res.status(500).json({
      error: 'Conversion failed',
      details: error.message,
    });
  }

});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
