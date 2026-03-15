<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

type Screen = 'demo' | 'hiscores' | 'howtoplay'

const SEQUENCE: Screen[]             = ['demo', 'hiscores', 'howtoplay']
const DURATIONS: Record<Screen, number> = { demo: 30000, hiscores: 8000, howtoplay: 8000 }

const currentScreen  = ref<Screen>('demo')
const screenProgress = ref(0)

let screenTimer:     ReturnType<typeof setTimeout>  | null = null
let progressInterval: ReturnType<typeof setInterval> | null = null

function nextScreen(): void {
  const idx = SEQUENCE.indexOf(currentScreen.value)
  currentScreen.value  = SEQUENCE[(idx + 1) % SEQUENCE.length]!
  screenProgress.value = 0
  startTimer()
}

function startTimer(): void {
  if (screenTimer)     clearTimeout(screenTimer)
  if (progressInterval) clearInterval(progressInterval)

  const duration = DURATIONS[currentScreen.value]
  const start    = Date.now()

  progressInterval = setInterval(() => {
    screenProgress.value = Math.min(1, (Date.now() - start) / duration)
  }, 100)

  screenTimer = setTimeout(nextScreen, duration)
}

onMounted(startTimer)
onUnmounted(() => {
  if (screenTimer)     clearTimeout(screenTimer)
  if (progressInterval) clearInterval(progressInterval)
})

const blink = ref(true)
let blinkTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => { blinkTimer = setInterval(() => { blink.value = !blink.value }, 500) })
onUnmounted(() => { if (blinkTimer) clearInterval(blinkTimer) })

const hiscores = [
  { name: 'ACE', score: 99999 },
  { name: 'GOD', score: 87430 },
  { name: 'SDG', score: 72100 },
  { name: 'MRK', score: 65880 },
  { name: 'CPU', score: 54200 },
]

const INVADER_COLORS = ['#FF5555', '#FF7700', '#5555FF']
const INVADER_PTS    = [30, 20, 10]
</script>

<template>
  <div class="attract-overlay">

    <!-- Tela 1: DEMO — banner piscante sobre o canvas do jogo -->
    <div v-if="currentScreen === 'demo'" class="attract-demo">
      <div class="attract-banner" :class="{ invisible: !blink }">
        DEMO — PRESS ENTER TO PLAY
      </div>
      <div class="attract-progress-bar">
        <div class="progress-fill" :style="{ width: (screenProgress * 100) + '%' }" />
      </div>
    </div>

    <!-- Tela 2: HI-SCORES -->
    <div v-else-if="currentScreen === 'hiscores'" class="attract-screen">
      <p class="attract-title">— HIGH SCORES —</p>
      <table class="hs-table">
        <tr v-for="(entry, i) in hiscores" :key="i" :style="{ color: i === 0 ? '#FFFF55' : '#FFFFFF' }">
          <td class="hs-rank">{{ String(i + 1).padStart(2, '0') }}</td>
          <td class="hs-name">{{ entry.name }}</td>
          <td class="hs-pts">{{ String(entry.score).padStart(6, '0') }}</td>
        </tr>
      </table>
      <div class="attract-progress-bar">
        <div class="progress-fill" :style="{ width: (screenProgress * 100) + '%' }" />
      </div>
    </div>

    <!-- Tela 3: HOW TO PLAY -->
    <div v-else-if="currentScreen === 'howtoplay'" class="attract-screen">
      <p class="attract-title">— HOW TO PLAY —</p>
      <div class="howto-controls">
        <div class="ctrl-row"><span class="key">← →</span><span class="desc">MOVE SHIP</span></div>
        <div class="ctrl-row"><span class="key">SPACE</span><span class="desc">FIRE (MAX 3)</span></div>
        <div class="ctrl-row"><span class="key">ENTER</span><span class="desc">START GAME</span></div>
      </div>
      <div class="howto-scores">
        <div v-for="(color, i) in INVADER_COLORS" :key="i" class="pts-row">
          <span class="inv-box" :style="{ background: color }" />
          <span class="inv-pts">= {{ INVADER_PTS[i] }} PTS</span>
        </div>
        <div class="pts-row">
          <span class="inv-box ufo-box" />
          <span class="inv-pts">= ??? PTS  UFO</span>
        </div>
      </div>
      <div class="attract-progress-bar">
        <div class="progress-fill" :style="{ width: (screenProgress * 100) + '%' }" />
      </div>
    </div>

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.attract-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-family: 'Press Start 2P', monospace;
  pointer-events: none;
  z-index: 10;
}

/* -- Demo banner ---------------------------------------------------------- */
.attract-demo {
  position: absolute;
  top: 0; left: 0; right: 0;
  text-align: center;
  padding-top: 10px;
}
.attract-banner {
  color: #FFFF55;
  font-size: 9px;
  letter-spacing: 2px;
  text-shadow: 0 0 8px #FFFF55;
}
.attract-banner.invisible { visibility: hidden; }

/* -- Solid screens -------------------------------------------------------- */
.attract-screen {
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.92);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 24px 32px;
  box-sizing: border-box;
}

.attract-title {
  color: #55FFFF;
  font-size: 12px;
  letter-spacing: 3px;
  margin: 0;
}

/* -- Hi-scores ------------------------------------------------------------ */
.hs-table { border-collapse: collapse; width: 50%; }
.hs-table td { padding: 6px 16px; font-size: 9px; }
.hs-rank { color: #AAAAAA; }
.hs-pts  { color: #55FF55; text-align: right; }

/* -- How to play ---------------------------------------------------------- */
.howto-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 60%;
}
.ctrl-row { display: flex; justify-content: space-between; align-items: center; }
.key  { color: #FFFF55; font-size: 9px; background: #222; padding: 4px 8px; }
.desc { color: #FFFFFF; font-size: 8px; }

.howto-scores { display: flex; flex-direction: column; gap: 8px; }
.pts-row { display: flex; align-items: center; gap: 16px; }
.inv-box { display: inline-block; width: 18px; height: 12px; border-radius: 2px; }
.ufo-box { background: #FF55FF; border-radius: 50%; }
.inv-pts { color: #FFFFFF; font-size: 9px; }

/* -- Progress bar --------------------------------------------------------- */
.attract-progress-bar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
  background: #1a1a2e;
}
.progress-fill {
  height: 100%;
  background: #55FFFF;
  transition: width 0.1s linear;
}
</style>
