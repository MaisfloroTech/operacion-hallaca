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

  const KID = {
    1: '3.6h3.', 2: '2.8h2.', 3: '2.1h6s1h2.', 4: '2.1s1e4s1e1s2.', 5: '2.3s2m3s2.', 6: '3.6s3.',
    7: '2.8t2.', 8: '1.1s8t1s1.', 9: '3.6t3.',
  };
  const KID_LEGS = [{ 10: '3.2p2.2p3.', 11: '2.3b2.3b2.' }, { 10: '2.2p4.2p2.', 11: '1.3b4.3b1.' }];
  function buildKid(pal) {
    return [0, 1].map((f) => {
      const rows = new Array(12).fill('............');
      for (const [r, sp] of Object.entries(KID)) rows[r] = rle(sp);
      for (const [r, sp] of Object.entries(KID_LEGS[f])) rows[r] = rle(sp);
      return drawRows(rows, Object.assign({ e: '#1a1020', m: '#7a2b2b', b: '#2a1a12' }, pal), 12, 12, true);
    });
  }
  function makeKid() {
    const nm = pick(DATA.KID_NAMES);
    return { name: 'Primo ' + nm, frames: buildKid({ s: pick(SKIN), h: pick(HAIRC), t: pick(SHIRTS), p: pick(['#2f6bff', '#2a2a4a', '#e8283a']) }), kid: true };
  }
  const MAMI_REL = { name: 'Mami', frames: buildHuman({ hair: 'curly', skirt: true, pal: { s: '#c88a5a', h: '#2b1a10', t: '#ff7ab6', p: '#e8283a' } }) };
  const PAPI_REL = { name: 'Papi', frames: buildHuman({ hair: 'short', extras: ['mustache', 'glasses'], pal: { s: '#c88a5a', h: '#3a2a1a', t: '#f4efe1', p: '#3a2a1a', g: '#1a1a1a' } }) };
  function makeVisitor(country, code) {
    let v = DATA.COUNTRY[country];
    if (!v) { // cualquier país del mundo: saludo en su idioma principal
      const L = (window.HALLACA_LANGS || {})[(window.HALLACA_COUNTRY_LANG || {})[code]];
      const where = country && country !== 'Otro' ? country : 'muy lejos';
      if (L && L.es) v = { name: L.name, lines: [{ t: L.t, es: L.es }, { t: L.t + ' ¡Vine desde ' + where + ' solo por una hallaca!' }] };
      else v = { name: 'Tía Viajera', lines: [{ t: '¡Feliz Navidad desde ' + where + '! La hallaca une al mundo.' }, { t: '¡Crucé medio planeta desde ' + where + ' solo por una hallaca!' }] };
    }
    if (!v) return null;
    const rel = makeRelative(v.name);
    rel.lines = v.lines; rel.country = country || 'Otro';
    return rel;
  }
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
  ICONS.arepa = { pal: { w: '#f1dca8', b: '#b9783a' }, rows: ['8.', '2.4w2.', '1.6w1.', '1.2w1b3w1.', '1.4w1b1w1.', '1.1w1b4w1.', '2.4w2.', '8.'] };
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
    { title: 'EL MERCADO', sub: 'Nivel 1', items: ['hoja', 'alinos', 'pimenton', 'onoto'], time: 85, tios: 2, kids: 1, braid: 0.75, theme: 'mercado' },
    { title: 'LA CARNICERÍA', sub: 'Nivel 2', items: ['res', 'cochino', 'gallina'], time: 80, tios: 2, kids: 1, braid: 0.65, theme: 'carniceria' },
    { title: 'EL ABASTO', sub: 'Nivel 3', items: ['harina', 'aceitunas', 'pasas', 'alcaparras', 'pabilo'], time: 100, tios: 2, kids: 1, braid: 0.55, theme: 'abasto' },
  ];
  const DATA = window.HALLACA_DATA || { MAMI: ['¡Un abrazo!'], PAPI: ['¡Un abrazo!'], KIDS: ['¡Juguemos!'], KID_NAMES: ['Santi'], COUNTRY: {} };

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

  // Laberinto: backtracker recursivo sobre una grilla de 10x7 celdas (pasillos de 2 tiles)
  // + "braid": abre paredes extra para crear loops y que no sea frustrante con tíos persiguiendo.
  const CW = 10, CH = 7;
  function genMap(braid) {
    const m = [];
    for (let y = 0; y < MH; y++) m.push(new Array(MW).fill(1));
    const vis = [];
    for (let y = 0; y < CH; y++) vis.push(new Array(CW).fill(false));
    const openCell = (cx, cy) => { for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) m[1 + 3 * cy + dy][1 + 3 * cx + dx] = 0; };
    const link = (ax, ay, bx, by) => {
      if (ay === by) { const wx = 3 + 3 * Math.min(ax, bx); m[1 + 3 * ay][wx] = 0; m[2 + 3 * ay][wx] = 0; }
      else { const wy = 3 + 3 * Math.min(ay, by); m[wy][1 + 3 * ax] = 0; m[wy][2 + 3 * ax] = 0; }
    };
    const st = [[0, CH - 1]]; vis[CH - 1][0] = true; openCell(0, CH - 1);
    while (st.length) {
      const [cx, cy] = st[st.length - 1];
      const nb = shuffle([[1, 0], [-1, 0], [0, 1], [0, -1]]).map(([dx, dy]) => [cx + dx, cy + dy])
        .filter(([x, y]) => x >= 0 && y >= 0 && x < CW && y < CH && !vis[y][x]);
      if (!nb.length) { st.pop(); continue; }
      const [nx, ny] = nb[0]; vis[ny][nx] = true; openCell(nx, ny); link(cx, cy, nx, ny); st.push([nx, ny]);
    }
    for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++) {
      if (cx < CW - 1 && rnd() < braid) link(cx, cy, cx + 1, cy);
      if (cy < CH - 1 && rnd() < braid) link(cx, cy, cx, cy + 1);
    }
    // Sin callejones: toda celda con una sola salida recibe otra
    const opened = (ax, ay, bx, by) => (ay === by ? m[1 + 3 * ay][3 + 3 * Math.min(ax, bx)] : m[3 + 3 * Math.min(ay, by)][1 + 3 * ax]) === 0;
    for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++) {
      const nbs = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => [cx + dx, cy + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < CW && y < CH);
      if (nbs.filter(([x, y]) => opened(cx, cy, x, y)).length <= 1) {
        const closed = nbs.filter(([x, y]) => !opened(cx, cy, x, y));
        if (closed.length) { const [x, y] = pick(closed); link(cx, cy, x, y); }
      }
    }
    return m;
  }
  function cellOpen(cx, cy, nx, ny) {
    if (nx < 0 || ny < 0 || nx >= CW || ny >= CH) return false;
    const m = game.map;
    if (ny === cy) return m[1 + 3 * cy][3 + 3 * Math.min(cx, nx)] === 0;
    return m[3 + 3 * Math.min(cy, ny)][1 + 3 * cx] === 0;
  }
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function cellOf(o) { return [clamp(Math.floor(o.x / 24), 0, CW - 1), clamp(Math.floor((o.y + 13 - TOP - 8) / 24), 0, CH - 1)]; }
  function anchor(cx, cy) { return [(1 + 3 * cx) * T, TOP + (1 + 3 * cy) * T - 7]; }
  function bfs(from) {
    const dist = [], prev = [];
    for (let y = 0; y < CH; y++) { dist.push(new Array(CW).fill(-1)); prev.push(new Array(CW).fill(null)); }
    const q = [from]; dist[from[1]][from[0]] = 0;
    while (q.length) {
      const [cx, cy] = q.shift();
      for (const [dx, dy] of DIRS) {
        const nx = cx + dx, ny = cy + dy;
        if (cellOpen(cx, cy, nx, ny) && dist[ny][nx] < 0) { dist[ny][nx] = dist[cy][cx] + 1; prev[ny][nx] = [cx, cy]; q.push([nx, ny]); }
      }
    }
    return { dist, prev };
  }
  // Siguiente celda en el camino más corto de "from" a "to" (los tíos te siguen por los pasillos)
  function bfsNext(from, to) {
    if (from[0] === to[0] && from[1] === to[1]) return to;
    const { prev } = bfs(from);
    let cur = to, guard = 0;
    while (prev[cur[1]][cur[0]] && guard++ < 80) {
      const pv = prev[cur[1]][cur[0]];
      if (pv[0] === from[0] && pv[1] === from[1]) return cur;
      cur = pv;
    }
    return from;
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
    game.map = genMap(L.braid); game.bg = renderMap(game.map, L.theme);
    game.items = []; game.particles = [];
    game.player = { x: T, y: TOP + 19 * T - 11, dir: 1, anim: 0, stun: 0, hug: 0 };
    const { dist } = bfs([0, CH - 1]);
    const cells = [];
    for (let cy = 0; cy < CH; cy++) for (let cx = 0; cx < CW; cx++) cells.push([cx, cy, dist[cy][cx]]);
    const far = cells.filter((c) => c[2] >= 5);
    const chosen = [];
    for (const id of L.items) {
      const c = shuffle(far).find((c2) => chosen.every((o) => Math.abs(o[0] - c2[0]) + Math.abs(o[1] - c2[1]) >= 3)) || pick(far.length ? far : cells);
      chosen.push(c);
      game.items.push({ id, x: (1 + 3 * c[0]) * T + 4, y: TOP + (1 + 3 * c[1]) * T + 4, got: false });
    }
    const used = new Set(chosen.map((c) => c[0] + ',' + c[1])); used.add('0,' + (CH - 1));
    const freeCell = (minD) => {
      for (let k = 0; k < 300; k++) { const c = pick(cells); if (c[2] >= minD && !used.has(c[0] + ',' + c[1])) { used.add(c[0] + ',' + c[1]); return c; } }
      return pick(cells);
    };
    game.npcs = [];
    const mk = (kind, rel, c, speed) => {
      const [ax, ay] = anchor(c[0], c[1]);
      game.npcs.push({ kind, rel, x: ax, y: ay, speed, dx: 0, dy: 0, anim: 0, face: 1, cool: 3, goal: [c[0], c[1]], prev: null, mode: 'wander', modeT: 1 + rnd() * 2 });
    };
    for (let k = 0; k < (game.visitor ? L.tios : L.tios + 1); k++) mk('tio', game.relatives[(i * 2 + k) % game.relatives.length], freeCell(4), 24);
    if (game.visitor) mk('pais', game.visitor, freeCell(4), 22);
    for (let k = 0; k < L.kids; k++) mk('kid', makeKid(), freeCell(2), 60);
    mk('mami', MAMI_REL, freeCell(3), 24);
    mk('papi', PAPI_REL, freeCell(3), 24);
    game.timeLeft = L.time;
    game.msg = null; game.toast = null;
    game.state = 'intro'; game.introT = 0;
    Music.setMode('game');
    if (typeof setPad === 'function') { setPad(true); fit(); }
  }
  function setDialog(name, line, dur, opts) { game.msg = Object.assign({ name, line, t: dur }, opts || {}); }
  function moveToward(o, tx, ty, s) {
    const ddx = tx - o.x, ddy = ty - o.y;
    let mx = 0, my = 0;
    if (Math.abs(ddx) > 0.5) { mx = Math.sign(ddx) * Math.min(s, Math.abs(ddx)); if (boxHits(o.x + mx, o.y)) mx = 0; }
    if (!mx && Math.abs(ddy) > 0.5) { my = Math.sign(ddy) * Math.min(s, Math.abs(ddy)); if (boxHits(o.x, o.y + my)) my = 0; }
    o.x += mx; o.y += my;
    o.dx = Math.sign(mx); o.dy = Math.sign(my);
    return Math.abs(tx - o.x) <= 0.5 && Math.abs(ty - o.y) <= 0.5;
  }
  // IA: tíos, visitante y primitos pasean tranquilos por el laberinto (no persiguen);
  // solo mami y papi vienen a buscarte, despacito, para darte el abrazo.
  function npcStep(n, dt) {
    const p = game.player, s = n.speed * dt;
    if (n.cool > 0) n.cool -= dt;
    n.modeT -= dt;
    if (n.modeT <= 0) {
      if (n.kind === 'kid') { n.mode = 'wander'; n.modeT = 99; }
      else if (n.kind === 'mami' || n.kind === 'papi') { n.mode = 'chase'; n.modeT = 99; }
      else { n.mode = 'wander'; n.modeT = 99; }
    }
    const here = cellOf(n), pc = cellOf(p);
    if (n.mode === 'chase' && here[0] === pc[0] && here[1] === pc[1]) { moveToward(n, p.x, p.y, s); n.goal = null; }
    else {
      if (!n.goal) n.goal = here;
      const [gx, gy] = anchor(n.goal[0], n.goal[1]);
      if (moveToward(n, gx, gy, s)) {
        if (n.mode === 'chase') { n.prev = n.goal; n.goal = bfsNext(n.goal, pc); }
        else {
          const opts = DIRS.map(([dx, dy]) => [n.goal[0] + dx, n.goal[1] + dy]).filter((c) => cellOpen(n.goal[0], n.goal[1], c[0], c[1]));
          let ch = opts.filter((c) => !n.prev || c[0] !== n.prev[0] || c[1] !== n.prev[1]);
          if (!ch.length) ch = opts;
          n.prev = n.goal; n.goal = ch.length ? pick(ch) : n.goal;
        }
      }
    }
    n.anim = n.dx || n.dy ? n.anim + dt : 0;
    if (n.dx) n.face = n.dx;
  }
  function hearts(x, y, k) {
    for (let i = 0; i < k; i++) game.particles.push({ x: x + rnd() * 12 - 2, y: y + rnd() * 6, vx: (rnd() - 0.5) * 18, vy: -18 - rnd() * 22, t: 1.1 + rnd() * 0.6 });
  }
  function meet(n) {
    const p = game.player;
    if (n.kind === 'tio') {
      n.cool = 9; n.mode = 'wander'; n.modeT = 99;
      if (rnd() < 0.25) { game.timeLeft += 6; Music.sfx('gift'); setDialog(n.rel.name, pick(REGALOS), 2.2, { gift: true }); }
      else { p.stun = 1.4; game.chismes++; Music.sfx('bump'); game.flash = 0.15; setDialog(n.rel.name, pick(CHISMES), 2.4); }
    } else if (n.kind === 'pais') {
      n.cool = 10; n.mode = 'wander'; n.modeT = 99;
      const ln = pick(n.rel.lines);
      p.stun = 1.2; game.visits++; Music.sfx('select');
      setDialog(n.rel.name + ' (' + n.rel.country + ')', ln.t, 3.6, { kind: 'pais', sub: ln.es });
    } else if (n.kind === 'kid') {
      n.cool = 6; p.stun = 0.6; Music.sfx('bump');
      setDialog(n.rel.name, pick(DATA.KIDS), 1.6, { kind: 'kid' });
      n.mode = 'wander'; n.goal = null;
    } else {
      n.cool = 11; n.mode = 'wander'; n.modeT = 6;
      p.hug = 1.5; game.timeLeft += 5; game.hugs++; Music.sfx('gift');
      hearts(p.x + 2, p.y, 18); hearts(n.x + 2, n.y - 2, 8);
      const lines = n.kind === 'mami' ? DATA.MAMI : DATA.PAPI;
      setDialog(n.rel.name, pick(lines) + ' +5s', 3.2, { kind: 'love', icon: 'arepa' });
    }
  }
  function update(dt) {
    game.t += dt;
    if (game.paused) return;
    if (game.toast) { game.toast.t -= dt; if (game.toast.t <= 0) game.toast = null; }
    if (game.flash > 0) game.flash -= dt;
    if (game.particles) {
      for (const pt of game.particles) { pt.t -= dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 10 * dt; }
      game.particles = game.particles.filter((pt) => pt.t > 0);
    }
    if (game.state === 'intro') { game.introT += dt; if (game.introT > 3.6) game.state = 'play'; return; }
    if (game.state === 'levelDone') { game.doneT += dt; if (game.doneT > 2.8) nextLevel(); return; }
    if (game.state !== 'play') return;
    game.timeLeft -= dt; game.totalTime += dt;
    if (game.timeLeft <= 0) { game.timeLeft = 0; game.state = 'gameover'; Music.sfx('lose'); return; }
    const p = game.player;
    if (game.msg) { game.msg.t -= dt; if (game.msg.t <= 0) game.msg = null; }
    if (p.stun > 0) p.stun -= dt;
    if (p.hug > 0) { p.hug -= dt; if (rnd() < dt * 6) hearts(p.x + 2, p.y, 1); }
    const frozen = p.stun > 0 || p.hug > 0;
    let dx = 0, dy = 0;
    if (!frozen) { if (keys.left) dx -= 1; if (keys.right) dx += 1; if (keys.up) dy -= 1; if (keys.down) dy += 1; }
    const sp = 72 * dt;
    if (dx && dy) {
      dx *= 0.7071; dy *= 0.7071;
      const nx = p.x + dx * sp; if (!boxHits(nx, p.y)) p.x = nx;
      const ny = p.y + dy * sp; if (!boxHits(p.x, ny)) p.y = ny;
    } else if (dx) { // ayuda para doblar esquinas: si chocas, te acomoda al pasillo
      const nx = p.x + dx * sp;
      if (!boxHits(nx, p.y)) p.x = nx;
      else for (let k = 1; k <= 8; k++) {
        if (!boxHits(nx, p.y - k)) { p.y -= Math.min(sp, k); break; }
        if (!boxHits(nx, p.y + k)) { p.y += Math.min(sp, k); break; }
      }
    } else if (dy) {
      const ny = p.y + dy * sp;
      if (!boxHits(p.x, ny)) p.y = ny;
      else for (let k = 1; k <= 8; k++) {
        if (!boxHits(p.x - k, ny)) { p.x -= Math.min(sp, k); break; }
        if (!boxHits(p.x + k, ny)) { p.x += Math.min(sp, k); break; }
      }
    }
    if (dx) p.dir = dx < 0 ? -1 : 1;
    p.anim = dx || dy ? p.anim + dt : 0;
    for (const it of game.items) {
      if (it.got) continue;
      if (Math.abs(p.x + 8 - (it.x + 4)) < 10 && Math.abs(p.y + 12 - (it.y + 4)) < 10) {
        it.got = true; game.score += 100; Music.sfx('pick');
        game.toast = { title: ING[it.id].name.toUpperCase(), line: ING[it.id].tip, t: 3.4 };
      }
    }
    if (game.items.every((it) => it.got)) {
      const bonus = Math.ceil(game.timeLeft) * 10;
      game.score += bonus; game.lastBonus = bonus;
      game.state = 'levelDone'; game.doneT = 0; Music.sfx('level'); return;
    }
    for (const n of game.npcs) {
      npcStep(n, dt);
      if (n.kind === 'tio' || n.kind === 'pais') {
        const d = Math.hypot(p.x - n.x, p.y - n.y);
        n.danger = n.cool <= 0 && d < 36;
        if (n.danger && !n.warned) { n.warned = true; Music.sfx('select'); }
        if (!n.danger) n.warned = false;
      } else if (n.kind === 'mami' || n.kind === 'papi') {
        n.heartT = (n.heartT || 0) - dt;
        if (n.heartT <= 0) { n.heartT = 0.45 + rnd() * 0.4; hearts(n.x + 3, n.y - 4, 1); }
      }
      if (n.cool <= 0 && p.stun <= 0 && p.hug <= 0 && Math.abs(p.x - n.x) < 11 && Math.abs(p.y - n.y) < 11) meet(n);
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
  function drawHeart(x, y, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x, y, 2, 1); ctx.fillRect(x + 3, y, 2, 1);
    ctx.fillRect(x, y + 1, 5, 1); ctx.fillRect(x + 1, y + 2, 3, 1); ctx.fillRect(x + 2, y + 3, 1, 1);
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
    const LABEL = { tio: '#ffcc00', pais: '#7fe3ff', kid: '#9be37a', mami: '#ff9ec4', papi: '#ff9ec4' };
    for (const n of game.npcs) ents.push({ y: n.y + 6, draw: () => {
      const parent = n.kind === 'mami' || n.kind === 'papi';
      const fr = n.rel.frames[Math.floor(n.anim * (n.kind === 'kid' ? 10 : 6)) % 2];
      let top = Math.round(n.y) + (n.kind === 'kid' ? 4 : 0);
      if (parent) { // mami y papi: más grandes que el resto (x1.35)
        const k = 1.35, w2 = Math.round(fr.width * k), h2 = Math.round(fr.height * k);
        const x0 = Math.round(n.x + 8 - w2 / 2), y0 = Math.round(n.y + 16 - h2 + 1);
        ctx.fillStyle = '#00000040'; ctx.fillRect(x0 + 3, Math.round(n.y) + 13, w2 - 6, 4);
        ctx.fillStyle = '#ff4f7a33'; ctx.fillRect(x0 - 1, y0 + h2 - 3, w2 + 2, 3);
        if (n.face < 0) { ctx.save(); ctx.translate(x0 + w2, y0); ctx.scale(-1, 1); ctx.drawImage(fr, 0, 0, w2, h2); ctx.restore(); }
        else ctx.drawImage(fr, x0, y0, w2, h2);
        top = y0 + 1;
      } else {
        shadow(n.x, n.y);
        if (n.kind === 'kid') drawSprite(fr, n.x + 2, n.y + 4, n.face < 0); else drawSprite(fr, n.x, n.y, n.face < 0);
      }
      ctx.font = FONT(5); const w = ctx.measureText(n.rel.name).width; const lh = LH(5) - 1;
      const ty = Math.max(TOP + lh + 1, top);
      if ((n.kind === 'tio' || n.kind === 'pais') && n.danger) { // ¡peligro! te tiene en la mira
        const bx = Math.round(n.x + 13), by = ty - lh - 11 + (Math.floor(game.t * 8) % 2);
        ctx.fillStyle = '#120a1e'; ctx.fillRect(bx - 1, by - 1, 7, 11);
        ctx.fillStyle = Math.floor(game.t * 6) % 2 ? '#ffcc00' : '#e8283a'; ctx.fillRect(bx, by, 5, 9);
        ctx.fillStyle = '#120a1e'; ctx.fillRect(bx + 2, by + 1, 1, 4); ctx.fillRect(bx + 2, by + 7, 1, 1);
      }
      const lx = Math.round(Math.max(w / 2 + 3, Math.min(W - w / 2 - 3, n.x + 8)));
      ctx.fillStyle = '#120a1ecc'; ctx.fillRect(Math.round(lx - w / 2) - 2, ty - lh - 1, w + 4, lh);
      text(n.rel.name, lx, ty - lh, { size: 5, align: 'center', color: LABEL[n.kind], shadow: false });
      if (parent) drawHeart(Math.round(n.x + 6), ty - lh - 7 + Math.round(Math.sin(game.t * 5)), '#ff4f7a');
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
    for (const pt of game.particles) { ctx.globalAlpha = Math.min(1, pt.t * 1.5); drawHeart(Math.round(pt.x), Math.round(pt.y), '#ff4f7a'); ctx.globalAlpha = 1; }

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
    syncMsgBar();

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
      text('Busca a mami y papi: abrazo, arepita y +5s', W / 2, H - 34, { size: 5, align: 'center', color: '#ff9ec4' });
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
    cabinet.classList.add('in-kitchen');
    showStep();
  }

  function showStep() {
    const st = STEPS[game.kitchenStep];
    const parts = st.q.split(' · ');
    $('#kHead').textContent = 'LA COCINA · ' + parts[0] + ' DE ' + STEPS.length;
    $('#kStep').textContent = parts[1] || st.q;
    const fb = $('#kFeedback'); fb.textContent = ''; fb.className = 'k-feedback';
    const opts = $('#kOpts'); opts.innerHTML = '';
    shuffle([st.good].concat(st.bad)).forEach((label, i) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'k-opt'; b.dataset.good = label === st.good ? '1' : '0';
      const n = document.createElement('span'); n.className = 'k-num'; n.textContent = String(i + 1);
      const t = document.createElement('span'); t.textContent = label;
      b.append(n, t);
      b.addEventListener('click', () => answer(b));
      opts.appendChild(b);
    });
    game.kmsg = null;
    $('#kitchen').classList.remove('hidden');
    fit();
  }

  function answer(btn) {
    if (btn.disabled) return;
    const st = STEPS[game.kitchenStep];
    if (btn.dataset.good === '1') {
      btn.classList.add('good'); Music.sfx('good');
      game.score += game.kitchenTries === 0 ? 150 : 50;
      game.kmsg = { name: '¡BIEN! TIP', line: st.tip, good: true };
      [...$('#kOpts').children].forEach((b) => { b.disabled = true; });
      const fb = $('#kFeedback'); fb.textContent = '¡Así es! ' + st.tip; fb.className = 'k-feedback good';
      // se quita la tarjeta un momento para ver cómo va quedando la hallaca
      setTimeout(() => { $('#kitchen').classList.add('hidden'); game.kitchenStep++; game.kitchenTries = 0; }, 900);
      setTimeout(() => {
        if (game.kitchenStep >= STEPS.length) finishGame();
        else showStep();
      }, 2500);
    } else {
      btn.classList.add('bad'); btn.disabled = true; Music.sfx('bad');
      game.kitchenTries++; game.score = Math.max(0, game.score - 25);
      const fb = $('#kFeedback'); fb.textContent = game.supervisor.name + ': ' + pick(REGANOS); fb.className = 'k-feedback bad';
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
    cabinet.classList.remove('in-kitchen'); fit();
    Music.sfx('win');
    const best = Math.max(store.get('best', 0), game.score);
    store.set('best', best);
    setTimeout(() => {
      $('#endTitle').textContent = '¡SALVASTE LA NAVIDAD!';
      $('#endScore').textContent = String(game.score);
      const mins = Math.floor(game.totalTime / 60), secs = Math.round(game.totalTime % 60);
      $('#endText').textContent = game.heroName + ' consiguió los 12 ingredientes en ' + mins + 'm ' + secs + 's, sobrevivió a ' + game.chismes + ' chisme' + (game.chismes === 1 ? '' : 's') + ' familiar' + (game.chismes === 1 ? '' : 'es') + ', recibió ' + game.hugs + ' abrazo' + (game.hugs === 1 ? '' : 's') + ' de papi y mami y armó la hallaca como manda la tradición. Récord en este dispositivo: ' + best + '.';
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
    if (game.state === 'kitchen' && /^[1-3]$/.test(e.key) && !$('#kitchen').classList.contains('hidden')) { const b = $('#kOpts').children[Number(e.key) - 1]; if (b) b.click(); }
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
    if (name !== 'game') cabinet.classList.remove('in-kitchen');
    setPad(name === 'game');
    fit();
  }
  function setPad(on) { cabinet.classList.toggle('show-pad', on); }

  // Ajusta el canvas al espacio REAL visible (visualViewport evita el bug de 100vh en iOS)
  // ---------- Barra de mensajes (fuera del canvas: nunca tapa al héroe) ----------
  let mbKey = '';
  function syncMsgBar() {
    const mb = $('#msgbar'); if (!mb) return;
    let kind = 'goal', name = '', textTxt = '', sub = '';
    if (game.msg) {
      kind = game.msg.kind || (game.msg.gift ? 'gift' : 'tio');
      name = (kind === 'love' ? '♥ ' : '') + game.msg.name.toUpperCase();
      textTxt = game.msg.line; sub = game.msg.sub || '';
    } else if (game.toast) {
      kind = 'toast'; name = '¡' + game.toast.title + '!'; textTxt = game.toast.line;
    } else if (game.paused) {
      name = 'PAUSA'; textTxt = 'Toca el juego o presiona P para seguir.';
    } else if (game.state === 'gameover') {
      name = 'SE HIZO TARDE'; textTxt = 'Toca el juego o presiona ENTER para reintentar.';
    } else if (game.state === 'levelDone') {
      kind = 'toast'; name = '¡NIVEL COMPLETO!'; textTxt = 'Bono de tiempo +' + (game.lastBonus || 0) + '. ¡Vamos al siguiente!';
    } else {
      const left = (game.items || []).filter((it) => !it.got).map((it) => ING[it.id].name);
      name = game.state === 'intro' ? '¡PREPÁRATE!' : 'TE FALTA';
      textTxt = left.length ? left.join(' · ') : '¡Ya tienes todo!';
      sub = game.state === 'intro' ? 'Mami y papi dan abrazos (+tiempo). Los tíos solo quieren conversar.' : '';
    }
    const key = kind + '|' + name + '|' + textTxt + '|' + sub;
    if (key === mbKey) return;
    mbKey = key;
    mb.dataset.kind = kind;
    $('#mbName').textContent = name;
    $('#mbText').textContent = textTxt;
    $('#mbSub').textContent = sub;
    fitMsgText();
  }
  // Achica la letra lo justo para que el mensaje completo (con traducción) quepa sin cortarse
  function fitMsgText() {
    const mb = $('#msgbar'); if (!mb || mb.offsetParent === null) return;
    mb.style.fontSize = '';
    const base = parseFloat(getComputedStyle(mb).fontSize) || 20;
    let k = 1;
    while (mb.scrollHeight > mb.clientHeight + 1 && k > 0.56) { k -= 0.06; mb.style.fontSize = (base * k).toFixed(1) + 'px'; }
  }

  function fit() {
    if (!cabinet.classList.contains('playing')) { canvas.style.width = ''; $('#stage').style.width = ''; $('#screen').style.minHeight = ''; return; }
    const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
    const holder = $('#panel-game');
    const pad = $('#pad'); const ps = getComputedStyle(pad);
    const padH = ps.display !== 'none' && ps.position !== 'absolute' ? pad.offsetHeight : 0;
    const kitH = 0; // la tarjeta de cocina va encima del canvas
    canvas.style.width = '10px'; $('#screen').style.minHeight = '';
    const chrome = cabinet.offsetHeight - holder.offsetHeight - padH;
    const credit = $('#credit'); const creditH = credit ? credit.offsetHeight + 10 : 0;
    const barH = audioBar && !audioBar.classList.contains('hidden') ? audioBar.offsetHeight : 0;
    const mb = $('#msgbar');
    mb.classList.remove('side'); mb.style.width = ''; mb.style.left = '';
    const inKitchen = cabinet.classList.contains('in-kitchen');
    const msgH = inKitchen ? 0 : mb.offsetHeight;
    const avail0 = vh - 18 - barH - chrome - padH - kitH - creditH - 4;
    let avail = avail0 - msgH;
    let w = Math.max(200, Math.min(holder.clientWidth, (avail * 4) / 3, 960));
    const landscapePhone = window.matchMedia('(pointer:coarse) and (orientation:landscape) and (max-height:560px)').matches;
    if (landscapePhone && !inKitchen) {
      // ¿cabe la barra al costado derecho? así el canvas no pierde altura
      const wFull = Math.max(200, Math.min(holder.clientWidth, (avail0 * 4) / 3, 960));
      const side = (holder.clientWidth - wFull) / 2 - 16;
      if (side >= 140) { mb.classList.add('side'); mb.style.width = Math.floor(side) + 'px'; mb.style.left = Math.floor((holder.clientWidth + wFull) / 2 + 10) + 'px'; avail = avail0; w = wFull; }
    }
    canvas.style.width = Math.floor(w) + 'px';
    $('#stage').style.width = Math.floor(w) + 'px';
    // en la cocina, la pantalla del juego usa todo el alto disponible para que la tarjeta respire
    $('#screen').style.minHeight = cabinet.classList.contains('in-kitchen') ? Math.floor(avail) + 'px' : '';
    mbKey = ''; // el tamaño cambió: recalcular la letra de la barra en el próximo cuadro
    const ppl = w / W;
    FS_BUMP = ppl < 1.55 ? 2 : ppl < 2.2 ? 1 : 0;
  }
  function scrollToCabinet() {
    const bar = $('#audioBar'); const barH = bar && !bar.classList.contains('hidden') ? bar.offsetHeight : 0;
    const y = cabinet.getBoundingClientRect().top + window.scrollY - 18 - barH;
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
  function deviceInfo() {
    const ua = navigator.userAgent || '';
    const coarse = window.matchMedia && matchMedia('(pointer:coarse)').matches;
    const ipadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    const short = Math.min(screen.width, screen.height);
    const tablet = /iPad|Tablet/i.test(ua) || ipadOS || (coarse && short >= 600 && !/Mobi/i.test(ua));
    const mobile = !tablet && (/Mobi|Android|iPhone|iPod/i.test(ua) || coarse);
    const os = /Android/i.test(ua) ? 'Android' : (/iPhone|iPad|iPod/i.test(ua) || ipadOS) ? 'iOS' : /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'macOS' : /CrOS/i.test(ua) ? 'ChromeOS' : /Linux/i.test(ua) ? 'Linux' : 'Otro';
    return { device: tablet ? 'tablet' : mobile ? 'mobile' : 'desktop', os };
  }
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

  // Selector con TODOS los países: nombres en español del propio navegador; si no hay Intl, queda la lista fija del HTML
  (function buildCountries() {
    const R = window.HALLACA_REGIONS, sel = form.querySelector('select[name="country"]');
    if (!R || !sel || typeof Intl === 'undefined' || !Intl.DisplayNames) return;
    let dn; try { dn = new Intl.DisplayNames(['es'], { type: 'region' }); } catch (e) { return; }
    const nameOf = (c) => { try { const n = dn.of(c); return n && n !== c ? n : null; } catch (e) { return null; } };
    const opt = (c, n) => { const o = document.createElement('option'); o.value = n; o.textContent = n; o.dataset.code = c; return o; };
    const top = R.top.map((c) => [c, nameOf(c)]).filter((x) => x[1]);
    const rest = R.all.filter((c) => R.top.indexOf(c) < 0).map((c) => [c, nameOf(c)]).filter((x) => x[1])
      .sort((a, b) => a[1].localeCompare(b[1], 'es'));
    if (rest.length < 150) return; // algo raro con Intl: mejor dejar la lista fija
    const keep = sel.value;
    sel.innerHTML = '';
    const ph = document.createElement('option'); ph.value = ''; ph.textContent = '— Escoge —'; sel.appendChild(ph);
    const g1 = document.createElement('optgroup'); g1.label = 'Los más comunes'; top.forEach(([c, n]) => g1.appendChild(opt(c, n)));
    const g2 = document.createElement('optgroup'); g2.label = 'Todos los países'; rest.forEach(([c, n]) => g2.appendChild(opt(c, n)));
    sel.appendChild(g1); sel.appendChild(g2);
    const other = document.createElement('option'); other.value = 'Otro'; other.textContent = 'Otro'; sel.appendChild(other);
    if (keep) sel.value = keep;
  })();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const country = String(fd.get('country') || '');
    const countrySel = form.querySelector('select[name="country"]');
    const countryCode = (countrySel.selectedOptions[0] && countrySel.selectedOptions[0].dataset.code) || '';
    const msg = $('#regMsg'); msg.classList.remove('err');
    if (!name) { msg.textContent = 'Falta tu nombre.'; msg.classList.add('err'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { msg.textContent = 'Ese correo no se ve bien.'; msg.classList.add('err'); return; }
    if (!country) { msg.textContent = 'Escoge tu país.'; msg.classList.add('err'); return; }
    if (!fd.get('consent')) { msg.textContent = 'Necesito tu permiso para guardar tus datos.'; msg.classList.add('err'); return; }

    Music.start('title');
    const dv = deviceInfo();
    const payload = { name, email, country, countryCode, device: dv.device, os: dv.os, consent: true, consentText: $('#consentText').textContent, website: fd.get('website') || '', elapsedMs: Date.now() - formStart };
    const btn = $('#regBtn'); btn.disabled = true; msg.textContent = 'Guardando...';
    try {
      const r = await postLead(payload);
      if (r.status === 400) { msg.textContent = 'Revisa los datos, algo no cuadra.'; msg.classList.add('err'); btn.disabled = false; return; }
      if (r.status !== 200) store.set('pendingLead', payload); // el servidor falló: no castigamos a quien juega, reintentamos luego
    } catch (err) {
      store.set('pendingLead', payload);
    }
    store.set('registered', { name, country, countryCode, at: Date.now() });
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
    const rinfo = store.get('registered', {}) || {};
    const ctry = rinfo.country;
    const vis = makeVisitor(ctry, rinfo.countryCode);
    $('#visitor').textContent = vis ? 'Este año viene de visita ' + vis.name + (ctry && ctry !== 'Otro' ? ' desde ' + ctry : '') + '. Y mami y papi te están esperando con arepitas.' : '';
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
    game.score = 0; game.chismes = 0; game.hugs = 0; game.visits = 0; game.totalTime = 0; game.items = []; game.paused = false;
    const regInfo = store.get('registered', {}) || {};
    game.visitor = makeVisitor(regInfo.country, regInfo.countryCode);
    $('#kitchen').classList.add('hidden');
    show('game');
    Music.start('game'); Music.setMode('game');
    document.fonts && document.fonts.load('8px "Press Start 2P"');
    startLevel(0);
    requestAnimationFrame(() => { fit(); scrollToCabinet(); });
  });

  $('#againBtn').addEventListener('click', () => goSetup());
  $('#shareBtn').addEventListener('click', async () => {
    // Dominio oficial para compartir (aunque estés jugando en el .vercel.app)
    const url = 'https://operacion-hallaca.maisfloro.com/';
    const t = '¡Rescaté la cena de Navidad con ' + game.score + ' puntos en ¡Rescata la Hallaca! ¿Me superas?';
    if (navigator.share) { try { await navigator.share({ title: '¡Rescata la Hallaca!', text: t, url }); return; } catch (e) { /* cancelado */ } }
    window.open('https://wa.me/?text=' + encodeURIComponent(t + ' ' + url), '_blank', 'noopener');
  });

  // ---------- Audio: arranca en la PRIMERA interacción (los navegadores bloquean audio antes) ----------
  const audioBar = $('#audioBar');
  function syncAudioBar() {
    const on = Music.isRunning();
    audioBar.classList.toggle('hidden', on);
    document.body.classList.toggle('has-audio-bar', !on);
    refit();
  }
  function unlockAudio() {
    Music.start(inGame() ? (game.state === 'kitchen' ? 'kitchen' : 'game') : 'title');
    setTimeout(syncAudioBar, 120);
  }
  ['pointerdown', 'keydown', 'touchend'].forEach((ev) => window.addEventListener(ev, () => { if (!Music.isRunning()) unlockAudio(); }, { capture: true, passive: true }));
  audioBar.addEventListener('click', () => { if (Music.isMuted()) toggleMute(); unlockAudio(); });
  document.addEventListener('visibilitychange', () => { Music.setPaused(document.hidden); if (!document.hidden) setTimeout(syncAudioBar, 200); });
  syncAudioBar();

  // Solo para pruebas locales: ?debug expone el estado
  if (/[?&]debug\b/.test(location.search)) window.__h = { game, startKitchen, nextLevel };

  // Arranque
  if (store.get('registered', null)) { flushPendingLead(); goSetup(); } else show('register');
})();
