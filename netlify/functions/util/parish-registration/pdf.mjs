import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_SIZE = [612, 792];
const MARGIN = 18;
const CONTENT_WIDTH = PAGE_SIZE[0] - MARGIN * 2;
const TITLE_SIZE = 11;
const SECTION_SIZE = 8;
const LABEL_SIZE = 4.5;
const VALUE_SIZE = 7;
const META_SIZE = 6;
const LINE_GAP = 7;
const CELL_PADDING_X = 3;
const CELL_PADDING_Y = 1.5;
const COLUMN_GAP = 4;
const FIELD_ROW_GAP = 5;
const SECTION_GAP = 5;
const SECTION_TOP_GAP = 10;
const MEMBER_LABEL_GAP = 3;
const MEMBER_SECTION_TOP_GAP = 8;
const CHILD_LABEL_TOP_GAP = 6;

// Brand colors
const BRAND_RED = rgb(0.749, 0.188, 0.235);
const BRAND_DARK = rgb(0.51, 0.129, 0.161);
const BLACK = rgb(0.08, 0.08, 0.08);
const TEXT = rgb(0.18, 0.18, 0.18);
const MUTED = rgb(0.42, 0.42, 0.42);
const FIELD_FILL = rgb(0.955, 0.955, 0.955);
const DIVIDER = rgb(0.88, 0.88, 0.88);
const WHITE = rgb(1, 1, 1);
const CHECK_GREEN = rgb(0.18, 0.62, 0.28);

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
  if (value === null || value === undefined) return '\u2014';
  const s = String(value).trim();
  return s === '' ? '\u2014' : s;
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
      const next = `${currentLine} ${word}`;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        currentLine = next;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : ['\u2014'];
};

// --- Field builders ---

// Family + Marriage + Additional merged into one 3-col grid
const buildFamilyAndMarriageFields = (value) => [
  { label: 'Family Last Name', value: value.family.lastName },
  { label: 'First Name(s)', value: value.family.firstNames },
  { label: 'Mailing Name', value: value.family.mailingName },
  { label: 'Address', value: value.family.address },
  { label: 'Address Line 2', value: value.family.addressLine2 },
  { label: 'City', value: value.family.city },
  { label: 'State', value: value.family.state },
  { label: 'Zip', value: value.family.zip },
  { label: 'Home Phone', value: value.family.homePhone },
  { label: 'Emergency Phone', value: value.family.emergencyPhone },
  { label: 'Family Email', value: value.family.familyEmail },
  { label: 'Env#', value: value.family.envelopeNumber },
];

const buildAdultFields = (adult) => [
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
];

const buildAdultSacraments = (adult) => ({
  baptism: adult.sacraments.baptism,
  isCatholic: adult.isCatholic,
  sacramentList: [
    { name: 'Reconciliation', data: adult.sacraments.reconciliation },
    { name: 'First Eucharist', data: adult.sacraments.eucharist },
    { name: 'Confirmation', data: adult.sacraments.confirmation },
  ],
});

const buildChildFields = (child) => [
  { label: 'Relationship to Head of Household', value: child.relationshipToHeadOfHousehold, span: 2 },
  { label: 'First Name', value: child.firstName },
  { label: 'Last Name', value: child.lastName },
  { label: 'Gender', value: child.gender },
  { label: 'Birthdate', value: child.birthdate },
  { label: 'Birthplace', value: child.birthplace },
  { label: 'School', value: child.school },
  { label: 'H.S. Grad Yr', value: child.highSchoolGraduationYear },
  { label: 'First Language', value: child.firstLanguage },
];

const buildChildSacraments = (child) => ({
  baptism: child.sacraments.baptism,
  isCatholic: child.isCatholic,
  sacramentList: [
    { name: 'Reconciliation', data: child.sacraments.reconciliation },
    { name: 'First Eucharist', data: child.sacraments.eucharist },
    { name: 'Confirmation', data: child.sacraments.confirmation },
  ],
});

// --- Height measurement ---

const measureLayoutRows = (fields, innerWidth, numCols = 2) => {
  const colWidth = (innerWidth - COLUMN_GAP * (numCols - 1)) / numCols;
  const layoutRows = [];
  let currentRow = [];
  let currentSpan = 0;

  for (const field of fields) {
    if (field.wide) {
      if (currentRow.length > 0) {
        layoutRows.push(currentRow);
        currentRow = [];
        currentSpan = 0;
      }
      layoutRows.push([{ ...field, renderWidth: innerWidth }]);
    } else {
      const span = Math.min(field.span ?? 1, numCols);

      if (currentSpan > 0 && currentSpan + span > numCols) {
        layoutRows.push(currentRow);
        currentRow = [];
        currentSpan = 0;
      }

      currentRow.push({
        ...field,
        renderWidth: colWidth * span + COLUMN_GAP * (span - 1),
      });
      currentSpan += span;

      if (currentSpan === numCols) {
        layoutRows.push(currentRow);
        currentRow = [];
        currentSpan = 0;
      }
    }
  }

  if (currentRow.length > 0) layoutRows.push(currentRow);
  return layoutRows;
};

const measureFieldCardHeight = (rawValue, width, font) => {
  const valueLines = wrapText(rawValue, font, VALUE_SIZE, width - CELL_PADDING_X * 2);
  return LABEL_SIZE + 3 + CELL_PADDING_Y * 2 + valueLines.length * LINE_GAP + 1;
};

const measureFieldGridHeight = (fields, gridWidth, regularFont, numCols = 2) => {
  const layoutRows = measureLayoutRows(fields, gridWidth, numCols);
  let total = 0;

  for (const row of layoutRows) {
    const rowH = Math.max(...row.map((f) => measureFieldCardHeight(f.value, f.renderWidth, regularFont)));
    total += rowH + FIELD_ROW_GAP;
  }

  return total;
};

const sacramentBlockHeight = () => {
  const checkRowH = 12;
  const fieldH = CELL_PADDING_Y * 2 + LABEL_SIZE + 3 + LINE_GAP;
  return checkRowH + 4 + fieldH + 4 + checkRowH + 4 + fieldH;
};

const childSacramentRowHeight = () => 16 + (CELL_PADDING_Y + LABEL_SIZE + 2 + LINE_GAP + 2);

export const generateParishRegistrationPdf = async (value) => {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const pageWidth = PAGE_SIZE[0];
  const pageHeight = PAGE_SIZE[1];
  let page = pdfDoc.addPage(PAGE_SIZE);
  let cursorY = pageHeight - MARGIN;

  const addPage = () => {
    page = pdfDoc.addPage(PAGE_SIZE);
    cursorY = pageHeight - MARGIN;
  };

  const ensureSpace = (requiredHeight) => {
    if (cursorY - requiredHeight < MARGIN + 16) addPage();
  };

  // --- Drawing helpers ---

  const drawCheckboxOn = (pageTarget, x, y, checked) => {
    const size = 9;
    pageTarget.drawRectangle({
      x,
      y: y - size,
      width: size,
      height: size,
      borderWidth: 0.7,
      borderColor: checked ? CHECK_GREEN : DIVIDER,
      color: checked ? rgb(0.93, 0.98, 0.94) : WHITE,
    });

    if (checked) {
      pageTarget.drawLine({
        start: { x: x + 1.5, y: y - size + 3.5 },
        end: { x: x + 3.5, y: y - size + 1.5 },
        thickness: 1.2,
        color: CHECK_GREEN,
      });
      pageTarget.drawLine({
        start: { x: x + 3.5, y: y - size + 1.5 },
        end: { x: x + 7.5, y: y - size + 7 },
        thickness: 1.2,
        color: CHECK_GREEN,
      });
    }
  };

  const drawHeader = () => {
    // Row 1: church name (left) + form title (right)
    page.drawText('St. Joseph Catholic Church', {
      x: MARGIN,
      y: cursorY,
      size: TITLE_SIZE,
      font: boldFont,
      color: BLACK,
    });
    const regLabel = 'Parish Registration Form';
    const regLabelW = regularFont.widthOfTextAtSize(regLabel, SECTION_SIZE);
    page.drawText(regLabel, {
      x: pageWidth - MARGIN - regLabelW,
      y: cursorY,
      size: SECTION_SIZE,
      font: regularFont,
      color: BRAND_RED,
    });
    cursorY -= TITLE_SIZE + 3;

    // Row 2: address (left) + submitted date (right)
    page.drawText('1300 N. Main St., Bluffton, IN 46714  \xb7  (260) 824-1380', {
      x: MARGIN,
      y: cursorY,
      size: META_SIZE,
      font: regularFont,
      color: MUTED,
    });
    const dateText = `Submitted: ${formatValue(value.family.registrationDate)}`;
    const dateW = regularFont.widthOfTextAtSize(dateText, META_SIZE);
    page.drawText(dateText, {
      x: pageWidth - MARGIN - dateW,
      y: cursorY,
      size: META_SIZE,
      font: regularFont,
      color: MUTED,
    });
    cursorY -= META_SIZE + 5;

    page.drawLine({
      start: { x: MARGIN, y: cursorY },
      end: { x: pageWidth - MARGIN, y: cursorY },
      thickness: 0.5,
      color: DIVIDER,
    });
    cursorY -= 6;
  };

  const drawSectionTitle = (title, options = {}) => {
    const { belowTitleGap = 1 } = options;

    ensureSpace(SECTION_SIZE + 16);
    cursorY -= SECTION_TOP_GAP;
    page.drawText(title.toUpperCase(), { x: MARGIN, y: cursorY, size: SECTION_SIZE, font: boldFont, color: BRAND_RED });
    cursorY -= SECTION_SIZE + belowTitleGap;
    page.drawLine({
      start: { x: MARGIN, y: cursorY },
      end: { x: pageWidth - MARGIN, y: cursorY },
      thickness: 0.6,
      color: BRAND_RED,
      opacity: 0.18,
    });
    cursorY -= 4;
  };

  // Draw a single form field at an exact position. Returns height used.
  const drawFieldCardOn = (pageTarget, x, y, width, label, rawValue) => {
    const valueLines = wrapText(rawValue, regularFont, VALUE_SIZE, width - CELL_PADDING_X * 2);
    const valueBoxTop = y - LABEL_SIZE - 3;
    const valueBoxHeight = CELL_PADDING_Y * 2 + valueLines.length * LINE_GAP + 1;
    const height = LABEL_SIZE + 3 + valueBoxHeight;

    pageTarget.drawText(label.toUpperCase(), {
      x,
      y: y - LABEL_SIZE,
      size: LABEL_SIZE,
      font: boldFont,
      color: MUTED,
    });

    pageTarget.drawRectangle({
      x,
      y: valueBoxTop - valueBoxHeight,
      width,
      height: valueBoxHeight,
      color: FIELD_FILL,
    });

    valueLines.forEach((line, i) => {
      pageTarget.drawText(line === '' ? ' ' : line, {
        x: x + CELL_PADDING_X,
        y: valueBoxTop - CELL_PADDING_Y - i * LINE_GAP - VALUE_SIZE,
        size: VALUE_SIZE,
        font: regularFont,
        color: TEXT,
      });
    });

    return height;
  };

  const drawMemberLabel = (label, x = MARGIN, y = cursorY) => {
    page.drawText(label.toUpperCase(), {
      x,
      y,
      size: META_SIZE,
      font: boldFont,
      color: MUTED,
    });
  };

  // Draw a flat grid of fields at cursorY, advancing cursorY.
  const drawFieldGrid = (fields, startX = MARGIN, gridWidth = CONTENT_WIDTH, numCols = 2) => {
    const layoutRows = measureLayoutRows(fields, gridWidth, numCols);

    for (const row of layoutRows) {
      const rowH = Math.max(...row.map((f) => measureFieldCardHeight(f.value, f.renderWidth, regularFont)));
      ensureSpace(rowH + FIELD_ROW_GAP);
      let xOffset = startX;

      for (const field of row) {
        drawFieldCardOn(page, xOffset, cursorY, field.renderWidth, field.label, field.value);
        xOffset += field.renderWidth + COLUMN_GAP;
      }

      cursorY -= rowH + FIELD_ROW_GAP;
    }
  };

  const drawChildSacramentRowAt = (pageTarget, sacData, startX, startY, blockWidth) => {
    const totalParts = 5;
    const partWidth = (blockWidth - COLUMN_GAP * (totalParts - 1)) / totalParts;
    const baptismWidth = partWidth * 2 + COLUMN_GAP;
    const otherWidth = partWidth;
    const fieldH = CELL_PADDING_Y + LABEL_SIZE + 2 + LINE_GAP + 2;
    const items = [
      {
        label: 'Baptism',
        width: baptismWidth,
        checked: isYes(sacData.baptism.received),
        value: sacData.baptism.date,
        extraLabel: 'Catholic?',
        extraChecked: isYes(sacData.isCatholic),
      },
      {
        label: 'Reconciliation',
        width: otherWidth,
        checked: isYes(sacData.sacramentList[0].data.received),
        value: sacData.sacramentList[0].data.date,
      },
      {
        label: 'First Eucharist',
        width: otherWidth,
        checked: isYes(sacData.sacramentList[1].data.received),
        value: sacData.sacramentList[1].data.date,
      },
      {
        label: 'Confirmation',
        width: otherWidth,
        checked: isYes(sacData.sacramentList[2].data.received),
        value: sacData.sacramentList[2].data.date,
      },
    ];

    let x = startX;

    items.forEach((item) => {
      drawCheckboxOn(pageTarget, x, startY, item.checked);
      pageTarget.drawText(`${item.label}?`, {
        x: x + 12,
        y: startY - 8,
        size: VALUE_SIZE,
        font: regularFont,
        color: TEXT,
      });

      if (item.extraLabel) {
        const extraX = x + item.width / 2;
        drawCheckboxOn(pageTarget, extraX, startY, item.extraChecked);
        pageTarget.drawText(item.extraLabel, {
          x: extraX + 12,
          y: startY - 8,
          size: VALUE_SIZE,
          font: regularFont,
          color: TEXT,
        });
      }

      drawFieldCardOn(pageTarget, x, startY - 16, item.width, `${item.label} Date`, item.value);
      x += item.width + COLUMN_GAP;
    });

    return startY - 16 - fieldH;
  };

  const drawPriestVisitRow = () => {
    const checkboxWidth = (CONTENT_WIDTH - COLUMN_GAP) / 6;
    const detailWidth = CONTENT_WIDTH - checkboxWidth - COLUMN_GAP;
    const rowHeight = Math.max(
      12,
      measureFieldCardHeight(value.additional.priestVisitDetails, detailWidth, regularFont),
    );

    ensureSpace(rowHeight + FIELD_ROW_GAP);

    const controlY = cursorY - Math.max(0, (rowHeight - 12) / 2);

    drawCheckboxOn(page, MARGIN, controlY, isYes(value.additional.priestVisitRequested));
    page.drawText('Priest Visit?', {
      x: MARGIN + 13,
      y: controlY - 7,
      size: VALUE_SIZE,
      font: regularFont,
      color: TEXT,
    });

    drawFieldCardOn(
      page,
      MARGIN + checkboxWidth + COLUMN_GAP,
      cursorY,
      detailWidth,
      'Priest Visit Details',
      value.additional.priestVisitDetails,
    );

    cursorY -= rowHeight + FIELD_ROW_GAP;
  };

  const drawMarriageRow = () => {
    const statusWidth = Math.floor(CONTENT_WIDTH * 0.25);
    const checkboxX = MARGIN + statusWidth + COLUMN_GAP + 8;
    const fieldHeight = measureFieldCardHeight(
      formatTitleCase(value.marriage?.maritalStatus ?? ''),
      statusWidth,
      regularFont,
    );
    const rowHeight = Math.max(12, fieldHeight);

    ensureSpace(rowHeight + FIELD_ROW_GAP);

    drawFieldCardOn(
      page,
      MARGIN,
      cursorY,
      statusWidth,
      'Marital Status',
      formatTitleCase(value.marriage?.maritalStatus ?? ''),
    );

    const checkboxY = cursorY - Math.max(0, (rowHeight - 12) / 2) - 1;
    drawCheckboxOn(page, checkboxX, checkboxY, isYes(value.marriage?.validCatholicMarriage));
    page.drawText('Valid Catholic Marriage?', {
      x: checkboxX + 13,
      y: checkboxY - 8,
      size: VALUE_SIZE,
      font: regularFont,
      color: TEXT,
    });

    cursorY -= rowHeight + FIELD_ROW_GAP;
  };

  // Draw sacrament block at the given position. Returns ending Y (does NOT touch cursorY).
  const drawSacramentBlockAt = (pageTarget, sacData, startX, startY, blockWidth) => {
    const checkSize = 9;
    const fieldH = CELL_PADDING_Y * 2 + LABEL_SIZE + 3 + LINE_GAP;
    const sacColWidth = (blockWidth - COLUMN_GAP * 2) / 3;
    let colY = startY;

    drawCheckboxOn(pageTarget, startX, colY, isYes(sacData.baptism.received));
    pageTarget.drawText('Baptized?', {
      x: startX + checkSize + 3,
      y: colY - 8,
      size: VALUE_SIZE,
      font: regularFont,
      color: TEXT,
    });
    const col2X = startX + blockWidth / 2;
    drawCheckboxOn(pageTarget, col2X, colY, isYes(sacData.isCatholic));
    pageTarget.drawText('Catholic?', {
      x: col2X + checkSize + 3,
      y: colY - 8,
      size: VALUE_SIZE,
      font: regularFont,
      color: TEXT,
    });
    colY -= 12 + 4;

    drawFieldCardOn(pageTarget, startX, colY, blockWidth, 'Baptism Date', sacData.baptism.date);
    colY -= fieldH + 7;

    sacData.sacramentList.forEach((sac, i) => {
      const sx = startX + i * (sacColWidth + COLUMN_GAP);
      drawCheckboxOn(pageTarget, sx, colY, isYes(sac.data.received));
      pageTarget.drawText(`${sac.name}?`, {
        x: sx + checkSize + 3,
        y: colY - 8,
        size: VALUE_SIZE,
        font: regularFont,
        color: TEXT,
      });
    });
    colY -= 12 + 4;

    sacData.sacramentList.forEach((sac, i) => {
      const sx = startX + i * (sacColWidth + COLUMN_GAP);
      drawFieldCardOn(pageTarget, sx, colY, sacColWidth, `${sac.name} Date`, sac.data.date);
    });
    colY -= fieldH;

    return colY;
  };

  // Draw two adult columns side-by-side with 2-sub-col fields.
  const drawAdultColumns = (adults) => {
    const COL_GAP = 10;
    const colWidth = (CONTENT_WIDTH - COL_GAP) / 2;

    cursorY -= MEMBER_SECTION_TOP_GAP - 4;
    drawSectionTitle('Individual Member Information', { belowTitleGap: -1 });

    const measureAdultCol = (adult) => {
      const fieldsH = measureFieldGridHeight(buildAdultFields(adult), colWidth, regularFont, 2);
      return fieldsH + SECTION_GAP + META_SIZE + 4 + sacramentBlockHeight();
    };

    const totalH = Math.max(...adults.map(measureAdultCol));
    ensureSpace(META_SIZE + 4 + totalH);

    adults.forEach((adult, i) => {
      const colX = MARGIN + i * (colWidth + COL_GAP);
      drawMemberLabel(`Adult ${i + 1}`, colX, cursorY - MEMBER_LABEL_GAP);
    });
    cursorY -= MEMBER_LABEL_GAP + META_SIZE + 2;

    const colStartY = cursorY;

    adults.forEach((adult, colIndex) => {
      const colX = MARGIN + colIndex * (colWidth + COL_GAP);
      const fieldLayoutRows = measureLayoutRows(buildAdultFields(adult), colWidth, 2);
      let colY = colStartY;

      for (const row of fieldLayoutRows) {
        const rowH = Math.max(...row.map((f) => measureFieldCardHeight(f.value, f.renderWidth, regularFont)));
        let xOff = colX;

        for (const field of row) {
          drawFieldCardOn(page, xOff, colY, field.renderWidth, field.label, field.value);
          xOff += field.renderWidth + COLUMN_GAP;
        }

        colY -= rowH + FIELD_ROW_GAP;
      }

      colY -= SECTION_GAP + 2;
      page.drawText('SACRAMENTS', { x: colX, y: colY, size: META_SIZE, font: boldFont, color: BRAND_DARK });
      colY -= META_SIZE + 2;

      drawSacramentBlockAt(page, buildAdultSacraments(adult), colX, colY, colWidth);
    });

    cursorY -= totalH;
  };

  // --- Render the PDF ---

  drawHeader();

  drawSectionTitle('Family Information', { belowTitleGap: -1 });
  drawFieldGrid(buildFamilyAndMarriageFields(value), MARGIN, CONTENT_WIDTH, 3);

  drawAdultColumns(value.adults);
  cursorY -= SECTION_GAP + 4;
  drawMarriageRow();
  drawPriestVisitRow();

  if (value.children.length > 0) {
    cursorY -= MEMBER_SECTION_TOP_GAP - 4;
    drawSectionTitle('Dependent Children Information', { belowTitleGap: -1 });

    const measureChild = (child) => {
      const fieldsH = measureFieldGridHeight(buildChildFields(child), CONTENT_WIDTH, regularFont, 5);
      return CHILD_LABEL_TOP_GAP + MEMBER_LABEL_GAP + META_SIZE + 2 + fieldsH + SECTION_GAP + childSacramentRowHeight();
    };

    value.children.forEach((child, index) => {
      ensureSpace(measureChild(child));

      cursorY -= CHILD_LABEL_TOP_GAP;
      drawMemberLabel(`Dependent / Child ${index + 1}`, MARGIN, cursorY - MEMBER_LABEL_GAP);
      cursorY -= MEMBER_LABEL_GAP + META_SIZE + 2;

      drawFieldGrid(buildChildFields(child), MARGIN, CONTENT_WIDTH, 5);

      cursorY -= SECTION_GAP;
      cursorY = drawChildSacramentRowAt(page, buildChildSacraments(child), MARGIN, cursorY, CONTENT_WIDTH);
    });
  }

  // Footer on every page
  const pages = pdfDoc.getPages();

  pages.forEach((footerPage, pageIndex) => {
    const footerText = `Page ${pageIndex + 1} of ${pages.length}`;
    const footerW = regularFont.widthOfTextAtSize(footerText, META_SIZE);

    footerPage.drawText(footerText, {
      x: pageWidth - MARGIN - footerW,
      y: MARGIN - 14,
      size: META_SIZE,
      font: regularFont,
      color: MUTED,
    });
    footerPage.drawText('St. Joseph Catholic Church \xb7 Parish Registration', {
      x: MARGIN,
      y: MARGIN - 14,
      size: META_SIZE,
      font: regularFont,
      color: MUTED,
    });
  });

  return await pdfDoc.save();
};
