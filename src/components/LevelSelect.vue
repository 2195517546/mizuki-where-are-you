<script setup>
import { useGameStore } from '../store/game.js'
import { useRouter } from 'vue-router'

const emit = defineEmits(['close'])
const store = useGameStore()
const router = useRouter()

function select(n) {
  if (!store.isLevelUnlocked(n)) return
  emit('close')
  router.push(`/${n}`)
}
</script>

<template>
  <div class="overlay" @click.self="emit('close')">
    <div class="modal">
      <h3 class="modal-title">选 关</h3>
      <div class="grid">
        <button
          v-for="n in 10"
          :key="n"
          class="level-btn"
          :class="{
            unlocked: store.isLevelUnlocked(n),
            done: store.completedLevels.includes(n),
            locked: !store.isLevelUnlocked(n),
          }"
          @click="select(n)"
        >
          <span class="lv-num">{{ n }}</span>
          <span v-if="store.completedLevels.includes(n)" class="badge">✓</span>
          <span v-else-if="!store.isLevelUnlocked(n)" class="badge">🔒</span>
        </button>
      </div>
      <button class="close-btn" @click="emit('close')">关闭</button>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: #fff;
  border-radius: 16px;
  padding: 32px 28px 24px;
  width: min(360px, 90vw);
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.modal-title {
  font-size: 1.4rem;
  color: #F6B1B5;
  -webkit-text-stroke: 1.5px #000;
  paint-order: stroke fill;
  margin: 0;
  letter-spacing: 0.1em;
}

.grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
  width: 100%;
}

.level-btn {
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  border: 2px solid #ddd;
  background: #f9f0ff;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: bold;
  color: #6b3fa0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s, box-shadow 0.15s;
}

.level-btn.done {
  background: #ffe0e5;
  border-color: #F6B1B5;
}

.level-btn.locked {
  background: #eee;
  color: #aaa;
  cursor: not-allowed;
}

.level-btn.unlocked:hover {
  transform: scale(1.08);
  box-shadow: 0 4px 12px rgba(160, 107, 212, 0.3);
}

.badge {
  position: absolute;
  top: 2px;
  right: 4px;
  font-size: 0.65rem;
}

.close-btn {
  padding: 8px 28px;
  border-radius: 20px;
  border: 2px solid #F6B1B5;
  background: transparent;
  color: #c07090;
  font-size: 0.95rem;
  cursor: pointer;
  transition: background 0.2s;
}

.close-btn:hover {
  background: #ffe0e5;
}
</style>
