<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  play:    []
  attract: []
}>()

const selected = ref(0)
const options = [
  { label: 'PLAY',         key: 'P', action: () => emit('play')    },
  { label: 'ATTRACT MODE', key: 'A', action: () => emit('attract') },
]

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'ArrowUp'   || e.key === 'ArrowLeft')  { e.preventDefault(); selected.value = (selected.value - 1 + options.length) % options.length }
  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); selected.value = (selected.value + 1) % options.length }
  if (e.key === 'Enter' || e.key === ' ')               { e.preventDefault(); options[selected.value]?.action() }
  if (e.key === 'p' || e.key === 'P')                  { emit('play')    }
  if (e.key === 'a' || e.key === 'A')                  { emit('attract') }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="menu-overlay">
    <div class="menu-box">
      <div class="menu-title">SPACE INVADERS</div>
      <div class="menu-subtitle">SELECT MODE</div>

      <div class="menu-options">
        <div
          v-for="(opt, i) in options"
          :key="opt.key"
          class="menu-item"
          :class="{ selected: selected === i }"
          @click="opt.action()"
        >
          <span class="cursor">{{ selected === i ? '►' : ' ' }}</span>
          <span class="label">{{ opt.label }}</span>
          <span class="shortcut">[{{ opt.key }}]</span>
        </div>
      </div>

      <div class="menu-hint">↑↓ NAVIGATE  ENTER SELECT</div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

.menu-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.88);
  z-index: 20;
  font-family: 'Press Start 2P', monospace;
}

.menu-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  padding: 40px 32px;
}

.menu-title {
  color: #55FF55;
  font-size: 18px;
  letter-spacing: 4px;
  text-shadow: 0 0 16px #55FF55;
}

.menu-subtitle {
  color: #AAAAAA;
  font-size: 8px;
  letter-spacing: 3px;
}

.menu-options {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 260px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 10px;
  color: #AAAAAA;
  cursor: pointer;
  padding: 6px 0;
  transition: color 0.1s;
}

.menu-item.selected {
  color: #FFFFFF;
}

.cursor { color: #55FFFF; width: 12px; display: inline-block; }
.label  { flex: 1; }
.shortcut { color: #444466; font-size: 8px; }

.menu-hint {
  color: #333355;
  font-size: 7px;
  letter-spacing: 1px;
  margin-top: 8px;
}
</style>
