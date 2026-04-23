<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  message: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 2000
  }
})

const visible = ref(props.show)

watch(() => props.show, (newVal) => {
  visible.value = newVal
  if (newVal && props.duration > 0) {
    setTimeout(() => {
      visible.value = false
    }, props.duration)
  }
})
</script>

<template>
  <Transition name="fade">
    <div v-if="visible" class="game-toast">
      {{ message }}
    </div>
  </Transition>
</template>

<style scoped>
.game-toast {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-lg);
  font-size: var(--font-size-base);
  z-index: var(--z-toast);
  pointer-events: none;
  max-width: 80%;
  text-align: center;
  box-shadow: var(--shadow-lg);
}
</style>
