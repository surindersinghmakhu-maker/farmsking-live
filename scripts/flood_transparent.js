const fs = require('fs');
const { PNG } = require('d:/FarmsKing/frontend/node_modules/pngjs');

function makeTransparent(inputPath, outputPath, tolerance = 35) {
  const buf = fs.readFileSync(inputPath);
  const png = PNG.sync.read(buf);
  const { width, height, data } = png;

  // Sample background color from outer border
  let rSum = 0, gSum = 0, bSum = 0, count = 0;
  function sample(x, y) {
    const idx = (y * width + x) * 4;
    rSum += data[idx];
    gSum += data[idx + 1];
    bSum += data[idx + 2];
    count++;
  }
  for (let x = 0; x < width; x++) {
    sample(x, 0);
    sample(x, height - 1);
  }
  for (let y = 1; y < height - 1; y++) {
    sample(0, y);
    sample(width - 1, y);
  }
  const bgR = rSum / count;
  const bgG = gSum / count;
  const bgB = bSum / count;
  console.log(`${inputPath} => BG: [${Math.round(bgR)}, ${Math.round(bgG)}, ${Math.round(bgB)}]`);

  // Flood-fill BFS from border
  const visited = new Uint8Array(width * height);
  const isBg = new Uint8Array(width * height);
  const queue = [];

  function colorDist(idx) {
    const dr = data[idx] - bgR;
    const dg = data[idx + 1] - bgG;
    const db = data[idx + 2] - bgB;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  // Push all border pixels that are close to BG
  for (let x = 0; x < width; x++) {
    for (let y of [0, height - 1]) {
      const pIdx = y * width + x;
      if (!visited[pIdx] && colorDist(pIdx * 4) <= tolerance * 1.5) {
        visited[pIdx] = 1;
        isBg[pIdx] = 1;
        queue.push(pIdx);
      }
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x of [0, width - 1]) {
      const pIdx = y * width + x;
      if (!visited[pIdx] && colorDist(pIdx * 4) <= tolerance * 1.5) {
        visited[pIdx] = 1;
        isBg[pIdx] = 1;
        queue.push(pIdx);
      }
    }
  }

  // BFS
  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    const neighbors = [
      [cx - 1, cy],
      [cx + 1, cy],
      [cx, cy - 1],
      [cx, cy + 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx]) {
          visited[nIdx] = 1;
          const dist = colorDist(nIdx * 4);
          if (dist <= tolerance) {
            isBg[nIdx] = 1;
            queue.push(nIdx);
          }
        }
      }
    }
  }

  // Now apply alpha and feathering
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pIdx = y * width + x;
      const idx = pIdx * 4;
      if (isBg[pIdx]) {
        data[idx + 3] = 0; // 100% transparent
      } else {
        // Check if adjacent to background for antialiasing
        let bgNeighborCount = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              if (isBg[ny * width + nx]) bgNeighborCount++;
            }
          }
        }
        if (bgNeighborCount > 0) {
          // Feather edge
          const dist = colorDist(idx);
          const factor = Math.min(1, Math.max(0.2, (dist - tolerance * 0.5) / tolerance));
          data[idx + 3] = Math.round(data[idx + 3] * factor);
        }
      }
    }
  }

  const outBuf = PNG.sync.write(png);
  fs.writeFileSync(outputPath, outBuf);
  console.log(`Saved transparent image to: ${outputPath}`);
}

const scratch = 'C:/Users/hp/.gemini/antigravity-ide/brain/8fd4a42b-5af8-4449-b5f9-a2f786b61b54/scratch';
makeTransparent('assets/images/icon_farming_3d_clean.png', `${scratch}/flood_farming.png`, 38);
makeTransparent('assets/images/icon_gardening_3d_clean.png', `${scratch}/flood_gardening.png`, 38);
makeTransparent('assets/images/icon_cropdoctors_3d_clean.png', `${scratch}/flood_cropdoctors.png`, 38);
makeTransparent('assets/images/icon_agristore_3d_clean.png', `${scratch}/flood_agristore.png`, 38);
