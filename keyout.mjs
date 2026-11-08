// Keys pure-black backgrounds to alpha via border flood-fill (protects dark
// pixels INSIDE the object), feathers edges, trims, and exports WebP + QA PNGs.
import sharp from "sharp";

const JOBS = [
  { name: "can-classic", out: 1000, qa: true },
  { name: "can-lime", out: 1000, qa: true },
  { name: "cherry", out: 460, qa: true },
  { name: "lime", out: 440, qa: true },
  { name: "leaf", out: 380, qa: false },
  { name: "leaves", out: 520, qa: true },
];

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

for (const job of JOBS) {
  const { data, info } = await sharp(`src/assets/raw/${job.name}.png`)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height, n = w * h;
  const maxc = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    maxc[i] = r > g ? (r > b ? r : b) : g > b ? g : b;
  }
  // Adaptive threshold from border luminance (95th percentile).
  const border = [];
  for (let x = 0; x < w; x++) { border.push(maxc[x], maxc[(h - 1) * w + x]); }
  for (let y = 0; y < h; y++) { border.push(maxc[y * w], maxc[y * w + w - 1]); }
  border.sort((a, b) => a - b);
  const p95 = border[Math.floor(border.length * 0.95)];
  const T = Math.min(30, Math.max(9, p95 + 6));

  // Flood fill "outside" from every dark border pixel.
  const outside = new Uint8Array(n);
  const queue = new Int32Array(n);
  let qh = 0, qt = 0;
  const seed = (i) => { if (!outside[i] && maxc[i] < T) { outside[i] = 1; queue[qt++] = i; } };
  for (let x = 0; x < w; x++) { seed(x); seed((h - 1) * w + x); }
  for (let y = 0; y < h; y++) { seed(y * w); seed(y * w + w - 1); }
  while (qh < qt) {
    const i = queue[qh++];
    const x = i % w;
    if (x > 0) seed(i - 1);
    if (x < w - 1) seed(i + 1);
    if (i >= w) seed(i - w);
    if (i < n - w) seed(i + w);
  }
  let outCount = 0;
  for (let i = 0; i < n; i++) {
    if (outside[i]) {
      outCount++;
      data[i * 4 + 3] = Math.round(255 * smooth(3, T, maxc[i]));
    } else {
      data[i * 4 + 3] = 255;
    }
  }
  // Bounding box of visible pixels.
  let minX = w, minY = h, maxX = 0, maxY = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (data[(y * w + x) * 4 + 3] > 14) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.02);
  minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
  maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
  const bw = maxX - minX + 1, bh = maxY - minY + 1;

  const cut = sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left: minX, top: minY, width: bw, height: bh })
    .resize({ width: job.out, height: job.out, fit: "inside" });
  const outBuf = await cut.clone().webp({ quality: 84, alphaQuality: 92 }).toFile(`src/assets/${job.name}.webp`);
  if (job.qa) {
    await cut.clone().resize({ width: 420, height: 420, fit: "inside" })
      .flatten({ background: "#075843" })
      .png().toFile(`src/assets/raw/qa-${job.name}.png`);
  }
  console.log(`${job.name}: ${w}x${h} T=${T} outside=${(100 * outCount / n).toFixed(1)}% bbox=${bw}x${bh} -> ${(outBuf.size / 1024).toFixed(0)}KB webp`);
}
console.log("done");
