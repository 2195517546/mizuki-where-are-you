import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'mzk-game-progress'

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useGameStore = defineStore('game', () => {
  const saved = loadSaved()
  // completedLevels: array of completed level numbers e.g. [1, 2, 3]
  const completedLevels = ref(saved?.completedLevels ?? [])

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completedLevels: completedLevels.value }))
  }

  // true if player has started at least one level
  const hasProgress = computed(() => completedLevels.value.length > 0)

  // the next level to play (1-10)
  const nextLevel = computed(() => {
    if (completedLevels.value.length === 0) return 1
    const maxDone = Math.max(...completedLevels.value)
    return Math.min(maxDone + 1, 10)
  })

  function completeLevel(n) {
    if (!completedLevels.value.includes(n)) {
      completedLevels.value.push(n)
      persist()
    }
  }

  function isLevelUnlocked(n) {
    if (n === 1) return true
    return completedLevels.value.includes(n - 1)
  }

  function reset() {
    completedLevels.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  return { completedLevels, hasProgress, nextLevel, completeLevel, isLevelUnlocked, reset }
})
