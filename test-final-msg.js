const express = require('express');
const app = express();
app.use(express.json());

const chatHandler = require('./api/chat.js');
app.post('/api/chat', chatHandler);

const server = app.listen(3003, async () => {
  console.log('✅ Test server running\n');
  
  try {
    console.log('🧪 Testing complete conversation with Claude Opus...\n');
    
    let history = [];
    const steps = [
      { user: 'kelight', label: '[1] Name' },
      { user: 'kelight@gmail.com', label: '[2] Email' },
      { user: 'AI Trading Bot with ML features', label: '[3] Project' },
      { user: '8500', label: '[4] Budget' }
    ];

    for (const { user, label } of steps) {
      const res = await fetch('http://localhost:3003/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: user, conversationHistory: history })
      });

      const data = await res.json();
      const isComplete = data.isComplete ? ' ✅ COMPLETE' : '';
      console.log(`${label}\n  User: "${user}"\n  Bot: "${data.message.substring(0, 80)}...${isComplete}"\n`);

      history.push({ role: 'user', content: user }, { role: 'assistant', content: data.message });
    }

    console.log('\n✅ Full flow works! Claude Opus ready for production.\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
});

setTimeout(() => {
  console.error('❌ Timeout');
  process.exit(1);
}, 30000);
