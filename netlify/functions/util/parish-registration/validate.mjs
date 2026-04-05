const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const PHONE_REGEX = /^\(\d{3}\) \d{3}-\d{4}$/;
const ZIP_REGEX = /^\d{5}(?:-\d{4})?$/;
const YES_NO_VALUES = new Set(['', 'yes', 'no']);
const GENDER_VALUES = new Set(['', 'male', 'female']);
const PARISH_STATUS_VALUES = new Set(['', 'active', 'inactive']);
const MARITAL_STATUS_VALUES = new Set(['', 'single', 'married', 'separated', 'divorced', 'annulled', 'widowed']);
const STATE_VALUES = new Set([
  '',
  'AL',
  'AK',
  'AZ',
  'AR',
  'CA',
  'CO',
  'CT',
  'DE',
  'FL',
  'GA',
  'HI',
  'ID',
  'IL',
  'IN',
  'IA',
  'KS',
  'KY',
  'LA',
  'ME',
  'MD',
  'MA',
  'MI',
  'MN',
  'MS',
  'MO',
  'MT',
  'NE',
  'NV',
  'NH',
  'NJ',
  'NM',
  'NY',
  'NC',
  'ND',
  'OH',
  'OK',
  'OR',
  'PA',
  'RI',
  'SC',
  'SD',
  'TN',
  'TX',
  'UT',
  'VT',
  'VA',
  'WA',
  'WV',
  'WI',
  'WY',
]);
const SACRAMENT_KEYS = ['baptism', 'eucharist', 'reconciliation', 'confirmation'];

const isValidDate = (value) => {
  if (!DATE_REGEX.test(value)) {
    return false;
  }

  const parsedDate = new Date(value);
  return !Number.isNaN(parsedDate.getTime());
};

const pushIfInvalidChoice = (errors, path, value, validValues) => {
  if (!validValues.has(value)) {
    errors.push({ path, message: 'Invalid value.' });
  }
};

const pushIfInvalidEmail = (errors, path, value) => {
  if (value !== '' && !EMAIL_REGEX.test(value)) {
    errors.push({ path, message: 'Invalid email address.' });
  }
};

const pushIfInvalidDate = (errors, path, value) => {
  if (value !== '' && !isValidDate(value)) {
    errors.push({ path, message: 'Invalid date.' });
  }
};

const pushIfInvalidPhone = (errors, path, value) => {
  if (value !== '' && !PHONE_REGEX.test(value)) {
    errors.push({ path, message: 'Invalid phone number. Include area code.' });
  }
};

const pushIfInvalidZip = (errors, path, value) => {
  if (value !== '' && !ZIP_REGEX.test(value)) {
    errors.push({ path, message: 'Invalid ZIP code.' });
  }
};

const validateSacraments = (errors, path, sacraments) => {
  SACRAMENT_KEYS.forEach((sacramentKey) => {
    const sacrament = sacraments[sacramentKey];
    pushIfInvalidDate(errors, `${path}.${sacramentKey}.date`, sacrament.date);

    if (sacrament.date !== '' && !sacrament.received) {
      errors.push({
        path: `${path}.${sacramentKey}.received`,
        message: 'Received must be true when a sacrament date is provided.',
      });
    }
  });
};

export const validateParishRegistration = (value) => {
  const errors = [];

  if (value.family.lastName === '') {
    errors.push({ path: 'family.lastName', message: 'Last name is required.' });
  }

  if (value.family.address === '') {
    errors.push({ path: 'family.address', message: 'Address is required.' });
  }

  if (value.family.city === '') {
    errors.push({ path: 'family.city', message: 'City is required.' });
  }

  if (value.family.state === '') {
    errors.push({ path: 'family.state', message: 'State is required.' });
  }

  if (value.family.familyEmail === '') {
    errors.push({ path: 'family.familyEmail', message: 'Family email is required.' });
  }

  if (value.family.homePhone === '') {
    errors.push({ path: 'family.homePhone', message: 'Home phone is required.' });
  }

  if (value.family.zip === '') {
    errors.push({ path: 'family.zip', message: 'ZIP code is required.' });
  }

  pushIfInvalidEmail(errors, 'family.familyEmail', value.family.familyEmail);
  pushIfInvalidDate(errors, 'family.registrationDate', value.family.registrationDate);
  pushIfInvalidPhone(errors, 'family.homePhone', value.family.homePhone);
  pushIfInvalidPhone(errors, 'family.emergencyPhone', value.family.emergencyPhone);
  pushIfInvalidZip(errors, 'family.zip', value.family.zip);
  pushIfInvalidChoice(errors, 'family.state', value.family.state, STATE_VALUES);

  if (!Array.isArray(value.adults) || value.adults.length !== 2) {
    errors.push({ path: 'adults', message: 'Exactly two adult members are required.' });
  }

  if (!Array.isArray(value.children)) {
    errors.push({ path: 'children', message: 'Children must be an array.' });
  }

  value.adults.forEach((adult, index) => {
    if (adult.parishStatus === '') {
      errors.push({ path: `adults.${index}.parishStatus`, message: 'Parish status is required.' });
    }

    if (adult.role === '') {
      errors.push({ path: `adults.${index}.role`, message: 'Role is required.' });
    }

    if (adult.firstName === '') {
      errors.push({ path: `adults.${index}.firstName`, message: 'First name is required.' });
    }

    if (adult.gender === '') {
      errors.push({ path: `adults.${index}.gender`, message: 'Gender is required.' });
    }

    if (adult.dateOfBirth === '') {
      errors.push({ path: `adults.${index}.dateOfBirth`, message: 'Date of birth is required.' });
    }

    if (adult.birthplace === '') {
      errors.push({ path: `adults.${index}.birthplace`, message: 'Birthplace is required.' });
    }

    pushIfInvalidChoice(errors, `adults.${index}.gender`, adult.gender, GENDER_VALUES);
    pushIfInvalidChoice(errors, `adults.${index}.maritalStatus`, adult.maritalStatus, MARITAL_STATUS_VALUES);
    pushIfInvalidChoice(errors, `adults.${index}.validCatholicMarriage`, adult.validCatholicMarriage, YES_NO_VALUES);
    pushIfInvalidChoice(errors, `adults.${index}.parishStatus`, adult.parishStatus, PARISH_STATUS_VALUES);
    pushIfInvalidChoice(errors, `adults.${index}.isCatholic`, adult.isCatholic, YES_NO_VALUES);
    pushIfInvalidEmail(errors, `adults.${index}.email`, adult.email);
    pushIfInvalidPhone(errors, `adults.${index}.workPhone`, adult.workPhone);
    pushIfInvalidPhone(errors, `adults.${index}.cellPhone`, adult.cellPhone);
    pushIfInvalidDate(errors, `adults.${index}.dateOfBirth`, adult.dateOfBirth);
    validateSacraments(errors, `adults.${index}.sacraments`, adult.sacraments);
  });

  value.children.forEach((child, index) => {
    if (child.relationshipToHeadOfHousehold === '') {
      errors.push({
        path: `children.${index}.relationshipToHeadOfHousehold`,
        message: 'Relationship to head of household is required.',
      });
    }

    if (child.firstName === '') {
      errors.push({ path: `children.${index}.firstName`, message: 'First name is required.' });
    }

    if (child.lastName === '') {
      errors.push({ path: `children.${index}.lastName`, message: 'Last name is required.' });
    }

    if (child.gender === '') {
      errors.push({ path: `children.${index}.gender`, message: 'Gender is required.' });
    }

    if (child.birthdate === '') {
      errors.push({ path: `children.${index}.birthdate`, message: 'Birthdate is required.' });
    }

    if (child.birthplace === '') {
      errors.push({ path: `children.${index}.birthplace`, message: 'Birthplace is required.' });
    }

    pushIfInvalidChoice(errors, `children.${index}.gender`, child.gender, GENDER_VALUES);
    pushIfInvalidChoice(errors, `children.${index}.isCatholic`, child.isCatholic, YES_NO_VALUES);
    pushIfInvalidDate(errors, `children.${index}.birthdate`, child.birthdate);
    validateSacraments(errors, `children.${index}.sacraments`, child.sacraments);
  });

  pushIfInvalidChoice(errors, 'additional.priestVisitRequested', value.additional.priestVisitRequested, YES_NO_VALUES);

  return errors;
};
