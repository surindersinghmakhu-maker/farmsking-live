const sharp = require('D:\\farmsking\\backend\\node_modules\\sharp');

async function inspectColLuma() {
  const { data, info } = await sharp('D:\\farmsking\\Govt\\docs\\00_Directors_Official_Signatures\\raw_gk_new_1.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  for (let x = 0; x < width; x += 5) {
    let min = 255;
    for (let y = 0; y < height; y++) {
      const idx = (y * width + x) * channels;
      const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (luma < min) min = luma;
    }
    console.log(`x: ${x + 45}, minLuma: ${min.toFixed(0)}`);
  }
}
inspectColLuma();
