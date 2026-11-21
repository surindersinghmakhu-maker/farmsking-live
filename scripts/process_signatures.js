const sharp = require('D:\\farmsking\\backend\\node_modules\\sharp');
const fs = require('fs');
const path = require('path');

const outDir = 'D:\\farmsking\\Govt\\docs\\00_Directors_Official_Signatures';
const gkDir = 'D:\\farmsking\\Govt\\docs\\03_Gagandeep_Kaur_Director';
const bsDir = 'D:\\farmsking\\Govt\\docs\\02_Bakhshish_Singh_Director';

async function processSignature(inputPath, outputPath, cropOptions) {
  // 1. Crop raw signature
  const { data, info } = await sharp(inputPath)
    .extract(cropOptions)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const channels = info.channels; // 4 (RGBA)

  // Find background paper color average by sampling edge pixels
  let edgeR = 0, edgeG = 0, edgeB = 0, edgeCount = 0;
  for (let x = 0; x < width; x++) {
    // top row
    let idx = x * channels;
    edgeR += data[idx]; edgeG += data[idx + 1]; edgeB += data[idx + 2]; edgeCount++;
    // bottom row
    idx = ((height - 1) * width + x) * channels;
    edgeR += data[idx]; edgeG += data[idx + 1]; edgeB += data[idx + 2]; edgeCount++;
  }
  const bgLuma = (edgeR + edgeG + edgeB) / (edgeCount * 3);
  console.log('Estimated background luma:', bgLuma);

  // Target ink color: Royal Navy Blue (RGB: 12, 45, 110)
  const targetR = 14;
  const targetG = 48;
  const targetB = 115;

  const threshold = bgLuma - 15; // Anything lighter than this is paper
  const maxDarkness = 85; // Full ink darkness threshold

  const outBuf = Buffer.alloc(width * height * 4);

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Perceived lightness
    const luma = 0.299 * r + 0.587 * g + 0.114 * b;

    if (luma >= threshold) {
      // Paper background -> 100% transparent
      outBuf[i] = 255;
      outBuf[i + 1] = 255;
      outBuf[i + 2] = 255;
      outBuf[i + 3] = 0;
    } else {
      // Ink pixel
      // Linear ramp from threshold (alpha=0) to maxDarkness (alpha=255)
      const diff = threshold - luma;
      const alphaRange = threshold - maxDarkness;
      let alpha = Math.min(255, Math.max(0, Math.round((diff / alphaRange) * 255)));

      // Boost contrast slightly
      alpha = Math.min(255, Math.round(Math.pow(alpha / 255, 0.8) * 255));

      outBuf[i] = targetR;
      outBuf[i + 1] = targetG;
      outBuf[i + 2] = targetB;
      outBuf[i + 3] = alpha;
    }
  }

  // Save clean transparent PNG
  await sharp(outBuf, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png({ quality: 100, compressionLevel: 9 })
    .toFile(outputPath);

  console.log('[OK] Generated clean transparent signature:', outputPath);
}

async function run() {
  const masterSheet = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\d6f7edcb-80b0-4e4d-ac65-524ebca94068\\.user_uploaded\\media_1795279705858_3e131492.jpg';

  // Gagandeep Kaur Signature 1 (Crisp and complete)
  const gkOut = path.join(outDir, 'gagandeep_kaur_signature.png');
  await processSignature(masterSheet, gkOut, { left: 42, top: 62, width: 165, height: 42 });

  // Copy to Gagandeep Kaur director folder
  fs.copyFileSync(gkOut, path.join(gkDir, '00_Gagandeep_Kaur_Official_Signature.png'));

  // Bakhshish Singh Signature 1
  const bsOut = path.join(outDir, 'bakhshish_singh_signature.png');
  await processSignature(masterSheet, bsOut, { left: 405, top: 65, width: 75, height: 38 });

  // Copy to Bakhshish Singh director folder
  fs.copyFileSync(bsOut, path.join(bsDir, '00_Bakhshish_Singh_Official_Signature.png'));

  console.log('[ALL DONE] Signatures extracted, cleaned, and archived in statutory directories.');
}

run().catch(console.error);
