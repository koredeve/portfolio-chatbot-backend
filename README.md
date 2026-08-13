# Portfolio Chatbot Backend

Secure backend for AI-powered lead capture chatbot. Proxies to OpenRouter (Claude), hides API key from frontend.

## Features

✨ **Smart Chatbot**
- Knows about your projects (MemeDash, Wallet Analyzer, etc.)
- Understands your expertise & services
- Qualifies leads naturally

🔒 **Secure**
- API key hidden from frontend
- All calls proxied through backend
- Frontend never sees sensitive data

📥 **Lead Capture**
- Collects: Name, Email, Project, Budget
- Webhook notifications (optional)
- Vercel logs for tracking

## Setup

### 1. Deploy to Vercel

```bash
vercel login
vercel deploy
```

### 2. Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
OPENROUTER_API_KEY=sk-or-v1-xxxxx
```

### 3. (Optional) Email Notifications

Create free form at https://formspree.io/:
1. Sign up
2. Create new form → get URL
3. Add to Vercel: `LEAD_WEBHOOK_URL=https://formspree.io/f/xxxxx`

## API Endpoints

### POST /api/chat
Send message, get AI response

```bash
curl -X POST https://your-domain.vercel.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about your services",
    "conversationHistory": []
  }'
```

### POST /api/leads
Capture lead data

```bash
curl -X POST https://your-domain.vercel.app/api/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "projectDescription": "Build an AI chatbot",
    "budget": "$5000"
  }'
```

## Frontend Integration

Use from `koredeve.github.io/chat.html`:

```javascript
const BACKEND_URL = 'https://your-domain.vercel.app';

async function chat(message) {
  const res = await fetch(`${BACKEND_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      conversationHistory: [] // pass full history
    })
  });
  return res.json();
}
```

## Customization

Edit `/api/chat.js` → `PORTFOLIO_CONTEXT` to change:
- Your expertise
- Project descriptions
- Pricing
- Services offered

## Status

✅ Ready to deploy
✅ All endpoints working
✅ Lead capture active
✅ Secure & isolated

---

Made with ❤️ by koredeve
