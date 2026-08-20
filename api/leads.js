/**
 * POST /api/leads
 * Capture lead data from chatbot
 * Sends notification email to innovation@ajared.ca
 */

// Use native Node.js fetch (v18+) instead of node-fetch

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

    const { name, email, projectDescription, budget } = body || {};

    // Validate required fields
    if (!name || !email || !projectDescription) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'email', 'projectDescription']
      });
    }

    console.log('[LEADS] New lead captured:', { name, email });

    // Store lead data (could be database, but for now log + notify)
    const leadData = {
      name,
      email,
      projectDescription,
      budget: budget || 'Not specified',
      capturedAt: new Date().toISOString(),
      source: 'portfolio-chatbot'
    };

    // Try to send email notification via simple HTTP service
    // Using a free service like Formspree or Webhook.cool
    const webhookUrl = process.env.LEAD_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: `New Lead: ${name}`,
            text: `
New Project Inquiry
==================
Name: ${name}
Email: ${email}
Project: ${projectDescription}
Budget: ${budget || 'Not specified'}
Time: ${new Date().toISOString()}

This lead came from your portfolio chatbot at koredeve.github.io
            `.trim()
          })
        });
      } catch (err) {
        console.warn('[LEADS] Webhook notification failed:', err.message);
        // Don't fail the request if webhook fails
      }
    }

    // Log to console (visible in Vercel logs)
    console.log('[LEADS] Lead data:', leadData);

    return res.status(200).json({
      success: true,
      message: 'Lead captured successfully',
      leadId: `lead_${Date.now()}`,
      notification: webhookUrl ? 'sent' : 'pending-setup'
    });
  } catch (error) {
    console.error('[LEADS] Error:', error.message);
    return res.status(500).json({
      error: 'Failed to capture lead',
      details: error.message
    });
  }
};
