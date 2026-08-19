/**
 * POST /api/chat
 * Secure chatbot endpoint - proxies to OpenRouter with portfolio knowledge
 * Hides API key from frontend, captures lead data
 */

// Use native Node.js fetch (v18+) instead of node-fetch

// Portfolio knowledge base
const PORTFOLIO_CONTEXT = `
You are a professional AI assistant for Osuolale Quyum (koredeve), an AI Engineer and Solana Developer based in Africa.

ABOUT OSUOLALE:
- AI Engineer specializing in production-grade AI systems
- Expert in LLM integrations (Claude, GPT, OpenRouter)
- Builds real-time Solana DeFi applications
- Experienced with trading systems, web scraping, automation
- Based in Africa, works with global clients

COMPLETED PROJECTS:
1. MemeDash - Real-time memecoin scanner
   - Pump.fun websocket integration
   - Token scoring algorithm
   - Telegram alerts (70+ per day)
   - DexScreener metrics
   - Production-grade infrastructure

2. Wallet Analyzer - Smart money profiling
   - Jupiter Portfolio integration
   - Claude AI analysis
   - Win rate & PnL tracking
   - Real-time wallet analytics
   - 1-10 smart money scoring

3. Various AI Chatbots & Automation Systems
   - Lead capture systems
   - Discord/Telegram bots
   - Custom integrations
   - Real-time monitoring

SERVICES OFFERED:
- Custom AI applications & chatbots
- LLM integrations & prompt engineering
- Solana DeFi system development
- Real-time scanning & alert systems
- Trading bot development
- Web scraping & data analysis
- Production infrastructure setup

PRICING:
- Typical project: $2,000 - $5,000
- Scope-dependent
- Can discuss custom rates
- Fast turnaround (1-2 weeks typical)

COMMUNICATION:
- Email: kelightsub@gmail.com
- Ready to discuss projects
- Available for consultations
- Quick response time

IMPORTANT INSTRUCTIONS:
1. Be friendly, professional, encouraging
2. Show genuine interest in their project
3. Ask qualifying questions to understand their needs
4. Mention relevant completed projects when applicable
5. Be clear about typical timelines and investment
6. Collect: Name → Email → Project Description → Budget
7. After collecting all info, confirm you'll have Osuolale reach out
8. Keep responses short (1-2 sentences max)
9. Ask one question at a time
`;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'message required' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Build messages with portfolio context
    const messages = [
      {
        role: 'system',
        content: PORTFOLIO_CONTEXT
      },
      ...conversationHistory,
      {
        role: 'user',
        content: message
      }
    ];

    // Call OpenRouter
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
        max_tokens: 200,
        messages: messages
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenRouter error:', error);
      return res.status(response.status).json({
        error: error.error?.message || 'AI service error'
      });
    }

    const data = await response.json();
    const botMessage = data.choices[0].message.content;

    return res.status(200).json({
      success: true,
      message: botMessage,
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
