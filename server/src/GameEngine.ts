import type { GameState } from '@game/shared'
import { CANVAS_W } from '@game/shared'

interface MutablePlayer  { x: number; y: number; lives: number; vx: number }
interface MutableInvader { id: number; row: number; col: number; x: number; y: number; alive: boolean }
interface MutableBullet  { id: number; x: number; y: number; dy: number; owner: 'player' | 'invader'; active?: boolean }
interface MutableShield  { id: number; x: number; y: number; blocks: number[][] }
interface MutableUFO     { active: boolean; x: number; y: number; points: number }
interface PendingEvent   { type: 'event'; name: string; data?: Record<string, unknown> }

export class GameEngine {
  private _levelBase: number
  private status!: 'waiting' | 'playing' | 'gameover'
  private score!: number
  private level!: number
  private _tick!: number
  private player!: MutablePlayer
  private invaders!: MutableInvader[]
  private _direction!: number
  private invaderTimer!: number
  private _elapsed!: number
  private bullets!: MutableBullet[]
  private _bulletIdSeq!: number
  private shields!: MutableShield[]
  private ufo!: MutableUFO
  private _nextInvaderFireMs!: number
  private _invaderFireAccum!: number
  private _nextUfoCheckMs!: number
  private _ufoCheckAccum!: number
  private _pendingEvents!: PendingEvent[]
  private _attractMode = false

  constructor() {
    this._levelBase = 1
    this.reset(true)
  }

  private _buildShields(): MutableShield[] {
    const xPositions = [30, 78, 126, 174]
    return xPositions.map((sx, id) => ({
      id,
      x: sx,
      y: 200,
      blocks: [
        [3, 3, 3],
        [3, 3, 3],
      ],
    }))
  }

  private _buildInvaders(): MutableInvader[] {
    const invaders: MutableInvader[] = []
    const startX = 24
    const startY = 48
    const spacingX = 16
    const spacingY = 16
    let id = 0
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 11; col++) {
        invaders.push({ id, row, col, x: startX + col * spacingX, y: startY + row * spacingY, alive: true })
        id++
      }
    }
    return invaders
  }

  private _pointsForRow(row: number): number {
    if (row === 0) return 30
    if (row <= 2) return 20
    return 10
  }

  private _aliveCount(): number {
    return this.invaders.filter(inv => inv.alive).length
  }

  get stepMs(): number {
    const killed = this.invaders.filter(inv => !inv.alive).length
    const pct = killed / 55
    const levelPenalty = Math.min(400, (this.level - 1) * 50)
    return Math.round(Math.max(150, 800 - levelPenalty - (pct * pct) * 600))
  }

  setVelocity(vx: number): void {
    this.player.vx = vx
  }

  setAttractMode(active: boolean): void {
    this._attractMode = active
  }

  startPlaying(): void {
    this.status = 'playing'
  }

  reset(fullReset = false): void {
    if (fullReset) {
      this._levelBase = 1
    }
    this.status = fullReset ? 'waiting' : 'playing'
    this.score  = fullReset ? 0 : (this.score ?? 0)
    this.level  = this._levelBase
    this._tick  = 0
    this.player = { x: 112, y: 240, lives: 3, vx: 0 }
    this.invaders = this._buildInvaders()
    this._direction = 1
    this.invaderTimer = 0
    this._elapsed = 0
    this.bullets = []
    this._bulletIdSeq = 0
    this.shields = this._buildShields()
    this.ufo = { active: false, x: 0, y: 20, points: 0 }
    this._nextInvaderFireMs = this._randomInvaderFireDelay()
    this._invaderFireAccum  = 0
    this._nextUfoCheckMs    = this._randomUfoDelay()
    this._ufoCheckAccum     = 0
    this._pendingEvents     = []
  }

  private _randomInvaderFireDelay(): number {
    return 1000 + Math.random() * 1000
  }

  private _randomUfoDelay(): number {
    return 5000 + Math.random() * 10000
  }

  tick(deltaMs = 60): void {
    if (this.status !== 'playing') return

    this._tick++
    this._elapsed += deltaMs
    this.invaderTimer += deltaMs

    const PLAYER_SPEED = 3
    this.player.x = Math.max(8, Math.min(216,
      this.player.x + this.player.vx * PLAYER_SPEED * (deltaMs / 60)
    ))

    if (this.invaderTimer >= this.stepMs) {
      this.invaderTimer = 0
      this._stepInvaders()
    }

    this._moveBullets(deltaMs)

    this._invaderFireAccum += deltaMs
    if (this._invaderFireAccum >= this._nextInvaderFireMs) {
      this._invaderFireAccum = 0
      this._nextInvaderFireMs = this._randomInvaderFireDelay()
      this._tryInvaderFire()
    }

    this._ufoCheckAccum += deltaMs
    if (this._ufoCheckAccum >= this._nextUfoCheckMs) {
      this._ufoCheckAccum = 0
      this._nextUfoCheckMs = this._randomUfoDelay()
      if (!this.ufo.active) {
        this._spawnUfo()
      }
    }

    if (this.ufo.active) {
      this.ufo.x += 1
      if (this.ufo.x > CANVAS_W) {
        this.ufo.active = false
      }
    }

    this._detectCollisions()

    const invaded = this.invaders.some(inv => inv.alive && inv.y >= 220)
    if (invaded) {
      this.status = 'gameover'
      this._pendingEvents.push({ type: 'event', name: 'gameover' })
    }

    if (this._aliveCount() === 0) {
      this._levelBase += 1
      this.level = this._levelBase
      this.bullets = []
      this.invaders = this._buildInvaders()
      this._direction = 1
      this.invaderTimer = 0
      this.ufo = { active: false, x: 0, y: 20, points: 0 }
      this._pendingEvents.push({ type: 'event', name: 'level_clear', data: { level: this.level } })
    }
  }

  private _moveBullets(deltaMs = 60): void {
    for (const b of this.bullets) {
      if (b.owner === 'player') {
        b.y -= 4 * (deltaMs / 60)
      } else {
        b.y += 3 * (deltaMs / 60)
      }
    }
    this.bullets = this.bullets.filter(b => b.y >= 0 && b.y <= 256)
  }

  private _tryInvaderFire(): void {
    const bottomPerCol = this._bottomInvadersPerColumn()
    if (bottomPerCol.length === 0) return
    const shooter = bottomPerCol[Math.floor(Math.random() * bottomPerCol.length)]!
    this.bullets.push({
      id: this._bulletIdSeq++,
      x: shooter.x,
      y: shooter.y + 8,
      dy: 3,
      owner: 'invader',
    })
  }

  private _bottomInvadersPerColumn(): MutableInvader[] {
    const colMap = new Map<number, MutableInvader>()
    for (const inv of this.invaders) {
      if (!inv.alive) continue
      const existing = colMap.get(inv.col)
      if (existing === undefined || inv.y > existing.y) {
        colMap.set(inv.col, inv)
      }
    }
    return Array.from(colMap.values())
  }

  private _spawnUfo(): void {
    const pointOptions = [50, 100, 150, 200, 300]
    this.ufo.active = true
    this.ufo.x = 0
    this.ufo.y = 20
    this.ufo.points = pointOptions[Math.floor(Math.random() * pointOptions.length)]!
  }

  private _detectCollisions(): void {
    const remainingBullets = new Set(this.bullets.map((_, i) => i))

    for (let bi = 0; bi < this.bullets.length; bi++) {
      if (!remainingBullets.has(bi)) continue
      const b = this.bullets[bi]!

      if (b.owner === 'player') {
        for (const inv of this.invaders) {
          if (!inv.alive) continue
          if (this._aabb(b.x, b.y, 2, 6, inv.x, inv.y, 12, 8)) {
            inv.alive = false
            const pts = this._pointsForRow(inv.row)
            this.score += pts
            this._pendingEvents.push({ type: 'event', name: 'invader_killed', data: { id: inv.id, points: pts } })
            remainingBullets.delete(bi)
            break
          }
        }
        if (!remainingBullets.has(bi)) continue

        if (this.ufo.active) {
          if (this._aabb(b.x, b.y, 2, 6, this.ufo.x, this.ufo.y, 12, 8)) {
            const pts = this.ufo.points
            this.ufo.active = false
            this.score += pts
            this._pendingEvents.push({ type: 'event', name: 'ufo_killed', data: { points: pts } })
            remainingBullets.delete(bi)
            continue
          }
        }

        for (const shield of this.shields) {
          if (!remainingBullets.has(bi)) break
          for (let row = 0; row < 2; row++) {
            if (!remainingBullets.has(bi)) break
            for (let col = 0; col < 3; col++) {
              const hp = shield.blocks[row]?.[col]
              if (hp === undefined || hp <= 0) continue
              const bx = shield.x + col * 6
              const by = shield.y + row * 4
              if (this._aabb(b.x, b.y, 2, 6, bx, by, 6, 4)) {
                shield.blocks[row]![col]! -= 1
                remainingBullets.delete(bi)
                break
              }
            }
          }
        }
      } else {
        if (this._aabb(b.x, b.y, 2, 6, this.player.x, this.player.y, 12, 8)) {
          this.player.lives -= 1
          this._pendingEvents.push({ type: 'event', name: 'player_hit' })
          remainingBullets.delete(bi)
          if (this.player.lives <= 0) {
            this.status = 'gameover'
            this._pendingEvents.push({ type: 'event', name: 'gameover' })
          } else {
            this.player.x = 112
          }
          continue
        }

        for (const shield of this.shields) {
          if (!remainingBullets.has(bi)) break
          for (let row = 0; row < 2; row++) {
            if (!remainingBullets.has(bi)) break
            for (let col = 0; col < 3; col++) {
              const hp = shield.blocks[row]?.[col]
              if (hp === undefined || hp <= 0) continue
              const bx = shield.x + col * 6
              const by = shield.y + row * 4
              if (this._aabb(b.x, b.y, 2, 6, bx, by, 6, 4)) {
                shield.blocks[row]![col]! -= 1
                remainingBullets.delete(bi)
                break
              }
            }
          }
        }
      }
    }

    this.bullets = this.bullets.filter((_, i) => remainingBullets.has(i))
  }

  private _aabb(ax: number, ay: number, aw: number, ah: number,
                bx: number, by: number, bw: number, bh: number): boolean {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
  }

  private _stepInvaders(): void {
    const dx = this._direction * 16

    for (const inv of this.invaders) {
      if (inv.alive) {
        inv.x += dx
      }
    }

    const hitBorder = this.invaders.some(inv => inv.alive && (inv.x <= 8 || inv.x >= 210))

    if (hitBorder) {
      this._direction *= -1
      for (const inv of this.invaders) {
        if (inv.alive) {
          inv.y += 8
        }
      }
    }
  }

  handleInput(action: string): void {
    switch (action) {
      case 'move_left':
        this.setVelocity(-1)
        break
      case 'move_right':
        this.setVelocity(+1)
        break
      case 'start':
        if (this.status === 'waiting' || this.status === 'gameover') {
          this.reset(true)
          this.status = 'playing'
        }
        break
      case 'fire':
        if (this.status === 'playing') {
          const MAX_PLAYER_BULLETS = 3
          const activeBullets = this.bullets.filter(b => b.owner === 'player').length
          if (activeBullets < MAX_PLAYER_BULLETS) {
            this.bullets.push({
              id: this._bulletIdSeq++,
              x: this.player.x + 4,
              y: this.player.y - 4,
              dy: -4,
              owner: 'player',
              active: true,
            })
          }
        }
        break
      default:
        break
    }
  }

  getEvents(): PendingEvent[] {
    const events = this._pendingEvents
    this._pendingEvents = []
    return events
  }

  getState(): GameState {
    return {
      type:   'state',
      tick:   this._tick,
      status: this.status,
      score:  this.score,
      level:  this.level,
      player: {
        x:     this.player.x,
        y:     this.player.y,
        lives: this.player.lives,
        vx:    this.player.vx,
      },
      invaders: this.invaders.map(inv => ({
        id:    inv.id,
        x:     inv.x,
        y:     inv.y,
        row:   inv.row,
        col:   inv.col,
        alive: inv.alive,
      })),
      bullets: this.bullets.map(b => ({
        id:    b.id,
        x:     b.x,
        y:     b.y,
        owner: b.owner,
      })),
      shields: this.shields.map(s => ({
        id:     s.id,
        x:      s.x,
        y:      s.y,
        blocks: s.blocks.map(row => row.map(hp => ({ hp }))),
      })),
      ufo: {
        active: this.ufo.active,
        x:      this.ufo.x,
        points: this.ufo.points,
      },
      attractMode: this._attractMode,
    }
  }
}
