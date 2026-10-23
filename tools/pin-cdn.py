#!/usr/bin/env python3
"""Fija index.html a un commit del repo para que los estáticos se sirvan desde GitHub vía jsDelivr.

Uso:  python3 tools/pin-cdn.py <commit_sha>

- Calcula el hash SRI (sha384) de cada archivo en ESE commit (git show), así el navegador
  verifica que lo que entrega el CDN es exactamente tu código.
- Reescribe el bloque entre <!-- CDN:START --> y <!-- CDN:END --> en index.html.
- Orden de carga: cdn.jsdelivr.net -> fastly.jsdelivr.net -> copia local en Vercel.
"""
import base64
import hashlib
import re
import subprocess
import sys

REPO = 'MaisfloroTech/operacion-hallaca'
SCRIPTS = ['music.js', 'family.js', 'game.js']
STYLE = 'style.css'


def sri(sha, path):
    data = subprocess.check_output(['git', 'show', f'{sha}:{path}'])
    return 'sha384-' + base64.b64encode(hashlib.sha384(data).digest()).decode()


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    sha = subprocess.check_output(['git', 'rev-parse', sys.argv[1]]).decode().strip()
    cdn = f'https://cdn.jsdelivr.net/gh/{REPO}@{sha}/'
    files = ',\n    '.join(f"['{f}', '{sri(sha, f)}']" for f in SCRIPTS)
    css_sri = sri(sha, STYLE)
    block = f"""<!-- CDN:START (generado por tools/pin-cdn.py, commit {sha[:7]}) -->
<link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin>
<link rel="stylesheet" href="{cdn}{STYLE}" integrity="{css_sri}" crossorigin="anonymous"
  onerror="this.onerror=null;this.removeAttribute('integrity');this.removeAttribute('crossorigin');this.href='{STYLE}'">
<script>
window.HALLACA_ASSETS = {{ version: '{sha[:7]}', bases: [
  'https://cdn.jsdelivr.net/gh/{REPO}@{sha}/',
  'https://fastly.jsdelivr.net/gh/{REPO}@{sha}/',
  ''
], files: [
    {files}
] }};
</script>
<!-- CDN:END -->"""
    html = open('index.html', encoding='utf-8').read()
    new, n = re.subn(r'<!-- CDN:START.*?<!-- CDN:END -->', block, html, flags=re.S)
    if n != 1:
        sys.exit('No encontré los marcadores CDN:START / CDN:END en index.html')
    open('index.html', 'w', encoding='utf-8').write(new)
    print(f'index.html fijado a {sha[:7]}')


if __name__ == '__main__':
    main()
