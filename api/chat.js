/**
 * POST /api/chat
 * Smart rule-based chatbot - only calls Claude at the end for final message
 * Guides conversation: Name → Email → Project → Budget
 */

// Use native Node.js fetch (v18+)

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  try {
    // Parse body if it's a string or buffer
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    } else if (Buffer.isBuffer(body)) {
      body = JSON.parse(body.toString());
    }

    const { message, conversationHistory = [] } = body || {};

    if (!message) {
      return res.status(400).json({ error: 'message required' });
    }

    // Extract lead data from conversation history
    const leadData = extractLeadData(conversationHistory);

    // Determine next step in conversation
    const nextStep = determineNextStep(leadData);
    const botMessage = generateBotMessage(nextStep, leadData, message);

    // If we have all data, call Claude to generate final message
    if (leadData.name && leadData.email && leadData.project && leadData.budget) {
      const finalMessage = await generateFinalMessage(leadData);

      return res.status(200).json({
        success: true,
        message: finalMessage,
        isComplete: true,
        leadData: leadData,
        timestamp: new Date().toISOString()
      });
    }

    return res.status(200).json({
      success: true,
      message: botMessage,
      isComplete: false,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CHATBOT] Error:', error.message);
    return res.status(500).json({
      error: 'Failed to process message',
      details: error.message
    });
  }
};

// Extract lead data from conversation
function extractLeadData(history) {
  const data = {
    name: null,
    email: null,
    project: null,
    budget: null
  };

  for (let i = 0; i < history.length; i++) {
    const msg = history[i].content.toLowerCase();

    // Extract name (simple heuristic - first word that looks like a name)
    if (i % 2 === 1 && !data.name && msg.length < 30 && msg.split(' ').length <= 3) {
      const words = msg.split(' ');
      const firstWord = words[0];
      if (firstWord.length > 2 && !firstWord.includes('@') && !firstWord.match(/\d+/) && !['yes', 'no', 'okay', 'ok', 'sure'].includes(firstWord)) {
        data.name = history[i].content;
      }
    }

    // Extract email
    if (msg.includes('@') && msg.includes('.')) {
      const emailMatch = history[i].content.match(/[^\s@]+@[^\s@]+\.[^\s@]+/);
      if (emailMatch) {
        data.email = emailMatch[0];
      }
    }

    // Extract project (anything after name/email and before budget mention)
    if (data.name && !data.email && i % 2 === 1) {
      if (msg.length > 10 && msg.length < 200 && !msg.match(/^\d+/) && !msg.includes('@')) {
        data.project = history[i].content;
      }
    }

    // Extract budget (numbers followed by k, m, or standalone large numbers)
    if (msg.match(/\d+(?:k|m)?/i) || msg.match(/\b\d{3,}\b/)) {
      const budgetMatch = history[i].content.match(/\d+(?:[,.]?\d+)*(?:k|m)?/i);
      if (budgetMatch) {
        data.budget = budgetMatch[0];
      }
    }
  }

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

// Generate bot message based on step
function generateBotMessage(step, leadData, userMessage) {
  const messages = {
    ask_name: "Hey there! 👋 I'm Osuolale's assistant. What's your name?",

    ask_email: `Nice to meet you, ${leadData.name}! 😊 What's your email address?`,

    ask_project: `Got it! What kind of project are you looking to build?`,

    ask_budget: `Interesting! What's your budget range for this project?`,

    complete: `Thanks for the info, ${leadData.name}! We'll be in touch soon.`
  };

  return messages[step] || messages.ask_name;
}

// Call Claude ONLY for the final personalized message
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
        model: 'anthropic/claude-opus-5-fast',
        max_tokens: 100,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error('Claude call failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;

  } catch (err) {
    console.error('Claude error:', err.message);
    // Fallback message if Claude fails
    return `Perfect, ${leadData.name}! Osuolale will review your ${leadData.project} project and reach out at ${leadData.email} soon. Typical timeline: 1-2 weeks.`;
  }
}
