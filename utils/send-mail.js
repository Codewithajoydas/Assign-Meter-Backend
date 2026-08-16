// utils/send-mail.js
const transporter = require("../config/nodemailer"); // no destructure

async function sendEmail({ to, subject, text, html }) {
  try {
    const info = await transporter.sendMail({
    from: `"Assign Meter" <${process.env.EMAIL}>`,
      to,
      subject,
      text,
      html,
    });
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Email sending failed:", error);
    return { success: false, error: error.message };
  }
}

module.exports = { sendEmail };