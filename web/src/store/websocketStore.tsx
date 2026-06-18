import { action, computed, makeObservable, observable, runInAction } from 'mobx'
import { createContext, useContext } from 'react'

const RECONNECT_TICK = 500
const BACKOFF_BASE_MS = 500
const BACKOFF_MAX_MS = 30000
const BACKOFF_MULTIPLIER = 2
const CONNECT_TIMEOUT_MS = 5000

interface SocketMessageHandler {
  onMessage: (msg: { type: string }) => void;
}

export interface SocketContext {
  readonly isConnected: boolean
  readonly connectState: ConnectState
  readonly reconnectCountdownText?: string
  on(types: string[], handler: SocketMessageHandler): void
  off(handler: SocketMessageHandler): void
}

export interface SocketLike {
  addEventListener(name: 'open'|'message'|'close', listener: (event: unknown) => void): void
  addEventListener(name: 'message', listener: (event: MessageEvent<string>) => void): void
  send(data: string | ArrayBufferLike | Blob | ArrayBufferView<ArrayBufferLike>): void
  close?: () => void
}
type TimeoutType = ReturnType<typeof setTimeout>
type ConnectState = 'connecting'|'connected'|'idle'

/**
 * Provides common interface to async websocket. Provides automatic re-connection to server with observable status.
 */
export default class WebsocketStore {
  private shouldConnect: boolean = false
  private startTimeout?: TimeoutType
  private socket?: SocketLike

  @observable accessor connectState: ConnectState = 'idle'
  @observable accessor connectAttempt: number = 0
  @observable private accessor delay: number = 0
  @observable accessor millisUntilConnect: number|undefined = undefined
  private reconnectTimer?: TimeoutType

  private handlers: Array<{ handler: SocketMessageHandler, types: string[] }> = []

  constructor(private readonly socketFactory: () => SocketLike) {
    makeObservable(this)
    // autorun(() => {
    //   console.log({ state: this.connectState, attempts: this.connectAttempt });
    // });
  }

  @computed
  get isConnected() {
    return this.connectState === 'connected'
  }

  @computed
  get reconnectCountdownText() {
    // Reduce flicker in the UI by not showing short countdowns
    if (this.delay < 2000) return undefined
    return this.millisUntilConnect ? Math.ceil(this.millisUntilConnect / 1000) + 's' : undefined
  }

  on(types: string[], handler: SocketMessageHandler) {
    console.log('register handler', types)
    this.handlers = [ ...this.handlers.filter(f => f.handler !== handler), { handler, types }]
  }

  off(handler: SocketMessageHandler) {
    this.handlers = this.handlers.filter(f => f.handler !== handler)
  }

  processMessage(data: string) {
    try {
      const json = JSON.parse(data)
      for (const handler of this.handlers) {
        console.log('looking at handler', handler.types, json.type)
        if (handler.types.some(t => json.type.startsWith(t))) {
          handler.handler.onMessage(json)
        }
      }
    } catch {
      console.log('failed to parse', data)
    }
  }

  async start(): Promise<void> {
    this.shouldConnect = true
    return new Promise(resolve => {
      this.startTimeout = setTimeout(() => {
        this.startTimeout = undefined
        this.reconnect()
        resolve()
      }, 0)
    })
  }

  @action.bound
  private reconnect() {
    this.connectState = 'connecting'
    this.socket = this.socketFactory()
    // Firefox (at least) will add a backoff timeout when making multiple attempts to reconnect
    // to the socket (on top of our backoffs). Limit the length of these browser-implemented timeouts
    const connectTimer = setTimeout(() => this.socket?.close?.(), CONNECT_TIMEOUT_MS)

    this.socket.addEventListener('open', () => {
      clearTimeout(connectTimer)
      runInAction(() => {
        this.connectState = 'connected'
        this.connectAttempt = 0
      })
      // Now it is safe to send data
      this.socket?.send('Hello Server!')
    })
    this.socket.addEventListener('message', (evt) => this.processMessage(evt.data))
    this.socket.addEventListener('close', () => {
      clearTimeout(connectTimer)
      runInAction(() => this.connectState = 'idle')
      if (this.shouldConnect) {
        this.scheduleReconnect()
      }
    })
  }

  @action.bound
  private scheduleReconnect() {
    this.delay = Math.min(
      BACKOFF_BASE_MS * BACKOFF_MULTIPLIER ** this.connectAttempt,
      BACKOFF_MAX_MS
    )
    this.connectAttempt++
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
    }
    this.millisUntilConnect = this.delay
    this.reconnectTimer = setInterval(() => {
      runInAction(() => this.millisUntilConnect = this.millisUntilConnect ? this.millisUntilConnect - RECONNECT_TICK : undefined)
      if (!this.millisUntilConnect) {
        if (this.reconnectTimer) {
          clearInterval(this.reconnectTimer)
        }
        this.reconnectTimer = undefined
        if (this.shouldConnect) {
          this.reconnect()
        }
      }
    }, RECONNECT_TICK)
  }

  stop() {
    this.shouldConnect = false
    this.socket?.close?.()
    if (this.startTimeout) {
      clearTimeout(this.startTimeout)
      this.startTimeout = undefined
    }
    if (this.reconnectTimer) {
      clearInterval(this.reconnectTimer)
      this.reconnectTimer = undefined
    }
  }
}

const SocketContextInstance = createContext<SocketContext | null>(null)

export const SocketProvider = ({ store, children }: { store: SocketContext; children: React.ReactNode }) => (
  <SocketContextInstance.Provider value={store}>{children}</SocketContextInstance.Provider>
)

export const useSocketContext = () => {
  const SocketContext = useContext(SocketContextInstance)

  if (!SocketContext) {
    throw new Error('useSocketContext must be used within <SocketProvider>')
  }

  return SocketContext
}
