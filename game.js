/* ¡Rescata la Hallaca! — juego 8-bit que corre 100% en el navegador.
 * Hecho con ❤️ por @maisfloro.tech
 */
(function () {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem('hallaca.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('hallaca.' + k, JSON.stringify(v)); } catch (e) { /* sin storage */ } },
  };

  // ---------- Utilidades ----------
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  let rnd = mulberry32(Date.now() & 0xffffffff);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // RLE: "4.8s4." → "....ssssssss...."
  function rle(spec) {
    let out = '';
    spec.replace(/(\d+)(.)/g, (_, n, c) => { out += c.repeat(Number(n)); return ''; });
    return out;
  }

  // ---------- Sprites humanos (16x16) ----------
  const BASE = {
    2: '5.6s5.', 3: '4.8s4.', 4: '4.8s4.', 5: '4.2s1e2s1e2s4.', 6: '4.8s4.', 7: '4.3s2m3s4.', 8: '5.6s5.',
    9: '4.8t4.', 10: '3.10t3.', 11: '3.1s8t1s3.', 12: '3.1s1.6t1.1s3.', 13: '5.6p5.',
  };
  const LEGS = [
    { 14: '5.2p2.2p5.', 15: '4.3b2.3b4.' },
    { 14: '4.2p4.2p4.', 15: '3.3b4.3b3.' },
  ];
  const SKIRT = [
    { 13: '4.8p4.', 14: '4.8p4.', 15: '5.2b2.2b5.' },
    { 13: '4.8p4.', 14: '4.8p4.', 15: '4.2b4.2b4.' },
  ];
  const HAIR = {
    short: { 1: '5.6h5.', 2: '4.8h4.', 3: '4.8h4.', 4: '4.1h6.1h4.' },
    long: { 1: '5.6h5.', 2: '4.8h4.', 3: '3.10h3.', 4: '3.2h6.2h3.', 5: '3.1h8.1h3.', 6: '3.1h8.1h3.', 7: '3.1h8.1h3.', 8: '3.1h8.1h3.', 9: '3.1h8.1h3.' },
    bun: { 0: '6.4h6.', 1: '5.6h5.', 2: '4.8h4.', 3: '4.8h4.', 4: '4.1h6.1h4.' },
    cap: { 1: '4.8c4.', 2: '4.8c4.', 3: '4.10c2.', 4: '4.1h6.1h4.' },
    curly: { 0: '4.8h4.', 1: '3.10h3.', 2: '2.12h2.', 3: '2.12h2.', 4: '2.2h8.2h2.', 5: '2.2h8.2h2.', 6: '3.1h8.1h3.' },
    bald: { 2: '4.1h6.1h4.', 3: '4.1h6.1h4.' },
  };
  const EXTRA = {
    mustache: { 7: '5.6h5.' },
    glasses: { 5: '5.2g2.2g5.' },
  };

  function buildHuman(o) {
    const frames = [0, 1].map((f) => {
      const rows = new Array(16).fill('................');
      for (const [r, s] of Object.entries(BASE)) rows[r] = rle(s);
      const legs = o.skirt ? SKIRT[f] : LEGS[f];
      for (const [r, s] of Object.entries(legs)) rows[r] = rle(s);
      const overlays = [HAIR[o.hair] || {}].concat((o.extras || []).map((e) => EXTRA[e]));
      for (const ov of overlays) {
        for (const [r, s] of Object.entries(ov)) {
          const line = rle(s); let row = rows[r].split('');
          for (let i = 0; i < 16; i++) if (line[i] !== '.') row[i] = line[i];
          rows[r] = row.join('');
        }
      }
      return rows;
    });
    const pal = Object.assign({ e: '#1a1020', m: '#7a2b2b', b: '#2a1a12', g: '#111111', o: '#000000' }, o.pal);
    return frames.map((rows) => drawRows(rows, pal, 16, 16, true));
  }

  function drawRows(rows, pal, w, h, outline) {
    const c = document.createElement('canvas');
    const pad = outline ? 1 : 0;
    c.width = w + pad * 2; c.height = h + pad * 2;
    const g = c.getContext('2d');
    const solid = (x, y) => y >= 0 && y < h && x >= 0 && x < w && rows[y][x] !== '.';
    if (outline) {
      g.fillStyle = '#120a1e';
      for (let y = -1; y <= h; y++) for (let x = -1; x <= w; x++) {
        if (solid(x, y)) continue;
        if (solid(x - 1, y) || solid(x + 1, y) || solid(x, y - 1) || solid(x, y + 1)) g.fillRect(x + pad, y + pad, 1, 1);
      }
    }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x];
      if (ch === '.') continue;
      g.fillStyle = pal[ch] || '#ff00ff';
      g.fillRect(x + pad, y + pad, 1, 1);
    }
    return c;
  }

  const SKIN = ['#f1c7a0', '#e0a878', '#c88a5a', '#a86b42', '#8d5a3b', '#6b4329'];
  const HEROES = [
    { id: 'valentina', label: 'La Chama', hair: 'long', pal: { s: '#e0a878', h: '#3b2416', t: '#e8283a', p: '#2f6bff' } },
    { id: 'andres', label: 'El Chamo', hair: 'short', pal: { s: '#8d5a3b', h: '#161212', t: '#2f6bff', p: '#2a2a4a' } },
    { id: 'carmen', label: 'Abuela Power', hair: 'bun', skirt: true, extras: ['glasses'], pal: { s: '#f1c7a0', h: '#dcdce8', t: '#8e44ad', p: '#5b2c6f', g: '#2a2a2a' } },
    { id: 'pana', label: 'El Pana', hair: 'cap', pal: { s: '#c88a5a', h: '#2b1a10', c: '#ffcc00', t: '#2f9e44', p: '#3a2a1a' } },
  ];
  HEROES.forEach((h) => { h.frames = buildHuman(h); });

  const TIA_POOL = ['Tía Chela', 'Tía Yoli', 'Tía Mireya', 'Tía Nena', 'Tía Coromoto', 'Tía Maritza', 'Tía Gladys', 'Tía Belkis', 'Tía Yajaira', 'Tía Carmencita', 'Tía Zuleima', 'Tía Mayela'];
  const TIO_POOL = ['Tío Pancho', 'Tío Cheo', 'Tío Nené', 'Tío Chucho', 'Tío Wilmer', 'Tío Ramón', 'Tío Freddy', 'Tío Pepe', 'Tío Toño', 'Tío Yorman', 'Tío Gustavo', 'Tío Luisito'];
  const SHIRTS = ['#e8283a', '#2f6bff', '#ffcc00', '#2f9e44', '#ff7ab6', '#ff8c1a', '#17b3b3', '#a05cff', '#ffffff'];
  const HAIRC = ['#161212', '#3b2416', '#6b3f1d', '#dcdce8', '#9b9b9b', '#b8442a', '#e0b44a'];

  function makeRelative(name) {
    const isTia = /^t[ií]a\b/i.test(name.trim());
    const isTio = /^t[ií]o\b/i.test(name.trim());
    const female = isTia || (!isTio && rnd() < 0.5);
    const hair = female ? pick(['curly', 'long', 'bun', 'short']) : pick(['short', 'bald', 'cap', 'short']);
    const extras = [];
    if (!female && rnd() < 0.7) extras.push('mustache');
    if (rnd() < 0.35) extras.push('glasses');
    const pal = { s: pick(SKIN), h: pick(HAIRC), t: pick(SHIRTS), p: pick(['#2a2a4a', '#3a2a1a', '#2f6bff', '#5b2c6f', '#1f4d2b']), c: pick(['#e8283a', '#ffcc00', '#2f6bff']), g: '#1a1a1a' };
    return { name, frames: buildHuman({ hair, extras, skirt: female && rnd() < 0.7, pal }) };
  }

  // ---------- Ingredientes (8x8) ----------
  const ICONS = {
    hoja: { pal: { g: '#2f9e44', l: '#9be37a' }, rows: ['2.5g1.', '1.6g1.', '6g1l1.', '5g1l2g', '4g1l3g', '1.3g1l3g', '1.1g1l4g1.', '1l7.'] },
    harina: { pal: { w: '#f4efe1', y: '#ffcc00', r: '#e8283a' }, rows: ['2.4w2.', '1.6y1.', '1.6y1.', '1.1y4r1y1.', '1.1y4w1y1.', '1.6y1.', '1.6y1.', '1.6y1.'] },
    onoto: { pal: { o: '#ff6a1a', r: '#c4161c', k: '#7a4a24' }, rows: ['8.', '2.1r1o1r1o2.', '1.1o1r1o1r1o1r1.', '8k', '1.6k1.', '2.4k2.', '8.', '8.'] },
    res: { pal: { r: '#c4161c', w: '#f4e4d4' }, rows: ['8.', '1.5r2.', '6r1w1.', '1w6r1w', '1w6r1.', '1.5r1w1.', '2.4w2.', '8.'] },
    cochino: { pal: { p: '#ff9ec4', d: '#e0679a', e: '#3a1020' }, rows: ['1.1p4.1p1.', '1.6p1.', '8p', '1p1e3p1e2p', '2p4d2p', '2p1d2e1d2p', '1.6p1.', '2.4p2.'] },
    gallina: { pal: { y: '#d9963b', w: '#f4efe1' }, rows: ['1.4y3.', '6y2.', '6y2.', '1.5y2.', '2.3y3.', '4.1w3.', '4.2w2.', '3.2w1.1w1.'] },
    alinos: { pal: { w: '#f4efe1', g: '#55c26b', v: '#b06ad9' }, rows: ['3.2g3.', '3.2g3.', '2.4w2.', '1.6w1.', '1.6w1.', '1.6w1.', '2.4w2.', '3.2v3.'] },
    pimenton: { pal: { r: '#e8283a', g: '#2f9e44' }, rows: ['3.1g4.', '2.3g3.', '1.6r1.', '8r', '8r', '1.6r1.', '2.4r2.', '3.2r3.'] },
    aceitunas: { pal: { g: '#7aa83a', r: '#e8283a' }, rows: ['8.', '1.3g1.3g', '1g1r1g1.1g1r1g1.', '1.3g1.3g', '8.', '2.3g3.', '2.1g1r1g3.', '2.3g3.'] },
    pasas: { pal: { v: '#6b2a7a' }, rows: ['8.', '2.2v4.', '1.2v1.2v2.', '1.6v1.', '2.2v1.2v1.', '1.2v1.2v2.', '3.2v3.', '8.'] },
    alcaparras: { pal: { k: '#7a4a24', j: '#bfe6ff', g: '#3f7a2a' }, rows: ['2.4k2.', '1.6j1.', '1.1j1g2j1g1j1.', '1.2j1g1j1g1j1.', '1.1j1g2j1g1j1.', '1.2j1g1j1g1j1.', '1.6j1.', '2.4j2.'] },
    pabilo: { pal: { w: '#f4efe1' }, rows: ['8.', '2.4w2.', '1.1w4.1w1.', '1.1w1.2w1.1w1.', '1.1w1.2w1.1w1.', '1.1w4.1w1.', '2.4w2.', '6.2w'] },
  };
  for (const k in ICONS) ICONS[k].img = drawRows(ICONS[k].rows.map(rle), ICONS[k].pal, 8, 8, true);

  const ING = {
    hoja: { name: 'Hojas de plátano', tip: 'Se limpian con paño húmedo y se pasan por la llama para que doblen sin romperse.' },
    alinos: { name: 'Aliños', tip: 'Cebolla, ajoporro, cebollín y ajo: la base del guiso.' },
    pimenton: { name: 'Pimentón y ají dulce', tip: 'El ají dulce es el perfume secreto. Picante NO, dulce SÍ.' },
    onoto: { name: 'Onoto', tip: 'Se fríe en aceite para sacar el color. Ese aceite rojo pinta masa y hoja.' },
    res: { name: 'Carne de res', tip: 'En cuadritos pequeños, nada de molida.' },
    cochino: { name: 'Cochino', tip: 'Le da jugosidad al guiso. Sin cochino, la tía se entera.' },
    gallina: { name: 'Gallina', tip: 'Su caldo se usa para la masa. Nada se desperdicia.' },
    harina: { name: 'Harina de maíz', tip: 'Se amasa con caldo y aceite onotado, no con agua sola.' },
    aceitunas: { name: 'Aceitunas', tip: 'Adorno clásico. Unas casas las ponen rellenas de pimentón.' },
    pasas: { name: 'Pasas', tip: 'El debate eterno. En este juego, sí van.' },
    alcaparras: { name: 'Alcaparras', tip: 'Pocas, que son intensas.' },
    pabilo: { name: 'Pabilo', tip: 'Hilo grueso de algodón para amarrar: 3 vueltas a lo largo y 3 a lo ancho.' },
  };

  // ---------- Niveles ----------
  const LEVELS = [
    { title: 'EL MERCADO', sub: 'Nivel 1', items: ['hoja', 'alinos', 'pimenton', 'onoto'], time: 60, tios: 2, theme: 'mercado' },
    { title: 'LA CARNICERÍA', sub: 'Nivel 2', items: ['res', 'cochino', 'gallina'], time: 55, tios: 3, theme: 'carniceria' },
    { title: 'EL ABASTO', sub: 'Nivel 3', items: ['harina', 'aceitunas', 'pasas', 'alcaparras', 'pabilo'], time: 75, tios: 4, theme: 'abasto' },
  ];

  const CHISMES = [
    '¿Y el novio o la novia pa\' cuándo?',
    '¿Tú no ibas a estudiar medicina?',
    '¡Cómo has crecido! La última vez eras así de chiquit@.',
    'Ayúdame a bajar la caja del pesebre, rapidito.',
    '¿Ya probaste mi ensalada de gallina? Ven, ven, una cucharadita.',
    'En mis tiempos la hallaca se amarraba con pabilo y amor.',
    '¿Y ese trabajo de la computadora qué es lo que es?',
    'Échale más onoto, que esa masa está pálida.',
    'Cuéntame el chisme de tu prima, que nadie me dice nada.',
    '¿Me pasas la clave del wifi? El de aquí no agarra.',
    'Las de tu abuela eran mejores. No te ofendas.',
    'Tranquil@, la cena es a las 12... ¿o era a las 10?',
    '¡Pon la gaita! ¡PON LA GAITA!',
    'Yo traigo el ponche crema... el año que viene.',
    '¿Tú sabes arreglar impresoras? La mía hace un ruidito.',
    'Te voy a contar algo, pero no le digas a nadie...',
    'Mira este video que me pasaron por WhatsApp, son 9 minutos.',
    '¿Las pasas van o no van? Defiéndete.',
  ];
  const REGALOS = [
    '¡Toma un pastelito pa\' que agarres fuerza! +6s',
    'Te guardé un pedacito de pan de jamón. ¡Corre! +6s',
    'Yo te cubro con la tía. ¡Vete, vete! +6s',
    'Toma un vasito de ponche crema y sigue. +6s',
  ];

  // ---------- Pasos de la cocina ----------
  const STEPS = [
    { q: 'PASO 1 · ¿Cómo preparas la hoja?', good: 'Limpiarla y untarla con aceite onotado', bad: ['Plastificarla con papel film', 'Pintarla con marcador amarillo'], tip: 'El onoto da color y evita que la masa se pegue.' },
    { q: 'PASO 2 · ¿Y la masa?', good: 'Una bolita aplastada bien finita', bad: ['Un bloque de 3 cm, pa\' que llene', 'Masa de pizza, total es masa'], tip: 'Finita, casi transparente. Esa es la meta.' },
    { q: 'PASO 3 · ¿Qué va en el centro?', good: 'El guiso de res, cochino y gallina', bad: ['Atún de lata', 'El arroz chino de anoche'], tip: 'El guiso va frío, hecho desde el día antes.' },
    { q: 'PASO 4 · Hora de adornar', good: 'Aceitunas, pasas, alcaparras, pimentón y cebolla', bad: ['Queso amarillo y ketchup', 'Gomitas de ositos'], tip: 'Cada familia defiende sus adornos como a su equipo de fútbol.' },
    { q: 'PASO 5 · ¿Cómo la cierras?', good: 'Doblar la hoja como un sobre', bad: ['Engraparla', 'Con cinta adhesiva'], tip: 'La masa de los bordes tiene que sellar el guiso.' },
    { q: 'PASO 6 · ¿Y después?', good: 'Envolverla con la faja (otra hoja)', bad: ['Meterla en la bolsa del abasto', 'En papel de regalo'], tip: 'La faja la protege mientras hierve.' },
    { q: 'PASO 7 · ¿Con qué la amarras?', good: 'Con pabilo: tres y tres vueltas', bad: ['Con el cable del cargador', 'Con ligas del cabello'], tip: 'Bien amarrada para que no le entre agua.' },
    { q: 'PASO 8 · ¿Cómo se cocina?', good: 'Hervirla en agua con sal, ~1 hora', bad: ['Microondas, 3 minutos', 'Freírla en la sartén'], tip: '¡A escurrir, reposar y a la mesa!' },
  ];
  const REGANOS = ['¡¿CÓMO QUE ESO?! ¡Respeta la tradición!', 'Ay no, mi amor. Así no.', 'Tu abuela se está revolcando en la cocina.', '¡Te vi! Otra vez, bien hecho.', 'Eso no lo hacen ni en el extranjero.'];

  // ---------- Canvas ----------
  const W = 256, H = 192, S = 3, T = 8, MW = 32, MH = 22, TOP = 16;
  const canvas = $('#game');
  const ctx = canvas.getContext('2d');
  function resetCtx() { ctx.setTransform(S, 0, 0, S, 0, 0); ctx.imageSmoothingEnabled = false; }
  resetCtx();
  let FS_BUMP = 0; // +1/+2 px lógicos cuando el canvas se ve pequeño (teléfonos)
  const FONT = (px) => (px + FS_BUMP) + 'px "Press Start 2P", monospace';
  const LH = (px) => px + FS_BUMP + 3;

  function text(str, x, y, opts) {
    opts = opts || {};
    ctx.font = FONT(opts.size || 8);
    ctx.textAlign = opts.align || 'left';
    ctx.textBaseline = 'top';
    if (opts.shadow !== false) { ctx.fillStyle = opts.shadowColor || '#120a1e'; ctx.fillText(str, x + 1, y + 1); }
    ctx.fillStyle = opts.color || '#f4efe1';
    ctx.fillText(str, x, y);
  }
  function wrap(str, maxW, size) {
    ctx.font = FONT(size);
    const words = str.split(' '); const lines = []; let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  }
  function box(x, y, w, h, fill, border) {
    ctx.fillStyle = border || '#120a1e'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = fill || '#151c52'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
    ctx.fillStyle = '#ffffff22'; ctx.fillRect(x + 2, y + 2, w - 4, 1);
  }

  // ---------- Mapa ----------
  const THEMES = {
    mercado: { floorA: '#c9a66b', floorB: '#bf9a5d', wall: '#2a1d3a' },
    carniceria: { floorA: '#dfe8ef', floorB: '#c8d6e2', wall: '#2a2f45' },
    abasto: { floorA: '#8a5a34', floorB: '#7d5130', wall: '#2a1d1a' },
  };

  function genMap() {
    for (let tries = 0; tries < 200; tries++) {
      const m = [];
      for (let y = 0; y < MH; y++) { m.push(new Array(MW).fill(0)); }
      for (let x = 0; x < MW; x++) { m[0][x] = 1; m[MH - 1][x] = 1; }
      for (let y = 0; y < MH; y++) { m[y][0] = 1; m[y][MW - 1] = 1; }
      const rowsY = [3, 8, 13];
      for (const ry of rowsY) {
        let x = 3 + Math.floor(rnd() * 2);
        while (x < MW - 3) {
          const len = 3 + Math.floor(rnd() * 4);
          for (let i = 0; i < len && x + i < MW - 2; i++) { m[ry][x + i] = 1; m[ry + 1][x + i] = 1; }
          x += len + 2 + Math.floor(rnd() * 2);
        }
      }
      // cajas sueltas
      for (let i = 0; i < 6; i++) {
        const x = 2 + Math.floor(rnd() * (MW - 4)), y = 2 + Math.floor(rnd() * (MH - 4));
        if (y >= 17 && x < 6) continue;
        if (m[y][x] === 0 && m[y - 1][x] === 0 && m[y + 1][x] === 0) m[y][x] = 2;
      }
      m[18][2] = 0; m[19][2] = 0; m[18][3] = 0; m[19][3] = 0;
      // conectividad
      const seen = m.map((r) => r.map(() => false));
      const q = [[2, 19]]; seen[19][2] = true; let count = 0;
      while (q.length) {
        const [x, y] = q.pop(); count++;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (m[ny] && m[ny][nx] === 0 && !seen[ny][nx]) { seen[ny][nx] = true; q.push([nx, ny]); }
        }
      }
      let floor = 0; for (const r of m) for (const c of r) if (c === 0) floor++;
      // conectividad 2x2 aproximada: el jugador ocupa ~1.3 tiles, exigimos pasillos de ≥2
      if (count === floor) return { m, seen };
    }
    return null;
  }

  function renderMap(m, theme) {
    const th = THEMES[theme];
    const c = document.createElement('canvas'); c.width = W; c.height = H - TOP;
    const g = c.getContext('2d');
    const r2 = mulberry32(42);
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const px = x * T, py = y * T, v = m[y][x];
      // piso
      g.fillStyle = (x + y) % 2 ? th.floorA : th.floorB; g.fillRect(px, py, T, T);
      if (theme === 'abasto') { g.fillStyle = '#00000022'; g.fillRect(px, py + 7, T, 1); if ((x + y * 3) % 4 === 0) g.fillRect(px + 7, py, 1, 8); }
      if (theme === 'carniceria') { g.fillStyle = '#ffffff55'; g.fillRect(px, py, T, 1); g.fillRect(px, py, 1, T); }
      if (theme === 'mercado' && r2() < 0.08) { g.fillStyle = '#00000018'; g.fillRect(px + 2, py + 3, 2, 1); }
      if (v === 0) continue;
      const border = y === 0 || y === MH - 1 || x === 0 || x === MW - 1;
      if (border) {
        g.fillStyle = th.wall; g.fillRect(px, py, T, T);
        g.fillStyle = '#ffffff10'; g.fillRect(px, py, T, 1);
        if (y === 0) { g.fillStyle = ['#e8283a', '#ffcc00', '#2f9e44', '#2f6bff'][x % 4]; g.fillRect(px + 3, py + 5, 2, 2); g.fillStyle = '#1f4d2b'; g.fillRect(px, py + 4, T, 1); }
        continue;
      }
      if (v === 2) { // caja / saco
        g.fillStyle = '#00000033'; g.fillRect(px + 1, py + 6, 7, 2);
        g.fillStyle = theme === 'carniceria' ? '#9aa7b4' : '#a0703c'; g.fillRect(px + 1, py + 1, 6, 6);
        g.fillStyle = '#00000044'; g.fillRect(px + 1, py + 4, 6, 1); g.fillRect(px + 4, py + 1, 1, 6);
        g.fillStyle = '#120a1e'; g.strokeStyle = '#120a1e'; g.strokeRect(px + 1.5, py + 1.5, 5, 5);
        continue;
      }
      const topEdge = m[y - 1][x] !== 1;
      if (theme === 'mercado') {
        if (topEdge) {
          for (let i = 0; i < T; i++) { g.fillStyle = (Math.floor((x * T + i) / 4) % 2) ? '#f4efe1' : (x % 6 < 3 ? '#e8283a' : '#2f6bff'); g.fillRect(px + i, py, 1, 5); }
          g.fillStyle = '#120a1e'; g.fillRect(px, py + 5, T, 1);
          g.fillStyle = '#7a4a24'; g.fillRect(px, py + 6, T, 2);
        } else {
          g.fillStyle = '#7a4a24'; g.fillRect(px, py, T, T); g.fillStyle = '#5a3418'; g.fillRect(px, py + 6, T, 2);
          const fr = ['#ffcc00', '#e8283a', '#2f9e44', '#ff8c1a', '#a05cff'];
          for (let i = 0; i < 3; i++) { g.fillStyle = fr[Math.floor(r2() * fr.length)]; g.fillRect(px + 1 + i * 2 + Math.floor(r2() * 1), py + 1 + Math.floor(r2() * 3), 2, 2); }
        }
      } else if (theme === 'carniceria') {
        if (topEdge) { g.fillStyle = '#bfe6ff'; g.fillRect(px, py, T, 5); g.fillStyle = '#ffffff99'; g.fillRect(px + 1, py + 1, 2, 3); g.fillStyle = '#c4161c'; g.fillRect(px + 4, py + 3, 3, 2); g.fillStyle = '#7d8a96'; g.fillRect(px, py + 5, T, 3); }
        else { g.fillStyle = '#9aa7b4'; g.fillRect(px, py, T, T); g.fillStyle = '#6b7884'; g.fillRect(px, py + 6, T, 2); g.fillStyle = '#ffffff44'; g.fillRect(px + 1, py + 2, 6, 1); }
      } else {
        g.fillStyle = '#5b3a22'; g.fillRect(px, py, T, T);
        g.fillStyle = '#3a2414'; g.fillRect(px, py + 3, T, 1); g.fillRect(px, py + 7, T, 1);
        const pr = ['#ffcc00', '#e8283a', '#2f6bff', '#f4efe1', '#2f9e44', '#ff7ab6'];
        for (let i = 0; i < 3; i++) { g.fillStyle = pr[Math.floor(r2() * pr.length)]; g.fillRect(px + i * 3, py + (topEdge ? 0 : 0), 2, 3); g.fillStyle = pr[Math.floor(r2() * pr.length)]; g.fillRect(px + i * 3, py + 4, 2, 3); }
      }
    }
    return c;
  }

  // ---------- Estado ----------
  const keys = {};
  const game = {
    state: 'idle', levelIdx: 0, score: 0, chismes: 0, totalTime: 0,
    hero: null, heroName: '', relatives: [], tios: [],
    map: null, bg: null, items: [], player: null, timeLeft: 0,
    msg: null, toast: null, flash: 0, paused: false, kitchenStep: 0, kitchenTries: 0, t: 0,
  };

  function solidAt(px, py) {
    const tx = Math.floor(px / T), ty = Math.floor((py - TOP) / T);
    if (ty < 0 || ty >= MH || tx < 0 || tx >= MW) return true;
    return game.map[ty][tx] !== 0;
  }
  function boxHits(x, y) { // hitbox de los pies
    const l = x + 4, r = x + 12, t = y + 11, b = y + 15;
    return solidAt(l, t) || solidAt(r, t) || solidAt(l, b) || solidAt(r, b);
  }

  function floorTiles() {
    const out = [];
    for (let y = 1; y < MH - 1; y++) for (let x = 1; x < MW - 1; x++) if (game.map[y][x] === 0) out.push([x, y]);
    return out;
  }

  function startLevel(i) {
    const L = LEVELS[i];
    game.levelIdx = i;
    let res = null; while (!res) res = genMap();
    game.map = res.m; game.bg = renderMap(game.map, L.theme);
    game.items = [];
    game.player = { x: 2 * T, y: TOP + 18 * T, dir: 1, anim: 0, stun: 0 };
    const floor = floorTiles();
    const chosen = [];
    for (const id of L.items) {
      let spot = null;
      for (let k = 0; k < 400 && !spot; k++) {
        const [x, y] = pick(floor);
        if (Math.hypot(x - 2, y - 19) < 9) continue;
        if (chosen.some((c) => Math.hypot(c[0] - x, c[1] - y) < 6)) continue;
        spot = [x, y];
      }
      spot = spot || pick(floor); chosen.push(spot);
      game.items.push({ id, x: spot[0] * T, y: TOP + spot[1] * T, got: false });
    }
    game.tios = [];
    for (let k = 0; k < L.tios; k++) {
      const rel = game.relatives[(i * 2 + k) % game.relatives.length];
      let spot; do { spot = pick(floor); } while (Math.hypot(spot[0] - 2, spot[1] - 19) < 8);
      game.tios.push({ rel, x: spot[0] * T - 4, y: TOP + spot[1] * T - 8, dx: 0, dy: 0, turn: 0, anim: 0, cool: 2 });
    }
    game.timeLeft = L.time;
    game.msg = null; game.toast = null;
    game.state = 'intro'; game.introT = 0;
    Music.setMode('game');
    if (typeof setPad === 'function') { setPad(true); fit(); }
  }

  function setDialog(name, line, dur, gift) {
    game.msg = { name, line, t: dur, gift };
  }

  // ---------- Update ----------
  function update(dt) {
    game.t += dt;
    if (game.paused) return;
    if (game.toast) { game.toast.t -= dt; if (game.toast.t <= 0) game.toast = null; }
    if (game.flash > 0) game.flash -= dt;

    if (game.state === 'intro') { game.introT += dt; if (game.introT > 3.2) game.state = 'play'; return; }
    if (game.state === 'levelDone') { game.doneT += dt; if (game.doneT > 2.8) nextLevel(); return; }
    if (game.state !== 'play') return;

    game.timeLeft -= dt; game.totalTime += dt;
    if (game.timeLeft <= 0) { game.timeLeft = 0; game.state = 'gameover'; Music.sfx('lose'); return; }

    const p = game.player;
    if (game.msg) { game.msg.t -= dt; if (game.msg.t <= 0) game.msg = null; }
    if (p.stun > 0) p.stun -= dt;

    let dx = 0, dy = 0;
    if (p.stun <= 0) {
      if (keys.left) dx -= 1; if (keys.right) dx += 1; if (keys.up) dy -= 1; if (keys.down) dy += 1;
    }
    if (dx && dy) { dx *= 0.7071; dy *= 0.7071; }
    const sp = 70 * dt;
    if (dx) { const nx = p.x + dx * sp; if (!boxHits(nx, p.y)) p.x = nx; p.dir = dx < 0 ? -1 : 1; }
    if (dy) { const ny = p.y + dy * sp; if (!boxHits(p.x, ny)) p.y = ny; }
    p.anim = dx || dy ? p.anim + dt : 0;

    // ingredientes
    for (const it of game.items) {
      if (it.got) continue;
      if (Math.abs(p.x + 8 - (it.x + 4)) < 9 && Math.abs(p.y + 12 - (it.y + 4)) < 9) {
        it.got = true; game.score += 100; Music.sfx('pick');
        game.toast = { title: ING[it.id].name.toUpperCase(), line: ING[it.id].tip, t: 3.4 };
      }
    }
    if (game.items.every((it) => it.got)) {
      const bonus = Math.ceil(game.timeLeft) * 10;
      game.score += bonus; game.lastBonus = bonus;
      game.state = 'levelDone'; game.doneT = 0; Music.sfx('level'); return;
    }

    // tíos
    for (const tio of game.tios) {
      tio.turn -= dt; if (tio.cool > 0) tio.cool -= dt;
      if (tio.turn <= 0) {
        tio.turn = 0.8 + rnd() * 2.2;
        const d = pick([[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0], [1, 0], [-1, 0]]).slice();
        // a veces se acercan al jugador (chismosos al fin)
        if (rnd() < 0.35) { const ax = p.x - tio.x, ay = p.y - tio.y; if (Math.abs(ax) > Math.abs(ay)) { d[0] = Math.sign(ax); d[1] = 0; } else { d[0] = 0; d[1] = Math.sign(ay); } }
        tio.dx = d[0]; tio.dy = d[1];
      }
      const s = 28 * dt;
      const nx = tio.x + tio.dx * s, ny = tio.y + tio.dy * s;
      if (tio.dx && !boxHits(nx, tio.y)) tio.x = nx; else if (tio.dx) tio.turn = 0;
      if (tio.dy && !boxHits(tio.x, ny)) tio.y = ny; else if (tio.dy) tio.turn = 0;
      tio.anim = tio.dx || tio.dy ? tio.anim + dt : 0;

      if (tio.cool <= 0 && p.stun <= 0 && Math.abs(p.x - tio.x) < 10 && Math.abs(p.y - tio.y) < 10) {
        tio.cool = 5;
        if (rnd() < 0.22) {
          game.timeLeft += 6; Music.sfx('gift');
          setDialog(tio.rel.name, pick(REGALOS), 2.2, true);
        } else {
          p.stun = 2.4; game.chismes++; Music.sfx('bump'); game.flash = 0.15;
          setDialog(tio.rel.name, pick(CHISMES), 2.4, false);
        }
      }
    }
  }

  function nextLevel() {
    game.items = [];
    if (game.levelIdx + 1 < LEVELS.length) startLevel(game.levelIdx + 1);
    else startKitchen();
  }

  // ---------- Render ----------
  function drawSprite(img, x, y, flip) {
    x = Math.round(x) - 1; y = Math.round(y) - 1;
    if (flip) { ctx.save(); ctx.translate(x + img.width, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0); ctx.restore(); }
    else ctx.drawImage(img, x, y);
  }
  function shadow(x, y) { ctx.fillStyle = '#00000040'; ctx.fillRect(Math.round(x) + 3, Math.round(y) + 14, 10, 3); }

  function render() {
    resetCtx();
    ctx.fillStyle = '#050816'; ctx.fillRect(0, 0, W, H);
    if (game.state === 'kitchen' || game.state === 'kitchenDone') { renderKitchen(); return; }
    if (!game.map) return;

    ctx.drawImage(game.bg, 0, TOP);
    const L = LEVELS[game.levelIdx];

    // objetos ordenados por profundidad
    const ents = [];
    for (const it of game.items) if (!it.got) ents.push({ y: it.y, draw: () => {
      const bob = Math.round(Math.sin(game.t * 4 + it.x) * 1.5);
      ctx.fillStyle = '#00000040'; ctx.fillRect(it.x + 1, it.y + 8, 7, 2);
      ctx.drawImage(ICONS[it.id].img, it.x - 1, it.y - 2 + bob);
      if (Math.floor(game.t * 3 + it.x) % 4 === 0) { ctx.fillStyle = '#fff'; ctx.fillRect(it.x + 7, it.y - 3 + bob, 1, 1); }
    } });
    for (const tio of game.tios) ents.push({ y: tio.y + 6, draw: () => {
      shadow(tio.x, tio.y);
      drawSprite(tio.rel.frames[Math.floor(tio.anim * 6) % 2], tio.x, tio.y, tio.dx < 0);
      ctx.font = FONT(5); const w = ctx.measureText(tio.rel.name).width; const lh = LH(5) - 1;
      const lx = Math.round(Math.max(w / 2 + 3, Math.min(W - w / 2 - 3, tio.x + 8)));
      ctx.fillStyle = '#120a1ecc'; ctx.fillRect(Math.round(lx - w / 2) - 2, Math.round(tio.y) - lh - 1, w + 4, lh);
      text(tio.rel.name, lx, Math.round(tio.y) - lh, { size: 5, align: 'center', color: '#ffcc00', shadow: false });
    } });
    const p = game.player;
    ents.push({ y: p.y + 6, draw: () => {
      shadow(p.x, p.y);
      const blink = p.stun > 0 && Math.floor(game.t * 12) % 2 === 0;
      if (!blink) drawSprite(game.hero.frames[Math.floor(p.anim * 8) % 2], p.x, p.y, p.dir < 0);
      if (p.stun > 0) { // estrellitas de mareo
        for (let i = 0; i < 3; i++) { const a = game.t * 5 + i * 2.1; ctx.fillStyle = '#ffcc00'; ctx.fillRect(Math.round(p.x + 8 + Math.cos(a) * 7), Math.round(p.y - 2 + Math.sin(a) * 2), 2, 2); }
      }
    } });
    ents.sort((a, b) => a.y - b.y).forEach((e) => e.draw());

    if (game.flash > 0) { ctx.fillStyle = '#ffffff55'; ctx.fillRect(0, TOP, W, H - TOP); }
    if (drag && drag.moved) {
      const r = canvas.getBoundingClientRect(), k = W / r.width;
      const ox = (drag.x - r.left) * k, oy = (drag.y - r.top) * k;
      let jx = (drag.cx - drag.x) * k, jy = (drag.cy - drag.y) * k; const d = Math.hypot(jx, jy) || 1;
      if (d > 12) { jx = jx / d * 12; jy = jy / d * 12; }
      ctx.fillStyle = '#ffffff22'; ctx.beginPath(); ctx.arc(ox, oy, 14, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffcc00aa'; ctx.beginPath(); ctx.arc(ox + jx, oy + jy, 6, 0, Math.PI * 2); ctx.fill();
    }

    // HUD
    ctx.fillStyle = '#120a1e'; ctx.fillRect(0, 0, W, TOP);
    ctx.fillStyle = '#ffcc00'; ctx.fillRect(0, TOP - 2, W / 3, 2); ctx.fillStyle = '#2f6bff'; ctx.fillRect(W / 3, TOP - 2, W / 3, 2); ctx.fillStyle = '#e8283a'; ctx.fillRect((2 * W) / 3, TOP - 2, W / 3 + 1, 2);
    text(L.title, 4, 4, { size: 6, color: '#ffcc00' });
    ctx.font = FONT(6);
    const ix = Math.round(4 + ctx.measureText(L.title).width + 8);
    game.items.forEach((it, k) => { ctx.globalAlpha = it.got ? 1 : 0.28; ctx.drawImage(ICONS[it.id].img, ix + k * 11, 3); ctx.globalAlpha = 1; });
    const tl = Math.ceil(game.timeLeft);
    const tStr = tl + 's';
    text(tStr, W - 4, 4, { size: 6, align: 'right', color: tl <= 10 && Math.floor(game.t * 4) % 2 ? '#e8283a' : '#f4efe1' });
    ctx.font = FONT(6);
    text(String(game.score).padStart(5, '0'), W - 4 - ctx.measureText(tStr).width - 8, 4, { size: 6, align: 'right' });

    // diálogo de tío
    if (game.msg) {
      const lines = wrap(game.msg.line, W - 28, 6);
      const h = 8 + LH(6) + lines.length * LH(6);
      box(6, H - h - 6, W - 12, h, game.msg.gift ? '#13402a' : '#151c52');
      text(game.msg.name.toUpperCase() + ':', 12, H - h, { size: 6, color: '#ffcc00' });
      lines.forEach((l, i) => text(l, 12, H - h + LH(6) + 1 + i * LH(6), { size: 6 }));
    } else if (game.toast) {
      const lines = wrap(game.toast.line, W - 28, 5);
      const h = 8 + LH(6) + lines.length * LH(5);
      box(6, H - h - 6, W - 12, h, '#0f2a26', '#120a1e');
      text('¡' + game.toast.title + '!', 12, H - h, { size: 6, color: '#9be37a' });
      lines.forEach((l, i) => text(l, 12, H - h + LH(6) + 1 + i * LH(5), { size: 5, color: '#f4efe1' }));
    }

    if (game.state === 'intro') {
      ctx.fillStyle = '#050816e6'; ctx.fillRect(0, 0, W, H);
      text(L.sub.toUpperCase(), W / 2, 30, { size: 8, align: 'center', color: '#b8a8ee' });
      text(L.title, W / 2, 46, { size: 14, align: 'center', color: '#ffcc00', shadowColor: '#e8283a' });
      text('CONSIGUE:', W / 2, 78, { size: 6, align: 'center' });
      L.items.forEach((id, k) => {
        const y = 92 + k * Math.max(12, LH(6) + 2);
        ctx.drawImage(ICONS[id].img, W / 2 - 60, y - 2);
        text(ING[id].name, W / 2 - 46, y, { size: 6 });
      });
      text('¡CUIDADO CON LOS TÍOS!', W / 2, H - 22, { size: 6, align: 'center', color: Math.floor(game.t * 3) % 2 ? '#e8283a' : '#f4efe1' });
    }
    if (game.state === 'levelDone') {
      ctx.fillStyle = '#050816cc'; ctx.fillRect(0, 0, W, H);
      text('¡NIVEL COMPLETO!', W / 2, 70, { size: 10, align: 'center', color: '#ffcc00', shadowColor: '#e8283a' });
      text('Bono de tiempo +' + game.lastBonus, W / 2, 96, { size: 6, align: 'center' });
      const nxt = LEVELS[game.levelIdx + 1];
      text(nxt ? 'Siguiente: ' + nxt.title : 'Siguiente: ¡LA COCINA!', W / 2, 112, { size: 6, align: 'center', color: '#b8a8ee' });
    }
    if (game.state === 'gameover') {
      ctx.fillStyle = '#050816e6'; ctx.fillRect(0, 0, W, H);
      text('¡SE HIZO TARDE!', W / 2, 54, { size: 12, align: 'center', color: '#e8283a' });
      const l = wrap('La tía ya llegó con hallacas compradas en la panadería. La deshonra.', W - 40, 6);
      l.forEach((s, i) => text(s, W / 2, 84 + i * 10, { size: 6, align: 'center' }));
      text('ENTER o toca para reintentar', W / 2, 140, { size: 6, align: 'center', color: Math.floor(game.t * 2) % 2 ? '#ffcc00' : '#f4efe1' });
    }
    if (game.paused) {
      ctx.fillStyle = '#050816cc'; ctx.fillRect(0, 0, W, H);
      text('PAUSA', W / 2, 84, { size: 14, align: 'center', color: '#ffcc00' });
      text('P para seguir', W / 2, 108, { size: 6, align: 'center' });
    }
  }

  // ---------- Cocina ----------
  function startKitchen() {
    game.state = 'kitchen'; game.kitchenStep = 0; game.kitchenTries = 0; game.kmsg = null;
    game.supervisor = game.relatives[0];
    Music.setMode('kitchen');
    $('#kitchen').classList.remove('hidden');
    setPad(false); drag = null; clearDir();
    showStep();
  }

  function showStep() {
    const st = STEPS[game.kitchenStep];
    $('#kStep').textContent = st.q;
    const opts = $('#kOpts'); opts.innerHTML = '';
    shuffle([st.good].concat(st.bad)).forEach((label, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn'; b.textContent = (i + 1) + '. ' + label; b.dataset.good = label === st.good ? '1' : '0';
      b.addEventListener('click', () => answer(b));
      opts.appendChild(b);
    });
    fit();
  }

  function answer(btn) {
    if (btn.disabled) return;
    const st = STEPS[game.kitchenStep];
    if (btn.dataset.good === '1') {
      btn.classList.add('good'); Music.sfx('good');
      game.score += game.kitchenTries === 0 ? 150 : 50;
      game.kmsg = { name: 'TIP', line: st.tip, good: true };
      [...$('#kOpts').children].forEach((b) => { b.disabled = true; });
      setTimeout(() => {
        game.kitchenStep++; game.kitchenTries = 0;
        if (game.kitchenStep >= STEPS.length) finishGame();
        else { showStep(); }
      }, 1500);
    } else {
      btn.classList.add('bad'); btn.disabled = true; Music.sfx('bad');
      game.kitchenTries++; game.score = Math.max(0, game.score - 25);
      game.kmsg = { name: game.supervisor.name.toUpperCase(), line: pick(REGANOS), good: false };
    }
  }

  function renderKitchen() {
    // pared y mesón
    for (let y = 0; y < 120; y += 8) for (let x = 0; x < W; x += 8) { ctx.fillStyle = ((x + y) / 8) % 2 ? '#f4efe1' : '#e2dccb'; ctx.fillRect(x, y, 8, 8); }
    ctx.fillStyle = '#2f6bff'; for (let x = 0; x < W; x += 16) ctx.fillRect(x, 60, 8, 8);
    ctx.fillStyle = '#7a4a24'; ctx.fillRect(0, 120, W, H - 120); ctx.fillStyle = '#5a3418'; ctx.fillRect(0, 120, W, 3);
    // ventana con noche
    box(170, 12, 70, 44, '#0b1033'); ctx.fillStyle = '#f4efe1'; ctx.fillRect(220, 20, 6, 6);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#e8283a', '#ffcc00', '#2f9e44'][i % 3]; ctx.fillRect(174 + i * 11, 14 + (i % 2) * 2, 3, 3); }
    // supervisora
    if (game.supervisor) { drawSprite(game.supervisor.frames[Math.floor(game.t * 2) % 2], 20, 98); }
    drawSprite(game.hero.frames[0], 216, 98, true);

    const st = game.state === 'kitchenDone' ? 8 : game.kitchenStep;
    const cx = W / 2, cy = 112;
    // tabla
    ctx.fillStyle = '#c9a66b'; ctx.fillRect(cx - 44, cy - 6, 88, 44); ctx.fillStyle = '#a0703c'; ctx.fillRect(cx - 44, cy + 36, 88, 2);
    if (st >= 8) {
      // olla
      ctx.fillStyle = '#4a4f63'; ctx.fillRect(cx - 34, cy - 10, 68, 44); ctx.fillStyle = '#6b7184'; ctx.fillRect(cx - 38, cy - 14, 76, 6);
      ctx.fillStyle = '#2f9e44'; ctx.fillRect(cx - 22, cy - 18, 20, 10); ctx.fillRect(cx + 2, cy - 20, 20, 12);
      ctx.fillStyle = '#f4efe1'; ctx.fillRect(cx - 13, cy - 18, 2, 10); ctx.fillRect(cx + 11, cy - 20, 2, 12);
      for (let i = 0; i < 4; i++) { const yy = cy - 30 - ((game.t * 14 + i * 9) % 30); ctx.fillStyle = '#ffffff66'; ctx.fillRect(cx - 24 + i * 15 + Math.round(Math.sin(game.t * 3 + i) * 2), yy, 3, 3); }
    } else {
      if (st >= 1) { ctx.fillStyle = '#2f9e44'; ctx.fillRect(cx - 36, cy - 2, 72, 36); ctx.fillStyle = '#ff6a1a88'; ctx.fillRect(cx - 32, cy + 2, 64, 28); ctx.fillStyle = '#1f7a3a'; ctx.fillRect(cx - 36, cy + 15, 72, 1); }
      if (st >= 2 && st < 5) { ctx.fillStyle = '#ffcc4a'; ctx.fillRect(cx - 24, cy + 2, 48, 28); ctx.fillRect(cx - 28, cy + 6, 56, 20); ctx.fillStyle = '#e8a93a'; ctx.fillRect(cx - 24, cy + 28, 48, 2); }
      if (st >= 3 && st < 5) { ctx.fillStyle = '#7a3b1a'; ctx.fillRect(cx - 12, cy + 8, 24, 16); ctx.fillStyle = '#a4542a'; ctx.fillRect(cx - 8, cy + 10, 6, 4); ctx.fillRect(cx + 3, cy + 15, 5, 4); }
      if (st >= 4 && st < 5) { [['#7aa83a', -8, 10], ['#6b2a7a', 4, 11], ['#3f7a2a', -3, 18], ['#e8283a', 6, 18], ['#f4efe1', -10, 20]].forEach(([c, dx, dy]) => { ctx.fillStyle = c; ctx.fillRect(cx + dx, cy + dy, 3, 3); }); }
      if (st >= 5) { ctx.fillStyle = '#c9a66b'; ctx.fillRect(cx - 36, cy - 2, 72, 36); ctx.fillStyle = '#2f9e44'; ctx.fillRect(cx - 22, cy + 2, 44, 28); ctx.fillStyle = '#1f7a3a'; ctx.fillRect(cx - 22, cy + 15, 44, 2); ctx.fillRect(cx - 1, cy + 2, 2, 28); }
      if (st >= 6) { ctx.fillStyle = '#257a38'; ctx.fillRect(cx - 26, cy, 52, 32); ctx.fillStyle = '#3fae5a'; ctx.fillRect(cx - 24, cy + 2, 48, 3); }
      if (st >= 7) { ctx.fillStyle = '#f4efe1'; [-12, 0, 12].forEach((d) => ctx.fillRect(cx + d, cy, 2, 32)); [8, 16, 24].forEach((d) => ctx.fillRect(cx - 26, cy + d, 52, 2)); }
    }
    // progreso
    text('LA COCINA', 6, 6, { size: 8, color: '#2a1d3a', shadow: false });
    for (let i = 0; i < STEPS.length; i++) { ctx.fillStyle = i < st ? '#2f9e44' : '#2a1d3a55'; ctx.fillRect(6 + i * 10, 18, 8, 4); }
    text(String(game.score).padStart(5, '0'), 6, 26, { size: 6, color: '#2a1d3a', shadow: false });

    if (game.kmsg && game.state !== 'kitchenDone') {
      const lines = wrap(game.kmsg.line, 150, 5);
      const h = 8 + LH(5) + lines.length * LH(5);
      box(48, 30, 162, h, game.kmsg.good ? '#13402a' : '#5a1020');
      text(game.kmsg.name + ':', 53, 34, { size: 5, color: '#ffcc00' });
      lines.forEach((l, i) => text(l, 53, 34 + LH(5) + i * LH(5), { size: 5 }));
    }
    if (game.state === 'kitchenDone') {
      text('¡HALLACAS LISTAS!', W / 2, 40, { size: 10, align: 'center', color: '#e8283a', shadowColor: '#ffcc00' });
    }
  }

  function finishGame() {
    game.state = 'kitchenDone';
    $('#kitchen').classList.add('hidden');
    Music.sfx('win');
    const best = Math.max(store.get('best', 0), game.score);
    store.set('best', best);
    setTimeout(() => {
      $('#endTitle').textContent = '¡SALVASTE LA NAVIDAD!';
      $('#endScore').textContent = String(game.score);
      const mins = Math.floor(game.totalTime / 60), secs = Math.round(game.totalTime % 60);
      $('#endText').textContent = game.heroName + ' consiguió los 12 ingredientes en ' + mins + 'm ' + secs + 's, sobrevivió a ' + game.chismes + ' chisme' + (game.chismes === 1 ? '' : 's') + ' familiar' + (game.chismes === 1 ? '' : 'es') + ' y armó la hallaca como manda la tradición. Récord en este dispositivo: ' + best + '.';
      show('end'); Music.setMode('title');
      flushPendingLead();
    }, 2600);
  }

  // ---------- Bucle ----------
  let last = 0;
  function loop(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0); last = ts;
    if (!$('#panel-game').classList.contains('hidden')) { update(dt); render(); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // ---------- Entrada ----------
  const KEYMAP = { ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right', ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down' };
  function inGame() { return !$('#panel-game').classList.contains('hidden'); }
  window.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
    const k = KEYMAP[e.key];
    if (k && inGame()) { keys[k] = true; e.preventDefault(); }
    if (!inGame()) return;
    if (e.key === 'p' || e.key === 'P') { if (game.state === 'play') game.paused = !game.paused; }
    if (e.key === 'm' || e.key === 'M') toggleMute();
    if ((e.key === 'Enter' || e.key === ' ') && game.state === 'gameover') { e.preventDefault(); retry(); }
    if ((e.key === 'Enter' || e.key === ' ') && game.state === 'intro') { e.preventDefault(); game.state = 'play'; }
    if (game.state === 'kitchen' && /^[1-3]$/.test(e.key)) { const b = $('#kOpts').children[Number(e.key) - 1]; if (b) b.click(); }
  });
  window.addEventListener('keyup', (e) => { const k = KEYMAP[e.key]; if (k) keys[k] = false; });
  window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
  document.addEventListener('visibilitychange', () => { if (document.hidden && game.state === 'play') game.paused = true; });
  // Control táctil por arrastre: donde pones el dedo queda el centro del joystick
  let drag = null;
  function clearDir() { keys.left = keys.right = keys.up = keys.down = false; }
  canvas.addEventListener('pointerdown', (e) => {
    if (game.state === 'gameover') { retry(); return; }
    if (game.state === 'intro') { game.state = 'play'; return; }
    if (game.paused) { game.paused = false; return; }
    if (game.state !== 'play') return;
    e.preventDefault();
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, cx: e.clientX, cy: e.clientY, moved: false };
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.cx = e.clientX; drag.cy = e.clientY;
    const dx = drag.cx - drag.x, dy = drag.cy - drag.y, dead = 10;
    if (Math.hypot(dx, dy) < dead) { clearDir(); return; }
    drag.moved = true;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    keys.left = dx < 0 && ax > ay * 0.45; keys.right = dx > 0 && ax > ay * 0.45;
    keys.up = dy < 0 && ay > ax * 0.45; keys.down = dy > 0 && ay > ax * 0.45;
  });
  const endDrag = (e) => { if (drag && e.pointerId === drag.id) { drag = null; clearDir(); } };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  document.querySelectorAll('.dpad button').forEach((b) => {
    const k = b.dataset.k;
    const on = (e) => { e.preventDefault(); keys[k] = true; b.classList.add('on'); };
    const off = (e) => { e.preventDefault(); keys[k] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off);
    b.addEventListener('pointerleave', off); b.addEventListener('pointercancel', off);
    b.addEventListener('contextmenu', (e) => e.preventDefault());
  });

  function retry() {
    game.items = []; game.score = Math.max(0, game.score - 200);
    startLevel(game.levelIdx);
  }

  // ---------- Pantallas DOM ----------
  const PANELS = ['register', 'setup', 'game', 'end'];
  const cabinet = $('.cabinet');
  function show(name) {
    PANELS.forEach((p) => $('#panel-' + p).classList.toggle('hidden', p !== name));
    cabinet.classList.toggle('playing', name === 'game');
    setPad(name === 'game');
    fit();
  }
  function setPad(on) { cabinet.classList.toggle('show-pad', on); }

  // Ajusta el canvas al espacio REAL visible (visualViewport evita el bug de 100vh en iOS)
  function fit() {
    if (!cabinet.classList.contains('playing')) { canvas.style.width = ''; return; }
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const holder = $('#panel-game');
    const pad = $('#pad'); const ps = getComputedStyle(pad);
    const padH = ps.display !== 'none' && ps.position !== 'absolute' ? pad.offsetHeight : 0;
    const kit = $('#kitchen'); const kitH = kit.classList.contains('hidden') ? 0 : kit.offsetHeight;
    canvas.style.width = '10px';
    const chrome = cabinet.offsetHeight - holder.offsetHeight - padH;
    const avail = vh - 18 - chrome - padH - kitH - 4;
    const w = Math.max(200, Math.min(holder.clientWidth, (avail * 4) / 3, 960));
    canvas.style.width = Math.floor(w) + 'px';
    const ppl = w / W;
    FS_BUMP = ppl < 1.55 ? 2 : ppl < 2.2 ? 1 : 0;
  }
  function scrollToCabinet() {
    const y = cabinet.getBoundingClientRect().top + window.scrollY - 18;
    window.scrollTo({ top: y, behavior: 'instant' });
  }
  let fitT = null;
  function refit() {
    clearTimeout(fitT);
    fitT = setTimeout(() => { fit(); if (cabinet.classList.contains('playing')) scrollToCabinet(); }, 120);
  }
  window.addEventListener('resize', refit);
  window.addEventListener('orientationchange', refit);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', refit);

  function toggleMute() {
    const m = Music.toggleMute();
    $('#muteBtn').textContent = m ? '♪ OFF' : '♪ ON';
    $('#muteBtn').setAttribute('aria-label', m ? 'Activar música' : 'Silenciar música');
  }
  $('#muteBtn').textContent = Music.isMuted() ? '♪ OFF' : '♪ ON';
  $('#muteBtn').addEventListener('click', toggleMute);

  // Registro
  const form = $('#regForm');
  const formStart = Date.now();
  async function postLead(payload) {
    const r = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const j = await r.json().catch(() => ({}));
    return { status: r.status, body: j };
  }
  async function flushPendingLead() {
    const pending = store.get('pendingLead', null);
    if (!pending) return;
    try { const r = await postLead(pending); if (r.status === 200) store.set('pendingLead', null); } catch (e) { /* luego */ }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const country = String(fd.get('country') || '');
    const msg = $('#regMsg'); msg.classList.remove('err');
    if (!name) { msg.textContent = 'Falta tu nombre.'; msg.classList.add('err'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'Ese correo no se ve bien.'; msg.classList.add('err'); return; }
    if (!country) { msg.textContent = 'Escoge tu país.'; msg.classList.add('err'); return; }
    if (!fd.get('consent')) { msg.textContent = 'Necesito tu permiso para guardar tus datos.'; msg.classList.add('err'); return; }

    Music.start('title');
    const payload = { name, email, country, consent: true, consentText: $('#consentText').textContent, website: fd.get('website') || '', elapsedMs: Date.now() - formStart };
    const btn = $('#regBtn'); btn.disabled = true; msg.textContent = 'Guardando...';
    try {
      const r = await postLead(payload);
      if (r.status === 400) { msg.textContent = 'Revisa los datos, algo no cuadra.'; msg.classList.add('err'); btn.disabled = false; return; }
      if (r.status !== 200) store.set('pendingLead', payload); // el servidor falló: no castigamos a quien juega, reintentamos luego
    } catch (err) {
      store.set('pendingLead', payload);
    }
    store.set('registered', { name, country, at: Date.now() });
    btn.disabled = false; msg.textContent = '';
    goSetup();
  });

  // Selección de personaje y tíos
  let selected = store.get('hero', 'valentina');
  function goSetup() {
    const reg = store.get('registered', {});
    const hn = $('#heroName');
    if (!hn.value) hn.value = store.get('heroName', '') || String(reg.name || '').split(' ')[0].slice(0, 12);
    const wrapC = $('#chars'); wrapC.innerHTML = '';
    HEROES.forEach((h) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'char'; b.setAttribute('role', 'radio');
      b.setAttribute('aria-checked', h.id === selected ? 'true' : 'false');
      const c = document.createElement('canvas'); c.width = 18; c.height = 18; c.getContext('2d').drawImage(h.frames[0], 0, 0);
      b.appendChild(c); const s = document.createElement('span'); s.textContent = h.label; b.appendChild(s);
      b.addEventListener('click', () => { selected = h.id; Music.sfx('select'); Music.start('title'); [...wrapC.children].forEach((x) => x.setAttribute('aria-checked', 'false')); b.setAttribute('aria-checked', 'true'); });
      wrapC.appendChild(b);
    });
    const saved = store.get('tios', null);
    fillTios(saved && saved.length === 6 ? saved : randomTios());
    show('setup');
  }
  function randomTios() { return shuffle(TIA_POOL).slice(0, 3).concat(shuffle(TIO_POOL).slice(0, 3)).sort(() => rnd() - 0.5); }
  function fillTios(list) {
    const w = $('#tios'); w.innerHTML = '';
    list.forEach((n, i) => { const inp = document.createElement('input'); inp.maxLength = 16; inp.value = n; inp.setAttribute('aria-label', 'Familiar ' + (i + 1)); w.appendChild(inp); });
  }
  $('#randTios').addEventListener('click', () => { Music.sfx('select'); fillTios(randomTios()); });

  $('#startBtn').addEventListener('click', () => {
    const heroDef = HEROES.find((h) => h.id === selected) || HEROES[0];
    const nm = ($('#heroName').value || heroDef.label).trim().slice(0, 12);
    const tios = [...$('#tios').querySelectorAll('input')].map((i, k) => (i.value.trim() || randomTios()[k]).slice(0, 16));
    store.set('hero', selected); store.set('heroName', nm); store.set('tios', tios);
    game.hero = heroDef; game.heroName = nm;
    game.relatives = shuffle(tios).map(makeRelative);
    game.score = 0; game.chismes = 0; game.totalTime = 0; game.items = []; game.paused = false;
    $('#kitchen').classList.add('hidden');
    show('game');
    Music.start('game'); Music.setMode('game');
    document.fonts && document.fonts.load('8px "Press Start 2P"');
    startLevel(0);
    requestAnimationFrame(() => { fit(); scrollToCabinet(); });
  });

  $('#againBtn').addEventListener('click', () => goSetup());
  $('#shareBtn').addEventListener('click', async () => {
    const url = location.origin + location.pathname;
    const t = '¡Rescaté la cena de Navidad con ' + game.score + ' puntos en ¡Rescata la Hallaca! ¿Me superas?';
    if (navigator.share) { try { await navigator.share({ title: '¡Rescata la Hallaca!', text: t, url }); return; } catch (e) { /* cancelado */ } }
    window.open('https://wa.me/?text=' + encodeURIComponent(t + ' ' + url), '_blank', 'noopener');
  });

  // Solo para pruebas locales: ?debug expone el estado
  if (/[?&]debug\b/.test(location.search)) window.__h = { game, startKitchen, nextLevel };

  // Arranque
  if (store.get('registered', null)) { flushPendingLead(); goSetup(); } else show('register');
})();
