const express = require('express');
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

// Test endpoint
app.post('/api/convert', (req, res) => {
  console.log('Request received!');
  console.log('API Key:', process.env.CLAUDE_API_KEY ? 'SET' : 'NOT SET');
  
  const { code } = req.body;
  
  if (!code) {
    return res.json({ success: false, error: 'No code provided' });
  }

  // TEST: Just return uppercase
  const result = code.toUpperCase();
  
  return res.json({ 
    success: true, 
    code: result 
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
