const { Resend } = require("resend");
const resend = new Resend(process.env.RESEND_API_KEY);

async function sendResetCodeEmail({ to, code }) {
  const from = process.env.EMAIL_FROM || "TaskBH <noreply@taskbh.com>";
  const subject = "Your TaskBH password reset code";
  const html = `
    <div style="font-family:Arial,sans-serif;font-size:16px;line-height:1.5">
      <p>Hello,</p>
      <p>Use this code to reset your TaskBH password:</p>
      <p style="font-size:24px;font-weight:bold;letter-spacing:4px">${code}</p>
      <p>This code will expire in 15 minutes.</p>
    </div>
  `;

  await resend.emails.send({ from, to, subject, html });
}

module.exports = { sendResetCodeEmail };
