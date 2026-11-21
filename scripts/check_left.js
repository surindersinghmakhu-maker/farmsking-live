const sharp = require('D:\\farmsking\\backend\\node_modules\\sharp');

async function checkLeftEdge() {
  const imgPath = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\d6f7edcb-80b0-4e4d-ac65-524ebca94068\\.user_uploaded\\media_1795279882540_6dc61643.jpg';
  const { data, info } = await sharp(imgPath)
    .extract({ left: 25, top: 335, width: 45, height: 40 })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  for (let x = 0; x < width; x += 2) {
    let min = 255;
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * channels;
      const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (luma < min) min = luma;
    }
    console.log(`x: ${x + 25}, minLuma: ${min.toFixed(0)}`);
  }
}
checkLeftEdge();
