import sharp from "sharp";
import path from "path";
import { existsSync } from "fs";

const SCHOOLS_DIR = path.join(process.cwd(), "public/images/campus/schools");

/** Raster logos with removable outer backgrounds */
const SOURCES = [
  { file: "psu.png", tolerance: 28 },
  { file: "osu.webp", tolerance: 26 },
  { file: "nyu.webp", tolerance: 24 },
  { file: "bu.png", tolerance: 24 },
  { file: "ucla.jpg", tolerance: 22 },
  { file: "stanford.webp", tolerance: 24 },
  { file: "berkeley.png", tolerance: 24 },
];

function colorDist(a, b) {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function samplePixel(pixels, width, channels, x, y) {
  const i = (y * width + x) * channels;
  return { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] };
}

function averageBg(pixels, width, height, channels) {
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  const samples = corners.map(([x, y]) => samplePixel(pixels, width, channels, x, y));
  return {
    r: Math.round(samples.reduce((s, c) => s + c.r, 0) / samples.length),
    g: Math.round(samples.reduce((s, c) => s + c.g, 0) / samples.length),
    b: Math.round(samples.reduce((s, c) => s + c.b, 0) / samples.length),
  };
}

function floodRemoveBackground(pixels, width, height, channels, tolerance) {
  const bg = averageBg(pixels, width, height, channels);
  const idx = (x, y) => y * width + x;
  const visited = new Uint8Array(width * height);
  const isBgAt = (x, y) => colorDist(samplePixel(pixels, width, channels, x, y), bg) <= tolerance;

  const queue = [];
  for (let x = 0; x < width; x++) {
    for (const y of [0, height - 1]) {
      if (isBgAt(x, y) && !visited[idx(x, y)]) {
        visited[idx(x, y)] = 1;
        queue.push([x, y]);
      }
    }
  }
  for (let y = 1; y < height - 1; y++) {
    for (const x of [0, width - 1]) {
      if (isBgAt(x, y) && !visited[idx(x, y)]) {
        visited[idx(x, y)] = 1;
        queue.push([x, y]);
      }
    }
  }

  let head = 0;
  while (head < queue.length) {
    const [x, y] = queue[head++];
    const i = idx(x, y) * channels;
    pixels[i + 3] = 0;

    for (const [nx, ny] of [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const ni = idx(nx, ny);
      if (visited[ni] || !isBgAt(nx, ny)) continue;
      visited[ni] = 1;
      queue.push([nx, ny]);
    }
  }
}

async function processLogo({ file, tolerance }) {
  const inputPath = path.join(SCHOOLS_DIR, file);
  if (!existsSync(inputPath)) {
    console.warn(`skip (missing): ${file}`);
    return;
  }

  const base = path.basename(file, path.extname(file));
  const outputPath = path.join(SCHOOLS_DIR, `${base}-cutout.png`);

  const { data, info } = await sharp(inputPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const pixels = new Uint8Array(data);
  floodRemoveBackground(pixels, info.width, info.height, info.channels, tolerance);

  await sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .trim()
    .png()
    .toFile(outputPath);

  console.log(`wrote ${path.relative(process.cwd(), outputPath)} (tolerance=${tolerance})`);
}

async function main() {
  for (const entry of SOURCES) {
    await processLogo(entry);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
