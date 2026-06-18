import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import WebsocketStore, { SocketLike } from '../websocketStore'

interface TestSocket extends SocketLike {
  trigger: (name: string, event?: unknown) => void
}

function createMockSocket(bag: Set<TestSocket>): TestSocket {
  const listeners: Partial<Record<string, Array<(event: unknown) => void>>> = {}
  const socket: TestSocket = {
    addEventListener: vi.fn((name: string, cb: (event: unknown) => void) => {
      listeners[name] ??= []
      listeners[name]!.push(cb)
    }),
    send: vi.fn(),
    close: vi.fn(),
    trigger(name: string, event?: unknown) {
      bag.delete(this)
      listeners[name]?.forEach(cb => cb(event ?? {}))
    },
  }
  bag.add(socket)
  return socket
}

describe('WebsocketStore', () => {
  let sockets: Set<TestSocket>
  let store: WebsocketStore
  let socketsCreated = 0

  const getSocket = () => {
    if (sockets.size > 1) throw new Error('should only have 1 active socket');
    return sockets.values().next().value!
  }

  beforeEach(() => {
    vi.useFakeTimers()
    //vi.spyOn(console, 'log').mockImplementation(() => {})
    sockets = new Set()
    socketsCreated = 0
    store = new WebsocketStore(() => {
      const s = createMockSocket(sockets)
      socketsCreated++
      return s
    })
  })

  afterEach(() => {
    store.stop()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  async function startStore() {
    const p = store.start()
    vi.advanceTimersByTime(1)
    await p
  }

  it('starts in idle state', () => {
    expect(store.connectState).toBe('idle')
    expect(store.isConnected).toBe(false)
    expect(store.millisUntilConnect).toBeUndefined()
  })

  it('transitions to connecting after start()', async () => {
    await startStore()
    expect(store.connectState).toBe('connecting')
    expect(sockets).toHaveLength(1)
  })

  it('transitions to connected on open', async () => {
    await startStore()
    getSocket().trigger('open')
    expect(store.connectState).toBe('connected')
    expect(store.isConnected).toBe(true)
  })

  describe('reconnect backoff', () => {
    it('schedules reconnect with 500ms delay on first close', async () => {
      await startStore()
      getSocket().trigger('close')
      expect(store.millisUntilConnect).toBe(500)
      expect(store.connectAttempt).toBe(1)
    })

    it('fires reconnect after the 500ms countdown', async () => {
      await startStore()
      getSocket().trigger('close')
      vi.advanceTimersByTime(500)
      expect(socketsCreated).toBe(2)
    })

    it('doubles delay on each failure', async () => {
      await startStore()
      getSocket().trigger('close')
      expect(store.millisUntilConnect).toBe(500)  // attempt 0 → 500ms

      vi.advanceTimersByTime(500)
      getSocket().trigger('close')
      expect(store.millisUntilConnect).toBe(1000) // attempt 1 → 1000ms

      vi.advanceTimersByTime(1000)
      getSocket().trigger('close')
      expect(store.millisUntilConnect).toBe(2000) // attempt 2 → 2000ms
    })

    it('caps delay at 30 seconds', async () => {
      await startStore()
      const delays = [500, 1000, 2000, 4000, 8000, 16000]
      for (const delay of delays) {
        getSocket().trigger('close')
        vi.advanceTimersByTime(delay)
      }
      getSocket().trigger('close')
      expect(store.millisUntilConnect).toBe(30000)
    })

    it('counts down millisUntilConnect every 500ms', async () => {
      await startStore()
      getSocket().trigger('close')  // first close → 500ms delay
      vi.advanceTimersByTime(500)  // fires reconnect for 500ms delay

      getSocket().trigger('close')  // second close → 1000ms delay
      expect(store.millisUntilConnect).toBe(1000)
      vi.advanceTimersByTime(500)
      expect(store.millisUntilConnect).toBe(500)
      vi.advanceTimersByTime(500)
      expect(store.millisUntilConnect).toBeFalsy()
    })

    it('resets attempt counter on successful reconnect', async () => {
      await startStore()
      getSocket().trigger('close')
      vi.advanceTimersByTime(500)
      getSocket().trigger('open')
      expect(store.connectAttempt).toBe(0)
      expect(store.isConnected).toBe(true)
    })

    it('does not reconnect after stop()', async () => {
      await startStore()
      getSocket().trigger('close')
      store.stop()
      vi.advanceTimersByTime(500)
      expect(sockets.size).toBe(0)
    })
  })

  describe('message routing', () => {
    it('routes messages to handlers by type prefix', () => {
      const handler = { onMessage: vi.fn() }
      store.on(['activity:'], handler)
      store.processMessage(JSON.stringify({ type: 'activity:updated' }))
      expect(handler.onMessage).toHaveBeenCalledWith({ type: 'activity:updated' })
    })

    it('does not deliver messages with non-matching type', () => {
      const handler = { onMessage: vi.fn() }
      store.on(['activity:'], handler)
      store.processMessage(JSON.stringify({ type: 'user:updated' }))
      expect(handler.onMessage).not.toHaveBeenCalled()
    })

    it('delivers to multiple type prefixes on one handler', () => {
      const handler = { onMessage: vi.fn() }
      store.on(['activity:', 'user:'], handler)
      store.processMessage(JSON.stringify({ type: 'activity:updated' }))
      store.processMessage(JSON.stringify({ type: 'user:updated' }))
      expect(handler.onMessage).toHaveBeenCalledTimes(2)
    })

    it('stops delivering after off()', () => {
      const handler = { onMessage: vi.fn() }
      store.on(['activity:'], handler)
      store.off(handler)
      store.processMessage(JSON.stringify({ type: 'activity:updated' }))
      expect(handler.onMessage).not.toHaveBeenCalled()
    })

    it('silently ignores invalid JSON', () => {
      expect(() => store.processMessage('not valid json')).not.toThrow()
    })
  })
})
