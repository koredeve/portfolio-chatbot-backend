const express = require('express');
const app = express();
app.use(express.json());

const chatHandler = require('./api/chat.js');

app.post('/api/chat', chatHandler);

const server = app.listen(3002, async () => {
  console.log('✅ Test server running\n');
  
  try {
    console.log('🧪 Testing Claude Opus chatbot...\n');
    
    let history = [];
    const steps = [
      { user: 'kelight', label: '[NAME]' },
      { user: 'kelight@gmail.com', label: '[EMAIL]' },
      { user: 'AI Trading Bot', label: '[PROJECT]' },
      { user: '5000', label: '[BUDGET]' }
    ];

    for (const { user, label } of steps) {
      const res = await fetch('http://localhost:3002/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: user, conversationHistory: history })
      });

      const data = await res.json();
      console.log(`${label} User: "${user}"`);
      console.log(`${label} Bot: "${data.message}"\n`);

      history.push({ role: 'user', content: user }, { role: 'assistant', content: data.message });
    }

    console.log('✅ Test complete! Claude Opus is working.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
});

setTimeout(() => {
  console.error('❌ Test timeout');
  process.exit(1);
}, 30000);
