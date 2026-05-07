const express = require('express');
const https = require('https');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

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

    // DEBUG
    console.log('=== ENVIRONMENT DEBUG ===');
    console.log('All env vars:', Object.keys(process.env).filter(k => k.includes('API') || k.includes('Api')));
    console.log('CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? 'SET' : 'NOT SET');
    console.log('Api2:', process.env.Api2 ? 'SET' : 'NOT SET');
    
    const apiKey = process.env.CLAUDE_API_KEY || process.env.Api2;
    console.log('Final apiKey used:', apiKey ? 'SET' : 'NOT SET');
    console.log('=== END DEBUG ===');

    const requestBody = JSON.stringify({
      model: 'claude-opus-4-1-20250805',
      max_tokens: 4000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Convert this JavaScript to TypeScript:\n\n\`\`\`javascript\n${code}\n\`\`\``,
        },
      ],
    });

    const options = {
      hostname: 'api.anthropic.com',
      port: 443,
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody),
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    };

    console.log('Making request to API...');

    const apiReq = https.request(options, (apiRes) => {
      let data = '';

      apiRes.on('data', (chunk) => {
        data += chunk;
      });

      apiRes.on('end', () => {
        console.log('API Response status:', apiRes.statusCode);

        if (apiRes.statusCode !== 200) {
          console.log('Error response:', data);
          return res.status(apiRes.statusCode).json({
            error: 'API Error',
            details: data,
          });
        }

        try {
          const result = JSON.parse(data);
          const content = result.content[0].text;
          return res.json({
            success: true,
            code: content,
          });
        } catch (e) {
          return res.status(500).json({
            error: 'Parse error',
            details: e.message,
          });
        }
      });
    });

    apiReq.on('error', (error) => {
      console.error('Request error:', error.message);
      return res.status(500).json({
        error: 'Request failed',
        details: error.message,
      });
    });

    apiReq.write(requestBody);
    apiReq.end();
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: 'Conversion failed',
      details: error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
