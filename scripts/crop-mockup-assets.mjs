import sharp from "sharp";
import { mkdir } from "fs/promises";
import path from "path";

const HOME_SRC = path.join(process.cwd(), "KakaoTalk_Photo_2026-06-03-01-21-28 001.png");
const HERO_SRC = path.join(process.cwd(), "KakaoTalk_Photo_2026-06-03-01-21-28 002.png");
const HOME_OUT = path.join(process.cwd(), "public/images/home");
const HERO_OUT = path.join(process.cwd(), "public/images/hero-landscape.webp");

/** Measured on 001 home mockup (1536×1024) — card bodies only, no section headers */
const HOME_REF_W = 1536;
const HOME_REF_H = 1024;

const HOME_CROPS = [
  { file: "featured/concrete-bloom.webp", left: 239, top: 518, width: 233, height: 134 },
  { file: "featured/sink-or-swim.webp", left: 486, top: 518, width: 233, height: 134 },
  { file: "featured/9pm-conversation.webp", left: 733, top: 518, width: 233, height: 134 },
  { file: "featured/almost-maine.webp", left: 980, top: 518, width: 233, height: 134 },
  { file: "featured/the-first-draft.webp", left: 1227, top: 518, width: 233, height: 134 },
  { file: "surface/flicker.webp", left: 239, top: 755, width: 177, height: 111 },
  { file: "surface/everything-somewhere.webp", left: 429, top: 755, width: 177, height: 111 },
  { file: "surface/rooftop-sound.webp", left: 618, top: 755, width: 177, height: 111 },
  { file: "surface/distant-land.webp", left: 807, top: 755, width: 177, height: 111 },
  { file: "selects/midnight-ferry.webp", left: 239, top: 924, width: 233, height: 100 },
  { file: "selects/glass-garden.webp", left: 486, top: 924, width: 233, height: 100 },
  { file: "selects/northbound.webp", left: 733, top: 924, width: 233, height: 100 },
  { file: "selects/paper-moon.webp", left: 980, top: 924, width: 233, height: 100 },
  { file: "campus-currents-map.webp", left: 1150, top: 748, width: 380, height: 190 },
];

/** Measured on 002 campus mockup — right-side mountain/wave texture only, no UI text */
const HERO_REF_W = 1491;
const HERO_REF_H = 1055;
const HERO_CROP = { left: 850, top: 88, width: 630, height: 300 };

function scaleCrop(ref, refW, refH, imgW, imgH) {
  return {
    left: Math.round((ref.left / refW) * imgW),
    top: Math.round((ref.top / refH) * imgH),
    width: Math.round((ref.width / refW) * imgW),
    height: Math.round((ref.height / refH) * imgH),
  };
}

function assertCrop(crop, imgW, imgH, label) {
  if (crop.left + crop.width > imgW || crop.top + crop.height > imgH) {
    throw new Error(`bad crop ${label}: ${JSON.stringify(crop)} vs ${imgW}x${imgH}`);
  }
}

const homeMeta = await sharp(HOME_SRC).metadata();
const homeW = homeMeta.width ?? HOME_REF_W;
const homeH = homeMeta.height ?? HOME_REF_H;

await mkdir(HOME_OUT, { recursive: true });

for (const ref of HOME_CROPS) {
  const crop = scaleCrop(ref, HOME_REF_W, HOME_REF_H, homeW, homeH);
  assertCrop(crop, homeW, homeH, ref.file);
  const dest = path.join(HOME_OUT, ref.file);
  await mkdir(path.dirname(dest), { recursive: true });
  await sharp(HOME_SRC).extract(crop).webp({ quality: 85 }).toFile(dest);
  console.log("home", ref.file, crop);
}

const heroMeta = await sharp(HERO_SRC).metadata();
const heroW = heroMeta.width ?? HERO_REF_W;
const heroH = heroMeta.height ?? HERO_REF_H;
const heroCrop = scaleCrop(HERO_CROP, HERO_REF_W, HERO_REF_H, heroW, heroH);
assertCrop(heroCrop, heroW, heroH, "hero-landscape");
await sharp(HERO_SRC).extract(heroCrop).webp({ quality: 85 }).toFile(HERO_OUT);
console.log("hero-landscape.webp", heroCrop);

console.log("done", { home: `${homeW}x${homeH}`, hero: `${heroW}x${heroH}` });
