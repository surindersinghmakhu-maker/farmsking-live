const sharp = require('D:\\farmsking\\backend\\node_modules\\sharp');

async function findBBoxes() {
  const { data, info } = await sharp('D:\\farmsking\\Govt\\docs\\00_Directors_Official_Signatures\\test_crop_area.png')
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  // Calculate average luma per row
  const rowLumas = [];
  for (let y = 0; y < height; y++) {
    let sum = 0;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      sum += luma;
    }
    rowLumas.push({ y, avgLuma: sum / width });
  }

  // Also print min luma in row to detect ink
  for (let y = 0; y < height; y += 5) {
    let min = 255;
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * channels;
      const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
      if (luma < min) min = luma;
    }
    console.log(`y: ${y + 280}, minLuma: ${min.toFixed(0)}, avg: ${rowLumas[y].avgLuma.toFixed(0)}`);
  }
}
findBBoxes();
