import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const PAGE_SIZE = [612, 792];
const MARGIN = 24;
const CONTENT_WIDTH = PAGE_SIZE[0] - MARGIN * 2;
const TITLE_SIZE = 14;
const SECTION_SIZE = 9;
const LABEL_SIZE = 5.5;
const VALUE_SIZE = 8;
const META_SIZE = 7;
const LINE_GAP = 9;
const CELL_PADDING_X = 5;
const CELL_PADDING_Y = 3;
const COLUMN_GAP = 5;
const FIELD_ROW_GAP = 3;
const SECTION_GAP = 8;

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

// --- Flat field row builders (no subsection grouping) ---

const buildFamilyFields = (value) => [
  { label: 'Last Name', value: value.family.lastName },
  { label: 'First Name(s)', value: value.family.firstNames },
  { label: 'Mailing Name', value: value.family.mailingName, wide: true },
  { label: 'Address', value: value.family.address, wide: true },
  { label: 'Address Line 2', value: value.family.addressLine2, wide: true },
  { label: 'City', value: value.family.city },
  { label: 'State', value: value.family.state },
  { label: 'Zip', value: value.family.zip },
  { label: 'Home Phone', value: value.family.homePhone },
  { label: 'Emergency Phone', value: value.family.emergencyPhone },
  { label: 'Family Email', value: value.family.familyEmail, wide: true },
  { label: 'Env#', value: value.family.envelopeNumber },
];

const buildAdultFields = (adult) => [
  { label: 'First Name', value: adult.firstName },
  { label: 'Nickname', value: adult.nickname },
  { label: 'Gender', value: adult.gender },
  { label: 'Maiden Name', value: adult.maidenName },
  { label: 'Role', value: adult.role },
  { label: 'Parish Status', value: adult.parishStatus },
  { label: 'Date of Birth', value: adult.dateOfBirth },
  { label: 'Birthplace', value: adult.birthplace },
  { label: 'Email', value: adult.email, wide: true },
  { label: 'Work Phone', value: adult.workPhone },
  { label: 'Cell Phone', value: adult.cellPhone },
  { label: 'First Language', value: adult.firstLanguage },
  { label: 'Occupation', value: adult.occupation },
  { label: 'Employer', value: adult.employer },
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
  { label: 'First Name', value: child.firstName },
  { label: 'Last Name', value: child.lastName },
  { label: 'Relationship', value: child.relationshipToHeadOfHousehold },
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

// --- Pure height measurement (no drawing, no side effects) ---

const measureLayoutRows = (fields, innerWidth) => {
  const halfWidth = (innerWidth - COLUMN_GAP) / 2;
  const layoutRows = [];
  let currentRow = [];

  for (const field of fields) {
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
  return CELL_PADDING_Y * 2 + LABEL_SIZE + 3 + valueLines.length * LINE_GAP;
};

const measureFieldGridHeight = (fields, gridWidth, regularFont) => {
  const layoutRows = measureLayoutRows(fields, gridWidth);
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
    if (cursorY - requiredHeight < MARGIN + 16) {
      addPage();
    }
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
      borderColor: checked ? CHECK_GREEN : FIELD_BORDER,
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
    page.drawRectangle({ x: MARGIN, y: cursorY - 2, width: CONTENT_WIDTH, height: 3, color: BRAND_RED });
    cursorY -= 10;

    page.drawText('St. Joseph Catholic Church', {
      x: MARGIN,
      y: cursorY,
      size: TITLE_SIZE,
      font: boldFont,
      color: BLACK,
    });
    cursorY -= TITLE_SIZE + 2;

    page.drawText('Parish Registration Form', {
      x: MARGIN,
      y: cursorY,
      size: SECTION_SIZE,
      font: regularFont,
      color: BRAND_RED,
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
    cursorY -= SECTION_SIZE + 3;

    page.drawText('1300 N. Main St., Bluffton, IN 46714  ·  (260) 824-1380', {
      x: MARGIN,
      y: cursorY,
      size: META_SIZE,
      font: regularFont,
      color: MUTED,
    });
    cursorY -= META_SIZE + 6;

    page.drawLine({
      start: { x: MARGIN, y: cursorY },
      end: { x: pageWidth - MARGIN, y: cursorY },
      thickness: 0.5,
      color: DIVIDER,
    });
    cursorY -= 8;
  };

  const drawSectionTitle = (title) => {
    ensureSpace(SECTION_SIZE + 20);
    cursorY -= 10;

    page.drawText(title.toUpperCase(), { x: MARGIN, y: cursorY, size: SECTION_SIZE, font: boldFont, color: BRAND_RED });
    cursorY -= SECTION_SIZE + 3;

    page.drawLine({
      start: { x: MARGIN, y: cursorY },
      end: { x: pageWidth - MARGIN, y: cursorY },
      thickness: 0.8,
      color: BRAND_RED,
      opacity: 0.3,
    });
    cursorY -= 6;
  };

  // Draw a single field card at an exact position. Returns height used.
  const drawFieldCardOn = (pageTarget, x, y, width, label, rawValue) => {
    const valueLines = wrapText(rawValue, regularFont, VALUE_SIZE, width - CELL_PADDING_X * 2);
    const height = CELL_PADDING_Y * 2 + LABEL_SIZE + 3 + valueLines.length * LINE_GAP;

    pageTarget.drawRectangle({
      x,
      y: y - height,
      width,
      height,
      borderWidth: 0.5,
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

    valueLines.forEach((line, i) => {
      pageTarget.drawText(line === '' ? ' ' : line, {
        x: x + CELL_PADDING_X,
        y: y - CELL_PADDING_Y - LABEL_SIZE - 3 - i * LINE_GAP - VALUE_SIZE,
        size: VALUE_SIZE,
        font: regularFont,
        color: TEXT,
      });
    });

    return height;
  };

  // Draw a flat grid of fields at cursorY, advancing cursorY. No card wrapper around the group.
  const drawFieldGrid = (fields, startX = MARGIN, gridWidth = CONTENT_WIDTH) => {
    const layoutRows = measureLayoutRows(fields, gridWidth);

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

  // Draw sacrament block (checkboxes + date fields) at cursorY, advancing cursorY.
  const drawSacramentBlock = (sacData, startX = MARGIN, blockWidth = CONTENT_WIDTH) => {
    const checkSize = 9;
    const fieldH = CELL_PADDING_Y * 2 + LABEL_SIZE + 3 + LINE_GAP;
    const sacColWidth = (blockWidth - COLUMN_GAP * 2) / 3;

    // Row 1: Baptized + Catholic checkboxes, then baptism date
    ensureSpace(12 + 4 + fieldH + 4);
    const cbY = cursorY;

    drawCheckboxOn(page, startX, cbY, isYes(sacData.baptism.received));
    page.drawText('Baptized?', {
      x: startX + checkSize + 4,
      y: cbY - 8,
      size: VALUE_SIZE,
      font: regularFont,
      color: TEXT,
    });

    const col2X = startX + blockWidth / 2;
    drawCheckboxOn(page, col2X, cbY, isYes(sacData.isCatholic));
    page.drawText('Catholic?', {
      x: col2X + checkSize + 4,
      y: cbY - 8,
      size: VALUE_SIZE,
      font: regularFont,
      color: TEXT,
    });
    cursorY -= 12 + 4;

    drawFieldCardOn(page, startX, cursorY, blockWidth, 'Baptism Date', sacData.baptism.date);
    cursorY -= fieldH + 4;

    // Row 2: Reconciliation, Eucharist, Confirmation checkboxes + dates
    ensureSpace(12 + 4 + fieldH);
    const cbY2 = cursorY;

    sacData.sacramentList.forEach((sac, i) => {
      const colX = startX + i * (sacColWidth + COLUMN_GAP);
      drawCheckboxOn(page, colX, cbY2, isYes(sac.data.received));
      page.drawText(`${sac.name}?`, {
        x: colX + checkSize + 4,
        y: cbY2 - 8,
        size: VALUE_SIZE,
        font: regularFont,
        color: TEXT,
      });
    });
    cursorY -= 12 + 4;

    sacData.sacramentList.forEach((sac, i) => {
      const colX = startX + i * (sacColWidth + COLUMN_GAP);
      drawFieldCardOn(page, colX, cursorY, sacColWidth, `${sac.name} Date`, sac.data.date);
    });
    cursorY -= fieldH;
  };

  // Draw two adult columns side-by-side.
  const drawAdultColumns = (adults) => {
    const COL_GAP = 10;
    const colWidth = (CONTENT_WIDTH - COL_GAP) / 2;

    drawSectionTitle('Adult Members');

    // Measure total column height
    const measureAdultCol = (adult) => {
      const fieldsH = measureFieldGridHeight(buildAdultFields(adult), colWidth, regularFont);
      const sacH = sacramentBlockHeight();
      // sacraments label line + spacing
      return fieldsH + SECTION_GAP + META_SIZE + 4 + sacH;
    };

    const totalH = Math.max(...adults.map(measureAdultCol));
    ensureSpace(totalH + 16);

    // Draw column headers
    adults.forEach((adult, i) => {
      const colX = MARGIN + i * (colWidth + COL_GAP);
      page.drawText(`ADULT ${i + 1} — ${formatValue(adult.firstName)} ${formatValue(adult.lastName)}`.toUpperCase(), {
        x: colX,
        y: cursorY,
        size: META_SIZE,
        font: boldFont,
        color: MUTED,
      });
    });
    cursorY -= META_SIZE + 4;

    const colStartY = cursorY;

    adults.forEach((adult, colIndex) => {
      const colX = MARGIN + colIndex * (colWidth + COL_GAP);
      // Temporarily redirect cursorY writes to a local var by using direct coordinates
      const fields = buildAdultFields(adult);
      const fieldLayoutRows = measureLayoutRows(fields, colWidth);
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

      // Sacraments label
      colY -= SECTION_GAP;
      page.drawText('SACRAMENTS', { x: colX, y: colY, size: META_SIZE, font: boldFont, color: BRAND_DARK });
      colY -= META_SIZE + 4;

      // Draw sacrament block inline (manually, same as drawSacramentBlock but at colX/colY)
      const sacData = buildAdultSacraments(adult);
      const checkSize = 9;
      const fieldH = CELL_PADDING_Y * 2 + LABEL_SIZE + 3 + LINE_GAP;
      const sacColWidth = (colWidth - COLUMN_GAP * 2) / 3;

      drawCheckboxOn(page, colX, colY, isYes(sacData.baptism.received));
      page.drawText('Baptized?', {
        x: colX + checkSize + 4,
        y: colY - 8,
        size: VALUE_SIZE,
        font: regularFont,
        color: TEXT,
      });
      const col2X = colX + colWidth / 2;
      drawCheckboxOn(page, col2X, colY, isYes(sacData.isCatholic));
      page.drawText('Catholic?', {
        x: col2X + checkSize + 4,
        y: colY - 8,
        size: VALUE_SIZE,
        font: regularFont,
        color: TEXT,
      });
      colY -= 12 + 4;

      drawFieldCardOn(page, colX, colY, colWidth, 'Baptism Date', sacData.baptism.date);
      colY -= fieldH + 4;

      sacData.sacramentList.forEach((sac, i) => {
        const sx = colX + i * (sacColWidth + COLUMN_GAP);
        drawCheckboxOn(page, sx, colY, isYes(sac.data.received));
        page.drawText(`${sac.name}?`, {
          x: sx + checkSize + 4,
          y: colY - 8,
          size: VALUE_SIZE,
          font: regularFont,
          color: TEXT,
        });
      });
      colY -= 12 + 4;

      sacData.sacramentList.forEach((sac, i) => {
        const sx = colX + i * (sacColWidth + COLUMN_GAP);
        drawFieldCardOn(page, sx, colY, sacColWidth, `${sac.name} Date`, sac.data.date);
      });
    });

    cursorY -= totalH;
  };

  // --- Render the PDF ---

  drawHeader();

  drawSectionTitle('Family Information');
  drawFieldGrid(buildFamilyFields(value));

  // Marriage + Additional on one row after Family
  {
    const marriageFields = [
      { label: 'Marital Status', value: value.marriage?.maritalStatus ?? '' },
      { label: 'Valid Catholic Marriage?', value: formatChoice(value.marriage?.validCatholicMarriage ?? '') },
    ];
    const additionalFields = [
      { label: 'Priest Visit?', value: formatChoice(value.additional.priestVisitRequested) },
      { label: 'Priest Visit Details', value: value.additional.priestVisitDetails },
    ];
    drawSectionTitle('Marriage & Additional');
    drawFieldGrid([...marriageFields, ...additionalFields]);
  }

  drawAdultColumns(value.adults);

  if (value.children.length > 0) {
    drawSectionTitle('Children / Dependents');

    const CHILD_COL_GAP = 10;
    const numCols = Math.min(value.children.length, 2);
    const childColWidth = numCols > 1 ? (CONTENT_WIDTH - CHILD_COL_GAP) / 2 : CONTENT_WIDTH;

    value.children.forEach((child, index) => {
      if (numCols > 1 && index % 2 === 0) {
        // For multi-column: draw label per child (simplified: just use full-width rows)
      }

      page.drawText(
        `CHILD ${index + 1} — ${formatValue(child.firstName)} ${formatValue(child.lastName)}`.toUpperCase(),
        {
          x: MARGIN,
          y: cursorY,
          size: META_SIZE,
          font: boldFont,
          color: MUTED,
        },
      );
      cursorY -= META_SIZE + 4;

      drawFieldGrid(buildChildFields(child));

      cursorY -= SECTION_GAP;
      page.drawText('SACRAMENTS', { x: MARGIN, y: cursorY, size: META_SIZE, font: boldFont, color: BRAND_DARK });
      cursorY -= META_SIZE + 4;
      drawSacramentBlock(buildChildSacraments(child));
      cursorY -= FIELD_ROW_GAP;
    });
  }

  // Footer on every page
  const pages = pdfDoc.getPages();

  pages.forEach((footerPage, pageIndex) => {
    const footerText = `Page ${pageIndex + 1} of ${pages.length}`;
    const footerWidth = regularFont.widthOfTextAtSize(footerText, 7);

    footerPage.drawText(footerText, {
      x: pageWidth - MARGIN - footerWidth,
      y: MARGIN - 16,
      size: 7,
      font: regularFont,
      color: MUTED,
    });
    footerPage.drawText('St. Joseph Catholic Church · Parish Registration', {
      x: MARGIN,
      y: MARGIN - 16,
      size: 7,
      font: regularFont,
      color: MUTED,
    });
  });

  return await pdfDoc.save();
};
