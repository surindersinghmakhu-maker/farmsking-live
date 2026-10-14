const fs = require('fs');
const path = require('path');
const sharp = require('d:/FarmsKing/backend/node_modules/sharp');

async function makeCleanTransparentPng(inputPath, outputPath) {
  const { data, info } = await sharp(inputPath)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const totalPixels = width * height;
  const rgba = Buffer.alloc(totalPixels * 4);

  // Mark background using BFS from borders
  const isBg = new Uint8Array(totalPixels);
  const visited = new Uint8Array(totalPixels);
  const queue = [];

  function isNearWhite(idx) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    return r >= 242 && g >= 242 && b >= 242;
  }

  // Seed borders
  for (let x = 0; x < width; x++) {
    for (let y of [0, height - 1]) {
      const pIdx = y * width + x;
      if (!visited[pIdx] && isNearWhite(pIdx * channels)) {
        visited[pIdx] = 1;
        isBg[pIdx] = 1;
        queue.push(pIdx);
      }
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x of [0, width - 1]) {
      const pIdx = y * width + x;
      if (!visited[pIdx] && isNearWhite(pIdx * channels)) {
        visited[pIdx] = 1;
        isBg[pIdx] = 1;
        queue.push(pIdx);
      }
    }
  }

  // BFS flood fill
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
          if (isNearWhite(nIdx * channels)) {
            isBg[nIdx] = 1;
            queue.push(nIdx);
          }
        }
      }
    }
  }

  // Write RGBA
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pIdx = y * width + x;
      const srcIdx = pIdx * channels;
      const dstIdx = pIdx * 4;

      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      if (isBg[pIdx]) {
        rgba[dstIdx] = 0;
        rgba[dstIdx + 1] = 0;
        rgba[dstIdx + 2] = 0;
        rgba[dstIdx + 3] = 0;
      } else {
        // Antialiased edge feathering
        let hasBgNeighbor = false;
        if (
          (x > 0 && isBg[pIdx - 1]) ||
          (x < width - 1 && isBg[pIdx + 1]) ||
          (y > 0 && isBg[pIdx - width]) ||
          (y < height - 1 && isBg[pIdx + width])
        ) {
          hasBgNeighbor = true;
        }

        rgba[dstIdx] = r;
        rgba[dstIdx + 1] = g;
        rgba[dstIdx + 2] = b;

        if (hasBgNeighbor && r >= 225 && g >= 225 && b >= 225) {
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const alpha = Math.max(0, Math.min(255, Math.round((255 - lum) * 8.5)));
          rgba[dstIdx + 3] = alpha;
        } else {
          rgba[dstIdx + 3] = 255;
        }
      }
    }
  }

  // Save via sharp, trim transparent margins, resize to 512x512 with contain
  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .trim({ threshold: 5 })
    .resize(512, 512, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  console.log(`Saved clean transparent icon: ${outputPath}`);
}

async function run() {
  const artifacts = 'C:/Users/hp/.gemini/antigravity-ide/brain/8fd4a42b-5af8-4449-b5f9-a2f786b61b54';
  const outDir = 'D:/FarmsKing/frontend/assets/images';

  const files = [
    {
      in: `${artifacts}/icon_farming_isolated_1792004257378.jpg`,
      out: `${outDir}/icon_farming_3d_clean.png`
    },
    {
      in: `${artifacts}/icon_gardening_isolated_1792004279678.jpg`,
      out: `${outDir}/icon_gardening_3d_clean.png`
    },
    {
      in: `${artifacts}/icon_cropdoctors_isolated_1792004302078.jpg`,
      out: `${outDir}/icon_cropdoctors_3d_clean.png`
    },
    {
      in: `${artifacts}/icon_agristore_isolated_1792004320548.jpg`,
      out: `${outDir}/icon_agristore_3d_clean.png`
    }
  ];

  for (const f of files) {
    await makeCleanTransparentPng(f.in, f.out);
  }
  console.log('All 4 icons converted successfully!');
}

run().catch(console.error);
