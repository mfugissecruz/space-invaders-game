import { z } from 'zod'
import type { GameEngine } from './GameEngine.js'

const InputSchema = z.object({
  type:   z.literal('input'),
  action: z.enum(['move_left', 'move_right', 'fire', 'start'])
})

type WsSocket = { readyState: number; send: (data: string) => void }

interface ClientInfo {
  connectedAt: number
}

export class WSHandler {
  private clients = new Map<WsSocket, ClientInfo>()

  register(socket: WsSocket): void {
    this.clients.set(socket, { connectedAt: Date.now() })
  }

  unregister(socket: WsSocket): void {
    this.clients.delete(socket)
  }

  broadcast(data: unknown): void {
    const payload = JSON.stringify(data)
    for (const [socket] of this.clients) {
      if (socket.readyState === 1) {
        socket.send(payload)
      }
    }
  }

  handleInput(raw: string, engine: GameEngine): void {
    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return
    }
    const result = InputSchema.safeParse(parsed)
    if (!result.success) return
    engine.handleInput(result.data.action)
  }
}
