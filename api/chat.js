/**
 * POST /api/chat
 * Smart rule-based chatbot - only calls Claude at the end for final message
 * Guides conversation: Name → Email → Project → Budget
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

    const { message, conversationHistory = [] } = data;

    if (!message) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'message required' }));
      return;
    }

    // Extract lead data from conversation
    const leadData = extractLeadData(conversationHistory);

    // Determine next step
    const nextStep = determineNextStep(leadData);
    const botMessage = generateBotMessage(nextStep, leadData);

    // If we have all data, call Claude
    if (leadData.name && leadData.email && leadData.project && leadData.budget) {
      const finalMessage = await generateFinalMessage(leadData);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: finalMessage,
        isComplete: true,
        leadData: leadData,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: botMessage,
      isComplete: false,
      timestamp: new Date().toISOString()
    }));

  } catch (error) {
    console.error('[CHATBOT] Error:', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Failed to process message',
      details: error.message
    }));
  }
};

// Extract lead data (positional order)
function extractLeadData(history) {
  const data = { name: null, email: null, project: null, budget: null };

  const userMessages = [];
  for (let i = 0; i < history.length; i++) {
    if (history[i].role === 'user') {
      userMessages.push(history[i].content);
    }
  }

  if (userMessages.length > 0) data.name = userMessages[0];
  if (userMessages.length > 1) data.email = userMessages[1];
  if (userMessages.length > 2) data.project = userMessages[2];
  if (userMessages.length > 3) data.budget = userMessages[3];

  return data;
}

// Determine next step
function determineNextStep(leadData) {
  if (!leadData.name) return 'ask_name';
  if (!leadData.email) return 'ask_email';
  if (!leadData.project) return 'ask_project';
  if (!leadData.budget) return 'ask_budget';
  return 'complete';
}

// Generate bot message
function generateBotMessage(step, leadData) {
  const messages = {
    ask_name: "Hey there! 👋 I'm Osuolale's assistant. What's your name?",
    ask_email: `Nice to meet you, ${leadData.name}! 😊 What's your email address?`,
    ask_project: `Got it! What kind of project are you looking to build?`,
    ask_budget: `Interesting! What's your budget range for this project?`,
    complete: `Thanks for the info, ${leadData.name}! We'll be in touch soon.`
  };

  return messages[step] || messages.ask_name;
}

// Call Claude Opus for final message
async function generateFinalMessage(leadData) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return `Perfect, ${leadData.name}! Thanks for sharing. Osuolale will review your project and reach out shortly at ${leadData.email}. Typical timeline: 1-2 weeks. Looking forward to building with you!`;
  }

  try {
    const prompt = `Generate a warm, professional 2-sentence closing message for a potential client.

Client Details:
- Name: ${leadData.name}
- Email: ${leadData.email}
- Project: ${leadData.project}
- Budget: $${leadData.budget}

The message should:
1. Thank them warmly
2. Confirm next steps (Osuolale will review and reach out)
3. Be personalized to their project
4. Keep it brief (2 sentences max)

Generate ONLY the message, nothing else.`;

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
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error('Claude call failed');
    }

    const result = await response.json();
    return result.choices[0].message.content;

  } catch (err) {
    console.error('Claude error:', err.message);
    return `Perfect, ${leadData.name}! Osuolale will review your ${leadData.project} project and reach out at ${leadData.email} soon. Typical timeline: 1-2 weeks.`;
  }
}
