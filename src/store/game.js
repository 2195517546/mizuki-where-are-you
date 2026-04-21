import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'mzk-game-progress'

function consentAllowed() {
  return localStorage.getItem('mzk-consent') === 'yes'
}

function loadSaved() {
  if (!consentAllowed()) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const useGameStore = defineStore('game', () => {
  const saved = loadSaved()
  const completedLevels = ref(saved?.completedLevels ?? [])

  function persist() {
    if (!consentAllowed()) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completedLevels: completedLevels.value }))
  }

  const hasProgress = computed(() => completedLevels.value.length > 0)

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
    if (consentAllowed()) localStorage.removeItem(STORAGE_KEY)
  }

  function resetLevel(n) {
    completedLevels.value = completedLevels.value.filter(level => level !== n)
    persist()
  }

  return { completedLevels, hasProgress, nextLevel, completeLevel, isLevelUnlocked, reset, resetLevel }
})
