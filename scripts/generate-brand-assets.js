const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const srcPath = 'C:/Users/madhu/.gemini/antigravity/brain/53750862-fba6-486c-88dc-b41170560cab/.user_uploaded/media_1793703859385_09c8edc3.png';
if (!fs.existsSync(srcPath)) {
  console.error('Source image not found at', srcPath);
  process.exit(1);
}

const srcPng = PNG.sync.read(fs.readFileSync(srcPath));
const W = srcPng.width;
const H = srcPng.height;

// 1. BFS flood-fill from border to detect outer background
const bgMask = new Uint8Array(W * H);
const queue = [];

function isBgPixel(x, y) {
  const idx = (y * W + x) * 4;
  return srcPng.data[idx] >= 248 && srcPng.data[idx + 1] >= 248 && srcPng.data[idx + 2] >= 248;
}

for (let x = 0; x < W; x++) {
  if (isBgPixel(x, 0)) { bgMask[x] = 1; queue.push([x, 0]); }
  if (isBgPixel(x, H - 1)) { bgMask[(H - 1) * W + x] = 1; queue.push([x, H - 1]); }
}
for (let y = 0; y < H; y++) {
  if (isBgPixel(0, y) && !bgMask[y * W]) { bgMask[y * W] = 1; queue.push([0, y]); }
  if (isBgPixel(W - 1, y) && !bgMask[y * W + W - 1]) { bgMask[y * W + W - 1] = 1; queue.push([W - 1, y]); }
}

let head = 0;
while (head < queue.length) {
  const [cx, cy] = queue[head++];
  for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
    if (nx >= 0 && nx < W && ny >= 0 && ny < H) {
      const nIdx = ny * W + nx;
      if (!bgMask[nIdx] && isBgPixel(nx, ny)) {
        bgMask[nIdx] = 1;
        queue.push([nx, ny]);
      }
    }
  }
}

// 2. Build cleaned source with transparency and edge anti-aliasing
const clean = new PNG({ width: W, height: H });
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const idx = y * W + x;
    const p = idx * 4;
    if (bgMask[idx]) {
      clean.data[p] = 0;
      clean.data[p + 1] = 0;
      clean.data[p + 2] = 0;
      clean.data[p + 3] = 0;
    } else {
      const r = srcPng.data[p], g = srcPng.data[p + 1], b = srcPng.data[p + 2];
      const hasBgNeighbor = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([nx, ny]) =>
        nx < 0 || nx >= W || ny < 0 || ny >= H || bgMask[ny * W + nx]
      );
      if (hasBgNeighbor) {
        const diff = Math.max(254 - r, 254 - g, 254 - b);
        if (diff < 40) {
          const a = Math.round(255 * (diff / 40));
          const aNorm = Math.max(0.01, a / 255);
          clean.data[p] = Math.min(255, Math.max(0, Math.round((r - 254 * (1 - aNorm)) / aNorm)));
          clean.data[p + 1] = Math.min(255, Math.max(0, Math.round((g - 254 * (1 - aNorm)) / aNorm)));
          clean.data[p + 2] = Math.min(255, Math.max(0, Math.round((b - 254 * (1 - aNorm)) / aNorm)));
          clean.data[p + 3] = a;
        } else {
          clean.data[p] = r;
          clean.data[p + 1] = g;
          clean.data[p + 2] = b;
          clean.data[p + 3] = 255;
        }
      } else {
        clean.data[p] = r;
        clean.data[p + 1] = g;
        clean.data[p + 2] = b;
        clean.data[p + 3] = 255;
      }
    }
  }
}

// 3. Find exact foreground bounding box
let minX = W, maxX = 0, minY = H, maxY = 0;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const p = (y * W + x) * 4;
    if (clean.data[p + 3] > 0) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
}

const fgW = maxX - minX + 1;
const fgH = maxY - minY + 1;
const fgCenterX = (minX + maxX) / 2;
const fgCenterY = (minY + maxY) / 2;
const maxDim = Math.max(fgW, fgH);

console.log('Foreground bounds:', { minX, maxX, minY, maxY, fgW, fgH, maxDim });

// Resample function: crops a centered square from clean image and scales to targetSize
// paddingRatio: 0 = tight fit, 0.08 = 8% padding on each side, etc.
// bgFill: null for transparent, or [r, g, b, a] for solid background
function renderResampled(targetSize, paddingRatio = 0.06, bgFill = null) {
  const outPng = new PNG({ width: targetSize, height: targetSize });

  // Init background
  if (bgFill) {
    for (let i = 0; i < outPng.data.length; i += 4) {
      outPng.data[i] = bgFill[0];
      outPng.data[i + 1] = bgFill[1];
      outPng.data[i + 2] = bgFill[2];
      outPng.data[i + 3] = bgFill[3];
    }
  } else {
    outPng.data.fill(0);
  }

  // The area in the output image occupied by the logo
  const innerSize = targetSize * (1 - 2 * paddingRatio);
  const offset = targetSize * paddingRatio;

  // Each pixel in outPng at (tx, ty) maps to source coordinates
  for (let ty = 0; ty < targetSize; ty++) {
    const normY = (ty - offset) / innerSize;
    if (normY < 0 || normY >= 1) continue;
    const srcY = (fgCenterY - maxDim / 2) + normY * maxDim;

    for (let tx = 0; tx < targetSize; tx++) {
      const normX = (tx - offset) / innerSize;
      if (normX < 0 || normX >= 1) continue;
      const srcX = (fgCenterX - maxDim / 2) + normX * maxDim;

      if (srcX < 0 || srcX >= W - 1 || srcY < 0 || srcY >= H - 1) continue;

      // High-quality bilinear sample with premultiplied alpha
      const x0 = Math.floor(srcX);
      const y0 = Math.floor(srcY);
      const x1 = Math.min(x0 + 1, W - 1);
      const y1 = Math.min(y0 + 1, H - 1);
      const dx = srcX - x0;
      const dy = srcY - y0;

      const p00 = (y0 * W + x0) * 4;
      const p10 = (y0 * W + x1) * 4;
      const p01 = (y1 * W + x0) * 4;
      const p11 = (y1 * W + x1) * 4;

      const a00 = clean.data[p00 + 3] / 255;
      const a10 = clean.data[p10 + 3] / 255;
      const a01 = clean.data[p01 + 3] / 255;
      const a11 = clean.data[p11 + 3] / 255;

      const outAlpha = (1 - dx) * (1 - dy) * a00 + dx * (1 - dy) * a10 + (1 - dx) * dy * a01 + dx * dy * a11;
      if (outAlpha <= 0.005) continue;

      let r = 0, g = 0, b = 0;
      const w00 = (1 - dx) * (1 - dy) * a00;
      const w10 = dx * (1 - dy) * a10;
      const w01 = (1 - dx) * dy * a01;
      const w11 = dx * dy * a11;
      const sumW = w00 + w10 + w01 + w11;

      if (sumW > 0) {
        r = (clean.data[p00] * w00 + clean.data[p10] * w10 + clean.data[p01] * w01 + clean.data[p11] * w11) / sumW;
        g = (clean.data[p00 + 1] * w00 + clean.data[p10 + 1] * w10 + clean.data[p01 + 1] * w01 + clean.data[p11 + 1] * w11) / sumW;
        b = (clean.data[p00 + 2] * w00 + clean.data[p10 + 2] * w10 + clean.data[p01 + 2] * w01 + clean.data[p11 + 2] * w11) / sumW;
      }

      const outIdx = (ty * targetSize + tx) * 4;
      if (bgFill) {
        // Blend over bgFill
        const bgA = bgFill[3] / 255;
        const combA = outAlpha + bgA * (1 - outAlpha);
        outPng.data[outIdx] = Math.round((r * outAlpha + bgFill[0] * bgA * (1 - outAlpha)) / combA);
        outPng.data[outIdx + 1] = Math.round((g * outAlpha + bgFill[1] * bgA * (1 - outAlpha)) / combA);
        outPng.data[outIdx + 2] = Math.round((b * outAlpha + bgFill[2] * bgA * (1 - outAlpha)) / combA);
        outPng.data[outIdx + 3] = Math.round(combA * 255);
      } else {
        outPng.data[outIdx] = Math.round(r);
        outPng.data[outIdx + 1] = Math.round(g);
        outPng.data[outIdx + 2] = Math.round(b);
        outPng.data[outIdx + 3] = Math.round(outAlpha * 255);
      }
    }
  }

  return outPng;
}

// 4. Generate all asset sizes
const targets = [
  { path: 'apps/web/public/logo.png', size: 512, pad: 0.05, bg: null },
  { path: 'apps/web/public/brand-lockup.png', size: 512, pad: 0.05, bg: null },
  { path: 'apps/web/public/icons/icon-512.png', size: 512, pad: 0.05, bg: null },
  { path: 'apps/web/public/icons/icon-512-maskable.png', size: 512, pad: 0.16, bg: [255, 255, 255, 255] },
  { path: 'apps/web/public/icons/icon-384.png', size: 384, pad: 0.05, bg: null },
  { path: 'apps/web/public/icons/icon-256.png', size: 256, pad: 0.05, bg: null },
  { path: 'apps/web/public/icons/icon-192.png', size: 192, pad: 0.05, bg: null },
  { path: 'apps/web/public/icons/icon-128.png', size: 128, pad: 0.05, bg: null },
  { path: 'apps/web/public/icons/icon-96.png', size: 96, pad: 0.05, bg: null },
  { path: 'apps/web/public/icons/icon-72.png', size: 72, pad: 0.05, bg: null },
  { path: 'apps/web/public/icons/icon-48.png', size: 48, pad: 0.05, bg: null },
  { path: 'apps/web/public/icons/favicon-32.png', size: 32, pad: 0.04, bg: null },
  { path: 'apps/web/public/icons/favicon-16.png', size: 16, pad: 0.02, bg: null },
  { path: 'apps/web/app/apple-icon.png', size: 180, pad: 0.10, bg: [255, 255, 255, 255] },
  { path: 'apps/web/app/icon.png', size: 192, pad: 0.05, bg: null },
];

targets.forEach(t => {
  const dir = path.dirname(t.path);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const rendered = renderResampled(t.size, t.pad, t.bg);
  fs.writeFileSync(t.path, PNG.sync.write(rendered));
  console.log('Generated:', t.path, `(${t.size}x${t.size})`);
});

// 5. Build multi-frame favicon.ico
function buildIco(pngBuffers) {
  // ICO header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(pngBuffers.length, 4); // count

  const dirEntries = [];
  let currentOffset = 6 + pngBuffers.length * 16;

  for (const { size, buffer } of pngBuffers) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buffer.length, 8); // size of image data
    entry.writeUInt32LE(currentOffset, 12); // offset of image data
    dirEntries.push(entry);
    currentOffset += buffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers.map(p => p.buffer)]);
}

const ico16 = PNG.sync.write(renderResampled(16, 0.02));
const ico32 = PNG.sync.write(renderResampled(32, 0.04));
const ico48 = PNG.sync.write(renderResampled(48, 0.05));
const icoBuffer = buildIco([
  { size: 16, buffer: ico16 },
  { size: 32, buffer: ico32 },
  { size: 48, buffer: ico48 },
]);
fs.writeFileSync('apps/web/app/favicon.ico', icoBuffer);
console.log('Generated: apps/web/app/favicon.ico (multi-resolution 16x16, 32x32, 48x48)');

// 6. Update screenshots with new stylized H logo
const logo32 = renderResampled(32, 0.04);
const GLYPHS = {
  H: ['#.....#','#.....#','#.....#','#######','#.....#','#.....#','#.....#','#.....#','#.....#'],
  O: ['.#####.','#.....#','#.....#','#.....#','#.....#','#.....#','#.....#','#.....#','.#####.'],
  R: ['######.','#.....#','#.....#','######.','###....','#..#...','#...#..','#....#.','#.....#'],
  E: ['#######','#......','#......','#####..','#......','#......','#......','#......','#######'],
  C: ['.#####.','#.....#','#......','#......','#......','#......','#......','#.....#','.#####.'],
  A: ['.#####.','#.....#','#.....#','#.....#','#######','#.....#','#.....#','#.....#','#.....#']
};

const screenshotFiles = ['dashboard-light.png', 'pos-light.png', 'kds-light.png', 'tables-light.png'];
screenshotFiles.forEach(file => {
  const filePath = 'apps/web/public/screenshots/' + file;
  if (!fs.existsSync(filePath)) return;
  const png = PNG.sync.read(fs.readFileSync(filePath));

  // Clear sidebar brand header area: x in [0, 254], y in [0, 63] to bg color 252, 252, 252
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 255; x++) {
      const idx = (y * png.width + x) * 4;
      png.data[idx] = 252;
      png.data[idx + 1] = 252;
      png.data[idx + 2] = 252;
      png.data[idx + 3] = 255;
    }
  }

  // Composite new H logo at (20, 16)
  const startX = 20;
  const startY = 16;
  for (let ly = 0; ly < 32; ly++) {
    for (let lx = 0; lx < 32; lx++) {
      const srcIdx = (ly * 32 + lx) * 4;
      const alpha = logo32.data[srcIdx + 3] / 255;
      if (alpha <= 0) continue;
      const dstIdx = ((startY + ly) * png.width + (startX + lx)) * 4;
      for (let c = 0; c < 3; c++) {
        png.data[dstIdx + c] = Math.round(logo32.data[srcIdx + c] * alpha + png.data[dstIdx + c] * (1 - alpha));
      }
    }
  }

  // Draw 'HORECA' at x = 62, y = 23 (height = 18px, scale = 2)
  const word = 'HORECA';
  let curX = 62;
  const curY = 23;
  const scale = 2;
  for (let i = 0; i < word.length; i++) {
    const glyph = GLYPHS[word[i]];
    if (!glyph) continue;
    for (let gy = 0; gy < glyph.length; gy++) {
      const row = glyph[gy];
      for (let gx = 0; gx < row.length; gx++) {
        if (row[gx] === '#') {
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              const px = curX + gx * scale + dx;
              const py = curY + gy * scale + dy;
              if (px < png.width && py < png.height) {
                const idx = (py * png.width + px) * 4;
                png.data[idx] = 17;     // #111827
                png.data[idx + 1] = 24;
                png.data[idx + 2] = 39;
                png.data[idx + 3] = 255;
              }
            }
          }
        }
      }
    }
    curX += 7 * scale + 3;
  }

  fs.writeFileSync(filePath, PNG.sync.write(png));
  console.log('Updated screenshot:', file);
});

console.log('All brand assets and screenshots successfully updated with the new H logo!');
