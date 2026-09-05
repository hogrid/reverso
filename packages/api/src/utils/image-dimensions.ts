/**
 * Reads the pixel size of an image from its header bytes. Covers the formats
 * the upload endpoint accepts (PNG, JPEG, GIF, WebP) without pulling a native
 * dependency in; anything else, or a truncated header, yields `null`.
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

/** How many leading bytes are enough for every supported format. */
export const IMAGE_HEADER_BYTES = 64 * 1024;

export function imageDimensions(buf: Buffer): ImageDimensions | null {
  if (buf.length < 10) return null;
  return png(buf) ?? gif(buf) ?? webp(buf) ?? jpeg(buf);
}

function valid(width: number, height: number): ImageDimensions | null {
  return width > 0 && height > 0 ? { width, height } : null;
}

function png(buf: Buffer): ImageDimensions | null {
  if (buf.length < 24) return null;
  if (buf.readUInt32BE(0) !== 0x89504e47 || buf.readUInt32BE(4) !== 0x0d0a1a0a) return null;
  // First chunk must be IHDR: width and height are the first two fields.
  if (buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return valid(buf.readUInt32BE(16), buf.readUInt32BE(20));
}

function gif(buf: Buffer): ImageDimensions | null {
  const sig = buf.toString('ascii', 0, 6);
  if (sig !== 'GIF87a' && sig !== 'GIF89a') return null;
  return valid(buf.readUInt16LE(6), buf.readUInt16LE(8));
}

function webp(buf: Buffer): ImageDimensions | null {
  if (buf.length < 30) return null;
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const chunk = buf.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') {
    // Lossy: 14-bit width/height after the 3-byte frame tag and start code.
    if (buf.length < 30) return null;
    return valid(buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff);
  }
  if (chunk === 'VP8L') {
    // Lossless: 14-bit fields, stored minus one, packed after the 0x2f signature.
    const b0 = buf[21] ?? 0;
    const b1 = buf[22] ?? 0;
    const b2 = buf[23] ?? 0;
    const b3 = buf[24] ?? 0;
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return valid(width, height);
  }
  if (chunk === 'VP8X') {
    // Extended: 24-bit canvas size minus one at offset 24.
    const width = 1 + buf.readUIntLE(24, 3);
    const height = 1 + buf.readUIntLE(27, 3);
    return valid(width, height);
  }
  return null;
}

function jpeg(buf: Buffer): ImageDimensions | null {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buf[offset + 1] ?? 0;
    // Padding bytes between segments.
    if (marker === 0xff) {
      offset += 1;
      continue;
    }
    // Standalone markers without a length field.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2;
      continue;
    }
    const length = buf.readUInt16BE(offset + 2);
    // SOFn markers (baseline, progressive, ...) carry the frame size.
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      if (offset + 9 > buf.length) return null;
      return valid(buf.readUInt16BE(offset + 7), buf.readUInt16BE(offset + 5));
    }
    if (marker === 0xda || marker === 0xd9) return null; // image data reached, no SOF
    offset += 2 + length;
  }
  return null;
}
