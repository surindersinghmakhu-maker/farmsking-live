const sharp = require('D:\\farmsking\\backend\\node_modules\\sharp');

async function mapInk() {
  const p = 'C:\\Users\\hp\\.gemini\\antigravity\\brain\\d6f7edcb-80b0-4e4d-ac65-524ebca94068\\.user_uploaded\\media_1795280193553_8466b966.jpg';
  const { data, info } = await sharp(p).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Let's create an ASCII map (sampling every 2 pixels)
  let ascii = '';
  for (let y = 0; y < height; y += 2) {
    let row = '';
    for (let x = 0; x < width; x += 2) {
      const idx = (y * width + x) * channels;
      const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (luma < 150) {
        row += '#';
      } else if (luma < 200) {
        row += '.';
      } else {
        row += ' ';
      }
    }
    ascii += `${y.toString().padStart(2, ' ')} | ${row}\n`;
  }
  console.log(ascii);
}

mapInk();
