import sharp from "sharp";

export interface SignatureRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ClusterDebug {
  x: number;
  y: number;
  width: number;
  height: number;
  score: number;
  heightRatio: number;
  aspect: number;
  fill: number;
  siblings: number;
  nearLine: boolean;
  accepted: boolean;
  reason?: string;
}

export interface DetectionResult {
  regions: SignatureRegion[];
  width: number;
  height: number;
  debug: {
    textHeight: number;
    lines: SignatureRegion[];
    clusters: ClusterDebug[];
  };
}

export interface ProcessResult {
  image: Buffer;
  regions: SignatureRegion[];
  hadSignature: boolean;
  width: number;
  height: number;
}

const ANALYSIS_WIDTH = 700;
const INK_LUMA = 215;
const MIN_SCORE = 6;

const PRIMARY_ZONE = 0.62;
const SECONDARY_ZONE = 0.45;
const LINE_NEAR_ZONE = 0.1;
const MIN_ASPECT = 1.2;
const MAX_ASPECT = 9;
const MAX_FILL = 0.5;
const MAX_BOX_AREA = 0.3;

const MAX_REGIONS = 8;

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  area: number;
}

interface Line {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

function median(values: number[]): number {
  if (values.length === 0) return 12;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function labelComponents(ink: Uint8Array, w: number, h: number): Box[] {
  const labels = new Int32Array(w * h);
  const boxes: Box[] = [];
  const stack: number[] = [];

  for (let start = 0; start < w * h; start++) {
    if (!ink[start] || labels[start]) continue;
    const id = boxes.length + 1;
    labels[start] = id;
    stack.push(start);
    let area = 0;
    let x0 = start % w;
    let y0 = Math.floor(start / w);
    let x1 = x0;
    let y1 = y0;

    while (stack.length) {
      const p = stack.pop() as number;
      const px = p % w;
      const py = (p - (p % w)) / w;
      area++;
      if (px < x0) x0 = px;
      if (px > x1) x1 = px;
      if (py < y0) y0 = py;
      if (py > y1) y1 = py;

      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = px + dx;
          const ny = py + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const np = ny * w + nx;
          if (ink[np] && !labels[np]) {
            labels[np] = id;
            stack.push(np);
          }
        }
      }
    }

    if (area >= 4) boxes.push({ x0, y0, x1, y1, area });
  }

  return boxes;
}

function findLines(ink: Uint8Array, luma: Uint8Array, w: number, h: number): Line[] {
  const counts = new Int32Array(h);
  const minX = new Int32Array(h).fill(-1);
  const maxX = new Int32Array(h).fill(-1);
  for (let y = 0; y < h; y++) {
    let count = 0;
    for (let x = 0; x < w; x++) {
      if (ink[y * w + x]) {
        count++;
        if (minX[y] === -1) minX[y] = x;
        maxX[y] = x;
      }
    }
    counts[y] = count;
  }

  const rows: number[] = [];
  const lines: Line[] = [];
  const flush = (startY: number, endY: number) => {
    const thickness = endY - startY + 1;
    if (thickness > Math.max(3, Math.round(h * 0.012))) return;
    let x0 = w;
    let x1 = -1;
    for (let y = startY; y <= endY; y++) {
      if (minX[y] < x0) x0 = minX[y];
      if (maxX[y] > x1) x1 = maxX[y];
    }
    const length = x1 - x0 + 1;
    const cy = (startY + endY) / 2;
    if (length < w * 0.12 || length > w * 0.62) return;
    if (cy < h * 0.3 || cy > h * 0.97) return;
    let lumaSum = 0;
    let lumaCount = 0;
    for (let y = startY; y <= endY; y++) {
      for (let x = x0; x <= x1; x++) {
        if (!ink[y * w + x]) continue;
        lumaSum += luma[y * w + x];
        lumaCount++;
      }
    }
    if (lumaCount && lumaSum / lumaCount > 175) return;
    lines.push({ x0, y0: startY, x1, y1: endY });
  };

  for (let y = 0; y < h; y++) {
    if (counts[y] >= Math.round(w * 0.18)) {
      rows.push(y);
    } else if (rows.length) {
      flush(rows[0], rows[rows.length - 1]);
      rows.length = 0;
    }
  }
  if (rows.length) flush(rows[0], rows[rows.length - 1]);

  return lines;
}

function clusterBoxes(boxes: Box[], w: number, h: number, gapScaleX = 0.006, gapScaleY = 0.004, boxAreaCap = 0.12): Box[] {
  const gapX = Math.max(2, Math.round(w * gapScaleX));
  const gapY = Math.max(2, Math.round(h * gapScaleY));
  const areaCap = w * h * boxAreaCap;
  const items = boxes.map((b) => ({ ...b, dead: false }));

  let merged = true;
  while (merged) {
    merged = false;
    outer: for (let i = 0; i < items.length; i++) {
      if (items[i].dead) continue;
      for (let j = i + 1; j < items.length; j++) {
        if (items[j].dead) continue;
        const a = items[i];
        const b = items[j];
        const dx = Math.max(0, Math.max(a.x0 - b.x1, b.x0 - a.x1));
        const dy = Math.max(0, Math.max(a.y0 - b.y1, b.y0 - a.y1));
        if (dx > gapX || dy > gapY) continue;
        const x0 = Math.min(a.x0, b.x0);
        const y0 = Math.min(a.y0, b.y0);
        const x1 = Math.max(a.x1, b.x1);
        const y1 = Math.max(a.y1, b.y1);
        if ((x1 - x0 + 1) * (y1 - y0 + 1) > areaCap) continue;
        a.x0 = x0;
        a.y0 = y0;
        a.x1 = x1;
        a.y1 = y1;
        a.area += b.area;
        b.dead = true;
        merged = true;
        break outer;
      }
    }
  }

  return items.filter((b) => !b.dead);
}

function expandRegion(box: Box, w: number, h: number): SignatureRegion {
  const padX = Math.round(w * 0.015);
  const padYUp = Math.round(h * 0.012);
  const padYDown = Math.round(h * 0.006);
  const x = clamp(box.x0 - padX, 0, w - 1);
  const y = clamp(box.y0 - padYUp, 0, h - 1);
  const x1 = clamp(box.x1 + padX, x, w - 1);
  const y1 = clamp(box.y1 + padYDown, y, h - 1);
  return { x, y, width: x1 - x + 1, height: y1 - y + 1 };
}

function overlaps(a: SignatureRegion, b: SignatureRegion): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

export async function detectSignatures(input: Buffer): Promise<DetectionResult> {
  const meta = await sharp(input).metadata();
  const W = meta.width || 0;
  const H = meta.height || 0;
  if (!W || !H) throw new Error("Unable to read certificate image dimensions");

  const aw = Math.min(ANALYSIS_WIDTH, W);
  const scale = aw / W;
  const ah = Math.max(1, Math.round(H * scale));

  const { data, info } = await sharp(input)
    .resize(aw, ah, { fit: "fill" })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .toColourspace("srgb")
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const ink = new Uint8Array(aw * ah);
  const luma = new Uint8Array(aw * ah);
  for (let p = 0; p < aw * ah; p++) {
    const o = p * channels;
    const r = data[o];
    const g = channels === 1 ? data[o] : data[o + 1];
    const b = channels === 1 ? data[o] : data[o + 2];
    const value = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    luma[p] = value;
    if (value < INK_LUMA) ink[p] = 1;
  }

  const components = labelComponents(ink, aw, ah).filter((c) => {
    const bw = c.x1 - c.x0 + 1;
    const bh = c.y1 - c.y0 + 1;
    const fill = c.area / (bw * bh);
    const aspect = bw / bh;
    return !((aspect > 10 || 1 / Math.max(aspect, 0.0001) > 10) && fill < 0.12);
  });
  const textHeight = median(
    components.filter((c) => c.area >= 8).map((c) => c.y1 - c.y0 + 1)
  );
  const lines = findLines(ink, luma, aw, ah);
  const isRuleComponent = (b: Box) => {
    const bh = b.y1 - b.y0 + 1;
    const bw = b.x1 - b.x0 + 1;
    return bh <= Math.max(3, Math.round(textHeight * 0.6)) && bw >= aw * 0.12;
  };
  const mergeable = components.filter((c) => !isRuleComponent(c));
  const ruleComponents = components.filter(isRuleComponent);
  const clusters = [...clusterBoxes(mergeable, aw, ah), ...ruleComponents];

  const childComponents = (c: Box): Box[] =>
    components.filter((k) => {
      const kx = (k.x0 + k.x1) / 2;
      const ky = (k.y0 + k.y1) / 2;
      return kx >= c.x0 && kx <= c.x1 && ky >= c.y0 && ky <= c.y1;
    });

  const isPrintedText = (c: Box): boolean => {
    const kids = childComponents(c).filter((k) => k.area >= 6);
    if (kids.length < 4) return false;
    const heights = kids.map((k) => k.y1 - k.y0 + 1);
    const bottoms = kids.map((k) => k.y1);
    const medH = median(heights);
    const medB = median(bottoms);
    if (medH <= 1) return false;
    let uniform = 0;
    for (let i = 0; i < kids.length; i++) {
      if (Math.abs(heights[i] - medH) <= medH * 0.45 && Math.abs(bottoms[i] - medB) <= medH * 0.35) uniform++;
    }
    return uniform / kids.length >= 0.7;
  };

  const hasSolidGraphic = (c: Box): boolean => {
    const kids = childComponents(c);
    const total = kids.reduce((s, k) => s + k.area, 0) || 1;
    return kids.some((k) => {
      const fill = k.area / ((k.x1 - k.x0 + 1) * (k.y1 - k.y0 + 1));
      return fill > 0.65 && k.area >= total * 0.15;
    });
  };

  const isBlueInk = (c: Box): boolean => {
    if (channels === 1) return false;
    let r = 0;
    let b = 0;
    let n = 0;
    for (let y = c.y0; y <= c.y1; y++) {
      for (let x = c.x0; x <= c.x1; x++) {
        const p = y * aw + x;
        if (!ink[p]) continue;
        const o = p * channels;
        r += data[o];
        b += data[o + 2];
        n++;
      }
    }
    if (!n) return false;
    return b / n - r / n >= 50;
  };

  const isMultiColor = (c: Box): boolean => {
    if (channels === 1) return false;
    let neutral = 0;
    let warm = 0;
    let cool = 0;
    let green = 0;
    for (let y = c.y0; y <= c.y1; y++) {
      for (let x = c.x0; x <= c.x1; x++) {
        const p = y * aw + x;
        if (!ink[p]) continue;
        const o = p * channels;
        const r = data[o];
        const g = data[o + 1];
        const b = data[o + 2];
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        if (max === 0 || (max - min) / max < 0.3) {
          neutral++;
          continue;
        }
        if (r >= g && r >= b) warm++;
        else if (g >= r && g >= b) green++;
        else cool++;
      }
    }
    const colorful = warm + cool + green;
    if (colorful < 8) return false;
    const families = [warm, cool, green].filter((n) => n / colorful >= 0.2);
    void neutral;
    return families.length >= 2;
  };

  const debugClusters: ClusterDebug[] = [];
  const accepted: Box[] = [];
  const rejected: { box: Box; reason?: string; score: number; dbg: ClusterDebug }[] = [];

  for (const c of clusters) {
    const bw = c.x1 - c.x0 + 1;
    const bh = c.y1 - c.y0 + 1;
    const cy = (c.y0 + c.y1) / 2;
    const aspect = bw / bh;
    const fill = c.area / (bw * bh);
    const heightRatio = bh / Math.max(1, textHeight);

    let siblings = 0;
    for (const o of clusters) {
      if (o === c) continue;
      const obh = o.y1 - o.y0 + 1;
      const ocy = (o.y0 + o.y1) / 2;
      const ratio = bh / Math.max(1, obh);
      if (ratio < 0.5 || ratio > 2) continue;
      if (Math.abs(cy - ocy) > Math.max(bh, obh) * 0.6) continue;
      siblings++;
    }

    const cx = (c.x0 + c.x1) / 2;
    const line = lines.find(
      (l) =>
        cy >= l.y0 - ah * LINE_NEAR_ZONE &&
        cy <= l.y1 + ah * 0.02 &&
        cx >= l.x0 - aw * 0.02 &&
        cx <= l.x1 + aw * 0.02
    );
    const nearLine = !!line;
    const belowLine = lines.some(
      (l) =>
        cy > l.y1 &&
        cy - l.y1 < ah * 0.15 &&
        cx >= l.x0 - aw * 0.02 &&
        cx <= l.x1 + aw * 0.02
    );

    let score = 0;
    if (heightRatio >= 1.6) score += 3;
    else if (heightRatio >= 1.15) score += 2;
    else if (heightRatio >= 0.85) score += 1;
    else score -= 1;

    if (aspect >= MIN_ASPECT && aspect <= 8) score += 2;
    else if (aspect >= 1.0 && aspect < MIN_ASPECT) score += 0.5;

    if (fill <= 0.35) score += 2;
    else if (fill <= MAX_FILL) score += 1;
    else score -= 1;

    if (bw >= aw * 0.05) score += 1;
    if (c.area >= aw * ah * 0.0008) score += 1;

    if (siblings >= 3) score -= 3;
    else if (siblings === 1) score -= 0.5;

    if (nearLine) score += heightRatio >= 1.15 ? 2 : 0.5;

    const inPrimaryZone = cy > ah * PRIMARY_ZONE;
    const inSecondaryZone = cy > ah * SECONDARY_ZONE;
    if (inPrimaryZone) score += 1;

    const isSignatureShaped =
      heightRatio >= 1.5 || (heightRatio >= 1.2 && nearLine);
    const inZone = inPrimaryZone || (inSecondaryZone && nearLine);

    let reason: string | undefined;
    let acceptedFlag = true;

    if (bw * bh > aw * ah * MAX_BOX_AREA) {
      acceptedFlag = false;
      reason = "background artifact";
    } else if (aspect < MIN_ASPECT) {
      acceptedFlag = false;
      reason = "too square";
    } else if (aspect > MAX_ASPECT) {
      acceptedFlag = false;
      reason = "too wide (text line)";
    } else if (fill > MAX_FILL) {
      acceptedFlag = false;
      reason = "too dense";
    } else if (!isSignatureShaped) {
      acceptedFlag = false;
      reason = "not signature height";
    } else if (siblings >= 3) {
      acceptedFlag = false;
      reason = "part of text row";
    } else if (belowLine) {
      acceptedFlag = false;
      reason = "below signature line";
    } else if (isPrintedText(c)) {
      acceptedFlag = false;
      reason = "printed text";
    } else if (isBlueInk(c)) {
      acceptedFlag = false;
      reason = "colored blue text";
    } else if (isMultiColor(c)) {
      acceptedFlag = false;
      reason = "multicolor graphic";
    } else if (hasSolidGraphic(c)) {
      acceptedFlag = false;
      reason = "logo/graphic";
    } else if (!inZone) {
      acceptedFlag = false;
      reason = "outside signature zone";
    } else if (score < MIN_SCORE) {
      acceptedFlag = false;
      reason = "low score";
    }

    const debug: ClusterDebug = {
      x: Math.round(c.x0 / scale),
      y: Math.round(c.y0 / scale),
      width: Math.round(bw / scale),
      height: Math.round(bh / scale),
      score: Math.round(score * 10) / 10,
      heightRatio: Math.round(heightRatio * 100) / 100,
      aspect: Math.round(aspect * 100) / 100,
      fill: Math.round(fill * 100) / 100,
      siblings,
      nearLine,
      accepted: acceptedFlag,
      reason,
    };
    debugClusters.push(debug);
    if (acceptedFlag) accepted.push(c);
    else rejected.push({ box: c, reason, score, dbg: debug });
  }

  const companionReasons = new Set(["printed text", "not signature height", "part of text row", "low score"]);
  const companions: Box[] = [];
  for (const r of rejected) {
    if (r.score < 3 || !r.reason || !companionReasons.has(r.reason)) continue;
    for (const a of accepted) {
      const dx = Math.max(0, Math.max(a.x0 - r.box.x1, r.box.x0 - a.x1));
      if (dx > aw * 0.04) continue;
      const overlap = Math.min(a.y1, r.box.y1) - Math.max(a.y0, r.box.y0);
      const minH = Math.min(a.y1 - a.y0 + 1, r.box.y1 - r.box.y0 + 1);
      if (minH <= 0 || overlap < minH * 0.5) continue;
      companions.push(r.box);
      r.dbg.accepted = true;
      r.dbg.reason = "signature continuation";
      break;
    }
  }

  const mergedAccepted = clusterBoxes([...accepted, ...companions], aw, ah, 0.03, 0.025);
  const regions = mergedAccepted
    .map((c) => {
      const scaled: Box = {
        x0: Math.round(c.x0 / scale),
        y0: Math.round(c.y0 / scale),
        x1: Math.round(c.x1 / scale),
        y1: Math.round(c.y1 / scale),
        area: c.area,
      };
      return expandRegion(scaled, W, H);
    })
    .filter((r, i, arr) => arr.findIndex((o) => overlaps(r, o)) === i)
    .slice(0, MAX_REGIONS);

  return {
    regions,
    width: W,
    height: H,
    debug: {
      textHeight,
      lines: lines.map((l) => ({
        x: Math.round(l.x0 / scale),
        y: Math.round(l.y0 / scale),
        width: Math.round((l.x1 - l.x0 + 1) / scale),
        height: Math.round((l.y1 - l.y0 + 1) / scale),
      })),
      clusters: debugClusters,
    },
  };
}

export async function blurRegions(input: Buffer, regions: SignatureRegion[]): Promise<Buffer> {
  if (!regions.length) return input;
  const meta = await sharp(input).metadata();
  const W = meta.width || 0;
  const H = meta.height || 0;
  const sigma = clamp(Math.round(Math.min(W, H) / 50), 8, 40);
  const blurred = await sharp(input).blur(sigma).toBuffer();

  const composites: sharp.OverlayOptions[] = [];
  for (const r of regions) {
    const x = clamp(Math.floor(r.x), 0, W - 1);
    const y = clamp(Math.floor(r.y), 0, H - 1);
    const width = clamp(Math.ceil(r.width), 1, W - x);
    const height = clamp(Math.ceil(r.height), 1, H - y);

    const blurredExtract = await sharp(blurred)
      .extract({ left: x, top: y, width, height })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const srcExtract = await sharp(input)
      .extract({ left: x, top: y, width, height })
      .raw()
      .toBuffer({ resolveWithObject: true });

    const sc = srcExtract.info.channels;
    const sb = srcExtract.data;
    let ix0 = width;
    let iy0 = height;
    let ix1 = -1;
    let iy1 = -1;
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const o = (py * width + px) * sc;
        const g = sc === 1 ? sb[o] : Math.round(0.299 * sb[o] + 0.587 * sb[o + 1] + 0.114 * sb[o + 2]);
        if (g < INK_LUMA) {
          if (px < ix0) ix0 = px;
          if (px > ix1) ix1 = px;
          if (py < iy0) iy0 = py;
          if (py > iy1) iy1 = py;
        }
      }
    }
    if (ix1 < 0) {
      ix0 = 0;
      iy0 = 0;
      ix1 = width - 1;
      iy1 = height - 1;
    }

    const marginL = Math.max(1, ix0);
    const marginR = Math.max(1, width - 1 - ix1);
    const marginT = Math.max(1, iy0);
    const marginB = Math.max(1, height - 1 - iy1);
    const smooth = (t: number): number => {
      const c = clamp((t - 0.25) / 0.75, 0, 1);
      return 1 - (c * c * (3 - 2 * c));
    };

    const bb = blurredExtract.data;
    const bc = blurredExtract.info.channels;
    const rgba = Buffer.alloc(width * height * 4);
    for (let py = 0; py < height; py++) {
      for (let px = 0; px < width; px++) {
        const tx = px < ix0 ? (ix0 - px) / marginL : px > ix1 ? (px - ix1) / marginR : 0;
        const ty = py < iy0 ? (iy0 - py) / marginT : py > iy1 ? (py - iy1) / marginB : 0;
        const alpha = Math.round(255 * smooth(Math.max(tx, ty)));
        const si = (py * width + px) * bc;
        const di = (py * width + px) * 4;
        if (bc === 1) {
          rgba[di] = bb[si];
          rgba[di + 1] = bb[si];
          rgba[di + 2] = bb[si];
        } else {
          rgba[di] = bb[si];
          rgba[di + 1] = bb[si + 1];
          rgba[di + 2] = bb[si + 2];
        }
        rgba[di + 3] = alpha;
      }
    }

    const region = await sharp(rgba, { raw: { width, height, channels: 4 } }).png().toBuffer();
    composites.push({ input: region, top: y, left: x });
  }

  return sharp(input).composite(composites).toBuffer();
}

export async function processCertificateBuffer(input: Buffer): Promise<ProcessResult> {
  const normalized = await sharp(input).rotate().flatten({ background: { r: 255, g: 255, b: 255 } }).toBuffer();
  const detection = await detectSignatures(normalized);
  if (!detection.regions.length) {
    return {
      image: normalized,
      regions: [],
      hadSignature: false,
      width: detection.width,
      height: detection.height,
    };
  }
  const image = await blurRegions(normalized, detection.regions);
  return {
    image,
    regions: detection.regions,
    hadSignature: true,
    width: detection.width,
    height: detection.height,
  };
}
