import * as esbuild from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Bundle the Electron main + preload, resolving "@/..." to the website's src/
// so we can reuse the slide-building + chord transposition logic.
await esbuild.build({
  entryPoints: [
    path.join(__dirname, 'src/main.ts'),
    path.join(__dirname, 'src/preload.ts'),
  ],
  outdir: path.join(__dirname, 'dist'),
  outExtension: { '.js': '.cjs' },
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  external: ['electron'],
  alias: {
    '@': path.resolve(__dirname, '..', 'src'),
  },
  logLevel: 'info',
})

console.log('[build] bundled dist/main.cjs + dist/preload.cjs')
