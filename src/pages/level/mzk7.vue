<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const BASE = 'https://faceround.cn/games/find-mzk/'

// ─── 解锁弹窗 ───
const UNLOCK_KEY = 'mzk-level7-unlocked'
const isUnlocked = ref(localStorage.getItem(UNLOCK_KEY) === 'true')
const unlockInput = ref('')
const unlockError = ref(false)

function tryUnlock() {
  if (unlockInput.value.trim() === '30') {
    localStorage.setItem(UNLOCK_KEY, 'true')
    isUnlocked.value = true
    startSlideshow()
  } else {
    unlockError.value = true
    setTimeout(() => (unlockError.value = false), 1500)
  }
}

// ─── 结算背景轮播（与第六关通关后一致） ───
const BG_SLIDES = [
  { src: 'https://faceround.cn/games/find-mzk/调查04.jpg', flash: 'https://faceround.cn/games/find-mzk/调查4.jpg' },
  { src: 'https://faceround.cn/games/find-mzk/调查05.jpg', flash: null },
  { src: 'https://faceround.cn/games/find-mzk/调查06.jpg', flash: null },
  { src: 'https://faceround.cn/games/find-mzk/调查03.jpg', flash: null },
]
const currentSlide = ref(0)
const slideOpacity = ref(1)
const flashImage = ref('')
const showFlash = ref(false)
let slideshowTimer = null

function startSlideshow() {
  currentSlide.value = 0
  slideOpacity.value = 1
  advanceSlide()
}

function advanceSlide() {
  slideshowTimer = setTimeout(() => {
    const slide = BG_SLIDES[currentSlide.value]

    if (slide.flash) {
      flashImage.value = slide.flash
      showFlash.value = true
      setTimeout(() => { showFlash.value = false }, 200)
    }

    slideOpacity.value = 0
    setTimeout(() => {
      currentSlide.value = (currentSlide.value + 1) % BG_SLIDES.length
      slideOpacity.value = 1
      advanceSlide()
    }, 1200)
  }, 3000)
}

function stopSlideshow() {
  if (slideshowTimer) { clearTimeout(slideshowTimer); slideshowTimer = null }
}

onMounted(() => {
  if (isUnlocked.value) {
    startSlideshow()
  }
})

onUnmounted(() => {
  stopSlideshow()
})

function goHome() {
  stopSlideshow()
  router.push('/index')
}
</script>

<template>
  <!-- ═══ 解锁弹窗 ═══ -->
  <Teleport to="body">
    <div v-if="!isUnlocked" class="overlay">
      <div class="unlock-card">
        <img class="unlock-mzk" :src="`${BASE}惊吓mzk.png`" alt="mzk" />
        <h2 class="unlock-title">第七关已被封锁</h2>
        <p class="unlock-desc">第六关的视频中一共有多少个mzk？</p>
        <input
          v-model="unlockInput"
          type="text"
          class="unlock-input"
          placeholder="请输入数字..."
          @keyup.enter="tryUnlock"
        />
        <p v-if="unlockError" class="unlock-error">数字不对哦，再想想？</p>
        <div class="unlock-btns">
          <button class="btn btn-back" @click="router.push('/index')">返回首页</button>
          <button class="btn btn-confirm" @click="tryUnlock">确认</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══ 解锁后：全关通关结算画面 ═══ -->
  <div v-if="isUnlocked" class="end-screen">
    <!-- 背景图层 -->
    <img
      class="end-bg"
      :src="BG_SLIDES[currentSlide].src"
      :style="{ opacity: slideOpacity }"
      alt=""
    />
    <!-- 闪现图层 -->
    <img
      v-if="showFlash"
      class="end-bg end-flash"
      :src="flashImage"
      alt=""
    />
    <!-- 晃动文字 -->
    <div class="end-text-wrap">
      <h1 class="end-title">你已经通过所有关卡</h1>
      <p class="end-subtitle">...真的是这样吗？</p>
      <button class="btn btn-end" @click="goHome">返回首页</button>
    </div>
  </div>
</template>

<style scoped>
/* ── 解锁弹窗 ── */
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px;
}
.unlock-card {
  background: #fff; border-radius: 20px; padding: 32px 24px; width: min(360px, 100%);
  display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center;
}
.unlock-mzk { width: 80px; height: 80px; object-fit: contain; }
.unlock-title { font-size: 1.2rem; color: #FF679A; margin: 0; }
.unlock-desc { font-size: 0.85rem; color: #888; margin: 0; }
.unlock-input {
  width: 100%; padding: 12px 16px; border: 2px solid #ffc0cb; border-radius: 12px;
  font-size: 1rem; text-align: center; outline: none; transition: border-color 0.2s;
}
.unlock-input:focus { border-color: #FF679A; }
.unlock-error { color: #e74c3c; font-size: 0.85rem; margin: 0; }
.unlock-btns { display: flex; gap: 12px; width: 100%; margin-top: 8px; }

/* ── 通用按钮 ── */
.btn {
  flex: 1; min-height: 44px; border-radius: 22px; border: none;
  font-size: 0.95rem; cursor: pointer; touch-action: manipulation; transition: transform 0.15s;
}
.btn:active { transform: scale(0.97); }
.btn-confirm { background: linear-gradient(135deg, #FF679A, #e05580); color: #fff; font-weight: bold; }
.btn-back { background: transparent; border: 2px solid #ddd; color: #888; }

/* ── 结算画面 ── */
.end-screen {
  position: fixed; inset: 0; z-index: 300;
  display: flex; align-items: center; justify-content: center;
  background: #000; overflow: hidden;
}
.end-bg {
  position: absolute; inset: 0; width: 100%; height: 100%;
  object-fit: cover; transition: opacity 1.2s ease;
}
.end-flash {
  opacity: 1; filter: blur(4px) brightness(1.3);
  animation: flash-pop 0.2s ease both;
  z-index: 1;
}
@keyframes flash-pop {
  0% { opacity: 0; }
  30% { opacity: 1; }
  100% { opacity: 0; }
}

.end-text-wrap {
  position: relative; z-index: 2;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  text-align: center; padding: 20px;
  animation: end-shake 0.5s infinite;
}

@keyframes end-shake {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(-5px, 5px) rotate(-2deg); }
  75% { transform: translate(5px, -5px) rotate(2deg); }
}

.end-title {
  font-size: clamp(1.6rem, 6vw, 2.4rem);
  font-weight: bold;
  color: #000;
  text-shadow: 0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5), 2px 2px 4px rgba(0,0,0,0.9);
  margin: 0;
}

.end-subtitle {
  font-size: clamp(0.9rem, 3.5vw, 1.1rem);
  color: #000;
  text-shadow: 0 0 8px rgba(0,0,0,0.6), 1px 1px 3px rgba(0,0,0,0.8);
  margin: 0;
}

.btn-end {
  margin-top: 12px;
  padding: 12px 36px;
  border-radius: 24px;
  border: 2px solid rgba(0,0,0,0.5);
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  color: #000;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  text-shadow: 0 0 4px rgba(0,0,0,0.4);
  transition: background 0.2s;
}
.btn-end:active { background: rgba(255,255,255,0.3); }
</style>
