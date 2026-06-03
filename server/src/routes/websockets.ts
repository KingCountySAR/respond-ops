import { upgradeWebSocket } from '@hono/node-server'
import { AuthVariables, withTextLogin } from '@server/middleware/auth.js'
import { SessionLogin } from '@server/model/auth.js'
import { Context, Hono } from 'hono'
import { WSMessageReceive } from 'hono/ws'
import { WebSocketServer } from 'ws'

interface Connection {
  login: SessionLogin
  socket: WebSocket
  connected: number
}

export class WebsocketManager {
  private connections: Record<string, Connection> = {}

  constructor(private readonly server: WebSocketServer) {
    setInterval(() => Object.values(this.connections).forEach(conn => conn.socket.send(JSON.stringify({ type: 'tick', msg: 'At the tone, coordinated universal time...'}))), 5000)
  }

  open(socket: WebSocket, id: string, login: SessionLogin) {
    console.log('open', id, login.email)
    const now = new Date().getTime()
    this.connections[id] = {
      login,
      socket,
      connected: now,
    }
    socket.send(JSON.stringify({ type: 'welcome', login: login.email }))
    this.tellAdmins({ type: 'admin.user.connect.', ...WebsocketManager.connectionToAdminData([id, this.connections[id]]) })
  }

  handleMessage(id: string, event: MessageEvent<WSMessageReceive>) {
    console.log('message', id, event.data)
    // this.connections[id]?.socket.send(event.data);
  }

  close(id: string) {
    delete this.connections[id]
    this.tellAdmins({ type: 'admin.user.disconnect.', id })
  }

  listConnections() {
    return Object.entries(this.connections).map(WebsocketManager.connectionToAdminData)
  }

  private static connectionToAdminData([id, conn]: [string, Connection]) {
    return {
      id,
      login: {
        name: conn.login.name,
        email: conn.login.email,
        orgId: conn.login.orgId,
      },
      time: conn.connected,
    }
  }

  private tellAdmins(msg: object) {
    const text = JSON.stringify(msg)
    Object.values(this.connections)
      .filter(conn => conn.login.siteAdmin)
      .forEach(conn => conn.socket.send(text))
  }
}

export function setupWebsockets(manager: WebsocketManager) {
  const routes = new Hono<{ Variables: AuthVariables }>()
  routes.get(
    '/',
    withTextLogin,
    upgradeWebSocket((c: Context) => {
      const login = c.get('login') as SessionLogin
      const id = crypto.randomUUID()
      return {
        onOpen: (_, ws) => manager.open(ws.raw as unknown as WebSocket, id, login),
        onMessage: (event) => manager.handleMessage(id, event),
        onClose: () => manager.close(id),
      }
    })
  )

  return routes
}
