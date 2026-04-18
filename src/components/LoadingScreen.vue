<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  text: { type: String, default: '正在加载中' },
  minDuration: { type: Number, default: 500 }
})

const emit = defineEmits(['done'])

const show = ref(true)

onMounted(() => {
  const start = Date.now()
  // 等所有图片/资源就绪 + 至少 minDuration ms
  const ready = new Promise(resolve => {
    if (document.readyState === 'complete') resolve()
    else window.addEventListener('load', resolve, { once: true })
  })
  const minWait = new Promise(resolve => setTimeout(resolve, props.minDuration))

  Promise.all([ready, minWait]).then(() => {
    // 额外保证从 mount 算起至少 minDuration
    const elapsed = Date.now() - start
    const remaining = Math.max(0, props.minDuration - elapsed)
    setTimeout(() => {
      show.value = false
      emit('done')
    }, remaining)
  })
})
</script>

<template>
  <Teleport to="body">
    <Transition name="loading-fade">
      <div v-if="show" class="loading-screen">
        <div class="loading-content">
          <div class="spinner"></div>
          <p class="loading-text">{{ text }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.loading-screen {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: linear-gradient(160deg, #fff0f5 0%, #fdf6ff 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f6c8cc;
  border-top-color: #F6B1B5;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.loading-text {
  margin: 0;
  font-size: 0.95rem;
  color: #c07090;
  letter-spacing: 0.05em;
}
.loading-fade-leave-active {
  transition: opacity 0.3s ease;
}
.loading-fade-leave-to {
  opacity: 0;
}
</style>
