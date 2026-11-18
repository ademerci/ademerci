const W = 1200, H = 300, B = 30, S = 6;
let seed = 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pick = a => a[Math.floor(rnd() * a.length)];
const r = (x, y, w, h, c, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"${extra}/>`;

const now = new Date();
const parts = new Intl.DateTimeFormat('en-GB', {timeZone: 'Europe/Zurich', hour: 'numeric', hourCycle: 'h23', month: 'numeric'}).formatToParts(now);
const hr = parseInt(process.env.PHASE ? {day:8,dawn:6,sunset:18,night:21}[process.env.PHASE] : parts.find(p => p.type === 'hour').value);
const mon = parseInt(process.env.MONTH || parts.find(p => p.type === 'month').value);
const phase = hr >= 21 || hr < 6 ? 'night' : hr >= 18 ? 'sunset' : hr >= 8 ? 'day' : 'dawn';
const isWinter = [12, 1, 2].includes(mon);

const SKY = {
  day: ['#6fb6ff', '#7cbfff', '#8ac8ff', '#9ad0ff', '#acd9ff'],
  dawn: ['#4a5fa8', '#7a78b8', '#c48aa8', '#f0a890', '#ffd0a0'],
  sunset: ['#3b3a7a', '#7a4a8a', '#c45a6a', '#f08050', '#ffb060'],
  night: ['#0b1430', '#101c40', '#16264f', '#1d3060', '#23386e']
};
const sky = SKY[phase].map((c, i) => r(0, i * 60, W, 60, c)).join('');

const texture = (id, rowColors) => {
  let out = `<pattern id="${id}" width="${B}" height="${B}" patternUnits="userSpaceOnUse">`;
  for (let y = 0; y < 5; y++) for (let x = 0; x < 5; x++) out += r(x * S, y * S, S, S, pick(rowColors(x, y)));
  return out + '</pattern>';
};
const GRASS = ['#5d9b3a', '#6aab42', '#4f8a31'], DIRT = ['#8a5a36', '#7a4e2e', '#96643d', '#6d4427'];
const STONE = ['#8c8c8c', '#7d7d7d', '#999999', '#727272'], LEAF = ['#3f7d2a', '#4a8f32', '#36702a', '#2f6024'], BARK = ['#6b4a2b', '#5a3d22', '#7a5532'];
const defs = [texture('grass', (x, y) => (y === 0 || (y === 1 && rnd() < 0.6) ? GRASS : DIRT)), texture('dirt', () => DIRT), texture('stone', () => STONE), texture('leaf', () => LEAF), texture('bark', x => (x % 2 ? BARK.slice(0, 2) : BARK))].join('');

const heights = [2,2,2,3,3,3,2,2,2,2,3,3,3,3,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,4,4,4,4,5,5,4,4,4];
const SHADE = { night: ['#0a1030', 0.45], dawn: ['#402040', 0.15], sunset: ['#402040', 0.15] }[phase];
let ground = '', snow = '', shade = '';
const addShade = (x, y, w, h) => { if (SHADE) shade += r(x, y, w, h, SHADE[0], ` opacity="${SHADE[1]}"`); };
heights.forEach((h, c) => {
  for (let i = 0; i < h; i++) {
    const y = H - (i + 1) * B;
    ground += r(c * B, y, B, B, `url(#${i === h - 1 ? 'grass' : i === 0 ? 'stone' : 'dirt'})`);
    addShade(c * B, y, B, B);
    if (isWinter && i === h - 1) snow += r(c * B, y, B, 6, '#f4f8ff');
  }
});
let tree = '', treeBase = H - 4 * B;
for (let i = 1; i <= 2; i++) { tree += r(33 * B, treeBase - i * B, B, B, 'url(#bark)'); addShade(33 * B, treeBase - i * B, B, B); }
for (const [dx, dy] of [[-2,4],[-1,4],[0,4],[1,4],[2,4],[-2,5],[-1,5],[0,5],[1,5],[2,5],[-1,6],[0,6],[1,6],[0,7]]) {
  tree += r((33 + dx) * B, treeBase - (dy - 1) * B, B, B, 'url(#leaf)');
  addShade((33 + dx) * B, treeBase - (dy - 1) * B, B, B);
  if (isWinter && dy === 7) snow += r((33 + dx) * B, treeBase - (dy - 1) * B, B, 6, '#f4f8ff');
}

const FONT = {N:['10001','11001','10101','10011','10001','10001','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],A:['01110','10001','10001','11111','10001','10001','10001'],H:['10001','10001','10001','11111','10001','10001','10001'],D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],M:['10001','11011','10101','10101','10001','10001','10001'],R:['11110','10001','10001','11110','10100','10010','10001'],C:['01110','10001','10000','10000','10000','10001','01110'],I:['11111','00100','00100','00100','00100','00100','11111'],'>':['10000','01000','00100','00010','00100','01000','10000'],' ':['00000','00000','00000','00000','00000','00000','00000']};
const pixelText = (str, x0, y0, p, color, bold = false) => {
  let out = '', adv = bold ? 7 : 6;
  [...str].forEach((ch, i) => FONT[ch].forEach((row, y) => [...row].forEach((bit, x) => { if(bit==='1') out += r(x0 + (i * adv + x) * p, y0 + y * p, bold ? 2 * p : p, p, color); })));
  return out;
};
const title = pixelText('NOAH', 70, 54, 10, '#3a2a1a', true) + pixelText('NOAH', 60, 44, 10, '#ffffff', true);
const sub = pixelText('> ADEMERCI', 63, 158, 4, '#2b3a55') + pixelText('> ADEMERCI', 60, 155, 4, '#ffffff');

const P = 8, BODY = '#d97757', DARK = '#b85f42', sprite = (rows, c) => rows.flatMap((row, y) => [...row].map((ch, x) => ch === 'X' ? r(x * P, y * P, P, P, c) : ch === 'E' ? r(x * P, y * P, P, P, '#1a1a1a') : '')).join('');
const body = sprite(['..XXXXXXX..','..XXXXXXX..','..XEXXXEX..','XXXXXXXXXXX','..XXXXXXX..','..XXXXXXX..'], BODY);
const lids = r(3 * P, 2 * P, P, P, BODY) + r(7 * P, 2 * P, P, P, BODY);
const campfire = `<g transform="translate(770 ${H-3*B-60}) scale(2)"><rect x="0" y="24" width="30" height="6" fill="#7a4e2e"/><rect x="6" y="24" width="30" height="6" fill="#7a4e2e" transform="rotate(-15 21 27)"/><g class="flame"><rect x="6" y="18" width="18" height="6" fill="#d9401f"/><rect x="6" y="12" width="18" height="6" fill="#f28c28"/><rect x="6" y="6" width="12" height="6" fill="#ffd23f"/><rect x="6" y="0" width="6" height="6" fill="#fff4b0"/></g><g class="flame2"><rect x="6" y="18" width="12" height="6" fill="#f28c28"/><rect x="6" y="12" width="18" height="6" fill="#ffd23f"/><rect x="6" y="6" width="12" height="6" fill="#fff4b0"/></g>${Array.from({length:5},(_,i)=>`<rect x="${6+i*4}" y="0" width="3" height="3" fill="#ff7a3a" class="spark" style="animation-delay:${i*0.3}s"/>`).join('')}</g>`;


const skyObj = phase === 'night' ? `<g transform="translate(1100 30)"><rect width="60" height="60" fill="#f4eec2"/><rect x="10" y="10" width="12" height="12" fill="#d8d0a0"/><rect x="35" y="35" width="12" height="12" fill="#d8d0a0"/></g>${Array.from({length:25},()=>`<rect x="${rnd()*W}" y="${rnd()*200}" width="${3+Math.floor(rnd()*2)}" height="${3+Math.floor(rnd()*2)}" fill="#fff" class="star" style="animation-delay:${rnd()*2}s"/>`).join('')}` : (phase === 'day' ? `${r(1110, 30, 60, 60, '#ffe066')}${r(1120, 40, 40, 40, '#fff3b0')}` : (phase === 'dawn' ? `${r(840, 110, 60, 60, '#ffb347')}${r(850, 120, 40, 40, '#ffe0a0')}` : `${r(840, 135, 60, 60, '#ff7a3a')}${r(850, 145, 40, 40, '#ffc070')}`));
const cloud = (cls, y, w) => phase === 'night' ? '' : `<g class="${cls}">${r(0, y, w, 24, phase==='sunset'?'#ffd0c0':'#fff')}${r(24, y - 18, w - 60, 18, phase==='sunset'?'#ffd0c0':'#fff')}${r(0, y + 24, w, 6, '#e3eefb')}</g>`;

const css = `svg { shape-rendering: crispEdges; } .c1 { animation: drift 40s linear infinite; } .c2 { animation: drift 60s linear infinite; animation-delay: -25s; } @keyframes drift { from { transform: translateX(-260px); } to { transform: translateX(1260px); } } .star { animation: blink 2s infinite alternate; } @keyframes blink { to { opacity: 0.2; } } .walk { animation: walk 7s linear infinite alternate; } @keyframes walk { from { transform: translateX(570px); } to { transform: translateX(812px); } } .bob { animation: bob .4s steps(1) infinite; } @keyframes bob { 50% { transform: translateY(8px); } } .la { animation: legs .4s steps(1) infinite; } .lb { animation: legs .4s steps(1) infinite; animation-delay: -.2s; } @keyframes legs { 0% { opacity: 1; } 50% { opacity: 0; } } .lid { opacity: 0; animation: lid 4s steps(1) infinite; } @keyframes lid { 0%, 94% { opacity: 0; } 95%, 98% { opacity: 1; } } .flame { animation: f 0.3s steps(1) infinite; } .flame2 { animation: f 0.3s steps(1) infinite; animation-delay: 0.15s; } @keyframes f { 0% { opacity: 0; } 50% { opacity: 1; } } .spark { animation: s 1.5s linear infinite; opacity: 0; } @keyframes s { 0% { opacity: 1; transform: translateY(0); } to { opacity: 0; transform: translateY(-40px); } } .sn { animation: fall 6s linear infinite; } @keyframes fall { from { transform: translateY(-20px); } to { transform: translateY(320px); } }`;
const snowflakes = isWinter ? Array.from({length:40},()=>`<rect x="${rnd()*W}" y="${rnd()*H}" width="4" height="4" fill="#f4f8ff" class="sn" style="animation-duration:${6+rnd()*6}s; animation-delay:${-rnd()*12}s"/>`).join('') : '';

process.stdout.write(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="NOAH – ademerci (${{day:'Tag',dawn:'Morgen',sunset:'Abend',night:'Nacht'}[phase]})"><style>${css}</style><defs>${defs}</defs>${sky}${skyObj}${cloud('c1', 70, 150)}${cloud('c2', 120, 110)}${ground}${snow}${tree}${shade}${title}${sub}${phase === 'night' ? `<g transform="translate(660 ${H-3*B-8*P})">${body}<g class="lid">${lids}</g>${sprite(['......','......','......','......','......','......','..X.X.X.X..','..X.X.X.X..'], DARK)}</g>` + campfire : `<g class="walk"><g transform="translate(0 ${H-3*B-8*P})"><g class="bob">${body}<g class="lid">${lids}</g></g><g class="la">${sprite(['......', '......', '......', '......', '......', '......', '..X.X.X.X..', '..X...X....'], DARK)}</g><g class="lb">${sprite(['......', '......', '......', '......', '......', '......', '..X.X.X.X..', '....X...X..'], DARK)}</g></g></g>`}${snowflakes}</svg>`);