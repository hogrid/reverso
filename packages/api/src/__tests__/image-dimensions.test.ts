import { describe, expect, it } from 'vitest';
import { imageDimensions } from '../utils/image-dimensions.js';

// 1x1 transparent PNG
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);
// 1x1 GIF
const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

function jpegWithSize(width: number, height: number): Buffer {
  const soi = Buffer.from([0xff, 0xd8]);
  const app0 = Buffer.concat([Buffer.from([0xff, 0xe0, 0x00, 0x10]), Buffer.alloc(14, 0x4a)]);
  const sof0 = Buffer.from([0xff, 0xc0, 0x00, 0x11, 0x08, 0, 0, 0, 0, 0x03]);
  sof0.writeUInt16BE(height, 5);
  sof0.writeUInt16BE(width, 7);
  const tail = Buffer.alloc(9, 0x11);
  return Buffer.concat([soi, app0, sof0, tail, Buffer.from([0xff, 0xda, 0, 2])]);
}

function webpVp8x(width: number, height: number): Buffer {
  const buf = Buffer.alloc(30);
  buf.write('RIFF', 0, 'ascii');
  buf.write('WEBP', 8, 'ascii');
  buf.write('VP8X', 12, 'ascii');
  buf.writeUIntLE(width - 1, 24, 3);
  buf.writeUIntLE(height - 1, 27, 3);
  return buf;
}

describe('imageDimensions', () => {
  it('reads PNG', () => {
    expect(imageDimensions(PNG)).toEqual({ width: 1, height: 1 });
  });

  it('reads GIF', () => {
    expect(imageDimensions(GIF)).toEqual({ width: 1, height: 1 });
  });

  it('reads JPEG from the SOF marker after other segments', () => {
    expect(imageDimensions(jpegWithSize(640, 480))).toEqual({ width: 640, height: 480 });
  });

  it('reads extended WebP canvas size', () => {
    expect(imageDimensions(webpVp8x(1920, 1080))).toEqual({ width: 1920, height: 1080 });
  });

  it('returns null for unknown or truncated data', () => {
    expect(imageDimensions(Buffer.from('hello world, not an image'))).toBeNull();
    expect(imageDimensions(PNG.subarray(0, 8))).toBeNull();
    expect(imageDimensions(Buffer.from([0xff, 0xd8, 0xff, 0xda, 0, 2]))).toBeNull();
  });
});
