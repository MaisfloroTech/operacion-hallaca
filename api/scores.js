// /api/scores — scoreboard público.
//   GET  → top 100, ranking de países y total de jugadores (cacheado 20 s en el CDN).
//   POST → guarda el MEJOR puntaje de cada jugador (id aleatorio del navegador, nunca el correo).
// Todo vive en un solo archivo privado de Vercel Blob, escrito con ifMatch (ETag) para que
// dos partidas que terminan al mismo tiempo no se pisen.
import { put, get, BlobPreconditionFailedError } from '@vercel/blob';
import { createHash } from 'node:crypto';

const BOARD = 'scoreboard/board.json';
const MAX_SCORE = 6000;       // techo teórico del juego (ingredientes + bonos de tiempo + cocina), con margen
const MIN_SECONDS = 15;       // nadie termina 3 niveles + cocina en menos
const COOLDOWN_MS = 15000;    // un envío cada 15 s por jugador
const TOP = 100;
const BAD = /(put[ao]|mierd|verg|co[ñn]o|pendej|maric|culer|chupa|polla|joder|fuck|shit|bitch|nazi|hitler|porn|sexo)/i;

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);
const short = (id) => createHash('sha256').update(id).digest('hex').slice(0, 10); // identificador público, no reversible

async function readBoard() {
  const r = await get(BOARD, { access: 'private', useCache: false }).catch(() => null);
  if (!r || !r.stream) return { board: { v: 1, entries: {} }, etag: null };
  let board;
  try { board = JSON.parse(await new Response(r.stream).text()); } catch { board = { v: 1, entries: {} }; }
  if (!board.entries) board.entries = {};
  return { board, etag: r.blob && r.blob.etag };
}

function ranked(board) {
  return Object.entries(board.entries)
    .map(([id, e]) => ({ id, ...e }))
    .sort((a, b) => b.s - a.s || a.t - b.t || String(a.at).localeCompare(String(b.at)));
}

function countries(list) {
  const m = {};
  for (const e of list) {
    const k = e.cc || e.c || '??';
    if (!m[k]) m[k] = { cc: e.cc || '', country: e.c || 'Otro', players: 0, best: 0, bestName: '' };
    m[k].players++;
    if (e.s > m[k].best) { m[k].best = e.s; m[k].bestName = e.n; }
  }
  return Object.values(m).sort((a, b) => b.best - a.best || b.players - a.players);
}

const publicRow = (e, i) => ({ rank: i + 1, k: short(e.id), name: e.n, country: e.c, cc: e.cc, score: e.s, seconds: e.t });

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const list = ranked((await readBoard()).board);
      const cc = String((req.query && req.query.cc) || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
      const view = cc ? list.filter((e) => e.cc === cc) : list;
      res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=20, stale-while-revalidate=60');
      return res.status(200).json({
        ok: true, total: list.length, filtered: cc ? view.length : undefined, updatedAt: new Date().toISOString(),
        top: view.slice(0, TOP).map(publicRow),
        countries: countries(list).slice(0, 60),
      });
    } catch (err) {
      console.error('scores_get_failed', err?.message);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(500).json({ ok: false, error: 'storage_failed' });
    }
  }

  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const pid = String(body.pid || '');
  const score = Number(body.score);
  const seconds = Math.round(Number(body.seconds));
  let name = clean(body.name, 14).replace(/[^\p{L}\p{N} .'\-_]/gu, '').trim();
  if (!name || BAD.test(name)) name = 'Jugador';
  const country = clean(body.country, 60) || 'Otro';
  const cc = clean(body.countryCode, 2).toUpperCase().replace(/[^A-Z]/g, '');

  if (!/^[A-Za-z0-9-]{16,64}$/.test(pid)) return res.status(400).json({ ok: false, error: 'bad_player' });
  if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) return res.status(400).json({ ok: false, error: 'bad_score' });
  if (!Number.isFinite(seconds) || seconds < MIN_SECONDS || seconds > 3600) return res.status(400).json({ ok: false, error: 'bad_time' });

  try {
    for (let attempt = 0; attempt < 6; attempt++) {
      const { board, etag } = await readBoard();
      const now = new Date().toISOString();
      const prev = board.entries[pid];
      if (prev && prev.last && Date.now() - Date.parse(prev.last) < COOLDOWN_MS) {
        return res.status(429).json({ ok: false, error: 'too_fast' });
      }
      const improved = !prev || score > prev.s || (score === prev.s && seconds < prev.t);
      board.entries[pid] = improved
        ? { n: name, c: country, cc, s: score, t: seconds, at: now, last: now, g: (prev?.g || 0) + 1 }
        : { ...prev, n: name, c: country, cc, last: now, g: (prev.g || 0) + 1 };
      try {
        await put(BOARD, JSON.stringify(board), {
          access: 'private', contentType: 'application/json', addRandomSuffix: false, allowOverwrite: true,
          ...(etag ? { ifMatch: etag } : {}),
        });
      } catch (err) {
        if (err instanceof BlobPreconditionFailedError || /precondition/i.test(err?.message || '')) {
          await new Promise((r) => setTimeout(r, 60 + Math.random() * 140));
          continue; // otra partida escribió primero: releer y reintentar
        }
        throw err;
      }
      const list = ranked(board);
      const rank = list.findIndex((e) => e.id === pid) + 1;
      return res.status(200).json({ ok: true, improved, rank, total: list.length, best: board.entries[pid].s, k: short(pid) });
    }
    return res.status(503).json({ ok: false, error: 'busy' });
  } catch (err) {
    console.error('scores_post_failed', err?.message);
    return res.status(500).json({ ok: false, error: 'storage_failed' });
  }
}
