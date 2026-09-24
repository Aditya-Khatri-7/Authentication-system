import nodemailer from 'nodemailer';

class EmailService {
  /**
   * Generates a reusable HTML master email wrapper
   */
  getMasterTemplate(title, bodyContent, securityWarning) {
    const currentTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const warningHTML = securityWarning
      ? `<div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; border-radius: 8px; margin: 24px 0; font-size: 13px; color: #991b1b; text-align: left;">
           <strong>⚠️ Security Alert:</strong> ${securityWarning}
         </div>`
      : '';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${title}</title>
        </head>
        <body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
          <div style="max-width: 600px; margin: 24px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <!-- Header Block -->
            <div style="background: linear-gradient(135deg, #1e3a8a, #2563eb); padding: 32px; text-align: center; color: #ffffff;">
              <div style="font-size: 32px; font-weight: 850; letter-spacing: -0.5px; margin-bottom: 6px;">🛡️ Enterprise Auth</div>
              <div style="font-size: 13px; opacity: 0.85; font-family: monospace; letter-spacing: 1px; text-transform: uppercase;">Secure Password Recovery</div>
            </div>
            
            <!-- Body Content -->
            <div style="padding: 40px 32px; line-height: 1.6; text-align: left; font-size: 15px;">
              ${bodyContent}
              ${warningHTML}
            </div>
            
            <!-- Support & Brand Footer -->
            <div style="background-color: #f1f5f9; padding: 24px 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0;">This is an automated notification. Generated at <strong>${currentTime} IST</strong>.</p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">&copy; 2026 Enterprise Authentication System. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Initializes Nodemailer transporter dynamically from environment properties
   */
  getTransporter() {
    const host = process.env.EMAIL_HOST;
    const port = process.env.EMAIL_PORT;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_APP_PASSWORD;

    if (!host || !user || !pass) {
      return null;
    }

    try {
      return nodemailer.createTransport({
        host,
        port: parseInt(port) || 587,
        secure: port === '465',
        auth: { user, pass },
      });
    } catch (error) {
      console.warn(`[SMTP Warning] Connection setup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Helper to trigger email delivery or log fallback if SMTP is unconfigured
   */
  async sendEmail(options) {
    const transporter = this.getTransporter();
    const from = process.env.EMAIL_FROM || `"Enterprise Auth Service" <${process.env.EMAIL_USER || 'noreply@auth.local'}>`;

    if (!transporter) {
      console.warn(`\n[SMTP Warning] Email service not configured in .env.`);
      console.log(`[SMTP Log Fallback] To: ${options.to} | Subject: "${options.subject}"`);
      return false;
    }

    try {
      await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });
      console.log(`[SMTP Success] Email delivered to ${options.to}`);
      return true;
    } catch (error) {
      console.warn(`[SMTP Warning] Failed to deliver email to ${options.to}: ${error.message}`);
      return false;
    }
  }

  /**
   * Sends password reset OTP email
   */
  async sendPasswordResetEmail(email, otp) {
    const title = 'Reset Your Password';
    const bodyContent = `
      <h2 style="color: #1e3a8a; margin-top: 0; margin-bottom: 16px;">Password Reset Request</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your account. Please use the following OTP code to proceed:</p>
      
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 12px; text-align: center; margin: 28px 0;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e3a8a; font-family: monospace;">${otp}</span>
      </div>
      
      <p>This code is valid for <strong>10 minutes</strong>. If you did not request this password reset, no action is required.</p>
    `;
    const warning = 'If you did not request a password reset, please secure your account immediately.';

    const html = this.getMasterTemplate(title, bodyContent, warning);
    return await this.sendEmail({ to: email, subject: 'Password Reset Request - OTP Code', html });
  }

  /**
   * Sends confirmation email after password reset
   */
  async sendPasswordChangedEmail(email) {
    const title = 'Password Reset Successfully';
    const bodyContent = `
      <h2 style="color: #15803d; margin-top: 0; margin-bottom: 16px;">Password Updated</h2>
      <p>Hello,</p>
      <p>Your account password has been updated successfully.</p>
      <p>If you did not perform this action, please contact support immediately.</p>
    `;
    const warning = 'If this was not done by you, your account may be compromised.';

    const html = this.getMasterTemplate(title, bodyContent, warning);
    return await this.sendEmail({ to: email, subject: 'Security Alert: Password Reset Completed', html });
  }
}

export default new EmailService();
