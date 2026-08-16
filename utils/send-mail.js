// utils/send-mail.js
const transporter = require("../config/nodemailer"); // no destructure

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sends an email. Never throws — always resolves with a
 * { success: boolean, ... } shape so callers (e.g. Promise.allSettled
 * consumers) can inspect failures without try/catch gymnastics.
 *
 * @param {Object} opts
 * @param {string|string[]} opts.to
 * @param {string} opts.subject
 * @param {string} [opts.text]
 * @param {string} [opts.html]
 * @param {number} [opts.retries=2] number of retry attempts on transient failure
 */
async function sendEmail({ to, subject, text, html, retries = 2 }) {
  const startedAt = Date.now();

  // ---- Validate inputs before touching the network ----
  const recipients = Array.isArray(to) ? to : [to];
  const invalidRecipients = recipients.filter(
    (addr) => !addr || !EMAIL_REGEX.test(String(addr).trim()),
  );

  if (recipients.length === 0 || invalidRecipients.length > 0) {
    console.error(
      `[send-mail] Refusing to send — invalid recipient(s): ${JSON.stringify(invalidRecipients)}`,
    );
    return { success: false, error: "invalid_recipient", invalidRecipients };
  }

  if (!subject || !subject.trim()) {
    console.error("[send-mail] Refusing to send — missing subject line");
    return { success: false, error: "missing_subject" };
  }

  if (!text && !html) {
    console.error("[send-mail] Refusing to send — no text or html body provided");
    return { success: false, error: "missing_body" };
  }

  if (!transporter) {
    console.error(
      "[send-mail] No transporter available from ../config/nodemailer — check that module's exports and env vars",
    );
    return { success: false, error: "transporter_unavailable" };
  }

  if (!process.env.EMAIL) {
    console.error(
      "[send-mail] process.env.EMAIL is not set — 'from' address will be malformed",
    );
    return { success: false, error: "missing_from_address" };
  }

  const mailOptions = {
    from: `"Assign Meter" <${process.env.EMAIL}>`,
    to: recipients.join(", "),
    subject: subject.trim(),
    text,
    html,
  };

  let lastError = null;

  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);

      const rejected = info.rejected || [];
      if (rejected.length > 0) {
        console.error(
          `[send-mail] Server accepted the request but rejected some recipients: ${rejected.join(", ")}`,
        );
        return {
          success: false,
          error: "partially_rejected",
          rejected,
          accepted: info.accepted,
          messageId: info.messageId,
        };
      }

      console.log(
        `[send-mail] Sent to ${recipients.join(", ")} — messageId=${info.messageId}, attempt=${attempt}, ${Date.now() - startedAt}ms`,
      );
      return { success: true, messageId: info.messageId, accepted: info.accepted };
    } catch (error) {
      lastError = error;
      const isLastAttempt = attempt === retries + 1;

      console.error(
        `[send-mail] Attempt ${attempt}/${retries + 1} failed for ${recipients.join(", ")}: ${error.message}`,
        { code: error.code, command: error.command },
      );

      if (isLastAttempt) break;

      // Backoff before retrying: 500ms, 1000ms, ...
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }

  console.error(
    `[send-mail] Giving up after ${retries + 1} attempt(s) for ${recipients.join(", ")}. Last error: ${lastError?.message}`,
  );

  return {
    success: false,
    error: "send_failed",
    message: lastError?.message,
    code: lastError?.code,
  };
}

module.exports = { sendEmail };