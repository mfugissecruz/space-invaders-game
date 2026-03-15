import { ref } from 'vue'
import type { Ref } from 'vue'
import type { GameState, GameEvent } from '@game/shared'

type SendData = { type: 'input'; action: string }

export function useWebSocket(): {
  state: Ref<GameState | null>
  events: Ref<GameEvent[]>
  send: (data: SendData) => void
  connect: (url: string) => void
} {
  const state  = ref<GameState | null>(null)
  const events = ref<GameEvent[]>([])
  let socket: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  function connect(url: string): void {
    if (socket) {
      socket.onclose = null
      socket.close()
    }

    socket = new WebSocket(url)

    socket.onmessage = (e: MessageEvent<string>) => {
      let msg: unknown
      try {
        msg = JSON.parse(e.data)
      } catch {
        return
      }

      const m = msg as { type: string }
      if (m.type === 'state') {
        state.value = msg as GameState
      } else if (m.type === 'event') {
        events.value = [...events.value, msg as GameEvent]
      }
    }

    socket.onclose = () => {
      reconnectTimer = setTimeout(() => {
        connect(url)
      }, 2000)
    }

    socket.onerror = () => {
      socket?.close()
    }
  }

  function send(data: SendData): void {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(data))
    }
  }

  const wsUrl = `ws://${window.location.host}/ws`
  connect(wsUrl)

  return { state, events, send, connect }
}
