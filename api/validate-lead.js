/**
 * POST /api/validate-lead
 * Validates and extracts lead data from conversation
 */

// Use native Node.js fetch (v18+)

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  try {
    const { conversationHistory = [] } = req.body;

    if (!conversationHistory || conversationHistory.length === 0) {
      return res.status(400).json({ error: 'conversationHistory required' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Extract lead info from conversation using AI
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
        model: 'deepseek/deepseek-chat',
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
      return res.status(response.status).json({ error: 'Validation failed' });
    }

    const data = await response.json();
    const validationResult = data.choices[0].message.content;

    // Parse JSON response
    try {
      const leadData = JSON.parse(validationResult);
      return res.status(200).json({
        success: true,
        leadData: leadData,
        timestamp: new Date().toISOString()
      });
    } catch (parseErr) {
      // If JSON parsing fails, return raw text
      return res.status(200).json({
        success: true,
        leadData: {
          name: null,
          email: null,
          projectDescription: null,
          budget: null
        },
        raw: validationResult,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('[VALIDATE-LEAD] Error:', error.message);
    return res.status(500).json({
      error: 'Failed to validate lead',
      details: error.message
    });
  }
};
