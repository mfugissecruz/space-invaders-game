<script setup lang="ts">
import { ref, watch } from 'vue'
import type { GameState } from '@game/shared'

const props = defineProps<{
  gameState: GameState | null
}>()

const hiScore       = ref(0)
const blinkContinue = ref(true)

watch(() => props.gameState?.score, (score) => {
  if (score !== undefined && score > hiScore.value) hiScore.value = score
})

setInterval(() => { blinkContinue.value = !blinkContinue.value }, 600)

function padScore(n: number | undefined): string {
  return String(n ?? 0).padStart(6, '0')
}
</script>

<template>
  <div class="hud">
    <!-- Barra superior -->
    <div class="hud-top">
      <div class="hud-col">
        <div class="hud-label">SCORE</div>
        <div class="hud-score-value">{{ padScore(gameState?.score) }}</div>
      </div>
      <div class="hud-col">
        <div class="hud-label">HI-SCORE</div>
        <div class="hud-hi-value">{{ padScore(hiScore) }}</div>
      </div>
      <div class="hud-col">
        <div class="hud-label">LEVEL</div>
        <div class="hud-level-value">{{ String(gameState?.level ?? 1).padStart(2, '0') }}</div>
      </div>
    </div>

    <!-- Barra inferior: vidas -->
    <div class="hud-bottom">
      <span class="hud-label">LIVES</span>
      <span
        v-for="n in (gameState?.player?.lives ?? 3)"
        :key="n"
        class="life-icon"
      />
    </div>

    <!-- Overlay: GAME OVER -->
    <div v-if="gameState?.status === 'gameover'" class="overlay">
      <div class="overlay-content">
        <div class="game-over-title">GAME OVER</div>
        <div class="go-score">
          <div>SCORE</div>
          <div class="hud-score-value">{{ padScore(gameState?.score) }}</div>
        </div>
        <div class="go-score">
          <div>HI-SCORE</div>
          <div class="hud-hi-value">{{ padScore(hiScore) }}</div>
        </div>
        <div class="press-continue" :class="{ 'blink-hidden': !blinkContinue }">PRESS ENTER TO CONTINUE</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.hud {
  font-family: 'Press Start 2P', monospace;
  color: #FFFFFF;
  background: #000000;
  user-select: none;
  position: relative;
  display: inline-flex;
  flex-direction: column;
  width: 768px;
}

.hud-top {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  background: #111111;
  border-bottom: 2px solid #333;
  font-size: 10px;
  letter-spacing: 2px;
}

.hud-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.hud-label {
  color: #AAAAAA;
  font-size: 8px;
}

.hud-score-value { color: #55FF55; }
.hud-hi-value    { color: #FFFF55; }
.hud-level-value { color: #55FFFF; }

.hud-bottom {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  background: #111111;
  border-top: 2px solid #333;
  font-size: 8px;
  gap: 8px;
}

.life-icon {
  display: inline-block;
  width: 12px;
  height: 10px;
  background: #55FF55;
  clip-path: polygon(50% 0%, 0% 100%, 15% 70%, 50% 90%, 85% 70%, 100% 100%);
  margin-right: 4px;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.overlay-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
}

.press-continue {
  font-size: 8px;
  color: #AAAAAA;
}

.blink-hidden {
  visibility: hidden;
}

.game-over-title {
  font-size: 16px;
  color: #FF5555;
  letter-spacing: 4px;
}

.go-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 8px;
}
</style>
