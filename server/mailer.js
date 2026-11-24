import nodemailer from 'nodemailer';

let transporter;
function getTransport() {
  if (!transporter) {
    const { SMTP_USER, SMTP_PASS } = process.env;
    if (!SMTP_USER || !SMTP_PASS) {
      const e = new Error('Email is not configured (set SMTP_USER and SMTP_PASS in server/.env)');
      e.status = 503;
      throw e;
    }
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT || 465),
      secure: (process.env.SMTP_SECURE ?? 'true') !== 'false',
      auth: { user: SMTP_USER, pass: SMTP_PASS.replace(/\s+/g, '') },
    });
  }
  return transporter;
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export async function sendContact({ name, email, subject, message }) {
  const to = process.env.CONTACT_TO || process.env.SMTP_USER;
  const safeName = name.replace(/["<>]/g, '');
  await getTransport().sendMail({
    from: `"Portfolio contact" <${process.env.SMTP_USER}>`, // must be your own address; visitors go in replyTo
    to,
    replyTo: `"${safeName}" <${email}>`,
    subject: `[Portfolio] ${subject}`,
    text: `From: ${name} <${email}>\n\n${message}`,
    html: `<p><strong>From:</strong> ${esc(name)} &lt;${esc(email)}&gt;</p><p style="white-space:pre-wrap">${esc(message)}</p>`,
  });
}

export async function verifyMailer() {
  await getTransport().verify();
}
