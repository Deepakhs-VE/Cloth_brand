import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { emailService } from './emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const recipient = process.argv[2] || process.env.EMAIL_USER;

if (!recipient) {
  console.error('Usage: npm run email:test -- recipient@example.com');
  process.exit(1);
}

try {
  await emailService.verifyConnection();
  const info = await emailService.sendMail({
    to: recipient,
    subject: 'AURA SMTP Test',
    text: 'Your AURA SMTP configuration is working correctly.',
    html: '<h2>AURA SMTP Test</h2><p>Your SMTP configuration is working correctly.</p>',
  });
  console.log(`[Email Test] Delivered successfully: ${info.messageId}`);
  process.exit(0);
} catch (error) {
  console.error(`[Email Test] Failed: ${error.message}`);
  process.exit(1);
}
