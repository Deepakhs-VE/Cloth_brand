import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.configSignature = '';
  }

  getTransporter() {
    const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_SECURE } = process.env;
    if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
      const error = new Error('SMTP is not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS.');
      error.statusCode = 503;
      throw error;
    }

    const port = Number.parseInt(EMAIL_PORT, 10) || 587;
    const secure = EMAIL_SECURE === 'true' || port === 465;
    const signature = `${EMAIL_HOST}:${port}:${EMAIL_USER}:${secure}`;

    if (!this.transporter || this.configSignature !== signature) {
      this.transporter = nodemailer.createTransport({
        host: EMAIL_HOST,
        port,
        secure,
        requireTLS: !secure,
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      });
      this.configSignature = signature;
    }

    return this.transporter;
  }

  async verifyConnection() {
    await this.getTransporter().verify();
    return true;
  }

  async sendMail({ to, subject, html, text }) {
    if (process.env.EMAIL_MODE === 'log') {
      console.log(`[Email Preview] To: ${to} | Subject: ${subject}`);
      return { messageId: `preview-${Date.now()}` };
    }

    const info = await this.getTransporter().sendMail({
      from: process.env.EMAIL_FROM || '"AURA Concierge" <support@aurastore.com>',
      to,
      subject,
      text: text || '',
      html,
    });
    console.log(`[Email Sent] To: ${to} | Subject: ${subject} | ID: ${info.messageId}`);
    return info;
  }

  async sendWelcomeEmail(user) {
    const subject = 'Welcome to AURA - Exquisite Modern Living';
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h1 style="color: #0f172a; margin-bottom: 8px;">Welcome to AURA, ${user.name}!</h1>
        <p>We are thrilled to welcome you to our curated community of discerning connoisseurs.</p>
        <p>Explore your private account, save items to your wishlist, and enjoy complimentary worldwide shipping on qualifying orders.</p>
        <div style="margin: 24px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5174'}/products" style="background-color: #0f172a; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Explore Collection</a>
        </div>
        <p style="color: #64748b; font-size: 14px;">With highest regards,<br>The AURA Concierge Team</p>
      </div>
    `;
    const text = `Welcome to AURA, ${user.name}! Explore our curated collection at ${process.env.CLIENT_URL || 'http://localhost:5174'}/products.`;
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

  async sendRefundUpdateEmail(order, user) {
    const request = order.refundRequest;
    if (!request || !user?.email) return null;

    const statusLabel = request.status.toLowerCase().replace(/_/g, ' ');
    const requestLabel = request.type === 'RETURN' ? 'Return' : 'Cancellation';
    const subject = `${requestLabel} request ${statusLabel} #${order.orderNumber} - AURA`;
    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a;">${requestLabel} request update</h2>
        <p>Hello ${user.name}, your request for order <strong>#${order.orderNumber}</strong> is now <strong>${statusLabel}</strong>.</p>
        ${request.adminNote ? `<p>Store note: ${request.adminNote}</p>` : ''}
        ${request.type === 'RETURN' && request.status === 'APPROVED' ? '<p>Please follow the return instructions provided by our support team. Your refund will be issued after the parcel is received and inspected.</p>' : ''}
        ${request.status === 'COMPLETED' ? `<p>A full refund of <strong>$${order.totalAmount.toFixed(2)}</strong> was sent to your original Stripe payment method. Bank processing time may vary.</p>` : ''}
      </div>
    `;
    const text = `${requestLabel} request for order #${order.orderNumber}: ${statusLabel}.${request.adminNote ? ` Store note: ${request.adminNote}` : ''}`;
    return this.sendMail({ to: user.email, subject, html, text });
  }
}

export const emailService = new EmailService();
