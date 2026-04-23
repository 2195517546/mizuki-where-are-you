<script setup>
import { computed, ref, watch, onUnmounted } from 'vue'
import { getImageUrl } from '../../config/constants.js'

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  success: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  message: {
    type: String,
    default: ''
  },
  showReplay: {
    type: Boolean,
    default: true
  },
  showNext: {
    type: Boolean,
    default: false
  },
  showHome: {
    type: Boolean,
    default: true
  },
  customButtons: {
    type: Array,
    default: () => []
  },
  // 第五关特殊效果
  enableGlitch: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['replay', 'next', 'home', 'custom'])

const modalTitle = computed(() => {
  if (props.title) return props.title
  return props.success ? '🎉 恭喜通关！' : '提示'
})

const modalMessage = computed(() => {
  if (props.message) return props.message
  return props.success ? '你成功完成了本关！' : ''
})

// 闪现效果
const showGlitchMzk = ref(false)
const flashRed = ref(false)
let glitchTimer = null

watch(() => props.show, (newVal) => {
  if (newVal && props.enableGlitch) {
    startGlitchEffect()
  } else {
    stopGlitchEffect()
  }
})

function startGlitchEffect() {
  glitchTimer = setInterval(() => {
    showGlitchMzk.value = true
    flashRed.value = true
    setTimeout(() => {
      showGlitchMzk.value = false
      flashRed.value = false
    }, 300)
  }, 5000)
}

function stopGlitchEffect() {
  if (glitchTimer) {
    clearInterval(glitchTimer)
    glitchTimer = null
  }
  showGlitchMzk.value = false
  flashRed.value = false
}

onUnmounted(() => {
  stopGlitchEffect()
})

function handleReplay() {
  emit('replay')
}

function handleNext() {
  emit('next')
}

function handleHome() {
  emit('home')
}

function handleCustom(action) {
  emit('custom', action)
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="result-modal-overlay" :class="{ 'flash-red': flashRed }" @click.self="handleHome">
      <div class="result-modal">
        <div class="modal-icon">
          <img
            v-if="success"
            :src="getImageUrl(showGlitchMzk ? '怪核mzk.png' : '生气mzk.png')"
            alt="成功"
            class="modal-mzk"
            :class="{ 'glitch-shake': showGlitchMzk }"
          />
          <span v-else class="modal-emoji">💡</span>
        </div>

        <h2 class="modal-title">{{ modalTitle }}</h2>
        <p v-if="modalMessage" class="modal-message">{{ modalMessage }}</p>

        <!-- 自定义内容插槽 -->
        <slot name="custom-content"></slot>

        <div class="modal-buttons">
          <button
            v-if="showReplay"
            class="game-btn game-btn-secondary"
            @click="handleReplay"
          >
            重新开始
          </button>

          <button
            v-if="showNext"
            class="game-btn game-btn-primary"
            @click="handleNext"
          >
            下一关
          </button>

          <button
            v-if="showHome"
            class="game-btn game-btn-secondary"
            @click="handleHome"
          >
            返回首页
          </button>

          <button
            v-for="(btn, index) in customButtons"
            :key="index"
            :class="['game-btn', btn.primary ? 'game-btn-primary' : 'game-btn-secondary']"
            @click="handleCustom(btn.action)"
          >
            {{ btn.label }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.result-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--color-bg-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--spacing-md);
  transition: background 0.3s;
}

.result-modal-overlay.flash-red {
  background: rgba(139, 0, 0, 0.7);
  animation: flash-red-bg 0.3s ease-out;
}

@keyframes flash-red-bg {
  0% { background: var(--color-bg-overlay); }
  50% { background: rgba(139, 0, 0, 0.7); }
  100% { background: rgba(139, 0, 0, 0.7); }
}

.result-modal {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  max-width: 400px;
  width: 100%;
  text-align: center;
  box-shadow: var(--shadow-lg);
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-icon {
  margin-bottom: var(--spacing-lg);
}

.modal-mzk {
  width: 120px;
  height: 120px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15));
  transition: filter 0.3s;
}

.modal-mzk.glitch-shake {
  animation: glitch-shake 0.3s ease-out;
  filter: drop-shadow(0 0 20px rgba(255, 0, 0, 0.8));
}

@keyframes glitch-shake {
  0%, 100% { transform: translate(0, 0); }
  10% { transform: translate(-5px, 2px) scale(1.05); }
  20% { transform: translate(5px, -2px) scale(0.95); }
  30% { transform: translate(-3px, -3px) scale(1.08); }
  40% { transform: translate(3px, 3px) scale(0.92); }
  50% { transform: translate(-2px, 1px) scale(1.03); }
  60% { transform: translate(2px, -1px) scale(0.97); }
  70% { transform: translate(-1px, -2px) scale(1.02); }
  80% { transform: translate(1px, 2px) scale(0.98); }
  90% { transform: translate(-1px, 1px) scale(1.01); }
}

.modal-emoji {
  font-size: 4rem;
  display: block;
}

.modal-title {
  font-size: var(--font-size-xl);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
  font-weight: 600;
}

.modal-message {
  font-size: var(--font-size-base);
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
  white-space: pre-wrap;
}

.modal-buttons {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.modal-buttons .game-btn {
  width: 100%;
  font-size: 1.1rem;
  font-weight: 600;
  min-height: 50px;
}

@media (max-width: 768px) {
  .result-modal {
    padding: var(--spacing-lg);
  }

  .modal-mzk {
    width: 100px;
    height: 100px;
  }

  .modal-emoji {
    font-size: 3rem;
  }

  .modal-title {
    font-size: var(--font-size-lg);
  }

  .modal-buttons .game-btn {
    font-size: 1rem;
    min-height: 45px;
  }
}
</style>
