<script setup>
import { useGameStore } from '../store/game.js'
import { useRouter } from 'vue-router'
import levels from '../data/levels.json'

const emit = defineEmits(['close'])
const store = useGameStore()
const router = useRouter()

function select(level) {
  if (!store.isLevelUnlocked(level.id)) return
  emit('close')
  router.push(`/${level.id}`)
}
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="emit('close')">
      <div class="sheet">
        <div class="sheet-header">
          <span class="sheet-title">选 关</span>
          <button class="close-x" @click="emit('close')">✕</button>
        </div>

        <ul class="level-list">
          <li
            v-for="level in levels"
            :key="level.id"
            class="level-row"
            :class="{
              done: store.completedLevels.includes(level.id),
              locked: !store.isLevelUnlocked(level.id),
            }"
            @click="select(level)"
          >
            <div class="row-left">
              <span class="lv-label">第{{ level.id }}关</span>
              <span class="lv-name">{{ level.name }}</span>
            </div>
            <span class="row-status">
              <template v-if="store.completedLevels.includes(level.id)">✓</template>
              <template v-else-if="!store.isLevelUnlocked(level.id)">🔒</template>
              <template v-else>▶</template>
            </span>
          </li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 200;
}

/* Bottom sheet — slides up from bottom, mobile-native feel */
.sheet {
  width: min(480px, 100%);
  max-height: 75dvh;
  background: #fff;
  border-radius: 20px 20px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 20px 14px;
  border-bottom: 1px solid #f0e0e5;
  flex-shrink: 0;
}

.sheet-title {
  font-size: 1.15rem;
  font-weight: bold;
  color: #F6B1B5;  letter-spacing: 0.15em;
}

.close-x {
  background: none;
  border: none;
  font-size: 1.1rem;
  color: #aaa;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  touch-action: manipulation;
}

/* Scrollable list */
.level-list {
  list-style: none;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  flex: 1;
}

.level-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid #faf0f2;
  cursor: pointer;
  transition: background 0.15s;
  min-height: 60px;
  touch-action: manipulation;
}

.level-row:not(.locked):active,
.level-row:not(.locked):hover {
  background: #fff5f7;
}

.level-row.locked {
  opacity: 0.45;
  cursor: not-allowed;
}

.level-row.done .lv-label {
  color: #d97ca8;
}

.row-left {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.lv-label {
  font-size: 0.85rem;
  font-weight: bold;
  color: #6b3fa0;
  white-space: nowrap;
  flex-shrink: 0;
}

.lv-name {
  font-size: 1rem;
  color: #333;
}

.row-status {
  font-size: 1rem;
  color: #F6B1B5;
  flex-shrink: 0;
  margin-left: 8px;
}

.level-row.done .row-status {
  color: #4caf8a;
  font-weight: bold;
}
</style>
