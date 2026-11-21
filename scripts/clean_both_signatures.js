const sharp = require('D:\\farmsking\\backend\\node_modules\\sharp');
const fs = require('fs');
const path = require('path');

const sigDir = 'D:\\farmsking\\Govt\\docs\\00_Directors_Official_Signatures';
const gkDir = 'D:\\farmsking\\Govt\\docs\\03_Gagandeep_Kaur_Director';
const bsDir = 'D:\\farmsking\\Govt\\docs\\02_Bakhshish_Singh_Director';
const desktopDir = 'C:\\Users\\hp\\Desktop\\FarmsKing Pvt Ltd';

async function cleanGagandeep() {
  const gkPath = path.join(sigDir, 'gagandeep_kaur_signature.png');
  const { data, info } = await sharp(gkPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Gagandeep: Clear y < 7 (removes the top dot completely) and y >= 50 (removes bottom specks)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (y < 7 || y >= 50) {
        data[idx + 3] = 0; // set alpha to 0 (100% transparent)
      }
    }
  }

  // Find tight bounding box of real signature strokes
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (data[idx + 3] > 30) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const pad = 3;
  const trimLeft = Math.max(0, minX - pad);
  const trimTop = Math.max(0, minY - pad);
  const trimWidth = Math.min(width - trimLeft, (maxX - minX) + pad * 2);
  const trimHeight = Math.min(height - trimTop, (maxY - minY) + pad * 2);

  const cleanBuf = await sharp(data, { raw: { width, height, channels } })
    .extract({ left: trimLeft, top: trimTop, width: trimWidth, height: trimHeight })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(sigDir, 'gagandeep_kaur_signature.png'), cleanBuf);
  fs.writeFileSync(path.join(gkDir, 'gagandeep_kaur_signature.png'), cleanBuf);
  fs.writeFileSync(path.join(gkDir, '00_Gagandeep_Kaur_Official_Signature.png'), cleanBuf);
  fs.writeFileSync(path.join(desktopDir, 'gagandeep_kaur_signature.png'), cleanBuf);

  console.log(`[OK] Gagandeep Kaur signature cleaned: ${trimWidth}x${trimHeight}px (Top dot removed)`);
}

async function cleanBakhshish() {
  const bsPath = path.join(sigDir, 'bakhshish_singh_signature.png');
  const { data, info } = await sharp(bsPath).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Bakhshish: Clear y < 8 (removes the 2 top dots at rows 0-2) and x < 4 (removes left edge noise)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (y < 8 || x < 4) {
        data[idx + 3] = 0; // set alpha to 0
      }
    }
  }

  // Find tight bounding box of real signature strokes
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      if (data[idx + 3] > 30) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  const pad = 3;
  const trimLeft = Math.max(0, minX - pad);
  const trimTop = Math.max(0, minY - pad);
  const trimWidth = Math.min(width - trimLeft, (maxX - minX) + pad * 2);
  const trimHeight = Math.min(height - trimTop, (maxY - minY) + pad * 2);

  const cleanBuf = await sharp(data, { raw: { width, height, channels } })
    .extract({ left: trimLeft, top: trimTop, width: trimWidth, height: trimHeight })
    .png({ quality: 100, compressionLevel: 9 })
    .toBuffer();

  fs.writeFileSync(path.join(sigDir, 'bakhshish_singh_signature.png'), cleanBuf);
  fs.writeFileSync(path.join(bsDir, 'bakhshish_singh_signature.png'), cleanBuf);
  fs.writeFileSync(path.join(bsDir, '00_Bakhshish_Singh_Official_Signature.png'), cleanBuf);
  fs.writeFileSync(path.join(desktopDir, 'bakhshish_singh_signature.png'), cleanBuf);

  console.log(`[OK] Bakhshish Singh signature cleaned: ${trimWidth}x${trimHeight}px (Both top dots removed)`);
}

async function run() {
  await cleanGagandeep();
  await cleanBakhshish();
}

run().catch(console.error);
