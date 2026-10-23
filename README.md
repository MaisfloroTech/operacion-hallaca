# ¡Rescata la Hallaca! · Operación Hallaca

Juego 8-bit navideño: consigue los 12 ingredientes en el mercado, la carnicería y el abasto, esquiva el chisme de los tíos y arma la hallaca venezolana paso a paso.

Hecho con ❤️ por [@maisfloro.tech](https://www.instagram.com/maisfloro.tech/)

## Cómo funciona

- **Todo el juego corre en el navegador**: canvas 256×192 escalado x3, pixel art definido en código (RLE), música chiptune original en ritmo de gaita sintetizada con Web Audio. No hay assets binarios.
- **Única llamada al servidor**: el registro (nombre, correo, país + consentimiento) → `POST /api/register`.
- **"Base de datos"**: Vercel Blob privado. Un JSON por persona en `leads/<sha256(correo)>.json`, así un mismo correo no se duplica.
- **Exportar leads**: `GET /api/leads?token=ADMIN_TOKEN` descarga un CSV (abre directo en Excel/Sheets). `&format=json` para JSON.

## Estructura

```
index.html   landing + juego + receta + privacidad
style.css    estética 8-bit
game.js      motor del juego (mapas, tíos, ingredientes, cocina)
music.js     gaita chiptune + efectos
api/register.js   guarda leads (anti-bots: honeypot + tiempo mínimo)
api/leads.js      exporta CSV protegido por ADMIN_TOKEN
```

## Variables de entorno (Vercel)

| Variable | Para qué |
|---|---|
| `BLOB_READ_WRITE_TOKEN` | Se crea sola al conectar el Blob store al proyecto |
| `ADMIN_TOKEN` | Clave para descargar los leads |

## Desarrollo local

```bash
npm i
npx vercel dev
```

Abre `http://localhost:3000/?debug` para exponer el estado en `window.__h` y probar niveles rápido.
