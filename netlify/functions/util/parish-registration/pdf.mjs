import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_SIZE = [612, 792];
const MARGIN = 48;
const BODY_SIZE = 10;
const SECTION_SIZE = 14;
const TITLE_SIZE = 18;
const LINE_GAP = 14;

const formatChoice = (value) => {
  if (value === 'yes') {
    return 'Yes';
  }

  if (value === 'no') {
    return 'No';
  }

  return '';
};

const formatValue = (value) => (value === '' ? '—' : value);

const formatSacrament = (label, sacrament) => {
  if (!sacrament.received && sacrament.date === '') {
    return `${label}: No`;
  }

  if (sacrament.date !== '') {
    return `${label}: Yes (${sacrament.date})`;
  }

  return `${label}: Yes`;
};

const wrapText = (text, font, size, maxWidth) => {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return ['—'];
  }

  const lines = [];
  let currentLine = words[0];

  for (const word of words.slice(1)) {
    const nextLine = `${currentLine} ${word}`;
    if (font.widthOfTextAtSize(nextLine, size) <= maxWidth) {
      currentLine = nextLine;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  lines.push(currentLine);
  return lines;
};

export const generateParishRegistrationPdf = async (value) => {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = PAGE_SIZE[0];
  const pageHeight = PAGE_SIZE[1];
  const contentWidth = pageWidth - MARGIN * 2;
  let page = pdfDoc.addPage(PAGE_SIZE);
  let cursorY = pageHeight - MARGIN;

  const addPage = () => {
    page = pdfDoc.addPage(PAGE_SIZE);
    cursorY = pageHeight - MARGIN;
  };

  const ensureSpace = (requiredHeight) => {
    if (cursorY - requiredHeight < MARGIN) {
      addPage();
    }
  };

  const drawParagraph = (label, rawValue) => {
    const valueText = formatValue(rawValue);
    const labelWidth = boldFont.widthOfTextAtSize(`${label}: `, BODY_SIZE);
    const lines = wrapText(valueText, regularFont, BODY_SIZE, contentWidth - labelWidth);
    const blockHeight = lines.length * LINE_GAP;

    ensureSpace(blockHeight + 4);

    page.drawText(`${label}:`, {
      x: MARGIN,
      y: cursorY,
      size: BODY_SIZE,
      font: boldFont,
      color: rgb(0.2, 0.2, 0.2),
    });

    lines.forEach((line, lineIndex) => {
      page.drawText(line, {
        x: MARGIN + labelWidth,
        y: cursorY - lineIndex * LINE_GAP,
        size: BODY_SIZE,
        font: regularFont,
        color: rgb(0.2, 0.2, 0.2),
      });
    });

    cursorY -= blockHeight + 4;
  };

  const drawSectionTitle = (title) => {
    ensureSpace(SECTION_SIZE + 12);
    page.drawText(title, {
      x: MARGIN,
      y: cursorY,
      size: SECTION_SIZE,
      font: boldFont,
      color: rgb(0.75, 0.19, 0.24),
    });
    cursorY -= SECTION_SIZE + 10;
  };

  page.drawText('St. Joseph Catholic Church Parish Registration', {
    x: MARGIN,
    y: cursorY,
    size: TITLE_SIZE,
    font: boldFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  cursorY -= TITLE_SIZE + 6;
  page.drawText('1300 N. Main St., Bluffton, IN 46714  |  (260) 824-1380', {
    x: MARGIN,
    y: cursorY,
    size: BODY_SIZE,
    font: regularFont,
    color: rgb(0.3, 0.3, 0.3),
  });
  cursorY -= 24;

  drawSectionTitle('Family Information');
  drawParagraph('Registration Date', value.family.registrationDate);
  drawParagraph('Env#', value.family.envelopeNumber);
  drawParagraph('Last Name', value.family.lastName);
  drawParagraph('First Name(s)', value.family.firstNames);
  drawParagraph('Mailing Name', value.family.mailingName);
  drawParagraph('Address', value.family.address);
  drawParagraph('Add2', value.family.addressLine2);
  drawParagraph('City', value.family.city);
  drawParagraph('State', value.family.state);
  drawParagraph('Zip', value.family.zip);
  drawParagraph('Home Phone', value.family.homePhone);
  drawParagraph('Emergency Phone', value.family.emergencyPhone);
  drawParagraph('Family Email', value.family.familyEmail);

  value.adults.forEach((adult, index) => {
    drawSectionTitle(`Adult Member ${index + 1}`);
    drawParagraph('Parish Status', adult.parishStatus);
    drawParagraph('Role', adult.role);
    drawParagraph('First Name', adult.firstName);
    drawParagraph('Nickname', adult.nickname);
    drawParagraph('Maiden Name', adult.maidenName);
    drawParagraph('Gender', adult.gender);
    drawParagraph('DOB', adult.dateOfBirth);
    drawParagraph('Email', adult.email);
    drawParagraph('Work Phone', adult.workPhone);
    drawParagraph('Cell Phone', adult.cellPhone);
    drawParagraph('First Language', adult.firstLanguage);
    drawParagraph('Occupation', adult.occupation);
    drawParagraph('Employer', adult.employer);
    drawParagraph('Birthplace', adult.birthplace);
    drawParagraph('Catholic?', formatChoice(adult.isCatholic));
    drawParagraph('Baptism', formatSacrament('Baptism', adult.sacraments.baptism).replace('Baptism: ', ''));
    drawParagraph('Eucharist', formatSacrament('Eucharist', adult.sacraments.eucharist).replace('Eucharist: ', ''));
    drawParagraph(
      'Reconciliation',
      formatSacrament('Reconciliation', adult.sacraments.reconciliation).replace('Reconciliation: ', ''),
    );
    drawParagraph(
      'Confirmation',
      formatSacrament('Confirmation', adult.sacraments.confirmation).replace('Confirmation: ', ''),
    );
    drawParagraph('Marital Status', adult.maritalStatus);
    drawParagraph('Valid Catholic Marriage?', formatChoice(adult.validCatholicMarriage));
  });

  drawSectionTitle('Children / Dependents');
  if (value.children.length === 0) {
    drawParagraph('Children', 'No children or dependents listed.');
  }

  value.children.forEach((child, index) => {
    drawSectionTitle(`Child / Dependent ${index + 1}`);
    drawParagraph('First Name', child.firstName);
    drawParagraph('Last Name', child.lastName);
    drawParagraph('Gender', child.gender);
    drawParagraph('Birthdate', child.birthdate);
    drawParagraph('Relationship To Head Of Household', child.relationshipToHeadOfHousehold);
    drawParagraph('School', child.school);
    drawParagraph('H.S. Grad Yr', child.highSchoolGraduationYear);
    drawParagraph('First Language', child.firstLanguage);
    drawParagraph('Catholic?', formatChoice(child.isCatholic));
    drawParagraph('Baptism', formatSacrament('Baptism', child.sacraments.baptism).replace('Baptism: ', ''));
    drawParagraph('Eucharist', formatSacrament('Eucharist', child.sacraments.eucharist).replace('Eucharist: ', ''));
    drawParagraph(
      'Reconciliation',
      formatSacrament('Reconciliation', child.sacraments.reconciliation).replace('Reconciliation: ', ''),
    );
    drawParagraph(
      'Confirmation',
      formatSacrament('Confirmation', child.sacraments.confirmation).replace('Confirmation: ', ''),
    );
  });

  drawSectionTitle('Additional Information');
  drawParagraph(
    'Would any household member like to be visited by a priest?',
    formatChoice(value.additional.priestVisitRequested),
  );
  drawParagraph('Priest Visit Details', value.additional.priestVisitDetails);

  return await pdfDoc.save();
};
