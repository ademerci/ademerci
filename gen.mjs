// Generates a blocky pixel-art GitHub banner: node gen.mjs > banner.svg
const W = 1200, H = 300, B = 30, S = 6; // canvas, block size, sub-pixel size
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rnd() * a.length)];
const r = (x, y, w, h, c, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"${extra}/>`;

// 30x30 block texture made of 5x5 sub-pixels
function texture(id, rowColors) {
  let out = `<pattern id="${id}" width="${B}" height="${B}" patternUnits="userSpaceOnUse">`;
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) out += r(x * S, y * S, S, S, pick(rowColors(x, y)));
  return out + '</pattern>';
}
const GRASS = ['#5d9b3a', '#6aab42', '#4f8a31'], DIRT = ['#8a5a36', '#7a4e2e', '#96643d', '#6d4427'];
const STONE = ['#8c8c8c', '#7d7d7d', '#999999', '#727272'], LEAF = ['#3f7d2a', '#4a8f32', '#36702a', '#2f6024'];
const BARK = ['#6b4a2b', '#5a3d22', '#7a5532'];
const defs = [
  texture('grass', (x, y) => (y === 0 || (y === 1 && rnd() < 0.6) ? GRASS : DIRT)),
  texture('dirt', () => DIRT),
  texture('stone', () => STONE),
  texture('leaf', () => LEAF),
  texture('bark', x => (x % 2 ? BARK.slice(0, 2) : BARK)),
].join('');

// sky in hard-edged bands
const sky = ['#6fb6ff', '#7cbfff', '#8ac8ff', '#9ad0ff', '#acd9ff'].map((c, i) => r(0, i * 60, W, 60, c)).join('');

// terrain: column heights in blocks; flat stretch 19..29 is where the mascot walks
const heights = [2,2,2,3,3,3,2,2,2,2,3,3,3,3,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,4,4,4,4,5,5,4,4,4];
let ground = '';
heights.forEach((h, c) => {
  for (let i = 0; i < h; i++) {
    const y = H - (i + 1) * B;
    ground += r(c * B, y, B, B, `url(#${i === h - 1 ? 'grass' : i === 0 ? 'stone' : 'dirt'})`);
  }
});
// tree on column 33 (ground top at height 4)
const treeBase = H - 4 * B;
let tree = '';
for (let i = 1; i <= 2; i++) tree += r(33 * B, treeBase - i * B, B, B, 'url(#bark)');
for (const [dx, dy] of [[-2,4],[-1,4],[0,4],[1,4],[2,4],[-2,5],[-1,5],[0,5],[1,5],[2,5],[-1,6],[0,6],[1,6],[0,7]])
  tree += r((33 + dx) * B, treeBase - (dy - 1) * B, B, B, 'url(#leaf)');

// 5x7 pixel font
const FONT = {
  N: ['10001','11001','10101','10011','10001','10001','10001'],
  O: ['01110','10001','10001','10001','10001','10001','01110'],
  A: ['01110','10001','10001','11111','10001','10001','10001'],
  H: ['10001','10001','10001','11111','10001','10001','10001'],
  D: ['11110','10001','10001','10001','10001','10001','11110'],
  E: ['11111','10000','10000','11110','10000','10000','11111'],
  M: ['10001','11011','10101','10101','10001','10001','10001'],
  R: ['11110','10001','10001','11110','10100','10010','10001'],
  C: ['01110','10001','10000','10000','10000','10001','01110'],
  I: ['11111','00100','00100','00100','00100','00100','11111'],
  '>': ['10000','01000','00100','00010','00100','01000','10000'],
  ' ': ['00000','00000','00000','00000','00000','00000','00000'],
};
// bold: each pixel is two wide, so glyphs need one extra column of advance
function pixelText(str, x0, y0, p, color, bold = false) {
  let out = '';
  const adv = bold ? 7 : 6;
  [...str].forEach((ch, i) => FONT[ch].forEach((row, y) => [...row].forEach((bit, x) => {
    if (bit === '1') out += r(x0 + (i * adv + x) * p, y0 + y * p, bold ? 2 * p : p, p, color);
  })));
  return out;
}
const title = pixelText('NOAH', 70, 54, 10, '#3a2a1a', true) + pixelText('NOAH', 60, 44, 10, '#ffffff', true);
const sub = pixelText('> ADEMERCI', 63, 158, 4, '#2b3a55') + pixelText('> ADEMERCI', 60, 155, 4, '#ffffff');
const cursorX = 60 + 10 * 6 * 4 + 4;

// clouds: flat blocky shapes drifting right
const cloud = (cls, y, w) =>
  `<g class="${cls}">${r(0, y, w, 24, '#ffffff')}${r(24, y - 18, w - 60, 18, '#ffffff')}${r(0, y + 24, w, 6, '#e3eefb')}</g>`;

// mascot: 11x8 sprite, sub-pixel size P
const P = 8, BODY = '#d97757', DARK = '#b85f42';
const sprite = (rows, color) => rows.flatMap((row, y) => [...row].map((ch, x) =>
  ch === 'X' ? r(x * P, y * P, P, P, color) : ch === 'E' ? r(x * P, y * P, P, P, '#1a1a1a') : '')).join('');
const body = sprite([
  '..XXXXXXX..',
  '..XXXXXXX..',
  '..XEXXXEX..',
  'XXXXXXXXXXX',
  '..XXXXXXX..',
  '..XXXXXXX..',
], BODY);
const legsA = sprite(['......', '......', '......', '......', '......', '......', '..X.X.X.X..', '..X...X....'], DARK);
const legsB = sprite(['......', '......', '......', '......', '......', '......', '..X.X.X.X..', '....X...X..'], DARK);
const lids = r(3 * P, 2 * P, P, P, BODY) + r(7 * P, 2 * P, P, P, BODY);
const walkY = H - 3 * B - 8 * P; // feet on the flat stretch

const css = `
  svg { shape-rendering: crispEdges; }
  .c1 { animation: drift 40s linear infinite; }
  .c2 { animation: drift 60s linear infinite; animation-delay: -25s; }
  @keyframes drift { from { transform: translateX(-260px); } to { transform: translateX(1260px); } }
  .cursor { animation: blink 1s steps(1) infinite; }
  @keyframes blink { 50% { opacity: 0; } }
  .walk { animation: walk 7s linear infinite alternate; }
  @keyframes walk { from { transform: translateX(570px); } to { transform: translateX(812px); } }
  .bob { animation: bob .4s steps(1) infinite; }
  @keyframes bob { 50% { transform: translateY(${P}px); } }
  .la { animation: legs .4s steps(1) infinite; }
  .lb { animation: legs .4s steps(1) infinite; animation-delay: -.2s; }
  @keyframes legs { 0% { opacity: 1; } 50% { opacity: 0; } }
  .lid { opacity: 0; animation: lid 4s steps(1) infinite; }
  @keyframes lid { 0%, 94% { opacity: 0; } 95%, 98% { opacity: 1; } }
`;

process.stdout.write(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="NOAH – ademerci">
<style>${css}</style>
<defs>${defs}</defs>
${sky}
${r(1110, 30, 60, 60, '#ffe066')}${r(1120, 40, 40, 40, '#fff3b0')}
${cloud('c1', 70, 150)}${cloud('c2', 120, 110)}
${ground}${tree}
${title}${sub}
${r(cursorX, 155, 16, 28, '#ffffff', ' class="cursor"')}
<g class="walk"><g transform="translate(0 ${walkY})"><g class="bob">${body}<g class="lid">${lids}</g></g>
<g class="la">${legsA}</g><g class="lb">${legsB}</g></g></g>
</svg>
`);
