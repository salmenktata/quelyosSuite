const express = require('express');
const router = express.Router();
const Brevo = require('@getbrevo/brevo');

// POST /api/v1/test-email
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    // Get Brevo configuration from database
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const config = await prisma.emailProviderConfig.findFirst({
      where: { isEnabled: true }
    });

    if (!config || !config.apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Email service not configured. Please configure Brevo in Super Admin settings.'
      });
    }

    // Initialize Brevo API
    const apiInstance = new Brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, config.apiKey);

    const sendSmtpEmail = new Brevo.SendSmtpEmail();

    sendSmtpEmail.subject = "🧪 Test Email from Quelyos";
    sendSmtpEmail.htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f172a; color: #e2e8f0; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
          .header { text-align: center; margin-bottom: 32px; }
          .logo { font-size: 24px; font-weight: bold; color: white; }
          .card { background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1)); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 16px; padding: 32px; margin: 24px 0; }
          .icon { font-size: 48px; text-align: center; margin-bottom: 16px; }
          h1 { color: #a78bfa; margin: 0 0 16px 0; font-size: 24px; text-align: center; }
          .message { color: #cbd5e1; line-height: 1.6; text-align: center; }
          .badge { display: inline-block; background: rgba(34, 197, 94, 0.2); color: #4ade80; border: 1px solid rgba(34, 197, 94, 0.3); padding: 8px 16px; border-radius: 12px; font-size: 14px; font-weight: 600; margin: 16px 0; }
          .footer { text-align: center; margin-top: 40px; color: #64748b; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">✨ Quelyos</div>
          </div>

          <div class="card">
            <div class="icon">✅</div>
            <h1>Email Configuration Test Successful!</h1>
            <p class="message">
              Congratulations! Your Brevo email service is properly configured and working.
            </p>
            <p class="message">
              You can now receive Cash Alerts F93, transaction notifications, and other important updates.
            </p>
            <div style="text-align: center;">
              <span class="badge">✓ Configuration Verified</span>
            </div>
          </div>

          <div class="footer">
            <p>This is a test email from Quelyos Super Admin</p>
            <p>Mode: ${config.mode || 'production'}</p>
            <p>© 2026 Quelyos. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
    sendSmtpEmail.sender = {
      name: config.senderName || 'Quelyos',
      email: config.senderEmail || 'noreply@quelyos.com'
    };
    sendSmtpEmail.to = [{ email, name: email.split('@')[0] }];
    sendSmtpEmail.replyTo = {
      email: config.senderEmail || 'noreply@quelyos.com',
      name: config.senderName || 'Quelyos'
    };

    // Send email
    const result = await apiInstance.sendTransacEmail(sendSmtpEmail);

    // Update test result in database
    await prisma.emailProviderConfig.update({
      where: { id: config.id },
      data: {
        lastTestedAt: new Date(),
        testResult: 'SUCCESS'
      }
    });

    await prisma.$disconnect();

    res.json({
      success: true,
      message: `Test email sent successfully to ${email}`,
      messageId: result.messageId
    });

  } catch (error) {
    console.error('Test email error:', error);

    // Try to update failure in database
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      const config = await prisma.emailProviderConfig.findFirst({ where: { isEnabled: true } });
      if (config) {
        await prisma.emailProviderConfig.update({
          where: { id: config.id },
          data: {
            lastTestedAt: new Date(),
            testResult: `FAILED: ${error.message}`
          }
        });
      }
      await prisma.$disconnect();
    } catch (dbError) {
      console.error('Failed to update test result:', dbError);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to send test email'
    });
  }
});

module.exports = router;
