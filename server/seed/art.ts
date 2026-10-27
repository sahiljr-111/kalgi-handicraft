/**
 * Procedural SVG illustrations of Meenakari handicrafts, used as placeholder
 * product imagery for the seed data until real photographs are uploaded.
 * Every drawing lives in an 800×800 viewBox.
 */

export interface Palette {
  base: string; // main enamel colour
  deep: string; // darker shade of base
  a: string; // accent 1
  b: string; // accent 2
  c: string; // accent 3
  gold: string;
  ivory: string;
}

export const PALETTES: Record<string, Palette> = {
  ruby: { base: '#9e1b32', deep: '#6a0f20', a: '#1f7a5c', b: '#2356a8', c: '#f2b8c6', gold: '#e2b04a', ivory: '#f6eedd' },
  emerald: { base: '#17664f', deep: '#0c4232', a: '#c8283e', b: '#f0c14b', c: '#f5d9e0', gold: '#e2b04a', ivory: '#f6eedd' },
  royal: { base: '#1f3f8a', deep: '#132a5e', a: '#d23a4a', b: '#2f9a74', c: '#f6c453', gold: '#e2b04a', ivory: '#f6eedd' },
  ivory: { base: '#efe4cc', deep: '#d8c8a4', a: '#b3203a', b: '#1f7a5c', c: '#2356a8', gold: '#c99a3a', ivory: '#fffaf0' },
  noir: { base: '#1d1a1c', deep: '#0e0c0d', a: '#e0405a', b: '#35b08a', c: '#4b7be0', gold: '#e2b04a', ivory: '#f6eedd' },
  teal: { base: '#15777c', deep: '#0b4f53', a: '#e8573a', b: '#f3c24d', c: '#f7e6d0', gold: '#e2b04a', ivory: '#f6eedd' },
  saffron: { base: '#d9731e', deep: '#9c4a0c', a: '#1f3f8a', b: '#17664f', c: '#fbe2b8', gold: '#f2c14e', ivory: '#fff6e6' },
};

const WOOD = { mid: '#7a4a2a', dark: '#4a2a17', light: '#9c6a40' };

// ---------------------------------------------------------------- motifs

function flower(cx: number, cy: number, r: number, p: Palette, petals = 8, petalColor = p.a, heart = p.b): string {
  const out: string[] = [];
  for (let i = 0; i < petals; i++) {
    const deg = (360 / petals) * i;
    out.push(
      `<ellipse cx="${cx}" cy="${cy - r * 0.55}" rx="${r * 0.26}" ry="${r * 0.5}" fill="${petalColor}" stroke="${p.gold}" stroke-width="${Math.max(1, r * 0.05)}" transform="rotate(${deg} ${cx} ${cy})"/>`,
    );
  }
  for (let i = 0; i < petals; i++) {
    const deg = (360 / petals) * i + 180 / petals;
    out.push(
      `<ellipse cx="${cx}" cy="${cy - r * 0.42}" rx="${r * 0.13}" ry="${r * 0.3}" fill="${p.ivory}" opacity="0.9" transform="rotate(${deg} ${cx} ${cy})"/>`,
    );
  }
  out.push(`<circle cx="${cx}" cy="${cy}" r="${r * 0.24}" fill="${heart}" stroke="${p.gold}" stroke-width="${Math.max(1, r * 0.06)}"/>`);
  out.push(`<circle cx="${cx}" cy="${cy}" r="${r * 0.09}" fill="${p.gold}"/>`);
  return out.join('');
}

function leaf(x: number, y: number, len: number, angle: number, p: Palette): string {
  return `<path d="M0 0 Q ${len * 0.5} ${-len * 0.35} ${len} 0 Q ${len * 0.5} ${len * 0.35} 0 0Z" fill="${p.b}" stroke="${p.gold}" stroke-width="1.5" transform="translate(${x} ${y}) rotate(${angle})"/>`;
}

/** A medallion: flower inside concentric rings with leaves. */
function medallion(cx: number, cy: number, r: number, p: Palette): string {
  const leaves: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8 + Math.PI / 8;
    leaves.push(leaf(cx + Math.cos(a) * r * 0.62, cy + Math.sin(a) * r * 0.62, r * 0.32, (a * 180) / Math.PI, p));
  }
  const dots: string[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (Math.PI * 2 * i) / 24;
    dots.push(`<circle cx="${cx + Math.cos(a) * r * 0.92}" cy="${cy + Math.sin(a) * r * 0.92}" r="${r * 0.035}" fill="${p.gold}"/>`);
  }
  return [
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.deep}" stroke="${p.gold}" stroke-width="${r * 0.05}"/>`,
    `<circle cx="${cx}" cy="${cy}" r="${r * 0.84}" fill="${p.ivory}" stroke="${p.gold}" stroke-width="${r * 0.025}"/>`,
    ...leaves,
    flower(cx, cy, r * 0.6, p),
    ...dots,
  ].join('');
}

/** A horizontal band of small flowers between gold rules. */
function band(x: number, y: number, w: number, h: number, p: Palette, fill = p.deep): string {
  const n = Math.max(3, Math.round(w / (h * 1.4)));
  const step = w / n;
  const items: string[] = [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${h * 0.1}" fill="${p.gold}"/>`,
    `<rect x="${x}" y="${y + h * 0.9}" width="${w}" height="${h * 0.1}" fill="${p.gold}"/>`,
  ];
  for (let i = 0; i < n; i++) {
    const cx = x + step * (i + 0.5);
    items.push(flower(cx, y + h / 2, h * 0.34, p, 6, i % 2 ? p.a : p.c, p.b));
  }
  return items.join('');
}

function defs(p: Palette, id: string): string {
  return `<defs>
    <radialGradient id="bg-${id}" cx="50%" cy="38%" r="75%">
      <stop offset="0%" stop-color="#fbf6ec"/><stop offset="70%" stop-color="#efe3cc"/><stop offset="100%" stop-color="#e2d2b2"/>
    </radialGradient>
    <linearGradient id="sheen-${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.28"/><stop offset="45%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="wood-${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${WOOD.light}"/><stop offset="100%" stop-color="${WOOD.dark}"/>
    </linearGradient>
    <pattern id="jaal-${id}" width="60" height="60" patternUnits="userSpaceOnUse">
      <rect width="60" height="60" fill="${p.base}"/>
      ${flower(30, 30, 16, p, 6)}
      ${flower(0, 0, 9, p, 6, p.c)}${flower(60, 0, 9, p, 6, p.c)}${flower(0, 60, 9, p, 6, p.c)}${flower(60, 60, 9, p, 6, p.c)}
    </pattern>
  </defs>`;
}

function backdrop(id: string, tone: 'studio' | 'deep' = 'studio'): string {
  if (tone === 'deep') {
    return `<rect width="800" height="800" fill="#2a1712"/><circle cx="400" cy="330" r="420" fill="#4a2a1d" opacity="0.7"/>`;
  }
  return `<rect width="800" height="800" fill="url(#bg-${id})"/>`;
}

const shadow = (cx: number, cy: number, rx: number, ry = rx * 0.12) =>
  `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#3b2415" opacity="0.22"/>`;

// ---------------------------------------------------------------- objects

function chowki(p: Palette, id: string, withDiya = false): string {
  const legs = (x: number, top: number, bottom: number, w: number, fill: string) =>
    `<path d="M${x} ${top} h${w} v${(bottom - top) * 0.45} q ${w * 0.25} ${(bottom - top) * 0.1} 0 ${(bottom - top) * 0.2} v${(bottom - top) * 0.25} q ${-w * 0.1} ${(bottom - top) * 0.1} ${-w * 0.5} ${(bottom - top) * 0.1} q ${-w * 0.4} 0 ${-w * 0.5} ${-(bottom - top) * 0.1} v${-(bottom - top) * 0.25} q ${-w * 0.25} ${-(bottom - top) * 0.1} 0 ${-(bottom - top) * 0.2}Z" fill="${fill}" stroke="${p.gold}" stroke-width="2"/>`;

  return [
    shadow(400, 655, 330, 34),
    legs(185, 455, 610, 34, p.deep),
    legs(581, 455, 610, 34, p.deep),
    // top surface (trapezoid in perspective)
    `<polygon points="175,360 625,360 705,448 95,448" fill="${p.base}" stroke="${p.gold}" stroke-width="4"/>`,
    `<polygon points="200,370 600,370 668,440 132,440" fill="url(#jaal-${id})" stroke="${p.gold}" stroke-width="3" opacity="0.95"/>`,
    `<g transform="translate(400 405) scale(1 0.3)">${medallion(0, 0, 150, p)}</g>`,
    `<polygon points="175,360 625,360 705,448 95,448" fill="url(#sheen-${id})"/>`,
    // edge thickness
    `<rect x="95" y="448" width="610" height="24" fill="${p.deep}" stroke="${p.gold}" stroke-width="3"/>`,
    // apron with scalloped bottom
    `<path d="M150 472 H650 V512 ${Array.from({ length: 8 }, () => 'q -31.25 34 -62.5 0').join(' ')} Z" fill="${p.base}" stroke="${p.gold}" stroke-width="3"/>`,
    band(150, 474, 500, 36, p, p.deep),
    // front legs
    legs(128, 472, 640, 40, p.base),
    legs(632, 472, 640, 40, p.base),
    `<g transform="translate(148 560)">${flower(0, 0, 13, p, 6)}</g>`,
    `<g transform="translate(652 560)">${flower(0, 0, 13, p, 6)}</g>`,
    withDiya ? diya(400, 380, 0.9, p) : '',
  ].join('');
}

function diya(cx: number, cy: number, s: number, p: Palette): string {
  return `<g transform="translate(${cx} ${cy}) scale(${s})">
    <path d="M-10 -40 Q 0 -80 10 -40 Q 0 -30 -10 -40Z" fill="#ffb43a"/>
    <path d="M-5 -42 Q 0 -64 5 -42 Q 0 -36 -5 -42Z" fill="#fff3b0"/>
    <path d="M-60 -20 Q 0 30 60 -20 Q 45 -10 30 -34 H-30 Q -45 -10 -60 -20Z" fill="${p.gold}" stroke="${WOOD.dark}" stroke-width="2"/>
    <ellipse cx="0" cy="-30" rx="30" ry="7" fill="${WOOD.dark}" opacity="0.5"/>
  </g>`;
}

function dryFruitBox(p: Palette, id: string): string {
  return [
    shadow(420, 628, 300, 30),
    // body
    `<polygon points="620,420 690,378 690,572 620,612" fill="${p.deep}" stroke="${p.gold}" stroke-width="3"/>`,
    `<rect x="150" y="420" width="470" height="192" fill="${p.base}" stroke="${p.gold}" stroke-width="4"/>`,
    `<rect x="170" y="440" width="430" height="152" fill="url(#jaal-${id})" stroke="${p.gold}" stroke-width="3"/>`,
    medallion(270, 516, 58, p),
    medallion(385, 516, 58, p),
    medallion(500, 516, 58, p),
    `<rect x="150" y="420" width="470" height="192" fill="url(#sheen-${id})"/>`,
    // lid
    `<polygon points="140,372 220,318 710,318 630,372" fill="${p.base}" stroke="${p.gold}" stroke-width="4"/>`,
    `<g transform="translate(425 345) scale(1 0.2) skewX(-30)">${medallion(0, 0, 120, p)}</g>`,
    `<polygon points="630,372 710,318 710,360 630,414" fill="${p.deep}" stroke="${p.gold}" stroke-width="3"/>`,
    band(140, 372, 490, 42, p),
    // knob
    `<ellipse cx="425" cy="336" rx="26" ry="9" fill="${p.gold}"/><circle cx="425" cy="322" r="15" fill="${p.gold}" stroke="${WOOD.dark}" stroke-width="2"/>`,
    // feet
    `<rect x="162" y="612" width="34" height="16" rx="4" fill="${p.gold}"/><rect x="574" y="612" width="34" height="16" rx="4" fill="${p.gold}"/>`,
  ].join('');
}

/** Top-down view of an open dry-fruit box with compartments. */
function dryFruitOpen(p: Palette, id: string, cols = 3, rows = 2): string {
  const x0 = 130;
  const y0 = 180;
  const w = 540;
  const h = 440;
  const cw = (w - 40) / cols;
  const ch = (h - 40) / rows;
  const fruits = [
    { fill: '#c8905a', rx: 16, ry: 9 }, // almond
    { fill: '#efd9a6', rx: 15, ry: 10 }, // cashew
    { fill: '#7a2e2a', rx: 9, ry: 9 }, // raisin
    { fill: '#9bb04a', rx: 11, ry: 8 }, // pistachio
    { fill: '#6b4424', rx: 13, ry: 11 }, // walnut
    { fill: '#c0473a', rx: 10, ry: 10 }, // cranberry
  ];
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const cells: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = x0 + 20 + c * cw;
      const cy = y0 + 20 + r * ch;
      const f = fruits[(r * cols + c) % fruits.length];
      cells.push(`<rect x="${cx + 6}" y="${cy + 6}" width="${cw - 12}" height="${ch - 12}" rx="10" fill="${p.ivory}" stroke="${p.gold}" stroke-width="3"/>`);
      for (let k = 0; k < 26; k++) {
        const fx = cx + 24 + rnd() * (cw - 48);
        const fy = cy + 24 + rnd() * (ch - 48);
        cells.push(`<ellipse cx="${fx}" cy="${fy}" rx="${f.rx}" ry="${f.ry}" fill="${f.fill}" stroke="#00000022" transform="rotate(${rnd() * 180} ${fx} ${fy})"/>`);
      }
    }
  }
  return [
    shadow(400, 650, 300, 22),
    `<rect x="${x0 - 14}" y="${y0 - 14}" width="${w + 28}" height="${h + 28}" rx="18" fill="${p.deep}" stroke="${p.gold}" stroke-width="4"/>`,
    `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="10" fill="url(#jaal-${id})"/>`,
    ...cells,
  ].join('');
}

function thali(p: Palette, id: string): string {
  const rimFlowers: string[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (Math.PI * 2 * i) / 16;
    rimFlowers.push(flower(400 + Math.cos(a) * 270, 440 + Math.sin(a) * 150, 18, p, 6, i % 2 ? p.a : p.c));
  }
  return [
    shadow(400, 620, 320, 40),
    `<ellipse cx="400" cy="452" rx="310" ry="180" fill="${WOOD.dark}" opacity="0.4"/>`,
    `<ellipse cx="400" cy="440" rx="310" ry="176" fill="${p.base}" stroke="${p.gold}" stroke-width="6"/>`,
    ...rimFlowers,
    `<ellipse cx="400" cy="440" rx="230" ry="126" fill="${p.gold}" opacity="0.9"/>`,
    `<ellipse cx="400" cy="440" rx="220" ry="120" fill="url(#jaal-${id})" opacity="0.35"/>`,
    `<ellipse cx="400" cy="440" rx="220" ry="120" fill="${p.ivory}" opacity="0.55"/>`,
    // small bowls: kumkum, haldi, rice
    `<ellipse cx="290" cy="420" rx="42" ry="24" fill="${p.gold}" stroke="${WOOD.dark}" stroke-width="2"/><ellipse cx="290" cy="416" rx="32" ry="16" fill="#c4122f"/>`,
    `<ellipse cx="510" cy="420" rx="42" ry="24" fill="${p.gold}" stroke="${WOOD.dark}" stroke-width="2"/><ellipse cx="510" cy="416" rx="32" ry="16" fill="#f2b705"/>`,
    `<ellipse cx="400" cy="505" rx="44" ry="22" fill="${p.gold}" stroke="${WOOD.dark}" stroke-width="2"/><ellipse cx="400" cy="501" rx="34" ry="14" fill="#fbf4e2"/>`,
    diya(400, 440, 1.1, p),
    `<ellipse cx="400" cy="440" rx="310" ry="176" fill="url(#sheen-${id})"/>`,
  ].join('');
}

function kumkumBox(p: Palette, id: string): string {
  const pot = (cx: number, color: string) => [
    `<rect x="${cx - 70}" y="400" width="140" height="130" fill="${p.base}" stroke="${p.gold}" stroke-width="3"/>`,
    `<rect x="${cx - 70}" y="420" width="140" height="90" fill="url(#jaal-${id})"/>`,
    `<ellipse cx="${cx}" cy="530" rx="70" ry="22" fill="${p.deep}" stroke="${p.gold}" stroke-width="3"/>`,
    `<ellipse cx="${cx}" cy="400" rx="70" ry="22" fill="${p.gold}"/>`,
    `<ellipse cx="${cx}" cy="400" rx="58" ry="16" fill="${color}"/>`,
    `<g transform="translate(${cx} 465)">${flower(0, 0, 32, p)}</g>`,
  ].join('');
  return [
    shadow(400, 600, 290, 30),
    `<rect x="120" y="540" width="560" height="44" rx="10" fill="${p.deep}" stroke="${p.gold}" stroke-width="3"/>`,
    band(130, 546, 540, 32, p),
    pot(240, '#c4122f'),
    pot(400, '#f2b705'),
    pot(560, '#e25822'),
  ].join('');
}

function jewelleryBox(p: Palette, id: string): string {
  return [
    shadow(410, 640, 270, 28),
    `<polygon points="580,440 640,404 640,590 580,626" fill="${p.deep}" stroke="${p.gold}" stroke-width="3"/>`,
    `<rect x="210" y="440" width="370" height="186" fill="${p.base}" stroke="${p.gold}" stroke-width="4"/>`,
    `<rect x="228" y="470" width="334" height="138" fill="url(#jaal-${id})" stroke="${p.gold}" stroke-width="3"/>`,
    medallion(395, 540, 60, p),
    `<rect x="210" y="440" width="370" height="186" fill="url(#sheen-${id})"/>`,
    // domed lid
    `<path d="M580 440 L640 404 Q 640 320 580 290 L 520 326 Q 580 356 580 440Z" fill="${p.deep}" stroke="${p.gold}" stroke-width="3"/>`,
    `<path d="M210 440 Q 210 330 395 326 Q 580 330 580 440 Z" fill="${p.base}" stroke="${p.gold}" stroke-width="4"/>`,
    `<path d="M240 432 Q 245 350 395 346 Q 545 350 550 432 Z" fill="url(#jaal-${id})" opacity="0.9"/>`,
    `<path d="M210 440 Q 210 330 395 326 Q 580 330 580 440 Z" fill="url(#sheen-${id})"/>`,
    `<rect x="210" y="436" width="370" height="16" fill="${p.gold}"/>`,
    // clasp & handle
    `<rect x="378" y="430" width="34" height="48" rx="6" fill="${p.gold}" stroke="${WOOD.dark}" stroke-width="2"/>`,
    `<circle cx="395" cy="460" r="6" fill="${WOOD.dark}"/>`,
    `<path d="M355 330 Q 395 290 435 330" fill="none" stroke="${p.gold}" stroke-width="10" stroke-linecap="round"/>`,
    // feet
    `<circle cx="232" cy="632" r="12" fill="${p.gold}"/><circle cx="558" cy="632" r="12" fill="${p.gold}"/>`,
  ].join('');
}

/** Flat jewellery / gift box with a hinged top shown from above. */
function giftBox(p: Palette, id: string): string {
  return [
    shadow(400, 640, 300, 30),
    `<rect x="140" y="250" width="520" height="370" rx="14" fill="${p.deep}" stroke="${p.gold}" stroke-width="5"/>`,
    `<rect x="165" y="275" width="470" height="320" rx="8" fill="url(#jaal-${id})" stroke="${p.gold}" stroke-width="3"/>`,
    medallion(400, 435, 110, p),
    `<g>${flower(200, 310, 24, p)}${flower(600, 310, 24, p)}${flower(200, 560, 24, p)}${flower(600, 560, 24, p)}</g>`,
    `<rect x="140" y="250" width="520" height="370" rx="14" fill="url(#sheen-${id})"/>`,
  ].join('');
}

/** A single flat enamel tile — used as a close-up detail image. */
function detail(p: Palette, id: string): string {
  return [
    `<rect width="800" height="800" fill="url(#jaal-${id})"/>`,
    `<rect x="60" y="60" width="680" height="680" fill="none" stroke="${p.gold}" stroke-width="10"/>`,
    medallion(400, 400, 240, p),
    `<rect width="800" height="800" fill="url(#sheen-${id})"/>`,
  ].join('');
}

export type ArtKind = 'chowki' | 'chowki-diya' | 'dryfruit' | 'dryfruit-open' | 'thali' | 'kumkum' | 'jewellery' | 'giftbox' | 'detail';

export function drawArt(kind: ArtKind, paletteName: keyof typeof PALETTES, id: string, tone: 'studio' | 'deep' = 'studio'): string {
  const p = PALETTES[paletteName];
  const body = {
    chowki: () => chowki(p, id),
    'chowki-diya': () => chowki(p, id, true),
    dryfruit: () => dryFruitBox(p, id),
    'dryfruit-open': () => dryFruitOpen(p, id),
    thali: () => thali(p, id),
    kumkum: () => kumkumBox(p, id),
    jewellery: () => jewelleryBox(p, id),
    giftbox: () => giftBox(p, id),
    detail: () => detail(p, id),
  }[kind]();
  // Pieces are drawn around y≈475; re-centre and enlarge them to fill the frame.
  const framed = kind === 'detail' ? body : `<g transform="translate(400 415) scale(1.14) translate(-400 -475)">${body}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">${defs(p, id)}${kind === 'detail' ? '' : backdrop(id, tone)}${framed}</svg>`;
}

/** A group scene for the gallery: several pieces arranged together (bulk orders). */
export function drawScene(kinds: ArtKind[], palettes: (keyof typeof PALETTES)[], id: string, tall = false): string {
  const h = tall ? 1100 : 800;
  const n = kinds.length;
  const cols = Math.min(n, 3);
  const rows = Math.ceil(n / cols);
  // Framed pieces span roughly 680×500 of their 800×800 box, centred at (400, 415).
  const s = Math.min(0.75, ((800 / cols) * 1.02) / 680, (h * 0.9) / rows / 500);
  const groups = kinds.map((k, i) => {
    const gid = `${id}-${i}`;
    const inner = drawArt(k, palettes[i % palettes.length], gid)
      .replace(/^<svg[^>]*>/, '')
      .replace(/<\/svg>$/, '')
      // Strip the individual backdrop so pieces share one scene.
      .replace(/<rect width="800" height="800" fill="url\(#bg-[^"]+\)"\/>/, '');
    const row = Math.floor(i / cols);
    const inRow = Math.min(cols, n - row * cols);
    const col = i % cols;
    const cx = (800 / inRow) * (col + 0.5);
    const cy = h / 2 + (row - (rows - 1) / 2) * 500 * s * 1.02;
    return `<g transform="translate(${cx - 400 * s} ${cy - 415 * s}) scale(${s})">${inner}</g>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 ${h}" width="800" height="${h}"><defs><linearGradient id="sc-${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f6eddc"/><stop offset="100%" stop-color="#e2d1ae"/></linearGradient></defs><rect width="800" height="${h}" fill="url(#sc-${id})"/>${groups.join('')}</svg>`;
}
