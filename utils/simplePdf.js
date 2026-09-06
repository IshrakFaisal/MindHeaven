const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;

const toAscii = (value) =>
  String(value ?? '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .normalize('NFKD')
    .replace(/[^\x20-\x7E]/g, '');

const escapePdfText = (value) =>
  toAscii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const wrapText = (text, maxCharacters) => {
  const words = toAscii(text).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxCharacters && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  });

  if (line) lines.push(line);
  return lines.length ? lines : [''];
};

class PdfPage {
  constructor() {
    this.commands = [];
  }

  text(value, x, y, options = {}) {
    const { size = 10, bold = false, color = [0.14, 0.19, 0.18] } = options;
    this.commands.push(
      `BT ${color.join(' ')} rg /${bold ? 'F2' : 'F1'} ${size} Tf ${x} ${y} Td (${escapePdfText(value)}) Tj ET`,
    );
    return this;
  }

  wrappedText(value, x, y, maxCharacters, options = {}) {
    const lineHeight = options.lineHeight || (options.size || 10) + 4;
    wrapText(value, maxCharacters).forEach((line, index) => {
      this.text(line, x, y - index * lineHeight, options);
    });
    return this;
  }

  line(x1, y1, x2, y2, options = {}) {
    const { width = 1, color = [0.75, 0.82, 0.8] } = options;
    this.commands.push(`${color.join(' ')} RG ${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
    return this;
  }

  rectangle(x, y, width, height, options = {}) {
    const { fill = [0.95, 0.97, 0.96], stroke = null, lineWidth = 1 } = options;
    if (fill) {
      this.commands.push(`${fill.join(' ')} rg ${x} ${y} ${width} ${height} re f`);
    }
    if (stroke) {
      this.commands.push(
        `${stroke.join(' ')} RG ${lineWidth} w ${x} ${y} ${width} ${height} re S`,
      );
    }
    return this;
  }

  polyline(points, options = {}) {
    if (points.length < 2) return this;
    const { width = 2, color = [0.12, 0.47, 0.4] } = options;
    const [first, ...rest] = points;
    const path = [`${first.x} ${first.y} m`, ...rest.map((point) => `${point.x} ${point.y} l`)];
    this.commands.push(`${color.join(' ')} RG ${width} w ${path.join(' ')} S`);
    return this;
  }

  stream() {
    return this.commands.join('\n');
  }
}

class SimplePdfDocument {
  constructor() {
    this.pages = [];
  }

  addPage() {
    const page = new PdfPage();
    this.pages.push(page);
    return page;
  }

  toBuffer() {
    if (!this.pages.length) this.addPage();

    const objects = new Map();
    const pageReferences = this.pages.map((_, index) => `${5 + index * 2} 0 R`).join(' ');

    objects.set(1, '<< /Type /Catalog /Pages 2 0 R >>');
    objects.set(2, `<< /Type /Pages /Kids [${pageReferences}] /Count ${this.pages.length} >>`);
    objects.set(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    objects.set(4, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

    this.pages.forEach((page, index) => {
      const pageObjectId = 5 + index * 2;
      const contentObjectId = pageObjectId + 1;
      const stream = page.stream();

      objects.set(
        pageObjectId,
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectId} 0 R >>`,
      );
      objects.set(
        contentObjectId,
        `<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`,
      );
    });

    const objectCount = Math.max(...objects.keys());
    const parts = ['%PDF-1.4\n%MindHaven\n'];
    const offsets = [0];
    let byteOffset = Buffer.byteLength(parts[0], 'latin1');

    for (let id = 1; id <= objectCount; id += 1) {
      const object = `${id} 0 obj\n${objects.get(id)}\nendobj\n`;
      offsets[id] = byteOffset;
      parts.push(object);
      byteOffset += Buffer.byteLength(object, 'latin1');
    }

    const xrefOffset = byteOffset;
    const xref = [
      `xref\n0 ${objectCount + 1}\n`,
      '0000000000 65535 f \n',
      ...offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`),
      `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
    ].join('');

    parts.push(xref);
    return Buffer.from(parts.join(''), 'latin1');
  }
}

module.exports = { PAGE_HEIGHT, PAGE_WIDTH, SimplePdfDocument, toAscii, wrapText };
