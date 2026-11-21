const sharp = require('D:\\farmsking\\backend\\node_modules\\sharp');
const fs = require('fs');

async function inspectImage() {
  const p = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\d6f7edcb-80b0-4e4d-ac65-524ebca94068\\.user_uploaded\\media_1795280193553_8466b966.jpg';
  const { data, info } = await sharp(p).raw().toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  console.log(`Dimensions: ${width}x${height}, channels: ${channels}`);

  // Find min luma across rows
  for (let y = 0; y < height; y++) {
    let minLuma = 255;
    let minX = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (luma < minLuma) {
        minLuma = luma;
        minX = x;
      }
    }
    console.log(`y: ${y}, minLuma: ${minLuma.toFixed(0)} at x=${minX}`);
  }
}

inspectImage();
