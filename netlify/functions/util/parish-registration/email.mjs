import nodemailer from 'nodemailer';
import { buildAttachmentFileName, buildParishRegistrationSummaryHtml } from './summary.mjs';

const getEnv = (key) => {
  if (globalThis.Netlify?.env?.get) {
    return globalThis.Netlify.env.get(key);
  }

  return process.env[key];
};

const getRecipients = () =>
  (getEnv('PARISH_REGISTRATION_EMAIL') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

export const sendParishRegistrationEmail = async (value, pdfBytes) => {
  const recipients = getRecipients();

  if (recipients.length === 0) {
    throw new Error('PARISH_REGISTRATION_EMAIL is not configured.');
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: getEnv('GMAIL_USERNAME'),
      pass: getEnv('GMAIL_PASSWORD'),
    },
  });

  const info = await transporter.sendMail({
    from: 'no-reply@stjosephchurchbluffton.org',
    to: recipients,
    replyTo: value.family.familyEmail || undefined,
    subject: 'New Parish Registration Submission',
    html: buildParishRegistrationSummaryHtml(value),
    attachments: [
      {
        filename: buildAttachmentFileName(value),
        content: Buffer.from(pdfBytes),
        contentType: 'application/pdf',
      },
    ],
  });

  if (!info.messageId) {
    throw new Error('Unable to send parish registration email.');
  }
};
