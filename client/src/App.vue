<script setup lang="ts">
import { computed, watch, onMounted, onUnmounted } from 'vue'
import type { Action } from '@game/shared'
import { useWebSocket } from './composables/useWebSocket'
import { useInput }     from './composables/useInput'
import { useSounds }    from './composables/useSounds'
import GameCanvas  from './components/GameCanvas.vue'
import GameHUD     from './components/GameHUD.vue'
import AttractMode from './components/AttractMode.vue'
import MainMenu    from './components/MainMenu.vue'

const { state, events, send } = useWebSocket()
const { playSound } = useSounds()

const attractActive = computed(() => state.value?.attractMode === true)
const showMenu      = computed(() => state.value?.status === 'waiting' && !attractActive.value)

function handlePlay(): void {
  send({ type: 'input', action: 'start' })
}

function handleAttract(): void {
  fetch('/attract/start', { method: 'POST' }).catch(() => undefined)
}

// Stop attract on any keydown (not handled by MainMenu)
function onAnyKey(): void {
  if (attractActive.value) {
    fetch('/attract/stop', { method: 'POST' }).catch(() => undefined)
  }
}

onMounted(() => window.addEventListener('keydown', onAnyKey))
onUnmounted(() => window.removeEventListener('keydown', onAnyKey))

function sendWithSound(data: { type: 'input'; action: Action }): void {
  if (data.action === 'fire') playSound('fire')
  send(data)
}

// Don't send movement inputs when in menu or attract
const inputActive = computed(() => !showMenu.value && !attractActive.value)
useInput((data) => { if (inputActive.value) sendWithSound(data) })

watch(
  events,
  (newEvents) => {
    if (!newEvents?.length) return
    const latest = newEvents[newEvents.length - 1]
    if (latest?.name) playSound(latest.name)
  },
  { deep: false }
)
</script>

<template>
  <div id="game-container">
    <GameHUD :game-state="state" />
    <div class="canvas-wrapper">
      <GameCanvas :game-state="state" :events="events" />
      <AttractMode v-if="attractActive" />
      <MainMenu    v-if="showMenu" @play="handlePlay" @attract="handleAttract" />
    </div>
  </div>
</template>

<style>
#game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.canvas-wrapper {
  position: relative;
  display: inline-block;
}
</style>
