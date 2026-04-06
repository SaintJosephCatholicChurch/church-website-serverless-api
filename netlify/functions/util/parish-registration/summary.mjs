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
const FIELD_BORDER = '#d5d5d5';
const GROUP_BORDER = '#e3c7c9'; // subtle red tint matching rgba(191,48,60,0.14)
const GROUP_BG = '#fdfafa';
const SECTION_UNDERLINE = 'rgba(191,48,60,0.25)';

const buildFieldCard = (label, value, width = '50%') => `
  <td style="width:${width}; vertical-align:top; padding:0 4px 6px 4px;">
    <table role="presentation" style="width:100%; border-collapse:collapse; border:1px solid ${FIELD_BORDER}; background:#fff;">
      <tr>
        <td style="padding:6px 10px; font-family:Arial, Helvetica, sans-serif;">
          <div style="font-size:9px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; color:${MUTED_COLOR};">
            ${escapeHtml(label)}
          </div>
          <div style="padding-top:3px; font-size:13px; line-height:1.4; color:${TEXT_COLOR}; white-space:pre-line;">
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
    <table role="presentation" style="width:100%; border-collapse:collapse;">
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

const buildSacramentGroup = (title, subtitle, baptism, isCatholic, sacramentList) => `
  <div style="padding:10px; border:1px solid ${GROUP_BORDER}; background:${GROUP_BG}; margin-bottom:6px;">
    <div style="font-size:10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${BRAND_DARK}; padding-bottom:4px;">
      ${escapeHtml(title)}
    </div>
    ${subtitle ? `<div style="font-size:11px; line-height:1.4; font-style:italic; color:#666; padding-bottom:8px;">${escapeHtml(subtitle)}</div>` : ''}
    <table role="presentation" style="width:100%; border-collapse:collapse; padding-bottom:6px;">
      <tr>
        <td style="width:50%; padding:4px 0;">${buildCheckboxHtml('Baptized?', isYes(baptism.received))}</td>
        <td style="width:50%; padding:4px 0;">${buildCheckboxHtml('Catholic?', isYes(isCatholic))}</td>
      </tr>
    </table>
    <table role="presentation" style="width:100%; border-collapse:collapse;">
      <tr>${buildFieldCard('Baptism Date', baptism.date, '100%')}</tr>
    </table>
    <table role="presentation" style="width:100%; border-collapse:collapse; margin-top:4px;">
      <tr>
        ${sacramentList
          .map(
            (sac) => `
          <td style="width:33.33%; vertical-align:top; padding:0 4px 0 0;">
            <div style="padding:4px 0;">${buildCheckboxHtml(`${sac.name}?`, isYes(sac.data.received))}</div>
            <table role="presentation" style="width:100%; border-collapse:collapse; border:1px solid ${FIELD_BORDER}; background:#fff;">
              <tr>
                <td style="padding:6px 10px; font-family:Arial, Helvetica, sans-serif;">
                  <div style="font-size:9px; font-weight:700; letter-spacing:0.05em; text-transform:uppercase; color:${MUTED_COLOR};">${escapeHtml(sac.name)} DATE</div>
                  <div style="padding-top:3px; font-size:13px; line-height:1.4; color:${TEXT_COLOR};">${escapeHtml(formatValue(sac.data.date))}</div>
                </td>
              </tr>
            </table>
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

const buildGroup = (title, rows, options = {}) => {
  const subtitleMarkup = options.subtitle
    ? `<div style="font-size:11px; line-height:1.4; font-style:italic; color:#666; padding-bottom:6px; margin-top:-2px;">${escapeHtml(options.subtitle)}</div>`
    : '';

  return `
    <div style="padding:10px; border:1px solid ${GROUP_BORDER}; background:${GROUP_BG}; margin-bottom:6px;">
      ${title ? `<div style="font-size:10px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase; color:${BRAND_DARK}; padding-bottom:6px;">${escapeHtml(title)}</div>` : ''}
      ${subtitleMarkup}
      ${buildFieldGrid(rows)}
    </div>
  `;
};

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
    [
      buildGroup('Household Details', [
        { label: 'Last Name', value: value.family.lastName },
        { label: 'First Name(s)', value: value.family.firstNames },
        { label: 'Mailing Name', value: value.family.mailingName, wide: true },
      ]),
      buildGroup('Address', [
        { label: 'Address', value: value.family.address, wide: true },
        { label: 'Address Line 2', value: value.family.addressLine2, wide: true },
        { label: 'City', value: value.family.city },
        { label: 'State', value: value.family.state },
        { label: 'Zip', value: value.family.zip },
      ]),
      buildGroup('Contact Details', [
        { label: 'Home Phone', value: value.family.homePhone },
        { label: 'Emergency Phone', value: value.family.emergencyPhone },
        { label: 'Family Email', value: value.family.familyEmail },
        { label: 'Env#', value: value.family.envelopeNumber },
      ]),
    ].join(''),
  );

const buildAdultSection = (adult, index) =>
  buildSection(
    `Adult Member ${index + 1}`,
    [
      buildGroup('Basic Information', [
        { label: 'Parish Status', value: adult.parishStatus },
        { label: 'Role', value: adult.role },
        { label: 'First Name', value: adult.firstName },
        { label: 'Nickname', value: adult.nickname },
        { label: 'Gender', value: adult.gender },
        { label: 'Maiden Name', value: adult.maidenName },
      ]),
      buildGroup('Contact And Background', [
        { label: 'Date of Birth', value: adult.dateOfBirth },
        { label: 'Birthplace', value: adult.birthplace },
        { label: 'Email', value: adult.email, wide: true },
        { label: 'Work Phone', value: adult.workPhone },
        { label: 'Cell Phone', value: adult.cellPhone },
        { label: 'First Language', value: adult.firstLanguage },
        { label: 'Occupation', value: adult.occupation },
        { label: 'Employer', value: adult.employer },
      ]),
      buildSacramentGroup(
        'Sacramental Information',
        'Check if sacrament received. Add date if known.',
        adult.sacraments.baptism,
        adult.isCatholic,
        [
          { name: 'Reconciliation', data: adult.sacraments.reconciliation },
          { name: 'First Eucharist', data: adult.sacraments.eucharist },
          { name: 'Confirmation', data: adult.sacraments.confirmation },
        ],
      ),
    ].join(''),
  );

const buildMarriageSection = (value) =>
  buildSection(
    'Marriage Information',
    buildGroup(null, [
      { label: 'Marital Status', value: value.marriage?.maritalStatus ?? '' },
      { label: 'Valid Catholic Marriage?', value: formatBooleanChoice(value.marriage?.validCatholicMarriage) },
    ]),
  );

const buildAdditionalSection = (value) =>
  buildSection(
    'Additional Information',
    buildGroup('Pastoral Care', [
      {
        label: 'Would any household member like to be visited by a priest?',
        value: formatBooleanChoice(value.additional.priestVisitRequested),
        wide: true,
      },
      { label: 'Priest Visit Details', value: value.additional.priestVisitDetails, wide: true },
    ]),
  );

const buildChildrenSection = (value) => {
  if (value.children.length === 0) {
    return buildSection(
      'Children / Dependents',
      `<div style="padding:14px; border:1px solid ${GROUP_BORDER}; background:${GROUP_BG}; font-size:14px; font-style:italic; color:#666;">No children or dependents listed.</div>`,
    );
  }

  return buildSection(
    'Children / Dependents',
    value.children
      .map(
        (child, index) => `
          <div style="font-size:13px; font-weight:700; color:${MUTED_COLOR}; padding:${index > 0 ? '16px' : '0'} 0 8px 0;">
            ${escapeHtml(`Child / Dependent ${index + 1}`)}
          </div>
          ${buildGroup('Basic Information', [
            { label: 'Relationship To Head of Household', value: child.relationshipToHeadOfHousehold, wide: true },
            { label: 'First Name', value: child.firstName },
            { label: 'Last Name', value: child.lastName },
            { label: 'Gender', value: child.gender },
            { label: 'Birthdate', value: child.birthdate },
            { label: 'Birthplace', value: child.birthplace },
          ])}
          ${buildGroup('School And Background', [
            { label: 'School', value: child.school },
            { label: 'H.S. Grad Yr', value: child.highSchoolGraduationYear },
            { label: 'First Language', value: child.firstLanguage },
          ])}
          ${buildSacramentGroup(
            'Sacramental Information',
            'Check if sacrament received. Add date if known.',
            child.sacraments.baptism,
            child.isCatholic,
            [
              { name: 'Reconciliation', data: child.sacraments.reconciliation },
              { name: 'First Eucharist', data: child.sacraments.eucharist },
              { name: 'Confirmation', data: child.sacraments.confirmation },
            ],
          )}
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
    `Marital Status: ${formatValue(value.marriage?.maritalStatus ?? '')}`,
    `Valid Catholic Marriage?: ${formatValue(formatBooleanChoice(value.marriage?.validCatholicMarriage))}`,
    `Priest Visit Requested: ${formatValue(formatBooleanChoice(value.additional.priestVisitRequested))}`,
  ];

  return lines.join('\n');
};

export const buildParishRegistrationSummaryHtml = (value) => `
  <div style="margin:0; padding:24px 0; font-family:Arial, Helvetica, sans-serif; color:${TEXT_COLOR}; background:#f5f5f5;">
    <div style="max-width:820px; margin:0 auto; border:1px solid #d9d9d9; background:#fff;">
      <div style="height:4px; background:${BRAND_RED};"></div>
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
        ${value.adults.map((adult, index) => buildAdultSection(adult, index)).join('')}
        ${buildMarriageSection(value)}
        ${buildAdditionalSection(value)}
        ${buildChildrenSection(value)}
      </div>
    </div>
  </div>
`;
