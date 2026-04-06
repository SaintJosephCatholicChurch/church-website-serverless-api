const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatTitleCase = (value) => {
  const normalized = String(value ?? '').trim();

  if (normalized === '') {
    return '';
  }

  return normalized
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

const formatValue = (value) => {
  const normalized = String(value ?? '').trim();
  return normalized === '' ? '—' : normalized;
};

const formatDisplayDate = (value) => {
  const normalized = String(value ?? '').trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return formatValue(value);
  }

  const [year, month, day] = normalized.split('-');
  return `${month}/${day}/${year}`;
};

const formatAdultNames = (adults) => {
  const names = adults
    .map((adult) =>
      [adult.firstName, adult.nickname, adult.maidenName].find((part) => String(part ?? '').trim() !== ''),
    )
    .filter(Boolean)
    .map((name) => formatValue(name));

  return names.length > 0 ? names.join(', ') : '—';
};

const formatHouseholdName = (value) => {
  const mailingName = String(value?.family?.mailingName ?? '').trim();

  if (mailingName !== '') {
    return mailingName;
  }

  return formatValue(value?.family?.lastName);
};

export const buildAttachmentFileName = (value) => {
  const lastName =
    value.family.lastName !== '' ? value.family.lastName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'family';
  const date = value.family.registrationDate || new Date().toISOString().slice(0, 10);

  return `parish-registration-${date}-${lastName}.pdf`;
};

export const buildParishRegistrationSummaryText = (value) => {
  const householdLine = formatHouseholdName(value);
  const lines = [
    'Someone registered at St. Joseph Catholic Church.',
    '',
    `Household: ${householdLine}`,
    `Adults: ${value.adults.length} (${formatAdultNames(value.adults)})`,
    `Children / Dependents: ${value.children.length}`,
    `Submitted: ${formatDisplayDate(value.family.registrationDate)}`,
    `Family Email: ${formatValue(value.family.familyEmail)}`,
    '',
    'The completed registration form is attached.',
  ];

  return lines.join('\n');
};

export const buildParishRegistrationSummaryHtml = (value) => {
  const householdLine = formatHouseholdName(value);
  const adultNames = formatAdultNames(value.adults);

  return `
    <div style="margin:0; padding:24px 0; font-family:Arial, Helvetica, sans-serif; color:#202020; background:#f5f5f5;">
      <div style="max-width:680px; margin:0 auto; border:1px solid #d9d9d9; background:#fff;">
        <div style="padding:28px 28px 32px 28px;">
          <div style="font-size:22px; font-weight:700; line-height:1.2; color:#202020;">
            Someone registered.
          </div>
          <div style="padding-top:6px; font-size:14px; line-height:1.5; color:#5c5c5c;">
            A new parish registration was submitted to St. Joseph Catholic Church.
          </div>

          <div style="padding-top:18px;">
            <table role="presentation" style="width:100%; border-collapse:collapse; table-layout:fixed;">
              <tr>
                <td style="width:40%; padding:0 10px 10px 0; font-size:12px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; color:#5c5c5c;">
                  Household
                </td>
                <td style="padding:0 0 10px 0; font-size:14px; line-height:1.4; color:#202020;">
                  ${escapeHtml(householdLine)}
                </td>
              </tr>
              <tr>
                <td style="width:40%; padding:0 10px 10px 0; font-size:12px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; color:#5c5c5c;">
                  Adults
                </td>
                <td style="padding:0 0 10px 0; font-size:14px; line-height:1.4; color:#202020;">
                  ${escapeHtml(`${value.adults.length} (${adultNames})`)}
                </td>
              </tr>
              <tr>
                <td style="width:40%; padding:0 10px 10px 0; font-size:12px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; color:#5c5c5c;">
                  Dependent Children
                </td>
                <td style="padding:0 0 10px 0; font-size:14px; line-height:1.4; color:#202020;">
                  ${escapeHtml(String(value.children.length))}
                </td>
              </tr>
              <tr>
                <td style="width:40%; padding:0 10px 10px 0; font-size:12px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; color:#5c5c5c;">
                  Submitted
                </td>
                <td style="padding:0 0 10px 0; font-size:14px; line-height:1.4; color:#202020;">
                  ${escapeHtml(formatDisplayDate(value.family.registrationDate))}
                </td>
              </tr>
              <tr>
                <td style="width:40%; padding:0 10px 10px 0; font-size:12px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; color:#5c5c5c;">
                  Family Email
                </td>
                <td style="padding:0 0 10px 0; font-size:14px; line-height:1.4; color:#202020;">
                  ${escapeHtml(formatValue(value.family.familyEmail))}
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-top:20px; padding-top:14px; border-top:1px solid #e2e2e2; font-size:14px; line-height:1.5; color:#5c5c5c;">
            The completed registration form is attached.
          </div>
        </div>
      </div>
    </div>
  `;
};
