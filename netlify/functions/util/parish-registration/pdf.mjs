import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_SIZE = [612, 792];
const MARGIN = 36;
const CONTENT_WIDTH = PAGE_SIZE[0] - MARGIN * 2;
const TITLE_SIZE = 18;
const SECTION_SIZE = 13;
const GROUP_SIZE = 9;
const LABEL_SIZE = 7;
const VALUE_SIZE = 10;
const META_SIZE = 8;
const LINE_GAP = 12;
const CELL_PADDING_X = 10;
const CELL_PADDING_Y = 8;
const COLUMN_GAP = 12;
const GROUP_CARD_PADDING = 12;
const GROUP_GAP = 10;

// Brand colors matching the UI
const BRAND_RED = rgb(0.749, 0.188, 0.235); // #bf303c
const BRAND_DARK = rgb(0.51, 0.129, 0.161); // #822129
const BLACK = rgb(0.08, 0.08, 0.08);
const TEXT = rgb(0.18, 0.18, 0.18);
const MUTED = rgb(0.42, 0.42, 0.42);
const GROUP_BORDER = rgb(0.88, 0.78, 0.79); // subtle red tint like rgba(191,48,60,0.14)
const FIELD_BORDER = rgb(0.82, 0.82, 0.82);
const DIVIDER = rgb(0.88, 0.88, 0.88);
const WHITE = rgb(1, 1, 1);
const GROUP_BG = rgb(0.995, 0.992, 0.992); // very faint red tint
const CHECK_GREEN = rgb(0.18, 0.62, 0.28);

const formatChoice = (value) => {
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

// --- Data builders matching UI form layout ---

const buildFamilyGroups = (value) => [
  {
    title: 'Household Details',
    columns: 2,
    rows: [
      { label: 'Last Name', value: value.family.lastName },
      { label: 'First Name(s)', value: value.family.firstNames },
      { label: 'Mailing Name', value: value.family.mailingName, wide: true },
    ],
  },
  {
    title: 'Address',
    columns: 2,
    rows: [
      { label: 'Address', value: value.family.address, wide: true },
      { label: 'Address Line 2', value: value.family.addressLine2, wide: true },
      { label: 'City', value: value.family.city },
      { label: 'State', value: value.family.state },
      { label: 'Zip', value: value.family.zip },
    ],
  },
  {
    title: 'Contact Details',
    columns: 2,
    rows: [
      { label: 'Home Phone', value: value.family.homePhone },
      { label: 'Emergency Phone', value: value.family.emergencyPhone },
      { label: 'Family Email', value: value.family.familyEmail },
      { label: 'Env#', value: value.family.envelopeNumber },
    ],
  },
];

const buildAdultGroups = (adult) => [
  {
    title: 'Basic Information',
    columns: 2,
    rows: [
      { label: 'Parish Status', value: adult.parishStatus },
      { label: 'Role', value: adult.role },
      { label: 'First Name', value: adult.firstName },
      { label: 'Nickname', value: adult.nickname },
      { label: 'Gender', value: adult.gender },
      { label: 'Maiden Name', value: adult.maidenName },
    ],
  },
  {
    title: 'Contact And Background',
    columns: 2,
    rows: [
      { label: 'Date of Birth', value: adult.dateOfBirth },
      { label: 'Birthplace', value: adult.birthplace },
      { label: 'Email', value: adult.email, wide: true },
      { label: 'Work Phone', value: adult.workPhone },
      { label: 'Cell Phone', value: adult.cellPhone },
      { label: 'First Language', value: adult.firstLanguage },
      { label: 'Occupation', value: adult.occupation },
      { label: 'Employer', value: adult.employer },
    ],
  },
  {
    title: 'Sacramental Information',
    subtitle: 'Check if sacrament received. Add date if known.',
    sacraments: true,
    baptism: adult.sacraments.baptism,
    isCatholic: adult.isCatholic,
    sacramentList: [
      { name: 'Reconciliation', data: adult.sacraments.reconciliation },
      { name: 'First Eucharist', data: adult.sacraments.eucharist },
      { name: 'Confirmation', data: adult.sacraments.confirmation },
    ],
  },
];

const buildMarriageGroups = (value) => [
  {
    title: null,
    columns: 2,
    rows: [
      { label: 'Marital Status', value: value.marriage?.maritalStatus ?? '' },
      {
        label: 'Valid Catholic Marriage?',
        value: formatChoice(value.marriage?.validCatholicMarriage ?? ''),
        check: value.marriage?.validCatholicMarriage,
      },
    ],
  },
];

const buildChildGroups = (child) => [
  {
    title: 'Basic Information',
    columns: 2,
    rows: [
      { label: 'Relationship To Head of Household', value: child.relationshipToHeadOfHousehold, wide: true },
      { label: 'First Name', value: child.firstName },
      { label: 'Last Name', value: child.lastName },
      { label: 'Gender', value: child.gender },
      { label: 'Birthdate', value: child.birthdate },
      { label: 'Birthplace', value: child.birthplace },
    ],
  },
  {
    title: 'School And Background',
    columns: 2,
    rows: [
      { label: 'School', value: child.school },
      { label: 'H.S. Grad Yr', value: child.highSchoolGraduationYear },
      { label: 'First Language', value: child.firstLanguage },
    ],
  },
  {
    title: 'Sacramental Information',
    subtitle: 'Check if sacrament received. Add date if known.',
    sacraments: true,
    baptism: child.sacraments.baptism,
    isCatholic: child.isCatholic,
    sacramentList: [
      { name: 'Reconciliation', data: child.sacraments.reconciliation },
      { name: 'First Eucharist', data: child.sacraments.eucharist },
      { name: 'Confirmation', data: child.sacraments.confirmation },
    ],
  },
];

const buildAdditionalGroups = (value) => [
  {
    title: 'Pastoral Care',
    columns: 1,
    rows: [
      {
        label: 'Would any household member like to be visited by a priest?',
        value: formatChoice(value.additional.priestVisitRequested),
        wide: true,
      },
      { label: 'Priest Visit Details', value: value.additional.priestVisitDetails, wide: true },
    ],
  },
];

// --- Pure height measurement (no drawing, no side effects) ---

const measureLayoutRows = (rows, innerWidth) => {
  const halfWidth = (innerWidth - COLUMN_GAP) / 2;
  const layoutRows = [];
  let currentRow = [];

  for (const field of rows) {
    if (field.wide) {
      if (currentRow.length > 0) {
        layoutRows.push(currentRow);
        currentRow = [];
      }

      layoutRows.push([{ ...field, renderWidth: innerWidth }]);
    } else {
      currentRow.push({ ...field, renderWidth: halfWidth });

      if (currentRow.length === 2) {
        layoutRows.push(currentRow);
        currentRow = [];
      }
    }
  }

  if (currentRow.length > 0) {
    layoutRows.push(currentRow);
  }

  return layoutRows;
};

const measureFieldCardHeight = (rawValue, width, font) => {
  const valueLines = wrapText(rawValue, font, VALUE_SIZE, width - CELL_PADDING_X * 2);
  return CELL_PADDING_Y * 2 + LABEL_SIZE + 4 + valueLines.length * LINE_GAP;
};

const measureGroupCardHeight = (group, cardWidth, regularFont) => {
  const innerWidth = cardWidth - GROUP_CARD_PADDING * 2;
  const layoutRows = measureLayoutRows(group.rows, innerWidth);
  const titleHeight = group.title ? GROUP_SIZE + 8 : 0;
  const subtitleHeight = group.subtitle ? META_SIZE + 6 : 0;
  let fieldsHeight = 0;

  for (const row of layoutRows) {
    const rowHeight = Math.max(
      ...row.map((field) => measureFieldCardHeight(field.value, field.renderWidth, regularFont)),
    );
    fieldsHeight += rowHeight + 4;
  }

  return GROUP_CARD_PADDING * 2 + titleHeight + subtitleHeight + fieldsHeight;
};

const measureSacramentCardHeight = (group) => {
  const titleHeight = GROUP_SIZE + 8;
  const subtitleHeight = group.subtitle ? META_SIZE + 6 : 0;
  const checkRowHeight = 16;
  const baptismDateFieldHeight = CELL_PADDING_Y * 2 + LABEL_SIZE + 4 + LINE_GAP;
  const topBlockHeight = checkRowHeight + 6 + baptismDateFieldHeight + 6;
  const sacramentItemHeight = 16 + 4 + (CELL_PADDING_Y * 2 + LABEL_SIZE + 4 + LINE_GAP);
  const sacramentGridHeight = sacramentItemHeight + 8;

  return GROUP_CARD_PADDING * 2 + titleHeight + subtitleHeight + topBlockHeight + sacramentGridHeight;
};

const measureAdultHeight = (adult, colWidth, regularFont) => {
  let total = 0;

  for (const group of buildAdultGroups(adult)) {
    const h = group.sacraments
      ? measureSacramentCardHeight(group)
      : measureGroupCardHeight(group, colWidth, regularFont);
    total += h + GROUP_GAP;
  }

  return total;
};

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

  // --- Drawing helpers ---

  const drawRoundedRect = (pageTarget, x, y, w, h, borderColor, fillColor) => {
    if (fillColor) {
      pageTarget.drawRectangle({ x, y, width: w, height: h, color: fillColor });
    }

    pageTarget.drawRectangle({ x, y, width: w, height: h, borderWidth: 0.8, borderColor });
  };

  const drawCheckboxOn = (pageTarget, x, y, checked) => {
    const size = 10;

    pageTarget.drawRectangle({
      x,
      y: y - size,
      width: size,
      height: size,
      borderWidth: 0.8,
      borderColor: checked ? CHECK_GREEN : FIELD_BORDER,
      color: checked ? rgb(0.93, 0.98, 0.94) : WHITE,
    });

    if (checked) {
      pageTarget.drawLine({
        start: { x: x + 2, y: y - size + 4 },
        end: { x: x + 4, y: y - size + 2 },
        thickness: 1.5,
        color: CHECK_GREEN,
      });
      pageTarget.drawLine({
        start: { x: x + 4, y: y - size + 2 },
        end: { x: x + 8, y: y - size + 7.5 },
        thickness: 1.5,
        color: CHECK_GREEN,
      });
    }
  };

  const drawCheckbox = (x, y, checked) => drawCheckboxOn(page, x, y, checked);

  const drawHeader = () => {
    page.drawRectangle({ x: MARGIN, y: cursorY - 2, width: CONTENT_WIDTH, height: 3, color: BRAND_RED });
    cursorY -= 16;

    page.drawText('St. Joseph Catholic Church', {
      x: MARGIN,
      y: cursorY,
      size: TITLE_SIZE,
      font: boldFont,
      color: BLACK,
    });
    cursorY -= TITLE_SIZE + 2;

    page.drawText('Parish Registration Form', { x: MARGIN, y: cursorY, size: 13, font: regularFont, color: BRAND_RED });
    cursorY -= 16;

    page.drawText('1300 N. Main St., Bluffton, IN 46714  ·  (260) 824-1380', {
      x: MARGIN,
      y: cursorY,
      size: META_SIZE,
      font: regularFont,
      color: MUTED,
    });

    const dateText = `Submitted: ${formatValue(value.family.registrationDate)}`;
    const dateWidth = regularFont.widthOfTextAtSize(dateText, META_SIZE);

    page.drawText(dateText, {
      x: pageWidth - MARGIN - dateWidth,
      y: cursorY,
      size: META_SIZE,
      font: regularFont,
      color: MUTED,
    });
    cursorY -= META_SIZE + 10;

    page.drawLine({
      start: { x: MARGIN, y: cursorY },
      end: { x: pageWidth - MARGIN, y: cursorY },
      thickness: 0.5,
      color: DIVIDER,
    });
    cursorY -= 16;
  };

  const drawSectionTitle = (title) => {
    ensureSpace(SECTION_SIZE + 20);

    page.drawText(title.toUpperCase(), { x: MARGIN, y: cursorY, size: SECTION_SIZE, font: boldFont, color: BRAND_RED });
    cursorY -= SECTION_SIZE + 4;

    page.drawLine({
      start: { x: MARGIN, y: cursorY },
      end: { x: pageWidth - MARGIN, y: cursorY },
      thickness: 1,
      color: BRAND_RED,
      opacity: 0.25,
    });
    cursorY -= 12;
  };

  const drawSubsectionTitle = (title) => {
    ensureSpace(18);
    page.drawText(title, { x: MARGIN, y: cursorY, size: 11, font: boldFont, color: MUTED });
    cursorY -= 16;
  };

  // Draw a single field card at an exact position. Returns height used.
  const drawFieldCardOn = (pageTarget, x, y, width, label, rawValue) => {
    const valueLines = wrapText(rawValue, regularFont, VALUE_SIZE, width - CELL_PADDING_X * 2);
    const height = CELL_PADDING_Y * 2 + LABEL_SIZE + 4 + valueLines.length * LINE_GAP;

    pageTarget.drawRectangle({
      x,
      y: y - height,
      width,
      height,
      borderWidth: 0.6,
      borderColor: FIELD_BORDER,
      color: WHITE,
    });
    pageTarget.drawText(label.toUpperCase(), {
      x: x + CELL_PADDING_X,
      y: y - CELL_PADDING_Y - LABEL_SIZE,
      size: LABEL_SIZE,
      font: boldFont,
      color: MUTED,
    });

    valueLines.forEach((line, lineIndex) => {
      pageTarget.drawText(line === '' ? ' ' : line, {
        x: x + CELL_PADDING_X,
        y: y - CELL_PADDING_Y - LABEL_SIZE - 5 - lineIndex * LINE_GAP - VALUE_SIZE,
        size: VALUE_SIZE,
        font: regularFont,
        color: TEXT,
      });
    });

    return height;
  };

  const drawFieldCard = (x, y, width, label, rawValue) => drawFieldCardOn(page, x, y, width, label, rawValue);

  // Draw a group card at a specific (startX, startY) with a given cardWidth. Does NOT touch cursorY.
  const drawGroupCardAt = (pageTarget, group, startX, startY, cardWidth) => {
    const innerWidth = cardWidth - GROUP_CARD_PADDING * 2;
    const layoutRows = measureLayoutRows(group.rows, innerWidth);
    const titleHeight = group.title ? GROUP_SIZE + 8 : 0;
    const subtitleHeight = group.subtitle ? META_SIZE + 6 : 0;
    let fieldsHeight = 0;

    for (const row of layoutRows) {
      const rowHeight = Math.max(
        ...row.map((field) => measureFieldCardHeight(field.value, field.renderWidth, regularFont)),
      );
      fieldsHeight += rowHeight + 4;
    }

    const totalCardHeight = GROUP_CARD_PADDING * 2 + titleHeight + subtitleHeight + fieldsHeight;

    drawRoundedRect(pageTarget, startX, startY - totalCardHeight, cardWidth, totalCardHeight, GROUP_BORDER, GROUP_BG);

    let innerY = startY - GROUP_CARD_PADDING;

    if (group.title) {
      pageTarget.drawText(group.title.toUpperCase(), {
        x: startX + GROUP_CARD_PADDING,
        y: innerY - GROUP_SIZE + 1,
        size: GROUP_SIZE,
        font: boldFont,
        color: BRAND_DARK,
      });
      innerY -= titleHeight;
    }

    if (group.subtitle) {
      pageTarget.drawText(group.subtitle, {
        x: startX + GROUP_CARD_PADDING,
        y: innerY - META_SIZE + 1,
        size: META_SIZE,
        font: italicFont,
        color: MUTED,
      });
      innerY -= subtitleHeight;
    }

    for (const row of layoutRows) {
      const rowHeight = Math.max(
        ...row.map((field) => measureFieldCardHeight(field.value, field.renderWidth, regularFont)),
      );
      let xOffset = startX + GROUP_CARD_PADDING;

      for (const field of row) {
        drawFieldCardOn(pageTarget, xOffset, innerY, field.renderWidth, field.label, field.value);
        xOffset += field.renderWidth + COLUMN_GAP;
      }

      innerY -= rowHeight + 4;
    }

    return totalCardHeight;
  };

  // Draw sacrament card at a specific position. Does NOT touch cursorY.
  const drawSacramentCardAt = (pageTarget, group, startX, startY, cardWidth) => {
    const innerWidth = cardWidth - GROUP_CARD_PADDING * 2;
    const titleHeight = GROUP_SIZE + 8;
    const subtitleHeight = group.subtitle ? META_SIZE + 6 : 0;
    const checkRowHeight = 16;
    const baptismDateFieldHeight = CELL_PADDING_Y * 2 + LABEL_SIZE + 4 + LINE_GAP;
    const topBlockHeight = checkRowHeight + 6 + baptismDateFieldHeight + 6;
    const sacramentItemHeight = 16 + 4 + (CELL_PADDING_Y * 2 + LABEL_SIZE + 4 + LINE_GAP);
    const sacramentGridHeight = sacramentItemHeight + 8;
    const totalCardHeight =
      GROUP_CARD_PADDING * 2 + titleHeight + subtitleHeight + topBlockHeight + sacramentGridHeight;

    drawRoundedRect(pageTarget, startX, startY - totalCardHeight, cardWidth, totalCardHeight, GROUP_BORDER, GROUP_BG);

    let innerY = startY - GROUP_CARD_PADDING;

    pageTarget.drawText(group.title.toUpperCase(), {
      x: startX + GROUP_CARD_PADDING,
      y: innerY - GROUP_SIZE + 1,
      size: GROUP_SIZE,
      font: boldFont,
      color: BRAND_DARK,
    });
    innerY -= titleHeight;

    if (group.subtitle) {
      pageTarget.drawText(group.subtitle, {
        x: startX + GROUP_CARD_PADDING,
        y: innerY - META_SIZE + 1,
        size: META_SIZE,
        font: italicFont,
        color: MUTED,
      });
      innerY -= subtitleHeight;
    }

    const cbX1 = startX + GROUP_CARD_PADDING;
    const cbX2 = startX + GROUP_CARD_PADDING + innerWidth / 2;

    drawCheckboxOn(pageTarget, cbX1, innerY, isYes(group.baptism.received));
    pageTarget.drawText('Baptized?', { x: cbX1 + 14, y: innerY - 9, size: VALUE_SIZE, font: regularFont, color: TEXT });

    drawCheckboxOn(pageTarget, cbX2, innerY, isYes(group.isCatholic));
    pageTarget.drawText('Catholic?', { x: cbX2 + 14, y: innerY - 9, size: VALUE_SIZE, font: regularFont, color: TEXT });
    innerY -= checkRowHeight + 6;

    drawFieldCardOn(pageTarget, startX + GROUP_CARD_PADDING, innerY, innerWidth, 'Baptism Date', group.baptism.date);
    innerY -= baptismDateFieldHeight + 6;

    const sacColWidth = (innerWidth - COLUMN_GAP * 2) / 3;

    group.sacramentList.forEach((sacrament, sacIndex) => {
      const colX = startX + GROUP_CARD_PADDING + sacIndex * (sacColWidth + COLUMN_GAP);

      drawCheckboxOn(pageTarget, colX, innerY, isYes(sacrament.data.received));
      pageTarget.drawText(`${sacrament.name}?`, {
        x: colX + 14,
        y: innerY - 9,
        size: VALUE_SIZE,
        font: regularFont,
        color: TEXT,
      });
      drawFieldCardOn(pageTarget, colX, innerY - 18, sacColWidth, `${sacrament.name} Date`, sacrament.data.date);
    });

    return totalCardHeight;
  };

  // Draw a list of groups using cursorY (for all sections except adult columns).
  const drawGroups = (groups, startX = MARGIN, cardWidth = CONTENT_WIDTH) => {
    for (const group of groups) {
      const h = group.sacraments
        ? measureSacramentCardHeight(group)
        : measureGroupCardHeight(group, cardWidth, regularFont);

      ensureSpace(h);

      if (group.sacraments) {
        drawSacramentCardAt(page, group, startX, cursorY, cardWidth);
      } else {
        drawGroupCardAt(page, group, startX, cursorY, cardWidth);
      }

      cursorY -= h + GROUP_GAP;
    }
  };

  // Draw all adults side-by-side in two equal columns.
  const drawAdultColumns = (adults) => {
    const ADULT_COL_GAP = 14;
    const colWidth = (CONTENT_WIDTH - ADULT_COL_GAP) / 2;

    drawSectionTitle('Adult Members');

    // Column labels
    ensureSpace(14);
    adults.forEach((_, index) => {
      const labelX = MARGIN + index * (colWidth + ADULT_COL_GAP);
      page.drawText(`ADULT ${index + 1}`, {
        x: labelX,
        y: cursorY,
        size: 8,
        font: boldFont,
        color: MUTED,
      });
    });
    cursorY -= 14;

    // Measure both columns and find the tallest
    const heights = adults.map((adult) => measureAdultHeight(adult, colWidth, regularFont));
    const totalHeight = Math.max(...heights);

    ensureSpace(totalHeight);

    const columnStartY = cursorY;
    const columnPage = page;

    adults.forEach((adult, colIndex) => {
      const colX = MARGIN + colIndex * (colWidth + ADULT_COL_GAP);
      let colY = columnStartY;

      for (const group of buildAdultGroups(adult)) {
        const h = group.sacraments
          ? measureSacramentCardHeight(group)
          : measureGroupCardHeight(group, colWidth, regularFont);

        if (group.sacraments) {
          drawSacramentCardAt(columnPage, group, colX, colY, colWidth);
        } else {
          drawGroupCardAt(columnPage, group, colX, colY, colWidth);
        }

        colY -= h + GROUP_GAP;
      }
    });

    cursorY -= totalHeight;
  };

  const drawEmptyState = (message) => {
    const height = GROUP_CARD_PADDING * 2 + LINE_GAP;

    ensureSpace(height);
    drawRoundedRect(page, MARGIN, cursorY - height, CONTENT_WIDTH, height, GROUP_BORDER, GROUP_BG);

    page.drawText(message, {
      x: MARGIN + GROUP_CARD_PADDING,
      y: cursorY - GROUP_CARD_PADDING - VALUE_SIZE,
      size: VALUE_SIZE,
      font: italicFont,
      color: MUTED,
    });

    cursorY -= height + GROUP_GAP;
  };

  // --- Render the PDF ---

  drawHeader();

  drawSectionTitle('Family Information');
  drawGroups(buildFamilyGroups(value));

  drawAdultColumns(value.adults);

  drawSectionTitle('Marriage Information');
  drawGroups(buildMarriageGroups(value));

  drawSectionTitle('Additional Information');
  drawGroups(buildAdditionalGroups(value));

  drawSectionTitle('Children / Dependents');

  if (value.children.length === 0) {
    drawEmptyState('No children or dependents listed.');
  } else {
    value.children.forEach((child, index) => {
      drawSubsectionTitle(`Child / Dependent ${index + 1}`);
      drawGroups(buildChildGroups(child));
    });
  }

  // Footer on every page
  const pages = pdfDoc.getPages();

  pages.forEach((footerPage, pageIndex) => {
    const footerText = `Page ${pageIndex + 1} of ${pages.length}`;
    const footerWidth = regularFont.widthOfTextAtSize(footerText, 7);

    footerPage.drawText(footerText, {
      x: pageWidth - MARGIN - footerWidth,
      y: MARGIN - 20,
      size: 7,
      font: regularFont,
      color: MUTED,
    });
    footerPage.drawText('St. Joseph Catholic Church · Parish Registration', {
      x: MARGIN,
      y: MARGIN - 20,
      size: 7,
      font: regularFont,
      color: MUTED,
    });
  });

  return await pdfDoc.save();
};
