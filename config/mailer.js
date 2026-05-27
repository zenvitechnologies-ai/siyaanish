// config/mailer.js
const postmark = require('postmark');

// Initialize Postmark client
const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN);

const mailer = {
  // Send email using Postmark
  sendPostmarkEmail: async (to, subject, htmlBody, textBody, attachments = []) => {
    try {
      const emailData = {
        From: process.env.POSTMARK_FROM_ADDRESS,
        To: to,
        Subject: subject,
        HtmlBody: htmlBody,
        TextBody: textBody,
        MessageStream: "outbound",
      };
      
      // Add attachments if any (e.g., PDF invoice)
      if (attachments.length > 0) {
        emailData.Attachments = attachments;
      }
      
      const response = await client.sendEmail(emailData);
      console.log(`Postmark email sent to ${to}, MessageID: ${response.MessageID}`);
      return { success: true, messageId: response.MessageID };
    } catch (error) {
      console.error('Postmark error:', error);
      return { success: false, error: error.message };
    }
  },
  
  // Send template email (if you create templates in Postmark dashboard)
  sendPostmarkTemplate: async (to, templateId, templateModel) => {
    try {
      const response = await client.sendEmailWithTemplate({
        From: process.env.POSTMARK_FROM_ADDRESS,
        To: to,
        TemplateId: templateId,
        TemplateModel: templateModel,
        MessageStream: "outbound",
      });
      return { success: true, messageId: response.MessageID };
    } catch (error) {
      console.error('Postmark template error:', error);
      return { success: false, error: error.message };
    }
  }
};

module.exports = mailer;