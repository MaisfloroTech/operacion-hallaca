/* Música chiptune ORIGINAL en ritmo de gaita (6/8) + efectos de sonido.
 * Todo se sintetiza en vivo con Web Audio: no hay archivos de audio.
 * Instrumentos imitados: furro (bajo triangular), charrasca (ruido agudo),
 * tambora (golpe grave + borde), cuatro (acordes cortos en pulso) y la voz líder (onda cuadrada).
 */
(function () {
  'use strict';
  const NOTE = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  function freq(n) {
    const m = /^([A-G]#?)(\d)$/.exec(n);
    if (!m) return 0;
    const midi = 12 * (Number(m[2]) + 1) + NOTE[m[1]];
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // 16 compases de 6/8 (6 corcheas). "nota:duración-en-corcheas", "-" = silencio.
  const MELODY = [
    'A4:1 D5:1 F#5:1 A5:2 F#5:1', 'G5:1 F#5:1 E5:1 D5:3',
    'C#5:1 E5:1 A5:1 G5:2 F#5:1', 'E5:3 -:1 A4:1 C#5:1',
    'E5:1 G5:1 F#5:1 E5:2 C#5:1', 'A4:1 B4:1 C#5:1 E5:2 G5:1',
    'F#5:2 E5:1 D5:1 F#5:1 A5:1', 'D6:3 -:3',
    'B5:2 A5:1 G5:2 D5:1', 'B4:1 D5:1 G5:1 B5:3',
    'A5:2 F#5:1 D5:2 A4:1', 'D5:1 E5:1 F#5:1 A5:3',
    'G5:1 F#5:1 E5:1 C#5:2 E5:1', 'A5:2 G5:1 E5:2 C#5:1',
    'D5:1 F#5:1 A5:1 F#5:1 E5:1 C#5:1', 'D5:3 -:3',
  ].map((bar) => bar.split(' ').map((t) => { const [n, d] = t.split(':'); return { n, d: Number(d) }; }));

  const CHORDS = {
    D: { root: 'D2', fifth: 'A2', notes: ['D4', 'F#4', 'A4'] },
    A: { root: 'A2', fifth: 'E2', notes: ['C#4', 'E4', 'A4'] },
    A7: { root: 'A2', fifth: 'E2', notes: ['C#4', 'E4', 'G4'] },
    G: { root: 'G2', fifth: 'D3', notes: ['B3', 'D4', 'G4'] },
  };
  const PROG = ['D', 'D', 'A', 'A', 'A', 'A7', 'D', 'D', 'G', 'G', 'D', 'D', 'A', 'A7', 'D', 'D'];

  const MODES = {
    title: { eighth: 0.19, lead: 'square', leadOct: 1, leadVol: 0.07 },
    game: { eighth: 0.155, lead: 'square', leadOct: 1, leadVol: 0.075 },
    kitchen: { eighth: 0.175, lead: 'triangle', leadOct: 1, leadVol: 0.12 },
  };

  let ctx = null, master = null, musicBus = null, sfxBus = null, noiseBuf = null;
  let timer = null, step = 0, nextTime = 0, mode = 'title', playing = false;
  let muted = false;
  try { muted = localStorage.getItem('hallaca.muted') === '1'; } catch (e) { /* sin storage */ }

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = muted ? 0 : 0.9; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.85; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return ctx;
  }

  function tone(type, f, t, dur, vol, bus, slideTo) {
    if (!f) return;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.setValueAtTime(vol, t + Math.max(0.01, dur * 0.6));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus || musicBus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(t, dur, vol, filterType, fq, q, bus) {
    const s = ctx.createBufferSource(); s.buffer = noiseBuf;
    s.playbackRate.value = 0.8 + Math.random() * 0.4;
    const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = fq; f.Q.value = q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(bus || musicBus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  function octave(n, shift) {
    if (!shift) return n;
    return n.replace(/(\d)$/, (d) => String(Number(d) + shift));
  }

  function scheduleStep(s, t) {
    const cfg = MODES[mode];
    const E = cfg.eighth;
    const bar = Math.floor(s / 6) % 16;
    const pos = s % 6;
    const ch = CHORDS[PROG[bar]];

    // Furro: bum (1) – ba (3) bum (4) – ba (6)
    if (pos === 0) tone('triangle', freq(ch.root), t, E * 1.6, 0.32);
    if (pos === 2) tone('triangle', freq(ch.fifth), t, E * 0.7, 0.2);
    if (pos === 3) tone('triangle', freq(ch.root), t, E * 1.2, 0.28);
    if (pos === 5) tone('triangle', freq(ch.fifth), t, E * 0.7, 0.2);

    // Charrasca: todas las corcheas, acento en 1 y 4, rasguño extra a mitad de 3 y 6
    noise(t, 0.035, pos === 0 || pos === 3 ? 0.11 : 0.06, 'highpass', 6500, 0.7);
    if (pos === 2 || pos === 5) noise(t + E / 2, 0.03, 0.05, 'highpass', 7000, 0.7);

    // Tambora: golpe grave en 1, borde de madera en 5
    if (pos === 0) { tone('sine', 110, t, 0.18, 0.35, musicBus, 50); noise(t, 0.06, 0.12, 'lowpass', 400, 1); }
    if (pos === 4) noise(t, 0.05, 0.1, 'bandpass', 1800, 6);

    // Cuatro: rasgueo corto en contratiempo (2,3 y 5,6)
    if (pos === 1 || pos === 2 || pos === 4 || pos === 5) {
      const v = pos === 1 || pos === 4 ? 0.035 : 0.025;
      ch.notes.forEach((n, i) => tone('square', freq(n), t + i * 0.008, E * 0.45, v));
    }

    // Melodía
    let acc = 0;
    for (const nt of MELODY[bar]) {
      if (acc === pos && nt.n !== '-') {
        const f = freq(octave(nt.n, cfg.leadOct - 1));
        tone(cfg.lead, f, t, E * nt.d * 0.92, cfg.leadVol);
        // eco suave estilo coro
        tone(cfg.lead, f / 2, t + 0.01, E * nt.d * 0.8, cfg.leadVol * 0.35);
      }
      acc += nt.d;
    }
  }

  function tick() {
    const cfg = MODES[mode];
    while (nextTime < ctx.currentTime + 0.15) {
      scheduleStep(step, nextTime);
      nextTime += cfg.eighth;
      step = (step + 1) % (16 * 6);
    }
  }

  function start(m) {
    if (!ensure()) return;
    if (ctx.state === 'suspended') ctx.resume();
    if (m) mode = m;
    if (playing) return;
    playing = true; step = 0; nextTime = ctx.currentTime + 0.08;
    timer = setInterval(tick, 25);
  }
  function setMode(m) { if (MODES[m]) mode = m; }
  function stop() { playing = false; clearInterval(timer); timer = null; }

  const SFX = {
    pick() { const t = ctx.currentTime; tone('square', 988, t, 0.06, 0.12, sfxBus); tone('square', 1319, t + 0.06, 0.12, 0.12, sfxBus); },
    bump() { const t = ctx.currentTime; tone('square', 220, t, 0.12, 0.12, sfxBus, 110); noise(t, 0.08, 0.1, 'lowpass', 900, 1, sfxBus); },
    gift() { const t = ctx.currentTime; [784, 988, 1175, 1568].forEach((f, i) => tone('square', f, t + i * 0.05, 0.08, 0.1, sfxBus)); },
    good() { const t = ctx.currentTime; tone('square', 660, t, 0.08, 0.12, sfxBus); tone('square', 880, t + 0.08, 0.14, 0.12, sfxBus); },
    bad() { const t = ctx.currentTime; tone('square', 196, t, 0.14, 0.12, sfxBus); tone('square', 147, t + 0.14, 0.22, 0.12, sfxBus); },
    level() { const t = ctx.currentTime; ['D5', 'F#5', 'A5', 'D6', 'A5', 'D6'].forEach((n, i) => tone('square', freq(n), t + i * 0.09, 0.12, 0.11, sfxBus)); },
    lose() { const t = ctx.currentTime; ['A4', 'G#4', 'G4', 'F#4'].forEach((n, i) => tone('square', freq(n), t + i * 0.2, 0.22, 0.12, sfxBus)); },
    win() { const t = ctx.currentTime; ['D5', 'D5', 'D5', 'A5', 'F#5', 'A5', 'D6'].forEach((n, i) => tone('square', freq(n), t + i * 0.11, 0.14, 0.12, sfxBus)); },
    select() { const t = ctx.currentTime; tone('square', 1047, t, 0.05, 0.08, sfxBus); },
  };
  function sfx(name) { if (!ensure() || !SFX[name]) return; if (ctx.state === 'suspended') ctx.resume(); SFX[name](); }

  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem('hallaca.muted', muted ? '1' : '0'); } catch (e) { /* nada */ }
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.9, ctx.currentTime, 0.02);
    return muted;
  }

  window.Music = { start, stop, setMode, sfx, toggleMute, isMuted: () => muted };
})();
