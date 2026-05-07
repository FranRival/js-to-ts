const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
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

module.exports = async function handler(req, res) {
  // Handle preflight FIRST
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(200).end();
    return;
  }

  // Enable CORS for all requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { code } = req.body;

  // Validation
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code is required' });
  }

  if (code.length > 50000) {
    return res.status(400).json({ error: 'Code too large (max 50KB)' });
  }

  if (code.trim().length === 0) {
    return res.status(400).json({ error: 'Code cannot be empty' });
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
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

    return res.status(200).json({
      success: true,
      code: result.text,
    });
  } catch (error) {
    console.error('Conversion error:', error);

    // Handle rate limit
    if (error.status === 429) {
      return res.status(429).json({
        error: 'Rate limited. Please try again in a moment.',
      });
    }

    // Handle auth error
    if (error.status === 401) {
      return res.status(401).json({
        error: 'API key invalid',
      });
    }

    return res.status(500).json({
      error: 'Conversion failed. Please try again.',
      details: error.message,
    });
  }
};
