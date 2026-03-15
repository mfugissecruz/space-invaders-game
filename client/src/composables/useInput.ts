import { onMounted, onUnmounted } from 'vue'
import type { Action } from '@game/shared'

type SendFn = (data: { type: 'input'; action: Action }) => void

export function useInput(send: SendFn): void {
  const keys: Record<'ArrowLeft' | 'ArrowRight', boolean> = {
    ArrowLeft:  false,
    ArrowRight: false,
  }
  let intervalId: ReturnType<typeof setInterval> | null = null

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      keys[e.key as 'ArrowLeft' | 'ArrowRight'] = true
      e.preventDefault()
    } else if (e.key === ' ') {
      send({ type: 'input', action: 'fire' })
      e.preventDefault()
    } else if (e.key === 'Enter') {
      send({ type: 'input', action: 'start' })
      e.preventDefault()
    }
  }

  function onKeyup(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      keys[e.key as 'ArrowLeft' | 'ArrowRight'] = false
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown)
    window.addEventListener('keyup',   onKeyup)

    intervalId = setInterval(() => {
      if (keys.ArrowLeft && !keys.ArrowRight)
        send({ type: 'input', action: 'move_left' })
      else if (keys.ArrowRight && !keys.ArrowLeft)
        send({ type: 'input', action: 'move_right' })
    }, 16)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
    window.removeEventListener('keyup',   onKeyup)
    if (intervalId) clearInterval(intervalId)
  })
}
