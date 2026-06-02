import sharp from "sharp";
import { mkdir } from "fs/promises";
import path from "path";

const SRC = path.join(process.cwd(), "KakaoTalk_Photo_2026-06-03-01-21-28 001.png");
const OUT = path.join(process.cwd(), "public/images/home");

const REF_W = 1491;
const REF_H = 1055;

/** Reference crops on 1491×1055 mockup */
const REF_CROPS = [
  { file: "featured/concrete-bloom.webp", left: 232, top: 528, width: 226, height: 138 },
  { file: "featured/sink-or-swim.webp", left: 472, top: 528, width: 226, height: 138 },
  { file: "featured/9pm-conversation.webp", left: 712, top: 528, width: 226, height: 138 },
  { file: "featured/almost-maine.webp", left: 952, top: 528, width: 226, height: 138 },
  { file: "featured/the-first-draft.webp", left: 1192, top: 528, width: 226, height: 138 },
  { file: "surface/flicker.webp", left: 232, top: 728, width: 172, height: 108 },
  { file: "surface/everything-somewhere.webp", left: 416, top: 728, width: 172, height: 108 },
  { file: "surface/rooftop-sound.webp", left: 600, top: 728, width: 172, height: 108 },
  { file: "surface/distant-land.webp", left: 784, top: 728, width: 172, height: 108 },
  { file: "selects/midnight-ferry.webp", left: 232, top: 900, width: 226, height: 130 },
  { file: "selects/glass-garden.webp", left: 472, top: 900, width: 226, height: 130 },
  { file: "selects/northbound.webp", left: 712, top: 900, width: 226, height: 130 },
  { file: "selects/paper-moon.webp", left: 952, top: 900, width: 226, height: 130 },
  { file: "campus-currents-map.webp", left: 1008, top: 712, width: 460, height: 210 },
];

function scaleCrop(ref, imgW, imgH) {
  return {
    left: Math.round((ref.left / REF_W) * imgW),
    top: Math.round((ref.top / REF_H) * imgH),
    width: Math.round((ref.width / REF_W) * imgW),
    height: Math.round((ref.height / REF_H) * imgH),
  };
}

const meta = await sharp(SRC).metadata();
const imgW = meta.width ?? REF_W;
const imgH = meta.height ?? REF_H;

await mkdir(OUT, { recursive: true });

for (const ref of REF_CROPS) {
  const crop = scaleCrop(ref, imgW, imgH);
  if (crop.left + crop.width > imgW || crop.top + crop.height > imgH) {
    throw new Error(`bad crop ${ref.file}: ${JSON.stringify(crop)} vs ${imgW}x${imgH}`);
  }
  const dest = path.join(OUT, ref.file);
  await mkdir(path.dirname(dest), { recursive: true });
  await sharp(SRC).extract(crop).webp({ quality: 85 }).toFile(dest);
  console.log("wrote", ref.file, crop);
}

console.log("done", imgW, imgH);
