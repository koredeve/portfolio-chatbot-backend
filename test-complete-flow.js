const express = require('express');
const app = express();
app.use(express.json());

const chatHandler = require('./api/chat.js');
app.post('/api/chat', chatHandler);

const server = app.listen(3004, async () => {
  console.log('✅ Test server running\n');
  
  try {
    console.log('🧪 Testing complete flow with Claude Opus final message...\n');
    
    let history = [];
    const steps = [
      { user: 'kelight', label: 'Name' },
      { user: 'kelight@gmail.com', label: 'Email' },
      { user: 'AI Trading Bot', label: 'Project' },
      { user: '8500', label: 'Budget' },
      { user: 'ready', label: 'Final' }  // Trigger the Claude message
    ];

    for (const { user, label } of steps) {
      const res = await fetch('http://localhost:3004/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: user, conversationHistory: history })
      });

      const data = await res.json();
      const complete = data.isComplete ? '✅ COMPLETE' : '⏳ Continuing';
      console.log(`📝 ${label}:`);
      console.log(`   User said: "${user}"`);
      console.log(`   Bot said: "${data.message}"`);
      console.log(`   Status: ${complete}\n`);

      if (data.isComplete) {
        console.log('🎉 Final lead data received:');
        console.log(JSON.stringify(data.leadData, null, 2));
        break;
      }

      history.push({ role: 'user', content: user }, { role: 'assistant', content: data.message });
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
});

setTimeout(() => {
  console.error('❌ Timeout');
  process.exit(1);
}, 35000);
