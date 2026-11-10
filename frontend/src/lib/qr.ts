// A small QR code generator with no dependencies (ISO/IEC 18004), enough for
// the event share link. Text is encoded in byte mode (UTF-8) at error
// correction level M (survives ~15% damage), choosing the smallest version
// (size) that fits, and the mask with the lowest penalty score.
//
// Usage: const modules = makeQr("https://…/e/dlsu-cso-event");
//        modules[row][col] === true means a dark square.

// Level M: error correction codewords per block, and number of blocks, for
// versions 1–40 (index 0 = version 1).
const ECC_PER_BLOCK_M = [
  10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28,
  28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28
];
const BLOCKS_M = [
  1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35,
  37, 38, 40, 43, 45, 47, 49
];
const FORMAT_LEVEL_M = 0; // the 2-bit code for level M in the format information

// ---------- Sizes ----------

/** Modules (squares) available for data and error correction in a version. */
function rawDataModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const numAlign = Math.floor(version / 7) + 2;
    result -= (25 * numAlign - 10) * numAlign - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function dataCodewords(version: number): number {
  return Math.floor(rawDataModules(version) / 8) - ECC_PER_BLOCK_M[version - 1] * BLOCKS_M[version - 1];
}

function alignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const size = version * 4 + 17;
  const numAlign = Math.floor(version / 7) + 2;
  const step = version === 32 ? 26 : Math.ceil((version * 4 + 4) / (numAlign * 2 - 2)) * 2;
  const result = [6];
  for (let pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
  return result;
}

// ---------- Reed–Solomon error correction over GF(256) ----------

function gfMultiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function rsDivisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < degree; j++) {
      result[j] = gfMultiply(result[j], root);
      if (j + 1 < degree) result[j] ^= result[j + 1];
    }
    root = gfMultiply(root, 0x02);
  }
  return result;
}

function rsRemainder(data: number[], divisor: number[]): number[] {
  const result = new Array<number>(divisor.length).fill(0);
  for (const byte of data) {
    const factor = byte ^ (result.shift() as number);
    result.push(0);
    divisor.forEach((coef, i) => {
      result[i] ^= gfMultiply(coef, factor);
    });
  }
  return result;
}

// ---------- Building the codewords ----------

function encodeData(text: string): { version: number; codewords: number[] } {
  const bytes = Array.from(new TextEncoder().encode(text));

  let version = 1;
  for (; ; version++) {
    if (version > 40) throw new Error("Text is too long for a QR code");
    const countBits = version <= 9 ? 8 : 16;
    if (4 + countBits + bytes.length * 8 <= dataCodewords(version) * 8) break;
  }

  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4); // byte mode
  push(bytes.length, version <= 9 ? 8 : 16);
  bytes.forEach((b) => push(b, 8));

  const capacity = dataCodewords(version) * 8;
  push(0, Math.min(4, capacity - bits.length)); // terminator
  push(0, (8 - (bits.length % 8)) % 8); // pad to a whole byte
  for (let pad = 0xec; bits.length < capacity; pad ^= 0xec ^ 0x11) push(pad, 8);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(""), 2));

  // Split into blocks, add error correction to each, then interleave.
  const numBlocks = BLOCKS_M[version - 1];
  const eccLen = ECC_PER_BLOCK_M[version - 1];
  const rawCodewords = Math.floor(rawDataModules(version) / 8);
  const numShortBlocks = numBlocks - (rawCodewords % numBlocks);
  const shortBlockLen = Math.floor(rawCodewords / numBlocks);
  const divisor = rsDivisor(eccLen);

  const blocks: number[][] = [];
  for (let i = 0, k = 0; i < numBlocks; i++) {
    const len = shortBlockLen - eccLen + (i < numShortBlocks ? 0 : 1);
    const block = data.slice(k, k + len);
    k += len;
    const ecc = rsRemainder(block, divisor);
    if (i < numShortBlocks) block.push(0); // placeholder, skipped below
    blocks.push(block.concat(ecc));
  }

  const codewords: number[] = [];
  for (let i = 0; i < blocks[0].length; i++) {
    blocks.forEach((block, j) => {
      if (i !== shortBlockLen - eccLen || j >= numShortBlocks) codewords.push(block[i]);
    });
  }
  return { version, codewords };
}

// ---------- Drawing the symbol ----------

class Symbol {
  readonly size: number;
  readonly dark: boolean[][];
  readonly reserved: boolean[][];

  constructor(readonly version: number) {
    this.size = version * 4 + 17;
    this.dark = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.reserved = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
  }

  set(row: number, col: number, isDark: boolean) {
    this.dark[row][col] = isDark;
    this.reserved[row][col] = true;
  }

  drawFunctionPatterns() {
    const { size } = this;
    for (let i = 0; i < size; i++) {
      this.set(6, i, i % 2 === 0); // timing patterns
      this.set(i, 6, i % 2 === 0);
    }
    this.drawFinder(3, 3);
    this.drawFinder(3, size - 4);
    this.drawFinder(size - 4, 3);

    const align = alignmentPositions(this.version);
    const last = align.length - 1;
    align.forEach((r, i) =>
      align.forEach((c, j) => {
        const corner = (i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0);
        if (!corner) this.drawAlignment(r, c);
      })
    );

    this.drawFormat(0); // reserve the format areas; redrawn once the mask is chosen
    this.drawVersion();
  }

  drawFinder(row: number, col: number) {
    for (let dr = -4; dr <= 4; dr++) {
      for (let dc = -4; dc <= 4; dc++) {
        const r = row + dr;
        const c = col + dc;
        if (r < 0 || r >= this.size || c < 0 || c >= this.size) continue;
        const dist = Math.max(Math.abs(dr), Math.abs(dc));
        this.set(r, c, dist !== 2 && dist !== 4);
      }
    }
  }

  drawAlignment(row: number, col: number) {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) this.set(row + dr, col + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }
  }

  drawFormat(mask: number) {
    const data = (FORMAT_LEVEL_M << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    const bit = (i: number) => ((bits >>> i) & 1) === 1;
    const { size } = this;

    // First copy, around the top-left finder.
    for (let i = 0; i <= 5; i++) this.set(i, 8, bit(i));
    this.set(7, 8, bit(6));
    this.set(8, 8, bit(7));
    this.set(8, 7, bit(8));
    for (let i = 9; i < 15; i++) this.set(8, 14 - i, bit(i));

    // Second copy, split between the other two finders.
    for (let i = 0; i < 8; i++) this.set(8, size - 1 - i, bit(i));
    for (let i = 8; i < 15; i++) this.set(size - 15 + i, 8, bit(i));
    this.set(size - 8, 8, true); // the always-dark module
  }

  drawVersion() {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (this.version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const isDark = ((bits >>> i) & 1) === 1;
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.set(b, a, isDark);
      this.set(a, b, isDark);
    }
  }

  drawCodewords(codewords: number[]) {
    const { size } = this;
    let i = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5; // skip the vertical timing pattern
      for (let vert = 0; vert < size; vert++) {
        for (let j = 0; j < 2; j++) {
          const col = right - j;
          const upward = ((right + 1) & 2) === 0;
          const row = upward ? size - 1 - vert : vert;
          if (!this.reserved[row][col] && i < codewords.length * 8) {
            this.dark[row][col] = ((codewords[i >>> 3] >>> (7 - (i & 7))) & 1) === 1;
            i++;
          }
        }
      }
    }
  }

  applyMask(mask: number) {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.reserved[r][c]) continue;
        let invert: boolean;
        switch (mask) {
          case 0: invert = (r + c) % 2 === 0; break;
          case 1: invert = r % 2 === 0; break;
          case 2: invert = c % 3 === 0; break;
          case 3: invert = (r + c) % 3 === 0; break;
          case 4: invert = (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0; break;
          case 5: invert = ((r * c) % 2) + ((r * c) % 3) === 0; break;
          case 6: invert = (((r * c) % 2) + ((r * c) % 3)) % 2 === 0; break;
          default: invert = (((r + c) % 2) + ((r * c) % 3)) % 2 === 0; break;
        }
        if (invert) this.dark[r][c] = !this.dark[r][c];
      }
    }
  }

  /** Lower is better: penalises long runs, 2×2 blocks, finder look-alikes and imbalance. */
  penalty(): number {
    const { size, dark } = this;
    let score = 0;
    const lines: boolean[][] = [];
    for (let i = 0; i < size; i++) {
      lines.push(dark[i]);
      lines.push(dark.map((row) => row[i]));
    }
    const finderLike = [true, false, true, true, true, false, true];
    for (const line of lines) {
      let run = 1;
      for (let i = 1; i <= size; i++) {
        if (i < size && line[i] === line[i - 1]) run++;
        else {
          if (run >= 5) score += run - 2;
          run = 1;
        }
      }
      for (let i = 0; i + 7 <= size; i++) {
        if (!finderLike.every((v, k) => line[i + k] === v)) continue;
        const lightBefore = i >= 4 && [1, 2, 3, 4].every((k) => !line[i - k]);
        const lightAfter = i + 11 <= size && [7, 8, 9, 10].every((k) => !line[i + k]);
        if (lightBefore || lightAfter) score += 40;
      }
    }
    for (let r = 0; r + 1 < size; r++) {
      for (let c = 0; c + 1 < size; c++) {
        const v = dark[r][c];
        if (v === dark[r][c + 1] && v === dark[r + 1][c] && v === dark[r + 1][c + 1]) score += 3;
      }
    }
    const darkCount = dark.reduce((n, row) => n + row.filter(Boolean).length, 0);
    const percent = (darkCount * 100) / (size * size);
    score += Math.floor(Math.abs(percent - 50) / 5) * 10;
    return score;
  }
}

/** Builds the QR code for `text`. Returns rows of squares; true = dark. */
export function makeQr(text: string): boolean[][] {
  const { version, codewords } = encodeData(text);
  let best: Symbol | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const symbol = new Symbol(version);
    symbol.drawFunctionPatterns();
    symbol.drawCodewords(codewords);
    symbol.applyMask(mask);
    symbol.drawFormat(mask);
    const score = symbol.penalty();
    if (score < bestScore) {
      best = symbol;
      bestScore = score;
    }
  }
  return (best as Symbol).dark;
}

/** An SVG path ("d" attribute) drawing the dark squares, offset by a quiet zone of `margin` squares. */
export function qrPath(modules: boolean[][], margin = 4): string {
  const parts: string[] = [];
  modules.forEach((row, r) =>
    row.forEach((isDark, c) => {
      if (isDark) parts.push(`M${c + margin} ${r + margin}h1v1h-1z`);
    })
  );
  return parts.join("");
}
