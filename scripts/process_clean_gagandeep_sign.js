const sharp = require('D:\\farmsking\\backend\\node_modules\\sharp');
const fs = require('fs');
const path = require('path');

const srcImg = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\d6f7edcb-80b0-4e4d-ac65-524ebca94068\\.user_uploaded\\media_1795280193553_8466b966.jpg';

async function processCleanSignature() {
  const { data, info } = await sharp(srcImg).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Background luminance (sampling border pixels)
  let sumLuma = 0, count = 0;
  for (let x = 0; x < width; x++) {
    const topIdx = x * channels;
    const botIdx = ((height - 1) * width + x) * channels;
    sumLuma += (0.299 * data[topIdx] + 0.587 * data[topIdx + 1] + 0.114 * data[topIdx + 2]);
    sumLuma += (0.299 * data[botIdx] + 0.587 * data[botIdx + 1] + 0.114 * data[botIdx + 2]);
    count += 2;
  }
  const bgLuma = sumLuma / count;
  console.log(`Estimated background luma: ${bgLuma.toFixed(1)}`);

  // Target ink color: Royal Navy Blue (RGB: 14, 45, 110)
  const inkR = 14, inkG = 45, inkB = 110;

  // Connected component analysis to remove stray dots
  // 1. Binary ink mask
  const mask = new Uint8Array(width * height);
  const threshold = bgLuma - 20;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (luma < threshold) {
        mask[y * width + x] = 1;
      }
    }
  }

  // 2. Find components (8-connectivity)
  const labels = new Int32Array(width * height);
  let currentLabel = 0;
  const componentSizes = {};

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (mask[idx] === 1 && labels[idx] === 0) {
        currentLabel++;
        let size = 0;
        const queue = [idx];
        labels[idx] = currentLabel;

        while (queue.length > 0) {
          const curr = queue.pop();
          size++;
          const cy = Math.floor(curr / width);
          const cx = curr % width;

          for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
              if (dx === 0 && dy === 0) continue;
              const ny = cy + dy;
              const nx = cx + dx;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                const nidx = ny * width + nx;
                if (mask[nidx] === 1 && labels[nidx] === 0) {
                  labels[nidx] = currentLabel;
                  queue.push(nidx);
                }
              }
            }
          }
        }
        componentSizes[currentLabel] = size;
      }
    }
  }

  console.log(`Found ${currentLabel} components`);
  for (const [lbl, size] of Object.entries(componentSizes)) {
    console.log(`Label ${lbl}: size ${size}`);
  }

  // Remove small stray components (like the dot at the top or bottom artifacts < 15 pixels)
  // But keep components belonging to dots of 'i' or parts of letters (> 15 pixels or connected)
  const validLabels = new Set();
  for (const [lbl, size] of Object.entries(componentSizes)) {
    if (size >= 15) {
      validLabels.add(parseInt(lbl));
    } else {
      console.log(`Filtering out stray speck: Label ${lbl} (size: ${size})`);
    }
  }

  // 3. Render clean RGBA image with alpha feathering
  const outBuf = Buffer.alloc(width * height * 4);
  const maxDarkness = 90;
  let minX = width, maxX = 0, minY = height, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const cIdx = idx * channels;
      const oIdx = idx * 4;

      const lbl = labels[idx];
      const r = data[cIdx];
      const g = data[cIdx + 1];
      const b = data[cIdx + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      if (validLabels.has(lbl) && luma < threshold) {
        const diff = threshold - luma;
        const alphaRange = threshold - maxDarkness;
        let alpha = Math.min(255, Math.max(0, Math.round((diff / alphaRange) * 255)));
        alpha = Math.min(255, Math.round(Math.pow(alpha / 255, 0.85) * 255));

        outBuf[oIdx] = inkR;
        outBuf[oIdx + 1] = inkG;
        outBuf[oIdx + 2] = inkB;
        outBuf[oIdx + 3] = alpha;

        if (alpha > 30) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      } else {
        outBuf[oIdx] = 255;
        outBuf[oIdx + 1] = 255;
        outBuf[oIdx + 2] = 255;
        outBuf[oIdx + 3] = 0;
      }
    }
  }

  // Crop with 4px border around ink
  const pad = 4;
  const trimLeft = Math.max(0, minX - pad);
  const trimTop = Math.max(0, minY - pad);
  const trimWidth = Math.min(width - trimLeft, (maxX - minX) + pad * 2);
  const trimHeight = Math.min(height - trimTop, (maxY - minY) + pad * 2);

  const trimmed = await sharp(outBuf, { raw: { width, height, channels: 4 } })
    .extract({ left: trimLeft, top: trimTop, width: trimWidth, height: trimHeight })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  const outPath1 = 'D:\\farmsking\\Govt\\docs\\00_Directors_Official_Signatures\\gagandeep_kaur_signature.png';
  const outPath2 = 'D:\\farmsking\\Govt\\docs\\03_Gagandeep_Kaur_Director\\gagandeep_kaur_signature.png';
  const outPath3 = 'C:\\Users\\hp\\Desktop\\FarmsKing Pvt Ltd\\gagandeep_kaur_signature.png';

  fs.writeFileSync(outPath1, trimmed);
  fs.writeFileSync(outPath2, trimmed);
  fs.writeFileSync(outPath3, trimmed);

  console.log(`[SUCCESS] Ultra-clean signature generated: ${trimWidth}x${trimHeight}px`);
  console.log(`Saved to:\n- ${outPath1}\n- ${outPath2}\n- ${outPath3}`);
}

processCleanSignature().catch(console.error);
