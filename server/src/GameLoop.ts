import type { GameEngine } from './GameEngine.js'
import type { WSHandler }  from './WSHandler.js'
import { AttractAI } from './AttractAI.js'

export class GameLoop {
  private engine:      GameEngine
  private wsHandler:   WSHandler
  private loopId:      ReturnType<typeof setInterval> | null = null
  private lastTime:    number | null = null
  private attractMode  = false
  private attractAI    = new AttractAI()

  constructor(engine: GameEngine, wsHandler: WSHandler) {
    this.engine    = engine
    this.wsHandler = wsHandler
  }

  startAttract(): void {
    this.attractMode = true
    this.attractAI.reset()
    this.engine.reset(true)
    this.engine.setAttractMode(true)
    this.engine.startPlaying()
  }

  stopAttract(): void {
    this.attractMode = false
    this.engine.setAttractMode(false)
    this.engine.reset(true)
  }

  start(): void {
    if (this.loopId !== null) return

    this.lastTime = Date.now()

    this.loopId = setInterval(() => {
      const now     = Date.now()
      const deltaMs = Math.min(now - (this.lastTime ?? now), 100)
      this.lastTime = now

      if (this.attractMode) {
        const state  = this.engine.getState()
        const action = this.attractAI.decide(state)
        if (action) this.engine.handleInput(action)

        if (state.status === 'gameover') {
          this.attractAI.reset()
          this.engine.reset(true)
          this.engine.startPlaying()
        }
      }

      this.engine.tick(deltaMs)
      this.wsHandler.broadcast(this.engine.getState())

      const events = this.engine.getEvents()
      for (const event of events) {
        this.wsHandler.broadcast(event)
      }
    }, 60)
  }

  stop(): void {
    if (this.loopId !== null) {
      clearInterval(this.loopId)
      this.loopId = null
    }
  }
}
