import type { GameState, Action, Invader } from '@game/shared'

/**
 * Hero's Journey Attract AI
 *
 * Phase progression (by alive invader count):
 *   DANGER  55–40  Overwhelmed — erratic, reactive, fires in panic
 *   CHAOS   40–25  Things heat up — rapid movement, burst fire
 *   DOUBT   15–25  Hesitation — defensive, dodges, pauses before shooting
 *   COURAGE  5–15  Found the groove — composed, precise targeting, leads shots
 *   BATTLE    0–5  Last stand — relentless pursuit, fires every opening
 */
type Phase = 'danger' | 'chaos' | 'doubt' | 'courage' | 'battle'

export class AttractAI {
  private fireTimer    = 0
  private phase: Phase = 'danger'
  private prevAvgX: number | null = null
  private fleetDir     = 1   // inferred from fleet movement
  private staggerTimer = 0   // for panic / hesitation beats

  // ─── Public API ───────────────────────────────────────────────────────────

  decide(state: GameState): Action | null {
    const { player, invaders, bullets } = state
    const alive = invaders.filter(inv => inv.alive)
    if (alive.length === 0) return null

    this.updatePhase(alive.length)
    this.trackFleetDir(alive)
    this.fireTimer++
    this.staggerTimer++

    const playerBullets = bullets.filter(b => b.owner === 'player').length
    const incoming = this.getIncomingBullets(player, bullets)
    const threat   = incoming.length > 0

    const target = this.selectTarget(player, alive)
    if (target === null) return null

    // Lead the target: offset aim by estimated next fleet step
    const lead  = this.fleetDir * 5
    const aimX  = target.x + 6 + lead        // center of target + lead
    const diff  = aimX - (player.x + 6)      // diff from player center

    switch (this.phase) {

      // ── DANGER: scared, reactive, wobbly aim ──────────────────────────────
      case 'danger': {
        // Panic dodge — but not perfectly, sometimes moves wrong direction
        if (threat) {
          const bullet = incoming[0]
          if (bullet !== undefined) {
            const safeDir = bullet.x < player.x ? 'move_right' : 'move_left'
            // 70 % of the time dodge correctly, 30 % freeze in panic
            return this.staggerTimer % 10 < 7 ? safeDir : null
          }
        }
        // Jittery movement — overshoots the target slightly
        if (Math.abs(diff) > 12) return diff > 0 ? 'move_right' : 'move_left'
        // Fires infrequently — adrenaline isn't flowing yet
        if (this.fireTimer >= 28 && playerBullets < 2) {
          this.fireTimer = 0
          return 'fire'
        }
        return null
      }

      // ── CHAOS: frantic — fast moves, burst fire, slightly imprecise ────────
      case 'chaos': {
        if (threat) {
          const bullet = incoming[0]
          if (bullet !== undefined) {
            return bullet.x < player.x ? 'move_right' : 'move_left'
          }
        }
        if (Math.abs(diff) > 6) return diff > 0 ? 'move_right' : 'move_left'
        // Burst fire: shoot as often as allowed
        if (this.fireTimer >= 14 && playerBullets < 3) {
          this.fireTimer = 0
          return 'fire'
        }
        return null
      }

      // ── DOUBT: introspective pause before committing ───────────────────────
      case 'doubt': {
        if (threat) {
          const bullet = incoming[0]
          if (bullet !== undefined) {
            return bullet.x < player.x ? 'move_right' : 'move_left'
          }
        }
        // Brief hesitation beat every 50 ticks — the "doubt" moment
        if (this.staggerTimer % 50 < 6) return null
        if (Math.abs(diff) > 5) return diff > 0 ? 'move_right' : 'move_left'
        if (this.fireTimer >= 20 && playerBullets < 3) {
          this.fireTimer = 0
          return 'fire'
        }
        return null
      }

      // ── COURAGE: composed, methodical, precise shots ───────────────────────
      case 'courage': {
        if (threat) {
          const bullet = incoming[0]
          if (bullet !== undefined) {
            return bullet.x < player.x ? 'move_right' : 'move_left'
          }
        }
        if (Math.abs(diff) > 3) return diff > 0 ? 'move_right' : 'move_left'
        if (this.fireTimer >= 13 && playerBullets < 3) {
          this.fireTimer = 0
          return 'fire'
        }
        return null
      }

      // ── BATTLE: relentless — last invaders, no mercy ───────────────────────
      case 'battle': {
        // Still dodge — even heroes don't stand in the way of bullets
        if (threat) {
          const bullet = incoming[0]
          if (bullet !== undefined) {
            return bullet.x < player.x ? 'move_right' : 'move_left'
          }
        }
        // Tight alignment — chase them down
        if (Math.abs(diff) > 2) return diff > 0 ? 'move_right' : 'move_left'
        // Fire at every opportunity
        if (this.fireTimer >= 9 && playerBullets < 3) {
          this.fireTimer = 0
          return 'fire'
        }
        return null
      }
    }
  }

  reset(): void {
    this.fireTimer    = 0
    this.phase        = 'danger'
    this.prevAvgX     = null
    this.fleetDir     = 1
    this.staggerTimer = 0
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private updatePhase(aliveCount: number): void {
    if      (aliveCount >= 40) this.phase = 'danger'
    else if (aliveCount >= 25) this.phase = 'chaos'
    else if (aliveCount >= 15) this.phase = 'doubt'
    else if (aliveCount >= 5)  this.phase = 'courage'
    else                       this.phase = 'battle'
  }

  /** Infer fleet horizontal direction from average X change */
  private trackFleetDir(alive: readonly Invader[]): void {
    if (alive.length === 0) return
    const avgX = alive.reduce((s, inv) => s + inv.x, 0) / alive.length
    if (this.prevAvgX !== null) {
      const delta = avgX - this.prevAvgX
      if (Math.abs(delta) > 1) this.fleetDir = delta > 0 ? 1 : -1
    }
    this.prevAvgX = avgX
  }

  /** Bullets that are within striking range of the player */
  private getIncomingBullets(
    player: GameState['player'],
    bullets: GameState['bullets'],
  ): GameState['bullets'] {
    return bullets.filter(
      b => b.owner === 'invader'
        && b.y > player.y - 90
        && b.y < player.y
        && Math.abs(b.x - (player.x + 6)) < 22,
    )
  }

  /**
   * Select the best target for current phase.
   *
   * courage / battle → invader closest to player (hunt them down)
   * others          → lowest invader in the column nearest the player
   *                   (most threatening / most likely to invade)
   */
  private selectTarget(
    player: GameState['player'],
    alive: readonly Invader[],
  ): Invader | null {
    if (alive.length === 0) return null

    if (this.phase === 'courage' || this.phase === 'battle') {
      // Target the invader physically closest to the player
      return alive.reduce((best, inv) =>
        Math.abs(inv.x + 6 - (player.x + 6)) < Math.abs(best.x + 6 - (player.x + 6))
          ? inv
          : best,
      )
    }

    // Build bottom-of-column map
    const colMap = new Map<number, Invader>()
    for (const inv of alive) {
      const existing = colMap.get(inv.col)
      if (existing === undefined || inv.y > existing.y) {
        colMap.set(inv.col, inv)
      }
    }
    const bottomRow = Array.from(colMap.values())

    // Among bottom invaders, pick the column closest to the player
    return bottomRow.reduce((best, inv) =>
      Math.abs(inv.x + 6 - (player.x + 6)) < Math.abs(best.x + 6 - (player.x + 6))
        ? inv
        : best,
    )
  }
}
