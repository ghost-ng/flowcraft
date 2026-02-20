/**
 * Generate PWA icon PNGs from scratch using pure Node.js (no dependencies).
 * Creates simple solid-color icons with the Chart Hero brand colors.
 * These are minimal valid PNG files suitable for PWA manifest icons.
 */
import { createWriteStream } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, '..', 'public');

function createPNG(width, height) {
  // Create raw RGBA pixel data
  const pixels = Buffer.alloc(width * height * 4);

  const cornerRadius = Math.floor(width * 0.1875); // ~96/512

  function isInsideRoundedRect(x, y, rx, ry, rw, rh, radius) {
    // Check if point is inside a rounded rectangle
    if (x < rx || x >= rx + rw || y < ry || y >= ry + rh) return false;
    // Check corners
    const corners = [
      { cx: rx + radius, cy: ry + radius },         // top-left
      { cx: rx + rw - radius, cy: ry + radius },    // top-right
      { cx: rx + radius, cy: ry + rh - radius },    // bottom-left
      { cx: rx + rw - radius, cy: ry + rh - radius }, // bottom-right
    ];
    for (const corner of corners) {
      const inCornerRegion =
        (x < rx + radius && y < ry + radius) ||
        (x >= rx + rw - radius && y < ry + radius) ||
        (x < rx + radius && y >= ry + rh - radius) ||
        (x >= rx + rw - radius && y >= ry + rh - radius);
      if (inCornerRegion) {
        const dx = x - corner.cx;
        const dy = y - corner.cy;
        if (dx * dx + dy * dy > radius * radius) return false;
      }
    }
    return true;
  }

  function lerp(a, b, t) {
    return Math.round(a + (b - a) * t);
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const nx = x / width;
      const ny = y / height;

      // Background gradient: #1e293b to #0f172a
      const bgR = lerp(0x1e, 0x0f, (nx + ny) / 2);
      const bgG = lerp(0x29, 0x17, (nx + ny) / 2);
      const bgB = lerp(0x3b, 0x2a, (nx + ny) / 2);

      // Start with transparent
      let r = 0, g = 0, b = 0, a = 0;

      // Rounded rectangle background
      if (isInsideRoundedRect(x, y, 0, 0, width, height, cornerRadius)) {
        r = bgR; g = bgG; b = bgB; a = 255;

        // Scale coordinates to 512-space for shape positions
        const sx = (x / width) * 512;
        const sy = (y / height) * 512;

        // Top-left blue node: rect(80, 100, 160, 100) rx=16
        const nodeRadius = 16;
        if (isInsideRoundedRect(sx, sy, 80, 100, 160, 100, nodeRadius)) {
          r = 0x3b; g = 0x82; b = 0xf6; // #3b82f6
        }

        // Bottom-right purple node: rect(272, 312, 160, 100) rx=16
        if (isInsideRoundedRect(sx, sy, 272, 312, 160, 100, nodeRadius)) {
          r = 0x8b; g = 0x5c; b = 0xf6; // #8b5cf6
        }

        // Small cyan accent: rect(300, 130, 80, 50) rx=8
        if (isInsideRoundedRect(sx, sy, 300, 130, 80, 50, 8)) {
          // Blend with background at 60% opacity
          r = lerp(bgR, 0x06, 0.6);
          g = lerp(bgG, 0xb6, 0.6);
          b = lerp(bgB, 0xd4, 0.6);
        }

        // Small amber accent: rect(132, 280, 80, 50) rx=8
        if (isInsideRoundedRect(sx, sy, 132, 280, 80, 50, 8)) {
          r = lerp(bgR, 0xf5, 0.6);
          g = lerp(bgG, 0x9e, 0.6);
          b = lerp(bgB, 0x0b, 0.6);
        }

        // Connector line from (240,150) to (272,362), width ~8px
        const lineWidth = 4;
        const lx1 = 240, ly1 = 150, lx2 = 272, ly2 = 362;
        const ldx = lx2 - lx1, ldy = ly2 - ly1;
        const len = Math.sqrt(ldx * ldx + ldy * ldy);
        // Distance from point to line segment
        const t = Math.max(0, Math.min(1, ((sx - lx1) * ldx + (sy - ly1) * ldy) / (len * len)));
        const px = lx1 + t * ldx, py = ly1 + t * ldy;
        const dist = Math.sqrt((sx - px) ** 2 + (sy - py) ** 2);
        if (dist < lineWidth) {
          r = 0x64; g = 0x74; b = 0x8b; // #64748b
        }
      }

      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = a;
    }
  }

  // Build PNG file
  // Add filter byte (0 = None) before each row
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter type: None
    pixels.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  function makeChunk(type, data) {
    const typeBuffer = Buffer.from(type, 'ascii');
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const crcData = Buffer.concat([typeBuffer, data]);

    // CRC32
    let crc = 0xFFFFFFFF;
    const crcTable = [];
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      crcTable[n] = c;
    }
    for (let i = 0; i < crcData.length; i++) {
      crc = crcTable[(crc ^ crcData[i]) & 0xFF] ^ (crc >>> 8);
    }
    crc = (crc ^ 0xFFFFFFFF) >>> 0;

    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc, 0);

    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
  }

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Generate 192x192
console.log('Generating pwa-192x192.png...');
const png192 = createPNG(192, 192);
const ws192 = createWriteStream(resolve(publicDir, 'pwa-192x192.png'));
ws192.write(png192);
ws192.end();

// Generate 512x512
console.log('Generating pwa-512x512.png...');
const png512 = createPNG(512, 512);
const ws512 = createWriteStream(resolve(publicDir, 'pwa-512x512.png'));
ws512.write(png512);
ws512.end();

// Generate apple-touch-icon (180x180)
console.log('Generating apple-touch-icon.png...');
const png180 = createPNG(180, 180);
const ws180 = createWriteStream(resolve(publicDir, 'apple-touch-icon.png'));
ws180.write(png180);
ws180.end();

console.log('Done! Icons generated in public/');
