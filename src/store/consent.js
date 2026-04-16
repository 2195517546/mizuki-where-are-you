import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const CONSENT_KEY = 'mzk-consent'

export const useConsentStore = defineStore('consent', () => {
  // 'yes' | null — 拒绝时不写 localStorage，下次进入仍会弹窗
  const value = ref(localStorage.getItem(CONSENT_KEY))

  const decided = computed(() => value.value !== null)
  const allowed = computed(() => value.value === 'yes')

  function agree() {
    value.value = 'yes'
    localStorage.setItem(CONSENT_KEY, 'yes')
  }

  function deny() {
    // 不写 localStorage，仅本次会话记录拒绝，下次打开仍弹窗
    value.value = 'no'
  }

  return { decided, allowed, agree, deny }
})
