const sharp = require('D:\\farmsking\\backend\\node_modules\\sharp');
const fs = require('fs');
const path = require('path');

const srcCard = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\d6f7edcb-80b0-4e4d-ac65-524ebca94068\\.user_uploaded\\media_1795279882540_6dc61643.jpg';
const sigDir = 'D:\\farmsking\\Govt\\docs\\00_Directors_Official_Signatures';
const gkDir = 'D:\\farmsking\\Govt\\docs\\03_Gagandeep_Kaur_Director';

// Copy source card to records
fs.copyFileSync(srcCard, path.join(sigDir, 'EPFO_SPECIMEN_SIGNATURE_CARD_GAGANDEEP_KAUR.jpg'));
fs.copyFileSync(srcCard, path.join(gkDir, 'EPFO_SPECIMEN_SIGNATURE_CARD_GAGANDEEP_KAUR.jpg'));

async function processInkSignature(inputPath, cropBox, outputPath) {
  const { data, info } = await sharp(inputPath)
    .extract(cropBox)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;

  // Background luminance estimation
  let sumLuma = 0;
  let count = 0;
  for (let x = 0; x < width; x++) {
    // sample top and bottom rows
    const topIdx = x * channels;
    const botIdx = ((height - 1) * width + x) * channels;
    sumLuma += (0.299 * data[topIdx] + 0.587 * data[topIdx + 1] + 0.114 * data[topIdx + 2]);
    sumLuma += (0.299 * data[botIdx] + 0.587 * data[botIdx + 1] + 0.114 * data[botIdx + 2]);
    count += 2;
  }
  const bgLuma = sumLuma / count;
  console.log(`Crop ${outputPath} - bgLuma: ${bgLuma.toFixed(1)}`);

  // Ink color: Deep executive Royal Navy Blue
  const inkR = 12;
  const inkG = 45;
  const inkB = 110;

  const threshold = bgLuma - 15; // Lighter than this is paper
  const maxDarkness = 90; // Solid ink threshold

  const outBuf = Buffer.alloc(width * height * 4);

  // Track bounding box of actual ink to trim whitespace
  let minX = width, maxX = 0, minY = height, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;

      if (luma >= threshold) {
        // Transparent paper
        outBuf[i] = 255;
        outBuf[i + 1] = 255;
        outBuf[i + 2] = 255;
        outBuf[i + 3] = 0;
      } else {
        const diff = threshold - luma;
        const alphaRange = threshold - maxDarkness;
        let alpha = Math.min(255, Math.max(0, Math.round((diff / alphaRange) * 255)));
        // Smooth gamma curve for realistic ink feathering
        alpha = Math.min(255, Math.round(Math.pow(alpha / 255, 0.85) * 255));

        outBuf[i] = inkR;
        outBuf[i + 1] = inkG;
        outBuf[i + 2] = inkB;
        outBuf[i + 3] = alpha;

        if (alpha > 30) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
  }

  // Create untrimmed buffer
  const untrimmed = await sharp(outBuf, {
    raw: { width, height, channels: 4 }
  }).png().toBuffer();

  // Add 4px padding around actual ink
  const pad = 4;
  const trimLeft = Math.max(0, minX - pad);
  const trimTop = Math.max(0, minY - pad);
  const trimWidth = Math.min(width - trimLeft, (maxX - minX) + pad * 2);
  const trimHeight = Math.min(height - trimTop, (maxY - minY) + pad * 2);

  await sharp(untrimmed)
    .extract({ left: trimLeft, top: trimTop, width: trimWidth, height: trimHeight })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`[SAVED] ${outputPath} (${trimWidth}x${trimHeight}px)`);
}

async function main() {
  // Sign 1: Very sharp, prominent loops
  await processInkSignature(srcCard, { left: 45, top: 334, width: 165, height: 35 }, path.join(sigDir, 'gagandeep_kaur_signature_specimen_1.png'));
  
  // Sign 2: Clean and balanced
  await processInkSignature(srcCard, { left: 45, top: 362, width: 165, height: 35 }, path.join(sigDir, 'gagandeep_kaur_signature_specimen_2.png'));
  
  // Sign 3: Fluent ending
  await processInkSignature(srcCard, { left: 45, top: 390, width: 165, height: 44 }, path.join(sigDir, 'gagandeep_kaur_signature_specimen_3.png'));

  // Copy specimen 1 as the master official signature
  fs.copyFileSync(
    path.join(sigDir, 'gagandeep_kaur_signature_specimen_1.png'),
    path.join(sigDir, 'gagandeep_kaur_signature.png')
  );
  fs.copyFileSync(
    path.join(sigDir, 'gagandeep_kaur_signature_specimen_1.png'),
    path.join(gkDir, '00_Gagandeep_Kaur_Official_Signature.png')
  );
  fs.copyFileSync(
    path.join(sigDir, 'gagandeep_kaur_signature_specimen_1.png'),
    path.join(gkDir, 'gagandeep_kaur_signature.png')
  );

  console.log('[COMPLETED] All Gagandeep Kaur signatures extracted and stored!');
}

main().catch(console.error);
