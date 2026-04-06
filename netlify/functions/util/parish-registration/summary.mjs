const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatBooleanChoice = (value) => {
  if (value === true || value === 'yes') {
    return 'Yes';
  }

  if (value === false || value === 'no') {
    return 'No';
  }

  return '';
};

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

const isYes = (value) => value === true || value === 'yes';

const formatValue = (value) => {
  const normalized = String(value ?? '').trim();
  return normalized === '' ? '—' : normalized;
};

// --- Email styling constants ---
const BRAND_RED = '#bf303c';
const BRAND_DARK = '#822129';
const TEXT_COLOR = '#202020';
const MUTED_COLOR = '#5c5c5c';
const FIELD_FILL = '#f3f3f3';
const SECTION_UNDERLINE = 'rgba(191,48,60,0.18)';

const buildFieldCard = (label, value, width = '50%') => `
  <td style="width:${width}; vertical-align:top; padding:0 4px 8px 4px;">
    <table role="presentation" style="width:100%; border-collapse:collapse; table-layout:fixed;">
      <tr>
        <td style="padding:3px 6px; font-family:Arial, Helvetica, sans-serif;">
          <div style="font-size:9px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; color:${MUTED_COLOR}; padding:0 0 1px 0;">
            ${escapeHtml(label)}
          </div>
          <div style="padding:1px 6px 2px 6px; font-size:13px; line-height:1.35; color:${TEXT_COLOR}; white-space:pre-line; overflow-wrap:anywhere; background:${FIELD_FILL};">
            ${escapeHtml(formatValue(value))}
          </div>
        </td>
      </tr>
    </table>
  </td>
`;

const buildFieldGrid = (rows) => {
  const layoutRows = [];
  let currentRow = [];

  for (const field of rows) {
    if (field.wide) {
      if (currentRow.length > 0) {
        layoutRows.push(currentRow);
        currentRow = [];
      }

      layoutRows.push([{ ...field, width: '100%' }]);
    } else {
      currentRow.push({ ...field, width: '50%' });

      if (currentRow.length === 2) {
        layoutRows.push(currentRow);
        currentRow = [];
      }
    }
  }

  if (currentRow.length > 0) {
    layoutRows.push(currentRow);
  }

  return `
    <table role="presentation" style="width:100%; border-collapse:collapse; table-layout:fixed;">
      ${layoutRows
        .map((row) => {
          const cells = row.map((field) => buildFieldCard(field.label, field.value, field.width)).join('');
          const filler =
            row.length === 1 && row[0].width === '50%' ? '<td style="width:50%; padding:0 4px 8px 4px;"></td>' : '';
          return `<tr>${cells}${filler}</tr>`;
        })
        .join('')}
    </table>
  `;
};

const buildCheckboxHtml = (label, checked) => {
  const boxStyle = checked
    ? 'display:inline-block; width:14px; height:14px; border:1.5px solid #2e9e47; background:#edfaef; vertical-align:middle; text-align:center; font-size:11px; line-height:14px; color:#2e9e47; font-weight:bold;'
    : 'display:inline-block; width:14px; height:14px; border:1.5px solid #bbb; background:#fff; vertical-align:middle;';

  return `
    <span style="${boxStyle}">${checked ? '✓' : ''}</span>
    <span style="vertical-align:middle; padding-left:6px; font-size:14px; color:${TEXT_COLOR};">${escapeHtml(label)}</span>
  `;
};

const buildSacramentGroup = (baptism, isCatholic, sacramentList) => `
  <div style="padding:4px 4px 0 4px;">
    <div style="font-size:10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${BRAND_DARK}; padding:0 0 2px 6px;">
      Sacraments
    </div>
    <table role="presentation" style="width:100%; border-collapse:collapse;">
      <tr>
        <td style="width:50%; padding:0 4px 6px 4px;">${buildCheckboxHtml('Baptized?', isYes(baptism.received))}</td>
        <td style="width:50%; padding:0 4px 6px 4px;">${buildCheckboxHtml('Catholic?', isYes(isCatholic))}</td>
      </tr>
    </table>
    ${buildFieldGrid([{ label: 'Baptism Date', value: baptism.date, wide: true }])}
    <table role="presentation" style="width:100%; border-collapse:collapse; margin-top:4px;">
      <tr>
        ${sacramentList
          .map(
            (sac) => `
              <td style="width:33.33%; vertical-align:top; padding:0 4px;">
                <div style="padding:2px 0 6px 6px;">${buildCheckboxHtml(`${sac.name}?`, isYes(sac.data.received))}</div>
                ${buildFieldGrid([{ label: `${sac.name} Date`, value: sac.data.date, wide: true }])}
              </td>
            `,
          )
          .join('')}
      </tr>
    </table>
  </div>
`;

export const buildAttachmentFileName = (value) => {
  const lastName =
    value.family.lastName !== '' ? value.family.lastName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'family';
  const date = value.family.registrationDate || new Date().toISOString().slice(0, 10);

  return `parish-registration-${date}-${lastName}.pdf`;
};

const buildMemberLabel = (label, addTopPadding = false) => `
  <div style="font-size:13px; font-weight:700; color:${MUTED_COLOR}; padding:${addTopPadding ? '12px' : '0'} 4px 4px 4px; text-transform:uppercase; letter-spacing:0.04em;">
    ${escapeHtml(label)}
  </div>
`;

const buildSection = (title, content) => `
  <div style="padding-top:14px;">
    <div style="font-family:Arial, Helvetica, sans-serif; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:${BRAND_RED}; border-bottom:2px solid ${SECTION_UNDERLINE}; padding-bottom:5px; margin-bottom:8px;">
      ${escapeHtml(title)}
    </div>
    ${content}
  </div>
`;

const buildFamilySection = (value) =>
  buildSection(
    'Family Information',
    buildFieldGrid([
      { label: 'Family Last Name', value: value.family.lastName },
      { label: 'First Name(s)', value: value.family.firstNames },
      { label: 'Mailing Name', value: value.family.mailingName, wide: true },
      { label: 'Address', value: value.family.address, wide: true },
      { label: 'Address Line 2', value: value.family.addressLine2, wide: true },
      { label: 'City', value: value.family.city },
      { label: 'State', value: value.family.state },
      { label: 'Zip', value: value.family.zip },
      { label: 'Home Phone', value: value.family.homePhone },
      { label: 'Emergency Phone', value: value.family.emergencyPhone },
      { label: 'Family Email', value: value.family.familyEmail },
      { label: 'Env#', value: value.family.envelopeNumber },
    ]),
  );

const buildAdultsSection = (value) =>
  buildSection(
    'Individual Member Information',
    value.adults
      .map(
        (adult, index) => `
          ${buildMemberLabel(`Adult ${index + 1}`, index > 0)}
          ${buildFieldGrid([
            { label: 'Parish Status', value: formatTitleCase(adult.parishStatus) },
            { label: 'Role', value: adult.role },
            { label: 'First Name', value: adult.firstName },
            { label: 'Nickname', value: adult.nickname },
            { label: 'Maiden Name', value: adult.maidenName },
            { label: 'Gender', value: adult.gender },
            { label: 'Date of Birth', value: adult.dateOfBirth },
            { label: 'Birthplace', value: adult.birthplace },
            { label: 'First Language', value: adult.firstLanguage },
            { label: 'Occupation', value: adult.occupation },
            { label: 'Employer', value: adult.employer },
            { label: 'Work Phone', value: adult.workPhone },
            { label: 'Cell Phone', value: adult.cellPhone },
            { label: 'Email', value: adult.email, wide: true },
          ])}
          ${buildSacramentGroup(adult.sacraments.baptism, adult.isCatholic, [
            { name: 'Reconciliation', data: adult.sacraments.reconciliation },
            { name: 'First Eucharist', data: adult.sacraments.eucharist },
            { name: 'Confirmation', data: adult.sacraments.confirmation },
          ])}
        `,
      )
      .join(''),
  );

const buildMarriageRow = (value) =>
  `
    <table role="presentation" style="width:100%; border-collapse:collapse; table-layout:fixed; margin-top:4px;">
      <tr>
        <td style="width:25%; vertical-align:top; padding:0 4px 8px 4px;">
          ${buildFieldGrid([{ label: 'Marital Status', value: formatTitleCase(value.marriage?.maritalStatus ?? ''), wide: true }])}
        </td>
        <td style="vertical-align:middle; padding:0 4px 8px 12px;">
          <div style="padding:8px 0 0 0;">${buildCheckboxHtml('Valid Catholic Marriage?', isYes(value.marriage?.validCatholicMarriage))}</div>
        </td>
      </tr>
    </table>
  `;

const buildPriestVisitRow = (value) => `
  <table role="presentation" style="width:100%; border-collapse:collapse; margin-top:2px;">
    <tr>
      <td style="width:130px; vertical-align:middle; padding:0 4px 8px 4px;">
        <div style="padding:10px 0 0 6px;">${buildCheckboxHtml('Priest Visit?', isYes(value.additional.priestVisitRequested))}</div>
      </td>
      <td style="vertical-align:top; padding:0 4px 8px 4px;">
        ${buildFieldGrid([{ label: 'Priest Visit Details', value: value.additional.priestVisitDetails, wide: true }])}
      </td>
    </tr>
  </table>
`;

const buildChildrenSection = (value) => {
  if (value.children.length === 0) {
    return buildSection(
      'Dependent Children Information',
      `<div style="padding:10px 4px; font-size:14px; font-style:italic; color:#666;">No children or dependents listed.</div>`,
    );
  }

  return buildSection(
    'Dependent Children Information',
    value.children
      .map(
        (child, index) => `
          ${buildMemberLabel(`Child ${index + 1}`, index > 0)}
          ${buildFieldGrid([
            { label: 'Relationship to Head of Household', value: child.relationshipToHeadOfHousehold, wide: true },
            { label: 'First Name', value: child.firstName },
            { label: 'Last Name', value: child.lastName },
            { label: 'Gender', value: child.gender },
            { label: 'Birthdate', value: child.birthdate },
            { label: 'Birthplace', value: child.birthplace },
            { label: 'School', value: child.school },
            { label: 'H.S. Grad Yr', value: child.highSchoolGraduationYear },
            { label: 'First Language', value: child.firstLanguage },
          ])}
          ${buildSacramentGroup(child.sacraments.baptism, child.isCatholic, [
            { name: 'Reconciliation', data: child.sacraments.reconciliation },
            { name: 'First Eucharist', data: child.sacraments.eucharist },
            { name: 'Confirmation', data: child.sacraments.confirmation },
          ])}
        `,
      )
      .join(''),
  );
};

export const buildParishRegistrationSummaryText = (value) => {
  const lines = [
    'New Parish Registration Submission',
    '',
    `Family: ${formatValue(value.family.lastName)} / ${formatValue(value.family.firstNames)}`,
    `Registration Date: ${formatValue(value.family.registrationDate)}`,
    `Family Email: ${formatValue(value.family.familyEmail)}`,
    `Home Phone: ${formatValue(value.family.homePhone)}`,
    `Address: ${formatValue(`${value.family.address} ${value.family.addressLine2}`.trim())}`,
    `City / State / Zip: ${formatValue([value.family.city, value.family.state, value.family.zip].filter(Boolean).join(', '))}`,
    '',
    `Adults: ${value.adults.length}`,
    `Children / Dependents: ${value.children.length}`,
    `Marital Status: ${formatValue(formatTitleCase(value.marriage?.maritalStatus ?? ''))}`,
    `Valid Catholic Marriage?: ${formatValue(formatBooleanChoice(value.marriage?.validCatholicMarriage))}`,
    `Priest Visit Requested: ${formatValue(formatBooleanChoice(value.additional.priestVisitRequested))}`,
  ];

  return lines.join('\n');
};

export const buildParishRegistrationSummaryHtml = (value) => `
  <div style="margin:0; padding:24px 0; font-family:Arial, Helvetica, sans-serif; color:${TEXT_COLOR}; background:#f5f5f5;">
    <div style="max-width:820px; margin:0 auto; border:1px solid #d9d9d9; background:#fff;">
      <div style="padding:28px 28px 32px 28px;">
        <div style="font-family:Arial, Helvetica, sans-serif; font-size:22px; font-weight:700; line-height:1.2; color:${TEXT_COLOR};">
          St. Joseph Catholic Church
        </div>
        <div style="padding-top:2px; font-size:15px; color:${BRAND_RED}; letter-spacing:0.02em;">
          Parish Registration Form
        </div>
        <div style="padding-top:8px; font-size:13px; line-height:1.6; color:${MUTED_COLOR};">
          1300 N. Main St., Bluffton, IN 46714 · (260) 824-1380<br />
          Submitted on ${escapeHtml(formatValue(value.family.registrationDate))}
        </div>

        ${buildFamilySection(value)}
        ${buildAdultsSection(value)}
        ${buildMarriageRow(value)}
        ${buildPriestVisitRow(value)}
        ${buildChildrenSection(value)}
      </div>
    </div>
  </div>
`;
