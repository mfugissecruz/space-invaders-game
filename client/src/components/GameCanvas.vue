<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { GameState, GameEvent, Invader } from '@game/shared'
import { CANVAS_W, CANVAS_H, SCALE } from '@game/shared'

const props = defineProps<{
  gameState: GameState | null
  events:    GameEvent[]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let animFrameId: number | null = null

function drawSprite(
  ctx: CanvasRenderingContext2D,
  sprite: readonly (readonly number[])[],
  originX: number,
  originY: number,
  palette: readonly string[]
): void {
  sprite.forEach((row, py) => {
    row.forEach((colorIdx, px) => {
      if (colorIdx === 0) return
      ctx.fillStyle = palette[colorIdx] ?? ''
      ctx.fillRect(
        (originX + px) * SCALE,
        (originY + py) * SCALE,
        SCALE, SCALE
      )
    })
  })
}

function drawScanlines(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
  for (let y = 0; y < CANVAS_H * SCALE; y += 2) {
    ctx.fillRect(0, y, CANVAS_W * SCALE, 1)
  }
}

function drawDangerBorder(ctx: CanvasRenderingContext2D, invaders: readonly Invader[]): void {
  const danger = invaders.some(inv => inv.alive && inv.y >= 180)
  if (!danger) return
  const visible = Math.sin(Date.now() / 200) > 0
  if (!visible) return
  ctx.strokeStyle = 'rgba(255, 0, 0, 0.4)'
  ctx.lineWidth = 8
  ctx.strokeRect(4, 4, CANVAS_W * SCALE - 8, CANVAS_H * SCALE - 8)
}

const SPRITE_PLAYER = [
  [0,0,0,0,0,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,0,0,0,0],
  [0,0,0,0,1,1,1,0,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,0],
  [1,1,1,1,1,1,1,1,1,1,1],
  [1,1,1,1,1,1,1,1,1,1,1],
  [1,0,1,0,0,0,0,0,1,0,1],
  [0,0,1,0,0,0,0,0,1,0,0],
]

const SPRITE_INV_A = [
  [
    [0,0,1,0,0,0,0,0,1,0,0],
    [0,0,0,1,0,0,0,1,0,0,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,1,1,0,1,1,1,0,1,1,0],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,0,1,1,1,1,1,1,1,0,1],
    [1,0,1,0,0,0,0,0,1,0,1],
    [0,0,0,1,1,0,1,1,0,0,0],
  ],
  [
    [0,0,1,0,0,0,0,0,1,0,0],
    [1,0,0,1,0,0,0,1,0,0,1],
    [1,0,1,1,1,1,1,1,1,0,1],
    [1,1,1,0,1,1,1,0,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,0,0,0,0,0,1,0,0],
    [0,1,0,0,0,0,0,0,0,1,0],
  ]
]

const SPRITE_INV_B = [
  [
    [0,0,0,1,0,0,0,1,0,0,0],
    [0,0,0,0,1,0,1,0,0,0,0],
    [0,0,0,1,1,1,1,1,0,0,0],
    [0,0,1,1,0,1,0,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,1,0,1,1,1,1,1,0,1,0],
    [0,1,0,1,0,0,0,1,0,1,0],
    [0,0,0,0,1,0,1,0,0,0,0],
  ],
  [
    [0,0,0,1,0,0,0,1,0,0,0],
    [1,0,0,0,1,0,1,0,0,0,1],
    [1,0,0,1,1,1,1,1,0,0,1],
    [1,0,1,1,0,1,0,1,1,0,1],
    [0,1,1,1,1,1,1,1,1,1,0],
    [0,0,1,1,1,1,1,1,1,0,0],
    [0,0,1,0,0,0,0,0,1,0,0],
    [0,1,0,0,0,0,0,0,0,1,0],
  ]
]

const SPRITE_INV_C = [
  [
    [0,1,1,0,0,0,0,0,1,1,0],
    [1,1,1,1,0,0,0,1,1,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,1,0,1,1,1,1,1,0,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [0,0,1,1,0,0,0,1,1,0,0],
    [0,1,1,0,1,0,1,0,1,1,0],
    [1,1,0,0,0,0,0,0,0,1,1],
  ],
  [
    [0,1,1,0,0,0,0,0,1,1,0],
    [0,0,1,1,0,0,0,1,1,0,0],
    [0,1,1,1,1,1,1,1,1,1,0],
    [1,1,0,1,1,1,1,1,0,1,1],
    [1,1,1,1,1,1,1,1,1,1,1],
    [1,0,1,1,0,0,0,1,1,0,1],
    [1,0,0,0,1,0,1,0,0,0,1],
    [0,0,1,1,0,0,0,1,1,0,0],
  ]
]

const SPRITE_UFO = [
  [0,0,0,0,1,1,1,1,1,1,0,0,0,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,0,0,0,0],
  [0,0,1,1,2,1,2,1,2,1,2,1,1,0,0,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [1,1,2,1,1,2,1,1,2,1,1,2,1,1,1,0],
  [0,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
  [0,0,1,0,1,0,0,0,0,0,1,0,1,0,0,0],
]

const SPRITE_BULLET_PLAYER  = [[1],[1],[1],[1]]
const SPRITE_BULLET_INVADER = [[1],[2],[2],[1]]

const SHIELD_STATES = [
  [[1,1,1,1],[1,1,1,1],[1,1,1,1]],
  [[1,1,1,1],[1,0,1,0],[0,1,0,1]],
  [[1,0,1,0],[0,0,0,1],[1,0,0,0]],
]

const SPRITE_EXPLOSION = [
  [0,1,0,0,1,0,1,0,0,1,0],
  [0,0,1,0,0,1,0,0,1,0,0],
  [1,0,0,1,0,0,0,1,0,0,1],
  [0,0,1,0,1,1,1,0,1,0,0],
  [0,1,0,1,1,1,1,1,0,1,0],
  [1,0,0,1,1,1,1,1,0,0,1],
  [0,0,1,0,1,1,1,0,1,0,0],
  [0,1,0,0,1,0,1,0,0,1,0],
]

// Starfield — deterministic, generated once
const stars = Array.from({ length: 60 }, (_, i) => ({
  x: (i * 37 + 13) % CANVAS_W,
  y: (i * 53 + 7)  % CANVAS_H,
  brightness: i % 3
}))
const STAR_COLORS = ['#222244', '#444466', '#8888AA']

// Active explosion entries: { x, y, ttl }
const explosions = ref<{ x: number; y: number; ttl: number }[]>([])

// Watch incoming events and create explosion entries
watch(
  () => props.events,
  (newEvents) => {
    if (!newEvents || !newEvents.length) return
    const latest = newEvents[newEvents.length - 1]
    if (!latest) return

    const gs = props.gameState
    if (!gs) return

    if (latest.name === 'invader_killed' && gs.invaders) {
      let ex: number | null = null
      let ey: number | null = null
      if (latest.data && latest.data['x'] != null && latest.data['y'] != null) {
        ex = latest.data['x'] as number
        ey = latest.data['y'] as number
      } else {
        const id = latest.data && latest.data.id != null ? latest.data.id : null
        let inv = null
        if (id != null) {
          inv = gs.invaders.find((i) => i.id === id)
        }
        if (!inv) {
          inv = gs.invaders.find((i) => !i.alive)
        }
        if (inv) {
          ex = inv.x
          ey = inv.y
        }
      }
      if (ex != null && ey != null) {
        explosions.value.push({ x: ex, y: ey, ttl: 8 })
      }
    } else if (latest.name === 'player_hit' && gs.player) {
      explosions.value.push({ x: gs.player.x, y: gs.player.y, ttl: 8 })
    }
  },
  { deep: false }
)

function draw() {
  const canvas = canvasRef.value
  if (!canvas) return

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.imageSmoothingEnabled = false

  // Background — physical coordinates directly
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, CANVAS_W * SCALE, CANVAS_H * SCALE)

  // Starfield — drawn before any sprite
  stars.forEach(star => {
    ctx.fillStyle = STAR_COLORS[star.brightness] ?? '#222244'
    ctx.fillRect(star.x * SCALE, star.y * SCALE, SCALE, SCALE)
  })

  const gs = props.gameState
  if (!gs || gs.status === 'waiting') return

  const frame = gs.tick && gs.tick % 60 < 30 ? 0 : 1

  // 1. Shields
  if (gs.shields) {
    for (const shield of gs.shields) {
      const blocks = shield.blocks
      if (!blocks) continue
      // blocks[by][bx] — rows then cols
      for (let by = 0; by < blocks.length; by++) {
        const blockRow = blocks[by]!
        for (let bx = 0; bx < blockRow.length; bx++) {
          const block = blockRow[bx]!
          if (block.hp <= 0) continue
          const stateIdx = block.hp === 3 ? 0 : block.hp === 2 ? 1 : 2
          const originX = shield.x + bx * 4
          const originY = shield.y + by * 3
          drawSprite(ctx, SHIELD_STATES[stateIdx]!, originX, originY, ['', '#55FFFF'])
        }
      }
    }
  }

  // 2. Invaders
  if (gs.invaders) {
    for (const inv of gs.invaders) {
      if (!inv.alive) continue
      let sprite: readonly (readonly number[])[]
      let color: string
      if (inv.row === 0) {
        sprite = SPRITE_INV_A[frame]!
        color = '#FF5555'
      } else if (inv.row <= 2) {
        sprite = SPRITE_INV_B[frame]!
        color = '#FF7700'
      } else {
        sprite = SPRITE_INV_C[frame]!
        color = '#5555FF'
      }
      drawSprite(ctx, sprite, inv.x - 5, inv.y - 4, ['', color])
    }
  }

  // 3. UFO
  if (gs.ufo && gs.ufo.active) {
    drawSprite(ctx, SPRITE_UFO, gs.ufo.x - 8, 17, ['', '#FF55FF', '#FFFFFF'])
  }

  // 4. Player
  if (gs.player) {
    drawSprite(ctx, SPRITE_PLAYER, gs.player.x - 5, gs.player.y - 4, ['', '#55FF55'])
  }

  // 5. Bullets
  if (gs.bullets) {
    for (const bullet of gs.bullets) {
      if (bullet.owner === 'player') {
        drawSprite(ctx, SPRITE_BULLET_PLAYER, bullet.x, bullet.y - 2, ['', '#FFFFFF'])
      } else {
        drawSprite(ctx, SPRITE_BULLET_INVADER, bullet.x, bullet.y - 2, ['', '#FF7700', '#FFFF55'])
      }
    }
  }

  // 6. Explosions
  const exps = explosions.value
  for (let i = exps.length - 1; i >= 0; i--) {
    const exp = exps[i]!
    exp.ttl--
    if (exp.ttl > 0) {
      drawSprite(ctx, SPRITE_EXPLOSION, exp.x - 5, exp.y - 4, ['', '#FFFF55'])
    } else {
      exps.splice(i, 1)
    }
  }

  // 7. Danger border (before scanlines)
  if (gs.invaders) {
    drawDangerBorder(ctx, gs.invaders)
  }

  // 8. Scanlines CRT — last operation
  drawScanlines(ctx)
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) return
  canvas.width  = CANVAS_W * SCALE
  canvas.height = CANVAS_H * SCALE
  canvas.style.width  = canvas.width  + 'px'
  canvas.style.height = canvas.height + 'px'

  function loop() {
    draw()
    animFrameId = requestAnimationFrame(loop)
  }
  animFrameId = requestAnimationFrame(loop)
})

onUnmounted(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId)
})
</script>

<template>
  <canvas ref="canvasRef" :width="CANVAS_W * SCALE" :height="CANVAS_H * SCALE"
    style="display:block; image-rendering:pixelated; image-rendering:crisp-edges;" />
</template>
