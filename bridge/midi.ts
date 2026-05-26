import { EventEmitter } from 'node:events'

export type ButtonEvent =
  | { type: 'selection'; index: number }
  | { type: 'mode' }
  | { type: 'blackout' }
  | { type: 'go' }
  | { type: 'back' }
  | { type: 'standby' }

// 10-button controller layout:
//   Top row (1-6): selection — songs (song mode) or slides (slide mode)
//   Bottom row:    GO / BACK / BLANK / TOGGLE
// Keyboard fallback maps to the same actions.
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

      // BACK: Backspace, Delete, or Left-Arrow (ESC [ D)
      if (key === '\x7f' || key === '\b' || key === '\x1b[D') {
        this.emit('button', { type: 'back' }); return
      }
      // GO: Space, Enter, or Right-Arrow (ESC [ C)
      if (key === ' ' || key === '\r' || key === '\n' || key === '\x1b[C') {
        this.emit('button', { type: 'go' }); return
      }

      const k = key.toLowerCase()
      if (k >= '1' && k <= '6')   this.emit('button', { type: 'selection', index: +k - 1 })
      else if (k === 't' || k === 'm') this.emit('button', { type: 'mode' })
      else if (k === 'b')              this.emit('button', { type: 'blackout' })
      else if (k === 's')              this.emit('button', { type: 'standby' })
    })

    console.log('[input] Keyboard: 1-6=select  Space/→=GO  Backspace/←=BACK  T=toggle  B=blank  S=standby  Ctrl+C=quit')
  }
}
