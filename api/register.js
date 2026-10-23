// POST /api/register — guarda un lead (nombre, correo, país) en Vercel Blob privado.
// Un archivo por correo (hash SHA-256): si la persona vuelve a registrarse, no se duplica.
import { put, head } from '@vercel/blob';
import { createHash } from 'node:crypto';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(v, max) {
  return String(v ?? '').replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, max);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Anti-bots: campo trampa invisible + tiempo mínimo llenando el formulario
  if (body.website) return res.status(200).json({ ok: true });
  const elapsed = Number(body.elapsedMs || 0);
  if (elapsed && elapsed < 1500) return res.status(200).json({ ok: true });

  const name = clean(body.name, 60);
  const email = clean(body.email, 120).toLowerCase();
  const country = clean(body.country, 60);
  const countryCode = clean(body.countryCode, 2).toUpperCase().replace(/[^A-Z]/g, '');
  const consent = body.consent === true;

  if (!name || !EMAIL_RE.test(email) || !country) {
    return res.status(400).json({ ok: false, error: 'invalid_fields' });
  }
  if (!consent) {
    return res.status(400).json({ ok: false, error: 'consent_required' });
  }

  const id = createHash('sha256').update(email).digest('hex').slice(0, 32);
  const pathname = `leads/${id}.json`;

  try {
    const exists = await head(pathname).catch(() => null);
    if (exists) return res.status(200).json({ ok: true, returning: true });

    const record = {
      name,
      email,
      country,
      countryCode,
      consent: true,
      consentText: clean(body.consentText, 400),
      character: clean(body.character, 30),
      device: ['mobile', 'tablet', 'desktop'].includes(body.device) ? body.device : 'desconocido',
      os: clean(body.os, 20),
      lang: clean(req.headers['accept-language'], 40).split(',')[0],
      createdAt: new Date().toISOString(),
      source: 'rescata-la-hallaca',
    };

    await put(pathname, JSON.stringify(record), {
      access: 'private',
      contentType: 'application/json',
      addRandomSuffix: false,
      allowOverwrite: false,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('register_failed', err?.message);
    return res.status(500).json({ ok: false, error: 'storage_failed' });
  }
}
