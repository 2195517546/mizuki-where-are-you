<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

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

onMounted(() => { startSlideshow() })
onUnmounted(() => { stopSlideshow() })

function goHome() { stopSlideshow(); router.push('/index') }
</script>

<template>
  <div class="end-screen">
    <img class="end-bg" :src="BG_SLIDES[currentSlide].src" :style="{ opacity: slideOpacity }" alt="" />
    <img v-if="showFlash" class="end-bg end-flash" :src="flashImage" alt="" />
    <div class="end-text-wrap">
      <h1 class="end-title">你已经通过所有关卡</h1>
      <p class="end-subtitle">...真的是这样吗？</p>
      <button class="btn btn-end" @click="goHome">返回首页</button>
    </div>
  </div>
</template>

<style scoped>
.end-screen { position: fixed; inset: 0; z-index: 300; display: flex; align-items: center; justify-content: center; background: #000; overflow: hidden; }
.end-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transition: opacity 1.2s ease; }
.end-flash { opacity: 1; filter: blur(4px) brightness(1.3); animation: flash-pop 0.2s ease both; z-index: 1; }
@keyframes flash-pop { 0% { opacity: 0; } 30% { opacity: 1; } 100% { opacity: 0; } }
.end-text-wrap { position: relative; z-index: 2; display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; padding: 20px; animation: end-shake 0.5s infinite; }
@keyframes end-shake { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 25% { transform: translate(-5px, 5px) rotate(-2deg); } 75% { transform: translate(5px, -5px) rotate(2deg); } }
.end-title { font-size: clamp(1.6rem, 6vw, 2.4rem); font-weight: bold; color: #000; text-shadow: 0 0 10px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5), 2px 2px 4px rgba(0,0,0,0.9); margin: 0; }
.end-subtitle { font-size: clamp(0.9rem, 3.5vw, 1.1rem); color: #000; text-shadow: 0 0 8px rgba(0,0,0,0.6), 1px 1px 3px rgba(0,0,0,0.8); margin: 0; }
.btn-end { margin-top: 12px; padding: 12px 36px; border-radius: 24px; border: 2px solid rgba(0,0,0,0.5); background: rgba(255,255,255,0.15); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); color: #000; font-size: 1rem; font-weight: bold; cursor: pointer; text-shadow: 0 0 4px rgba(0,0,0,0.4); transition: background 0.2s; }
.btn-end:active { background: rgba(255,255,255,0.3); }
</style>
