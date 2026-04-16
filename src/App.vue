<script setup>
import GameLayout from './components/GameLayout.vue'
import ConsentDialog from './components/ConsentDialog.vue'
import { useConsentStore } from './store/consent.js'

const consent = useConsentStore()
</script>

<template>
  <GameLayout>
    <router-view />
  </GameLayout>

  <ConsentDialog v-if="!consent.decided" />
</template>
