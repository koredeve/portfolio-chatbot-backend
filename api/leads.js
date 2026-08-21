/**
 * POST /api/leads
 * Capture lead data from chatbot
 * Sends notification email to kelightsub@gmail.com
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

    const { name, email, projectDescription, budget } = data;

    // Validate required fields
    if (!name || !email || !projectDescription) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Missing required fields',
        required: ['name', 'email', 'projectDescription']
      }));
      return;
    }

    console.log('[LEADS] New lead captured:', { name, email });

    const leadData = {
      name,
      email,
      projectDescription,
      budget: budget || 'Not specified',
      capturedAt: new Date().toISOString(),
      source: 'portfolio-chatbot'
    };

    // Try to send email notification via Formspree
    const formspreeUrl = process.env.FORMSPREE_URL;
    if (formspreeUrl) {
      try {
        await fetch(formspreeUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            email: email,
            _subject: `New Lead: ${name}`,
            message: `
New Project Inquiry
==================
Name: ${name}
Email: ${email}
Project: ${projectDescription}
Budget: $${budget || 'Not specified'}
Time: ${new Date().toISOString()}

This lead came from your portfolio chatbot at koredeve.github.io
            `.trim()
          })
        });
        console.log('[LEADS] Email sent to kelightsub@gmail.com via Formspree');
      } catch (err) {
        console.warn('[LEADS] Formspree notification failed:', err.message);
      }
    } else {
      console.warn('[LEADS] FORMSPREE_URL not configured');
    }

    console.log('[LEADS] Lead data:', leadData);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      message: 'Lead captured successfully',
      leadId: `lead_${Date.now()}`,
      notification: formspreeUrl ? 'sent' : 'pending-setup'
    }));

  } catch (error) {
    console.error('[LEADS] Error:', error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Failed to capture lead',
      details: error.message
    }));
  }
};
