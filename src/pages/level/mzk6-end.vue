<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useGameStore } from '../../store/game.js'

const router = useRouter()
const route = useRoute()
const store = useGameStore()

const END_SEEN_KEY = 'mzk-level6-endscreen-seen'
// 只有从首页继续游戏进来（带 ?from=index）才显示"继续游戏"小字
const showContinue = ref(route.query.from === 'index')

// ─── 结算背景轮播 ───
const BG_SLIDES = [
  { src: '调查04.jpg', flash: '调查4.jpg' },
  { src: '调查05.jpg', flash: null },
  { src: '调查06.jpg', flash: null },
  { src: '调查03.jpg', flash: null },
]
const currentSlide = ref(0)
const slideOpacity = ref(1)
const flashImage = ref('')
const showFlash = ref(false)
let slideshowTimer = null

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

function goBack() {
  localStorage.setItem(END_SEEN_KEY, 'true')
  if (slideshowTimer) { clearTimeout(slideshowTimer); slideshowTimer = null }
  router.push('/index')
}

function continueToLevel7() {
  store.completeLevel(6)
  if (slideshowTimer) { clearTimeout(slideshowTimer); slideshowTimer = null }
  router.push('/7')
}

onMounted(() => {
  currentSlide.value = 0
  slideOpacity.value = 1
  advanceSlide()
})

onUnmounted(() => {
  if (slideshowTimer) { clearTimeout(slideshowTimer); slideshowTimer = null }
})
</script>

<template>
  <div class="end-screen">
    <img
      class="end-bg"
      :src="BG_SLIDES[currentSlide].src"
      :style="{ opacity: slideOpacity }"
      alt=""
    />
    <img
      v-if="showFlash"
      class="end-bg end-flash"
      :src="flashImage"
      alt=""
    />
    <div class="end-text-wrap">
      <h1 class="end-title">你已经通过所有关卡</h1>
      <p class="end-subtitle">...真的是这样吗？</p>
      <button class="btn btn-end" @click="goBack">返回首页</button>
      <span v-if="showContinue" class="continue-secret" @click="continueToLevel7">继续游戏</span>
    </div>
  </div>
</template>

<style scoped>
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
  animation: flash-pop 0.2s ease both; z-index: 1;
}
@keyframes flash-pop {
  0% { opacity: 0; } 30% { opacity: 1; } 100% { opacity: 0; }
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
  font-size: clamp(1.6rem, 6vw, 2.4rem); font-weight: bold; color: #000; margin: 0;
  text-shadow: 0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5), 2px 2px 4px rgba(0,0,0,0.9);
}
.end-subtitle {
  font-size: clamp(0.9rem, 3.5vw, 1.1rem); color: #000; margin: 0;
  text-shadow: 0 0 8px rgba(0,0,0,0.6), 1px 1px 3px rgba(0,0,0,0.8);
}
.btn { border: none; cursor: pointer; }
.btn-end {
  margin-top: 12px; padding: 12px 36px; border-radius: 24px;
  border: 2px solid rgba(0,0,0,0.5); background: rgba(255,255,255,0.15);
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  color: #000; font-size: 1rem; font-weight: bold;
  text-shadow: 0 0 4px rgba(0,0,0,0.4); transition: background 0.2s;
}
.btn-end:active { background: rgba(255,255,255,0.3); }
.continue-secret {
  margin-top: 20px; font-size: 0.75rem; color: #000;
  text-decoration: underline; cursor: pointer; opacity: 0.7;
  transition: opacity 0.2s; text-shadow: 0 0 4px rgba(0,0,0,0.4);
}
.continue-secret:hover { opacity: 1; }
</style>
