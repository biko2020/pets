const sgMail = require('@sendgrid/mail');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');

// Initialize SendGrid with API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  constructor() {
    this.templates = {};
    this.loadTemplates();
  }

  async loadTemplates() {
    try {
      // Load email templates
      const templatesDir = path.join(__dirname, '../templates/emails');
      const templates = {
        newMessage: await fs.readFile(path.join(templatesDir, 'newMessage.html'), 'utf-8'),
        newReview: await fs.readFile(path.join(templatesDir, 'newReview.html'), 'utf-8'),
        reviewResponse: await fs.readFile(path.join(templatesDir, 'reviewResponse.html'), 'utf-8'),
        welcome: await fs.readFile(path.join(templatesDir, 'welcome.html'), 'utf-8'),
        resetPassword: await fs.readFile(path.join(templatesDir, 'resetPassword.html'), 'utf-8'),
      };

      // Compile templates
      for (const [name, template] of Object.entries(templates)) {
        this.templates[name] = handlebars.compile(template);
      }
    } catch (error) {
      console.error('Failed to load email templates:', error);
    }
  }

  async sendEmail(to, subject, templateName, data) {
    try {
      if (!this.templates[templateName]) {
        throw new Error(`Template ${templateName} not found`);
      }

      const html = this.templates[templateName](data);
      
      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject,
        html,
      };

      await sgMail.send(msg);
      console.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  // Specific email sending methods
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to Pet Professionals Network!';
    return this.sendEmail(user.email, subject, 'welcome', {
      firstName: user.firstName,
      loginUrl: `${process.env.FRONTEND_URL}/login`,
      supportEmail: process.env.SUPPORT_EMAIL
    });
  }

  async sendNewMessageEmail(recipient, sender, messagePreview) {
    const subject = 'New Message Received';
    return this.sendEmail(recipient.email, subject, 'newMessage', {
      recipientName: recipient.firstName,
      senderName: `${sender.firstName} ${sender.lastName}`,
      messagePreview: messagePreview.substring(0, 150) + (messagePreview.length > 150 ? '...' : ''),
      messageUrl: `${process.env.FRONTEND_URL}/messages`,
      unsubscribeUrl: `${process.env.FRONTEND_URL}/settings/notifications`
    });
  }

  async sendNewReviewEmail(recipient, reviewer, review) {
    const subject = 'New Review Received';
    return this.sendEmail(recipient.email, subject, 'newReview', {
      recipientName: recipient.firstName,
      reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
      rating: review.rating,
      reviewTitle: review.title,
      reviewContent: review.content.substring(0, 200) + (review.content.length > 200 ? '...' : ''),
      profileUrl: `${process.env.FRONTEND_URL}/profile/${recipient.id}`,
      unsubscribeUrl: `${process.env.FRONTEND_URL}/settings/notifications`
    });
  }

  async sendReviewResponseEmail(recipient, business, review, response) {
    const subject = 'Response to Your Review';
    return this.sendEmail(recipient.email, subject, 'reviewResponse', {
      recipientName: recipient.firstName,
      businessName: business.name,
      reviewTitle: review.title,
      responseContent: response.substring(0, 200) + (response.length > 200 ? '...' : ''),
      profileUrl: `${process.env.FRONTEND_URL}/profile/${business.id}`,
      unsubscribeUrl: `${process.env.FRONTEND_URL}/settings/notifications`
    });
  }

  async sendPasswordResetEmail(user, resetToken) {
    const subject = 'Reset Your Password';
    return this.sendEmail(user.email, subject, 'resetPassword', {
      firstName: user.firstName,
      resetUrl: `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`,
      supportEmail: process.env.SUPPORT_EMAIL,
      expiryTime: '1 hour'
    });
  }
}

module.exports = new EmailService();
