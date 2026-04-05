import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_SIZE = [612, 792];
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_SIZE[0] - MARGIN * 2;
const TITLE_SIZE = 20;
const SECTION_SIZE = 14;
const GROUP_SIZE = 11;
const LABEL_SIZE = 8;
const VALUE_SIZE = 10;
const META_SIZE = 9;
const LINE_GAP = 12;
const CELL_PADDING = 8;
const ROW_GAP = 8;
const COLUMN_GAP = 10;

const BLACK = rgb(0.12, 0.12, 0.12);
const TEXT = rgb(0.22, 0.22, 0.22);
const MUTED = rgb(0.45, 0.45, 0.45);
const BORDER = rgb(0.74, 0.74, 0.74);
const DIVIDER = rgb(0.85, 0.85, 0.85);

const formatChoice = (value) => {
  if (value === true || value === 'yes') {
    return 'Yes';
  }

  if (value === false || value === 'no') {
    return 'No';
  }

  return '';
};

const formatValue = (value) => {
  if (value === null || value === undefined) {
    return '—';
  }

  const stringValue = String(value).trim();
  return stringValue === '' ? '—' : stringValue;
};

const wrapText = (text, font, size, maxWidth) => {
  const normalized = formatValue(text);
  const paragraphs = normalized.split(/\r?\n/);
  const lines = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);

    if (words.length === 0) {
      lines.push('');
      continue;
    }

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
  }

  return lines.length > 0 ? lines : ['—'];
};

const buildFamilyGroups = (value) => [
  {
    title: 'Household Details',
    columns: 2,
    rows: [
      ['Registration Date', value.family.registrationDate],
      ['Env#', value.family.envelopeNumber],
      ['Last Name', value.family.lastName],
      ['First Name(s)', value.family.firstNames],
      ['Mailing Name', value.family.mailingName],
    ],
  },
  {
    title: 'Address',
    columns: 1,
    rows: [
      ['Address', value.family.address],
      ['Address Line 2', value.family.addressLine2],
      ['City / State / Zip', [value.family.city, value.family.state, value.family.zip].filter(Boolean).join(', ')],
    ],
  },
  {
    title: 'Contact Details',
    columns: 2,
    rows: [
      ['Home Phone', value.family.homePhone],
      ['Emergency Phone', value.family.emergencyPhone],
      ['Family Email', value.family.familyEmail],
    ],
  },
];

const buildAdultGroups = (adult) => [
  {
    title: 'Basic Information',
    columns: 2,
    rows: [
      ['Parish Status', adult.parishStatus],
      ['Role', adult.role],
      ['First Name', adult.firstName],
      ['Nickname', adult.nickname],
      ['Gender', adult.gender],
      ['Maiden Name', adult.maidenName],
    ],
  },
  {
    title: 'Contact And Background',
    columns: 2,
    rows: [
      ['Date of Birth', adult.dateOfBirth],
      ['Birthplace', adult.birthplace],
      ['Email', adult.email],
      ['First Language', adult.firstLanguage],
      ['Work Phone', adult.workPhone],
      ['Cell Phone', adult.cellPhone],
      ['Occupation', adult.occupation],
      ['Employer', adult.employer],
    ],
  },
  {
    title: 'Sacramental Information',
    subtitle: 'Check if sacrament received. Add date if known.',
    columns: 2,
    rows: [
      ['Baptized?', formatChoice(adult.sacraments.baptism.received)],
      ['Catholic?', formatChoice(adult.isCatholic)],
      ['Baptism Date', adult.sacraments.baptism.date],
      ['Reconciliation?', formatChoice(adult.sacraments.reconciliation.received)],
      ['Reconciliation Date', adult.sacraments.reconciliation.date],
      ['First Eucharist?', formatChoice(adult.sacraments.eucharist.received)],
      ['First Eucharist Date', adult.sacraments.eucharist.date],
      ['Confirmed?', formatChoice(adult.sacraments.confirmation.received)],
      ['Confirmation Date', adult.sacraments.confirmation.date],
    ],
  },
];

const buildMarriageGroups = (value) => [
  {
    title: 'Shared Marriage Details',
    columns: 2,
    rows: [
      ['Marital Status', value.marriage?.maritalStatus ?? ''],
      ['Valid Catholic Marriage?', formatChoice(value.marriage?.validCatholicMarriage ?? '')],
    ],
  },
];

const buildChildGroups = (child) => [
  {
    title: 'Basic Information',
    columns: 2,
    rows: [
      ['Relationship To Head of Household', child.relationshipToHeadOfHousehold],
      ['First Name', child.firstName],
      ['Last Name', child.lastName],
      ['Gender', child.gender],
      ['Birthdate', child.birthdate],
      ['Birthplace', child.birthplace],
      ['School', child.school],
      ['H.S. Grad Yr', child.highSchoolGraduationYear],
      ['First Language', child.firstLanguage],
      ['Catholic?', formatChoice(child.isCatholic)],
    ],
  },
  {
    title: 'Sacramental Information',
    subtitle: 'Check if sacrament received. Add date if known.',
    columns: 2,
    rows: [
      ['Baptized?', formatChoice(child.sacraments.baptism.received)],
      ['Baptism Date', child.sacraments.baptism.date],
      ['Reconciliation?', formatChoice(child.sacraments.reconciliation.received)],
      ['Reconciliation Date', child.sacraments.reconciliation.date],
      ['First Eucharist?', formatChoice(child.sacraments.eucharist.received)],
      ['First Eucharist Date', child.sacraments.eucharist.date],
      ['Confirmed?', formatChoice(child.sacraments.confirmation.received)],
      ['Confirmation Date', child.sacraments.confirmation.date],
    ],
  },
];

const buildAdditionalGroups = (value) => [
  {
    title: 'Pastoral Care',
    columns: 1,
    rows: [
      [
        'Would any household member like to be visited by a priest?',
        formatChoice(value.additional.priestVisitRequested),
      ],
      ['Priest Visit Details', value.additional.priestVisitDetails],
    ],
  },
];

export const generateParishRegistrationPdf = async (value) => {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
  const pageWidth = PAGE_SIZE[0];
  const pageHeight = PAGE_SIZE[1];
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

  const drawDivider = () => {
    page.drawLine({
      start: { x: MARGIN, y: cursorY },
      end: { x: pageWidth - MARGIN, y: cursorY },
      thickness: 1,
      color: DIVIDER,
    });
    cursorY -= 14;
  };

  const drawHeader = () => {
    page.drawText('St. Joseph Catholic Church Parish Registration', {
      x: MARGIN,
      y: cursorY,
      size: TITLE_SIZE,
      font: boldFont,
      color: BLACK,
    });
    cursorY -= TITLE_SIZE + 6;

    page.drawText('1300 N. Main St., Bluffton, IN 46714  |  (260) 824-1380', {
      x: MARGIN,
      y: cursorY,
      size: META_SIZE,
      font: regularFont,
      color: MUTED,
    });
    cursorY -= META_SIZE + 4;

    page.drawText(`Submitted: ${formatValue(value.family.registrationDate)}`, {
      x: MARGIN,
      y: cursorY,
      size: META_SIZE,
      font: regularFont,
      color: MUTED,
    });
    cursorY -= META_SIZE + 12;
    drawDivider();
  };

  const drawSectionTitle = (title) => {
    ensureSpace(SECTION_SIZE + 16);
    page.drawText(title, {
      x: MARGIN,
      y: cursorY,
      size: SECTION_SIZE,
      font: boldFont,
      color: BLACK,
    });
    cursorY -= SECTION_SIZE + 8;
  };

  const drawGroupTitle = (title, subtitle) => {
    ensureSpace(subtitle ? 28 : 16);
    page.drawText(title, {
      x: MARGIN,
      y: cursorY,
      size: GROUP_SIZE,
      font: boldFont,
      color: TEXT,
    });
    cursorY -= GROUP_SIZE + 3;

    if (subtitle) {
      page.drawText(subtitle, {
        x: MARGIN,
        y: cursorY,
        size: META_SIZE,
        font: italicFont,
        color: MUTED,
      });
      cursorY -= META_SIZE + 6;
    }
  };

  const drawGrid = (rows, columns = 2) => {
    const cellWidth = columns === 1 ? CONTENT_WIDTH : (CONTENT_WIDTH - COLUMN_GAP * (columns - 1)) / columns;

    for (let index = 0; index < rows.length; index += columns) {
      const rowItems = rows.slice(index, index + columns);
      const cellMetrics = rowItems.map(([label, rawValue]) => {
        const valueLines = wrapText(rawValue, regularFont, VALUE_SIZE, cellWidth - CELL_PADDING * 2);
        const height = CELL_PADDING * 2 + LABEL_SIZE + 4 + valueLines.length * LINE_GAP;

        return {
          label,
          valueLines,
          height,
        };
      });
      const rowHeight = Math.max(...cellMetrics.map((metric) => metric.height));

      ensureSpace(rowHeight + ROW_GAP);

      cellMetrics.forEach((metric, columnIndex) => {
        const x = MARGIN + columnIndex * (cellWidth + COLUMN_GAP);
        const y = cursorY - rowHeight;

        page.drawRectangle({
          x,
          y,
          width: cellWidth,
          height: rowHeight,
          borderWidth: 0.8,
          borderColor: BORDER,
        });

        page.drawText(metric.label.toUpperCase(), {
          x: x + CELL_PADDING,
          y: cursorY - CELL_PADDING - LABEL_SIZE,
          size: LABEL_SIZE,
          font: boldFont,
          color: MUTED,
        });

        metric.valueLines.forEach((line, lineIndex) => {
          page.drawText(line === '' ? ' ' : line, {
            x: x + CELL_PADDING,
            y: cursorY - CELL_PADDING - LABEL_SIZE - 6 - lineIndex * LINE_GAP - VALUE_SIZE,
            size: VALUE_SIZE,
            font: regularFont,
            color: TEXT,
          });
        });
      });

      cursorY -= rowHeight + ROW_GAP;
    }
  };

  const drawEmptyState = (message) => {
    const lines = wrapText(message, regularFont, VALUE_SIZE, CONTENT_WIDTH - CELL_PADDING * 2);
    const height = CELL_PADDING * 2 + lines.length * LINE_GAP;

    ensureSpace(height + ROW_GAP);
    page.drawRectangle({
      x: MARGIN,
      y: cursorY - height,
      width: CONTENT_WIDTH,
      height,
      borderWidth: 0.8,
      borderColor: BORDER,
    });

    lines.forEach((line, index) => {
      page.drawText(line, {
        x: MARGIN + CELL_PADDING,
        y: cursorY - CELL_PADDING - index * LINE_GAP - VALUE_SIZE,
        size: VALUE_SIZE,
        font: regularFont,
        color: TEXT,
      });
    });

    cursorY -= height + ROW_GAP;
  };

  const drawGroups = (groups) => {
    groups.forEach((group, index) => {
      drawGroupTitle(group.title, group.subtitle);
      drawGrid(group.rows, group.columns);

      if (index < groups.length - 1) {
        cursorY -= 2;
      }
    });
  };

  drawHeader();

  drawSectionTitle('Family Information');
  drawGroups(buildFamilyGroups(value));
  cursorY -= 6;

  value.adults.forEach((adult, index) => {
    drawSectionTitle(`Adult Member ${index + 1}`);
    drawGroups(buildAdultGroups(adult));
    cursorY -= 6;
  });

  drawSectionTitle('Marriage Information');
  drawGroups(buildMarriageGroups(value));
  cursorY -= 6;

  drawSectionTitle('Additional Information');
  drawGroups(buildAdditionalGroups(value));
  cursorY -= 6;

  drawSectionTitle('Children / Dependents');

  if (value.children.length === 0) {
    drawEmptyState('No children or dependents listed.');
  } else {
    value.children.forEach((child, index) => {
      drawGroupTitle(`Child / Dependent ${index + 1}`);
      drawGroups(buildChildGroups(child));

      if (index < value.children.length - 1) {
        cursorY -= 6;
      }
    });
  }

  return await pdfDoc.save();
};
