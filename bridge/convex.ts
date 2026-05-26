import { ConvexHttpClient } from 'convex/browser'
import type { BridgeState, LiveSetlist } from './state.js'

let client: ConvexHttpClient | null = null

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _api: any = null

export async function initConvex(url: string): Promise<void> {
  client = new ConvexHttpClient(url)
  _api = await import('../convex/_generated/api.js')
  console.log('[convex] Connected to', url)
}

export function pushSession(state: BridgeState): void {
  if (!client || !_api) return
  client.mutation(_api.api.liveSession.update, {
    currentSong:  state.currentSong,
    currentSlide: state.currentSlide,
    queuedSong:   state.queuedSong,
    queuedSlide:  state.queuedSlide,
    mode:         state.mode,
    isBlackout:   state.isBlackout,
    isLive:       state.isLive,
  }).catch((err: Error) => console.error('[convex] session update failed:', err.message))
}

export async function loadSetlist(): Promise<LiveSetlist | null> {
  if (!client || !_api) return null
  try {
    return (await client.query(_api.api.liveSetlist.get, {})) as LiveSetlist | null
  } catch (err: unknown) {
    console.error('[convex] failed to load setlist:', (err as Error).message)
    return null
  }
}
