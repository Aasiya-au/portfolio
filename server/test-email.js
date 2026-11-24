// Run `npm run test-email`: sends one test message through the real contact pipeline.
// Screenshot the output + the email in your inbox as "evidence of successful delivery".
import 'dotenv/config';
import { sendContact, verifyMailer } from './mailer.js';

try {
  await verifyMailer();
  console.log('SMTP login OK.');
  await sendContact({
    name: 'Portfolio test',
    email: process.env.SMTP_USER,
    subject: 'Test message from the portfolio server',
    message: `This is a test sent at ${new Date().toISOString()}.\nIf you can read this, the contact system works.`,
  });
  console.log(`Sent! Check the inbox of ${process.env.CONTACT_TO || process.env.SMTP_USER}.`);
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
}
