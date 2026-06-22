// Kopiert dist/index.html nach dist/404.html, damit client-seitiges Routing
// (BrowserRouter) auf GitHub Pages auch bei Deeplinks/Reloads funktioniert.
import { copyFileSync, existsSync } from 'node:fs'

const src = 'dist/index.html'
const dest = 'dist/404.html'

if (existsSync(src)) {
  copyFileSync(src, dest)
  console.log('[postbuild] dist/404.html erstellt (SPA-Fallback fuer GitHub Pages).')
} else {
  console.warn('[postbuild] dist/index.html nicht gefunden – 404.html nicht erstellt.')
}
