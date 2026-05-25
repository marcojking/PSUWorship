import express from 'express'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'node:http'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import type { WSPayload } from './state.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function createBridgeServer() {
  const app = express()
  const httpServer = createServer(app)
  const wss = new WebSocketServer({ server: httpServer })

  app.get('/display',  (_, res) => res.sendFile(join(__dirname, 'pages', 'display.html')))
  app.get('/monitor',  (_, res) => res.sendFile(join(__dirname, 'pages', 'monitor.html')))
  app.get('/emulator', (_, res) => res.sendFile(join(__dirname, 'pages', 'emulator.html')))

  let lastPayload: WSPayload | null = null

  wss.on('connection', (ws) => {
    if (lastPayload) ws.send(JSON.stringify(lastPayload))
  })

  function broadcast(payload: WSPayload): void {
    lastPayload = payload
    const msg = JSON.stringify(payload)
    wss.clients.forEach(c => { if (c.readyState === WebSocket.OPEN) c.send(msg) })
  }

  function listen(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      httpServer.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          console.error(`[server] Port ${port} is in use — is another bridge instance running?`)
          process.exit(1)
        }
        reject(err)
      })
      httpServer.listen(port, () => {
        console.log(`[server] http://localhost:${port}/display  → open in Chrome → HDMI 1`)
        console.log(`[server] http://localhost:${port}/monitor  → open in Chrome → HDMI 2`)
        console.log(`[server] http://localhost:${port}/emulator → dev window`)
        resolve()
      })
    })
  }

  return { broadcast, listen }
}
