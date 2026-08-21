/**
 * POST /api/validate-lead
 * Validates and extracts lead data from conversation
 */

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'POST only' }));
    return;
  }

  try {
    // Parse body
    let body = '';
    await new Promise((resolve, reject) => {
      req.on('data', chunk => body += chunk);
      req.on('end', resolve);
      req.on('error', reject);
    });

    let data = {};
    try {
      data = JSON.parse(body);
    } catch (e) {
      // Empty or invalid JSON
    }

    const { conversationHistory = [] } = data;

    if (!conversationHistory || conversationHistory.length === 0) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'conversationHistory required' }));
      return;
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API key not configured' }));
      return;
    }

    // Validate lead using Claude
    const validationPrompt = `Based on this conversation, extract the lead information.
Return ONLY a JSON object with: { name, email, projectDescription, budget }
If any field is missing, use null.
Conversation:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://koredeve.github.io',
        'X-Title': 'Osuolale Portfolio Chatbot'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus',
        max_tokens: 300,
        messages: [
          {
            role: 'system',
            content: 'You are a lead validation assistant. Extract lead data from conversations and return valid JSON.'
          },
          {
            role: 'user',
            content: validationPrompt
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenRouter error:', error);
      res.writeHead(response.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Validation failed' }));
      return;
    }

    const result = await response.json();
    const validationResult = result.choices[0].message.content;

    try {
      const leadData = JSON.parse(validationResult);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        leadData: leadData,
        timestamp: new Date().toISOString()
      }));
    } catch (parseErr) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        leadData: { name: null, email: null, projectDescription: null, budget: null },
        raw: validationResult,
        timestamp: new Date().toISOString()
      }));
    }

  } catch (error) {
    console.error('[VALIDATE-LEAD] Error:', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Failed to validate lead',
      details: error.message
    }));
  }
};
