// GET /api/leads?token=ADMIN_TOKEN[&format=json] — exporta los leads como CSV (por defecto) o JSON.
// El token vive en la variable de entorno ADMIN_TOKEN del proyecto en Vercel.
import { list, get } from '@vercel/blob';
import { timingSafeEqual } from 'node:crypto';

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

async function readJson(pathname) {
  const r = await get(pathname, { access: 'private', useCache: false });
  if (!r || !r.stream) return null;
  const text = await new Response(r.stream).text();
  try { return JSON.parse(text); } catch { return null; }
}

function csvCell(v) {
  let s = String(v ?? '');
  if (/^[=+\-@]/.test(s)) s = "'" + s; // evita inyección de fórmulas en Excel/Sheets
  return '"' + s.replace(/"/g, '""') + '"';
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  // CORS: el dashboard (artefacto en claude.ai) lee esto desde el navegador. Igual exige el token.
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();
  const auth = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const token = auth || req.query.token;
  if (!process.env.ADMIN_TOKEN || !safeEqual(token, process.env.ADMIN_TOKEN)) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }

  const leads = [];
  let cursor;
  do {
    const page = await list({ prefix: 'leads/', cursor, limit: 1000 });
    const batch = await Promise.all(page.blobs.map((b) => readJson(b.pathname).catch(() => null)));
    leads.push(...batch.filter(Boolean));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);

  leads.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));

  if (req.query.format === 'json') {
    return res.status(200).json({ ok: true, total: leads.length, leads });
  }

  const cols = ['createdAt', 'name', 'email', 'country', 'device', 'os', 'lang', 'consent', 'source'];
  const csv = [cols.join(',')]
    .concat(leads.map((l) => cols.map((c) => csvCell(l[c])).join(',')))
    .join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="leads-hallaca.csv"');
  return res.status(200).send('﻿' + csv);
}
