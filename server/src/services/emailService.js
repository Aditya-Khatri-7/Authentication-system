import nodemailer from 'nodemailer';

class EmailService {
  /**
   * Generates a reusable, responsive master HTML wrapper for all branding emails
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
              <div style="font-size: 13px; opacity: 0.85; font-family: monospace; letter-spacing: 1px; text-transform: uppercase;">Secure Access Services</div>
            </div>
            
            <!-- Body Content -->
            <div style="padding: 40px 32px; line-height: 1.6; text-align: left; font-size: 15px;">
              ${bodyContent}
              ${warningHTML}
            </div>
            
            <!-- Support & Brand Footer -->
            <div style="background-color: #f1f5f9; padding: 24px 32px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px 0;">This is an automated notification. Generated at <strong>${currentTime} IST</strong>.</p>
              <p style="margin: 0 0 12px 0;">Need assistance? Contact our security response team at <a href="mailto:support@auth.local" style="color: #2563eb; text-decoration: none; font-weight: 500;">support@auth.local</a></p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">&copy; 2026 Enterprise Authentication Service. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Initializes a Nodemailer transporter dynamically from environment properties
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
        auth: {
          user,
          pass,
        },
      });
    } catch (error) {
      console.warn(`[SMTP Warning] Failed to initialize SMTP connection transporter: ${error.message}`);
      return null;
    }
  }

  /**
   * Low-level helper to trigger email delivery or log fallback if SMTP is unavailable
   */
  async sendEmail(options) {
    const transporter = this.getTransporter();
    const from = process.env.EMAIL_FROM || `"Enterprise Authentication Service" <${process.env.EMAIL_USER || 'noreply@auth.local'}>`;

    if (!transporter) {
      console.warn(`\n[SMTP Warning] Email service not configured. OTP skipped.`);
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
      console.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      console.warn(`\n[SMTP Warning] Failed to deliver email to ${options.to}: ${error.message}`);
      return false;
    }
  }

  /**
   * Sends a generic OTP email
   */
  async sendOTPEmail(email, otp, purpose) {
    const title = 'Your Verification OTP Code';
    const cleanPurpose = purpose.replace(/_/g, ' ');
    const bodyContent = `
      <h2 style="color: #1e3a8a; margin-top: 0; margin-bottom: 16px;">One-Time Password (OTP)</h2>
      <p>Hello,</p>
      <p>You requested a verification code for the purpose of <strong>${cleanPurpose}</strong>.</p>
      
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 12px; text-align: center; margin: 28px 0;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e3a8a; font-family: monospace;">${otp}</span>
      </div>
      
      <p>This code will expire in <strong>10 minutes</strong>. Please do not share this code with anyone.</p>
    `;
    const warning = 'If you did not initiate this request, someone else may be attempting to access your account. Please secure your details immediately.';

    const html = this.getMasterTemplate(title, bodyContent, warning);
    return await this.sendEmail({ to: email, subject: `[OTP] ${cleanPurpose}`, html });
  }

  /**
   * Sends email verification OTP
   */
  async sendVerificationEmail(email, otp) {
    const title = 'Verify Your Email Address';
    const bodyContent = `
      <h2 style="color: #1e3a8a; margin-top: 0; margin-bottom: 16px;">Confirm Your Email</h2>
      <p>Hello,</p>
      <p>Welcome to our security platform. Please verify your email address by using the 6-digit verification code below:</p>
      
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 12px; text-align: center; margin: 28px 0;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e3a8a; font-family: monospace;">${otp}</span>
      </div>
      
      <p>This code is valid for <strong>10 minutes</strong>. Once verified, your account setup will be complete.</p>
    `;
    const warning = 'If you did not register on our portal, you can safely ignore this notification.';

    const html = this.getMasterTemplate(title, bodyContent, warning);
    return await this.sendEmail({ to: email, subject: 'Verify Your Email - OTP Code', html });
  }

  /**
   * Sends password reset OTP
   */
  async sendPasswordResetEmail(email, otp) {
    const title = 'Reset Your Password';
    const bodyContent = `
      <h2 style="color: #1e3a8a; margin-top: 0; margin-bottom: 16px;">Password Reset Request</h2>
      <p>Hello,</p>
      <p>We received a request to reset the password for your account. Please use the following code to proceed:</p>
      
      <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 12px; text-align: center; margin: 28px 0;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #1e3a8a; font-family: monospace;">${otp}</span>
      </div>
      
      <p>This code is valid for <strong>10 minutes</strong>. If you do not wish to reset your password, no action is required.</p>
    `;
    const warning = 'If you did not request a password reset, please change your security credentials immediately as your account might be compromised.';

    const html = this.getMasterTemplate(title, bodyContent, warning);
    return await this.sendEmail({ to: email, subject: 'Password Reset Request - OTP Code', html });
  }

  /**
   * Sends security alert notification
   */
  async sendSecurityAlertEmail(email, alertDetails) {
    const title = 'Security Alert Notification';
    const bodyContent = `
      <h2 style="color: #b91c1c; margin-top: 0; margin-bottom: 16px;">Critical Security Alert</h2>
      <p>Hello,</p>
      <p>We detected an event on your account that requires your immediate attention:</p>
      
      <div style="background-color: #fef2f2; border: 1px solid #fca5a5; padding: 18px; border-radius: 10px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #991b1b;">
          <strong>Detail:</strong> ${alertDetails}
        </p>
      </div>
      
      <p>If this was you, you can safely ignore this alert. If you do not recognize this activity, please log in and change your password immediately.</p>
    `;
    const warning = 'Our automated systems detected this suspicious pattern. Please monitor your active logins and sessions.';

    const html = this.getMasterTemplate(title, bodyContent, warning);
    return await this.sendEmail({ to: email, subject: '⚠️ Security Alert Notification', html });
  }

  /**
   * Sends password changed notification
   */
  async sendPasswordChangedEmail(email, userName = 'User', ip = 'unknown') {
    const title = 'Your Password Was Changed Successfully';
    const bodyContent = `
      <h2 style="color: #16a34a; margin-top: 0; margin-bottom: 16px;">Password Updated Successfully</h2>
      <p>Hello ${userName},</p>
      <p>This is to confirm that the password for your account has been successfully changed.</p>
      
      <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 18px; border-radius: 10px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #166534;">
          <strong>Request Location/IP:</strong> ${ip}<br>
          <strong>Status:</strong> Completed Successfully
        </p>
      </div>
      
      <p>All existing active web sessions on other devices have been logged out for security purposes.</p>
    `;
    const warning = 'If you did not make this change, please contact our security team immediately at support@auth.local as your credentials may have been compromised.';

    const html = this.getMasterTemplate(title, bodyContent, warning);
    return await this.sendEmail({ to: email, subject: '🔑 Password Changed Successfully', html });
  }

  /**
   * Compatibility wrapper mapping the legacy sendVerificationOTP function
   */
  async sendVerificationOTP(email, otp) {
    return await this.sendVerificationEmail(email, otp);
  }
}

export default new EmailService();
