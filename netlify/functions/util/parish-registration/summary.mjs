const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatBooleanChoice = (value) => {
  if (value === 'yes') {
    return 'Yes';
  }

  if (value === 'no') {
    return 'No';
  }

  return '';
};

const formatSacrament = (label, sacrament) => {
  if (!sacrament.received && sacrament.date === '') {
    return `${label}: No`;
  }

  if (sacrament.date !== '') {
    return `${label}: Yes (${sacrament.date})`;
  }

  return `${label}: Yes`;
};

const buildList = (rows) => `
  <ul>
    ${rows.map((row) => `<li>${escapeHtml(row.label)}: ${escapeHtml(row.value)}</li>`).join('')}
  </ul>
`;

export const buildAttachmentFileName = (value) => {
  const lastName =
    value.family.lastName !== '' ? value.family.lastName.toLowerCase().replace(/[^a-z0-9]+/g, '-') : 'family';
  const date = value.family.registrationDate || new Date().toISOString().slice(0, 10);

  return `parish-registration-${date}-${lastName}.pdf`;
};

export const buildParishRegistrationSummaryHtml = (value) => {
  const familyRows = [
    { label: 'Registration Date', value: value.family.registrationDate },
    { label: 'Env#', value: value.family.envelopeNumber },
    { label: 'Last Name', value: value.family.lastName },
    { label: 'First Name(s)', value: value.family.firstNames },
    { label: 'Mailing Name', value: value.family.mailingName },
    { label: 'Address', value: value.family.address },
    { label: 'Add2', value: value.family.addressLine2 },
    { label: 'City', value: value.family.city },
    { label: 'State', value: value.family.state },
    { label: 'Zip', value: value.family.zip },
    { label: 'Home Phone', value: value.family.homePhone },
    { label: 'Emergency Phone', value: value.family.emergencyPhone },
    { label: 'Family Email', value: value.family.familyEmail },
  ];

  const adultSections = value.adults
    .map((adult, index) => {
      const rows = [
        { label: 'First Name / Nickname', value: adult.firstNameNickname },
        { label: 'Gender', value: adult.gender },
        { label: 'DOB', value: adult.dateOfBirth },
        { label: 'Marital Status', value: adult.maritalStatus },
        { label: 'Valid Catholic Marriage?', value: formatBooleanChoice(adult.validCatholicMarriage) },
        { label: 'Parish Status', value: adult.parishStatus },
        { label: 'Role', value: adult.role },
        { label: 'Occupation / Employer', value: adult.occupationEmployer },
        { label: 'Work Phone / Cell', value: adult.workPhoneOrCell },
        { label: 'Email', value: adult.email },
        { label: 'First Language', value: adult.firstLanguage },
        { label: 'Maiden Name', value: adult.maidenName },
        { label: 'Birthplace', value: adult.birthplace },
        { label: 'Catholic?', value: formatBooleanChoice(adult.isCatholic) },
        { label: 'Baptism', value: formatSacrament('Baptism', adult.sacraments.baptism).replace('Baptism: ', '') },
        {
          label: 'Eucharist',
          value: formatSacrament('Eucharist', adult.sacraments.eucharist).replace('Eucharist: ', ''),
        },
        {
          label: 'Reconciliation',
          value: formatSacrament('Reconciliation', adult.sacraments.reconciliation).replace('Reconciliation: ', ''),
        },
        {
          label: 'Confirmation',
          value: formatSacrament('Confirmation', adult.sacraments.confirmation).replace('Confirmation: ', ''),
        },
      ];

      return `<h3>Adult Member ${index + 1}</h3>${buildList(rows)}`;
    })
    .join('');

  const childrenSection =
    value.children.length === 0
      ? '<p>No children or dependents listed.</p>'
      : value.children
          .map((child, index) => {
            const rows = [
              { label: 'First Name', value: child.firstName },
              { label: 'Last Name', value: child.lastName },
              { label: 'Gender', value: child.gender },
              { label: 'Birthdate', value: child.birthdate },
              { label: 'Relationship To Head Of Household', value: child.relationshipToHeadOfHousehold },
              { label: 'School', value: child.school },
              { label: 'H.S. Grad Yr', value: child.highSchoolGraduationYear },
              { label: 'First Language', value: child.firstLanguage },
              { label: 'Catholic?', value: formatBooleanChoice(child.isCatholic) },
              {
                label: 'Baptism',
                value: formatSacrament('Baptism', child.sacraments.baptism).replace('Baptism: ', ''),
              },
              {
                label: 'Eucharist',
                value: formatSacrament('Eucharist', child.sacraments.eucharist).replace('Eucharist: ', ''),
              },
              {
                label: 'Reconciliation',
                value: formatSacrament('Reconciliation', child.sacraments.reconciliation).replace(
                  'Reconciliation: ',
                  '',
                ),
              },
              {
                label: 'Confirmation',
                value: formatSacrament('Confirmation', child.sacraments.confirmation).replace('Confirmation: ', ''),
              },
            ];

            return `<h3>Child / Dependent ${index + 1}</h3>${buildList(rows)}`;
          })
          .join('');

  const additionalRows = [
    {
      label: 'Would any household member like to be visited by a priest?',
      value: formatBooleanChoice(value.additional.priestVisitRequested),
    },
    { label: 'Priest Visit Details', value: value.additional.priestVisitDetails },
  ];

  return `
    <h2>New Parish Registration Submission</h2>
    <h3>Family Information</h3>
    ${buildList(familyRows)}
    ${adultSections}
    <h3>Children / Dependents</h3>
    ${childrenSection}
    <h3>Additional Information</h3>
    ${buildList(additionalRows)}
  `;
};
