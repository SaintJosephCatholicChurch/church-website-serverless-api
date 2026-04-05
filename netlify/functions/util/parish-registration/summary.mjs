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

const formatValue = (value) => {
  const normalized = String(value ?? '').trim();
  return normalized === '' ? '—' : normalized;
};

const buildFieldCard = (label, value, width = '50%') => `
  <td style="width:${width}; vertical-align:top; padding:0 6px 12px 6px;">
    <table role="presentation" style="width:100%; border-collapse:collapse; border:1px solid #d5d5d5;">
      <tr>
        <td style="padding:10px 12px; font-family:Arial, Helvetica, sans-serif;">
          <div style="font-size:11px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; color:#5c5c5c;">
            ${escapeHtml(label)}
          </div>
          <div style="padding-top:5px; font-size:14px; line-height:1.45; color:#202020; white-space:pre-line;">
            ${escapeHtml(formatValue(value))}
          </div>
        </td>
      </tr>
    </table>
  </td>
`;

const buildFieldGrid = (rows, columns = 2) => {
  if (columns === 1) {
    return `
      <table role="presentation" style="width:100%; border-collapse:collapse; margin:0 -6px;">
        ${rows.map(([label, value]) => `<tr>${buildFieldCard(label, value, '100%')}</tr>`).join('')}
      </table>
    `;
  }

  const chunks = [];

  for (let index = 0; index < rows.length; index += 2) {
    chunks.push(rows.slice(index, index + 2));
  }

  return `
    <table role="presentation" style="width:100%; border-collapse:collapse; margin:0 -6px;">
      ${chunks
        .map((chunk) => {
          const cells = chunk.map(([label, value]) => buildFieldCard(label, value)).join('');
          const filler = chunk.length === 1 ? '<td style="width:50%; padding:0 6px 12px 6px;"></td>' : '';
          return `<tr>${cells}${filler}</tr>`;
        })
        .join('')}
    </table>
  `;
};

export const buildAttachmentFileName = (value) => {
  const lastName =
    value.family.lastName !== '' ? value.family.lastName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'family';
  const date = value.family.registrationDate || new Date().toISOString().slice(0, 10);

  return `parish-registration-${date}-${lastName}.pdf`;
};

const buildGroup = (title, rows, options = {}) => {
  const subtitleMarkup = options.subtitle
    ? `<div style="padding:2px 0 10px 0; font-size:13px; line-height:1.4; font-style:italic; color:#666666;">${escapeHtml(options.subtitle)}</div>`
    : '';

  return `
    <div style="padding-top:10px;">
      <div style="font-family:Georgia, 'Times New Roman', serif; font-size:18px; font-weight:700; color:#202020;">
        ${escapeHtml(title)}
      </div>
      ${subtitleMarkup}
      ${buildFieldGrid(rows, options.columns)}
    </div>
  `;
};

const buildSection = (title, content) => `
  <div style="padding-top:22px;">
    <div style="font-family:Georgia, 'Times New Roman', serif; font-size:24px; font-weight:700; color:#141414; border-bottom:1px solid #d9d9d9; padding-bottom:8px; margin-bottom:6px;">
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
        ['Registration Date', value.family.registrationDate],
        ['Env#', value.family.envelopeNumber],
        ['Last Name', value.family.lastName],
        ['First Name(s)', value.family.firstNames],
        ['Mailing Name', value.family.mailingName],
      ]),
      buildGroup(
        'Address',
        [
          ['Address', value.family.address],
          ['Address Line 2', value.family.addressLine2],
          ['City / State / Zip', [value.family.city, value.family.state, value.family.zip].filter(Boolean).join(', ')],
        ],
        { columns: 1 },
      ),
      buildGroup('Contact Details', [
        ['Home Phone', value.family.homePhone],
        ['Emergency Phone', value.family.emergencyPhone],
        ['Family Email', value.family.familyEmail],
      ]),
    ].join(''),
  );

const buildAdultSection = (adult, index) =>
  buildSection(
    `Adult Member ${index + 1}`,
    [
      buildGroup('Basic Information', [
        ['Parish Status', adult.parishStatus],
        ['Role', adult.role],
        ['First Name', adult.firstName],
        ['Nickname', adult.nickname],
        ['Gender', adult.gender],
        ['Maiden Name', adult.maidenName],
      ]),
      buildGroup('Contact And Background', [
        ['Date of Birth', adult.dateOfBirth],
        ['Birthplace', adult.birthplace],
        ['Email', adult.email],
        ['First Language', adult.firstLanguage],
        ['Work Phone', adult.workPhone],
        ['Cell Phone', adult.cellPhone],
        ['Occupation', adult.occupation],
        ['Employer', adult.employer],
      ]),
      buildGroup(
        'Sacramental Information',
        [
          ['Baptized?', formatBooleanChoice(adult.sacraments.baptism.received)],
          ['Catholic?', formatBooleanChoice(adult.isCatholic)],
          ['Baptism Date', adult.sacraments.baptism.date],
          ['Reconciliation?', formatBooleanChoice(adult.sacraments.reconciliation.received)],
          ['Reconciliation Date', adult.sacraments.reconciliation.date],
          ['First Eucharist?', formatBooleanChoice(adult.sacraments.eucharist.received)],
          ['First Eucharist Date', adult.sacraments.eucharist.date],
          ['Confirmed?', formatBooleanChoice(adult.sacraments.confirmation.received)],
          ['Confirmation Date', adult.sacraments.confirmation.date],
        ],
        { subtitle: 'Check if sacrament received. Add date if known.' },
      ),
    ].join(''),
  );

const buildMarriageSection = (value) =>
  buildSection(
    'Marriage Information',
    buildGroup('Shared Marriage Details', [
      ['Marital Status', value.marriage?.maritalStatus ?? ''],
      ['Valid Catholic Marriage?', formatBooleanChoice(value.marriage?.validCatholicMarriage)],
    ]),
  );

const buildAdditionalSection = (value) =>
  buildSection(
    'Additional Information',
    buildGroup(
      'Pastoral Care',
      [
        [
          'Would any household member like to be visited by a priest?',
          formatBooleanChoice(value.additional.priestVisitRequested),
        ],
        ['Priest Visit Details', value.additional.priestVisitDetails],
      ],
      { columns: 1 },
    ),
  );

const buildChildrenSection = (value) => {
  if (value.children.length === 0) {
    return buildSection(
      'Children / Dependents',
      buildGroup('Household Children', [['Status', 'No children or dependents listed.']], { columns: 1 }),
    );
  }

  return buildSection(
    'Children / Dependents',
    value.children
      .map(
        (child, index) =>
          buildGroup(`Child / Dependent ${index + 1} · Basic Information`, [
            ['Relationship To Head of Household', child.relationshipToHeadOfHousehold],
            ['First Name', child.firstName],
            ['Last Name', child.lastName],
            ['Gender', child.gender],
            ['Birthdate', child.birthdate],
            ['Birthplace', child.birthplace],
            ['School', child.school],
            ['H.S. Grad Yr', child.highSchoolGraduationYear],
            ['First Language', child.firstLanguage],
            ['Catholic?', formatBooleanChoice(child.isCatholic)],
          ]) +
          buildGroup(
            `Child / Dependent ${index + 1} · Sacramental Information`,
            [
              ['Baptized?', formatBooleanChoice(child.sacraments.baptism.received)],
              ['Baptism Date', child.sacraments.baptism.date],
              ['Reconciliation?', formatBooleanChoice(child.sacraments.reconciliation.received)],
              ['Reconciliation Date', child.sacraments.reconciliation.date],
              ['First Eucharist?', formatBooleanChoice(child.sacraments.eucharist.received)],
              ['First Eucharist Date', child.sacraments.eucharist.date],
              ['Confirmed?', formatBooleanChoice(child.sacraments.confirmation.received)],
              ['Confirmation Date', child.sacraments.confirmation.date],
            ],
            { subtitle: 'Check if sacrament received. Add date if known.' },
          ),
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
  <div style="margin:0; padding:24px 0; font-family:Arial, Helvetica, sans-serif; color:#202020; background:none;">
    <div style="max-width:820px; margin:0 auto; border:1px solid #d9d9d9; padding:28px 28px 32px 28px;">
      <div style="font-family:Georgia, 'Times New Roman', serif; font-size:32px; font-weight:700; line-height:1.2; color:#141414;">
        New Parish Registration Submission
      </div>
      <div style="padding-top:8px; font-size:14px; line-height:1.6; color:#5f5f5f;">
        St. Joseph Catholic Church Parish Registration<br />
        Submitted on ${escapeHtml(formatValue(value.family.registrationDate))}
      </div>

      ${buildFamilySection(value)}
      ${value.adults.map((adult, index) => buildAdultSection(adult, index)).join('')}
      ${buildMarriageSection(value)}
      ${buildAdditionalSection(value)}
      ${buildChildrenSection(value)}
    </div>
  </div>
`;
