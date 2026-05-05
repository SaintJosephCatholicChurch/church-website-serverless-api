import { sendParishRegistrationEmail } from './util/parish-registration/email.mjs';
import { generateParishRegistrationPdf } from './util/parish-registration/pdf.mjs';
import { sanitizeParishRegistration } from './util/parish-registration/sanitize.mjs';
import { validateParishRegistration } from './util/parish-registration/validate.mjs';
import { generateJsonResponse, logFunctionError } from './util/response.mjs';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return generateJsonResponse(event, 200, { message: 'OK' });
  }

  if (event.httpMethod !== 'POST') {
    return generateJsonResponse(event, 405, { message: 'Method not allowed.' });
  }

  let parsedBody;

  try {
    parsedBody = JSON.parse(event.body ?? '{}');
  } catch {
    return generateJsonResponse(event, 400, { message: 'Invalid JSON payload.' });
  }

  const sanitizedSubmission = sanitizeParishRegistration(parsedBody);
  const validationErrors = validateParishRegistration(sanitizedSubmission);

  if (validationErrors.length > 0) {
    return generateJsonResponse(event, 400, {
      message: 'Invalid parish registration submission.',
      errors: validationErrors,
    });
  }

  try {
    const pdfBytes = await generateParishRegistrationPdf(sanitizedSubmission);
    await sendParishRegistrationEmail(sanitizedSubmission, pdfBytes);
  } catch (error) {
    logFunctionError('parish-registration', event, error, {
      validationErrorCount: validationErrors.length,
    });
    return generateJsonResponse(event, 500, { message: 'Unable to submit parish registration.' });
  }

  return generateJsonResponse(event, 200, {
    message: 'Parish registration submitted successfully.',
  });
};
