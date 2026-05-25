import { EventEmitter } from 'node:events'

export type ButtonEvent =
  | { type: 'selection'; index: number }
  | { type: 'mode' }
  | { type: 'blackout' }
  | { type: 'go' }
  | { type: 'standby' }

export class InputSource extends EventEmitter {
  startKeyboard(): void {
    if (!process.stdin.isTTY) {
      console.log('[input] Not a TTY — keyboard fallback unavailable')
      return
    }
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    process.stdin.on('data', (key: string) => {
      if (key === '\x03') { console.log('\n[bridge] Goodbye.'); process.exit(0) }
      const k = key.toLowerCase()
      if (k >= '1' && k <= '6')        this.emit('button', { type: 'selection', index: +k - 1 })
      else if (k === 'm')              this.emit('button', { type: 'mode' })
      else if (k === 'b')              this.emit('button', { type: 'blackout' })
      else if (k === ' ' || k === '\r') this.emit('button', { type: 'go' })
      else if (k === 's')              this.emit('button', { type: 'standby' })
    })

    console.log('[input] Keyboard: 1-6=select  M=mode  B=blackout  Space=GO  S=standby  Ctrl+C=quit')
  }
}
