import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      this.transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10) || 587,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
    }
  }

  async sendMail({ to, subject, html, text }) {
    try {
      if (this.transporter && process.env.NODE_ENV === 'production') {
        const info = await this.transporter.sendMail({
          from: `"AURA Concierge" <${process.env.EMAIL_FROM || 'support@aurastore.com'}>`,
          to,
          subject,
          text: text || '',
          html,
        });
        console.log(`[Email Sent] To: ${to} | Subject: ${subject} | ID: ${info.messageId}`);
        return info;
      } else {
        // Fallback logger for dev/staging
        console.log(`\n================== [OUTGOING EMAIL NOTIFICATION] ==================`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Message Preview:\n${text || 'HTML email content generated.'}`);
        console.log(`===================================================================\n`);
        return { messageId: `mock-${Date.now()}` };
      }
    } catch (error) {
      console.error(`[Email Error] Failed to send email to ${to}:`, error.message);
      return null;
    }
  }

  async sendWelcomeEmail(user) {
    const subject = 'Welcome to AURA - Exquisite Modern Living';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h1 style="color: #0f172a; margin-bottom: 8px;">Welcome to AURA, ${user.name}!</h1>
        <p>We are thrilled to welcome you to our curated community of discerning connoisseurs.</p>
        <p>Explore your private account, save items to your wishlist, and enjoy complimentary worldwide shipping on qualifying orders.</p>
        <div style="margin: 24px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/products" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Explore Collection</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">With highest regards,<br>The AURA Concierge Team</p>
      </div>
    `;
    const text = `Welcome to AURA, ${user.name}! Explore our curated collection at ${process.env.CLIENT_URL || 'http://localhost:5173'}/products.`;
    return this.sendMail({ to: user.email, subject, html, text });
  }

  async sendPasswordResetEmail(user, resetUrl) {
    const subject = 'Password Reset Request - AURA Account';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a;">Password Reset Instructions</h2>
        <p>Hello ${user.name},</p>
        <p>You requested a password reset for your AURA account. Please click the button below within 30 minutes to set a new password:</p>
        <div style="margin: 24px 0;">
          <a href="${resetUrl}" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 13px; color: #64748b;">If you did not request this, please disregard this email. Your password will remain unchanged.</p>
      </div>
    `;
    const text = `Password Reset: Click this link within 30 minutes to reset your password: ${resetUrl}`;
    return this.sendMail({ to: user.email, subject, html, text });
  }

  async sendOrderConfirmationEmail(order, user) {
    const subject = `Order Confirmed #${order.orderNumber} - AURA`;
    const itemsList = order.orderItems
      .map(
        (item) => `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">${item.name} (x${item.quantity})</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: right;">$${item.total.toFixed(2)}</td>
        </tr>`
      )
      .join('');

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a;">Thank you for your order, ${user.name}!</h2>
        <p>Your order <strong>#${order.orderNumber}</strong> has been received and is being prepared with utmost care.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f8fafc;">
              <th style="padding: 8px; text-align: left;">Item</th>
              <th style="padding: 8px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList}
          </tbody>
          <tfoot>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Total:</td>
              <td style="padding: 8px; font-weight: bold; text-align: right;">$${order.totalAmount.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
        <p>Shipping to: ${order.shippingAddress.streetAddress}, ${order.shippingAddress.city}, ${order.shippingAddress.postalCode}</p>
      </div>
    `;
    const text = `Order #${order.orderNumber} Confirmed! Total: $${order.totalAmount.toFixed(2)}. Track in your account.`;
    return this.sendMail({ to: user.email, subject, html, text });
  }

  async sendShippingNotification(order, user) {
    const subject = `Your Order #${order.orderNumber} is on the way! - AURA`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a;">Your order is on the way!</h2>
        <p>Great news, ${user.name}! Order <strong>#${order.orderNumber}</strong> has been dispatched.</p>
        <p>Carrier: <strong>${order.carrier || 'Express Courier'}</strong></p>
        <p>Tracking Number: <strong>${order.trackingNumber || 'Available in account dashboard'}</strong></p>
      </div>
    `;
    const text = `Order #${order.orderNumber} dispatched! Carrier: ${order.carrier}, Tracking: ${order.trackingNumber}.`;
    return this.sendMail({ to: user.email, subject, html, text });
  }

  async sendDeliveryNotification(order, user) {
    const subject = `Your Order #${order.orderNumber} has been Delivered - AURA`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a;">Your package has arrived!</h2>
        <p>Hello ${user.name}, order <strong>#${order.orderNumber}</strong> has been marked as delivered.</p>
        <p>We hope you love your selection. Please take a moment to leave a review!</p>
      </div>
    `;
    const text = `Order #${order.orderNumber} delivered. Enjoy your purchase!`;
    return this.sendMail({ to: user.email, subject, html, text });
  }
}

export const emailService = new EmailService();
