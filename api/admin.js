// GET /api/admin?view=leads|players — datos para el tablero privado de Mais.
//
// No usa token: solo responde cuando la petición entra por una URL interna de Vercel
// (*-maria-isabel-florez-rodriguezs-projects.vercel.app), que está detrás de
// Vercel Authentication. Por el dominio público (operacion-hallaca.maisfloro.com)
// o por operacion-hallaca.vercel.app siempre devuelve 404.
import { list, get } from '@vercel/blob';

const TEAM_SUFFIX = '-maria-isabel-florez-rodriguezs-projects.vercel.app';

function hostOf(req) {
  // solo Host: es lo que Vercel usa para enrutar (x-forwarded-host lo podría mandar cualquiera)
  return String(req.headers.host || '').toLowerCase().split(':')[0];
}

async function readJson(pathname) {
  const r = await get(pathname, { access: 'private', useCache: false }).catch(() => null);
  if (!r || !r.stream) return null;
  try { return JSON.parse(await new Response(r.stream).text()); } catch { return null; }
}

async function leads(since) {
  const out = [];
  let cursor;
  do {
    const page = await list({ prefix: 'leads/', cursor, limit: 1000 });
    // de a 25 para no abrir cientos de conexiones a la vez
    for (let i = 0; i < page.blobs.length; i += 25) {
      const batch = await Promise.all(page.blobs.slice(i, i + 25).map((b) => readJson(b.pathname)));
      out.push(...batch.filter(Boolean));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out
    .map((l) => ({
      createdAt: l.createdAt || '', name: l.name || '', email: l.email || '',
      country: l.country || '', countryCode: l.countryCode || '', device: l.device || '',
      os: l.os || '', lang: l.lang || '',
    }))
    .filter((l) => !since || Date.parse(l.createdAt) >= since)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

async function players(since) {
  const board = (await readJson('scoreboard/board.json')) || { entries: {} };
  return Object.values(board.entries || {})
    .map((e) => ({
      name: e.n || '', country: e.c || '', countryCode: e.cc || '', score: e.s || 0,
      seconds: e.t || 0, games: e.g || 1, bestAt: e.at || '', lastPlayed: e.last || e.at || '',
    }))
    .filter((p) => !since || Date.parse(p.lastPlayed) >= since)
    .sort((a, b) => b.score - a.score || a.seconds - b.seconds);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (!hostOf(req).endsWith(TEAM_SUFFIX)) return res.status(404).json({ ok: false, error: 'not_found' });
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  try {
    const view = String((req.query && req.query.view) || 'leads');
    // ?since=2026-10-20 o una fecha ISO completa: solo lo que pasó desde ahí (vacío = todo)
    const raw = String((req.query && req.query.since) || '');
    const since = raw && !Number.isNaN(Date.parse(raw)) ? Date.parse(raw) : 0;
    if (view === 'players') return res.status(200).json({ ok: true, since: since ? new Date(since).toISOString() : null, rows: await players(since) });
    if (view === 'leads') return res.status(200).json({ ok: true, since: since ? new Date(since).toISOString() : null, rows: await leads(since) });
    return res.status(400).json({ ok: false, error: 'bad_view' });
  } catch (err) {
    console.error('admin_failed', err?.message);
    return res.status(500).json({ ok: false, error: 'storage_failed' });
  }
}
