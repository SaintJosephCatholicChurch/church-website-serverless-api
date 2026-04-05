const normalizeString = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim();
};

const normalizeDate = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
};

const normalizeBoolean = (value) => value === true;

const normalizeChoice = (value) => {
  const normalizedValue = normalizeString(value).toLowerCase();
  return normalizedValue;
};

const normalizeState = (value) => normalizeString(value).toUpperCase();

const sanitizeSacraments = (value = {}) => ({
  baptism: {
    received: normalizeBoolean(value?.baptism?.received),
    date: normalizeDate(value?.baptism?.date),
  },
  eucharist: {
    received: normalizeBoolean(value?.eucharist?.received),
    date: normalizeDate(value?.eucharist?.date),
  },
  reconciliation: {
    received: normalizeBoolean(value?.reconciliation?.received),
    date: normalizeDate(value?.reconciliation?.date),
  },
  confirmation: {
    received: normalizeBoolean(value?.confirmation?.received),
    date: normalizeDate(value?.confirmation?.date),
  },
});

const sanitizeAdult = (value = {}) => ({
  parishStatus: normalizeChoice(value.parishStatus),
  role: normalizeString(value.role),
  firstName: normalizeString(value.firstName) || normalizeString(value.firstNameNickname),
  nickname: normalizeString(value.nickname),
  maidenName: normalizeString(value.maidenName),
  gender: normalizeChoice(value.gender),
  dateOfBirth: normalizeDate(value.dateOfBirth),
  email: normalizeString(value.email),
  workPhone: normalizeString(value.workPhone) || normalizeString(value.workPhoneOrCell),
  cellPhone: normalizeString(value.cellPhone),
  firstLanguage: normalizeString(value.firstLanguage),
  occupation: normalizeString(value.occupation) || normalizeString(value.occupationEmployer),
  employer: normalizeString(value.employer),
  birthplace: normalizeString(value.birthplace),
  isCatholic: normalizeChoice(value.isCatholic),
  maritalStatus: normalizeChoice(value.maritalStatus),
  validCatholicMarriage: normalizeChoice(value.validCatholicMarriage),
  sacraments: sanitizeSacraments(value.sacraments),
});

const sanitizeChild = (value = {}) => ({
  firstName: normalizeString(value.firstName),
  lastName: normalizeString(value.lastName),
  gender: normalizeChoice(value.gender),
  birthdate: normalizeDate(value.birthdate),
  birthplace: normalizeString(value.birthplace),
  relationshipToHeadOfHousehold: normalizeString(value.relationshipToHeadOfHousehold),
  school: normalizeString(value.school),
  highSchoolGraduationYear: normalizeString(value.highSchoolGraduationYear),
  firstLanguage: normalizeString(value.firstLanguage),
  isCatholic: normalizeChoice(value.isCatholic),
  sacraments: sanitizeSacraments(value.sacraments),
});

export const sanitizeParishRegistration = (value = {}) => ({
  family: {
    registrationDate: normalizeDate(value?.family?.registrationDate),
    envelopeNumber: normalizeString(value?.family?.envelopeNumber),
    lastName: normalizeString(value?.family?.lastName),
    firstNames: normalizeString(value?.family?.firstNames),
    mailingName: normalizeString(value?.family?.mailingName),
    address: normalizeString(value?.family?.address),
    addressLine2: normalizeString(value?.family?.addressLine2),
    city: normalizeString(value?.family?.city),
    state: normalizeState(value?.family?.state),
    zip: normalizeString(value?.family?.zip),
    homePhone: normalizeString(value?.family?.homePhone),
    emergencyPhone: normalizeString(value?.family?.emergencyPhone),
    familyEmail: normalizeString(value?.family?.familyEmail),
  },
  adults: Array.isArray(value?.adults) ? value.adults.map(sanitizeAdult) : [],
  children: Array.isArray(value?.children) ? value.children.map(sanitizeChild) : [],
  additional: {
    priestVisitRequested: normalizeChoice(value?.additional?.priestVisitRequested),
    priestVisitDetails: normalizeString(value?.additional?.priestVisitDetails),
  },
});
