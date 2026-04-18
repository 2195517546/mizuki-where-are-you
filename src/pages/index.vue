<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../store/game.js'
import LevelSelect from '../components/LevelSelect.vue'
import minigames from '../data/minigames.json'

const router = useRouter()
const store = useGameStore()
const showSelect = ref(false)
const showMinigames = ref(false)
const weirdMode = ref(false)

// ─── 恐怖内容免责声明 ───
const DISCLAIMER_KEY = 'mzk-disclaimer-accepted'
const showDisclaimer = ref(!localStorage.getItem(DISCLAIMER_KEY))

function acceptDisclaimer() {
  localStorage.setItem(DISCLAIMER_KEY, 'true')
  showDisclaimer.value = false
}

// ─── 全关通关结算画面 ───
const showEndScreen = ref(false)
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
function closeEndScreen() {
  showEndScreen.value = false
  stopSlideshow()
}

onUnmounted(() => { stopSlideshow() })

onMounted(() => {
  // 检查是否需要显示诡异模式（仅一次）
  if (sessionStorage.getItem('showWeirdMode') === 'true') {
    weirdMode.value = true
    // 立即清除标记，确保只显示一次
    sessionStorage.removeItem('showWeirdMode')
  }
})

const allCleared = () => store.completedLevels.includes(6)

function startOrContinue() {
  if (allCleared()) {
    showEndScreen.value = true
    startSlideshow()
  } else {
    router.push(`/${store.nextLevel}`)
  }
}

function clearSave() {
  if (confirm('确定要清除所有存档吗？')) {
    localStorage.clear()
    sessionStorage.clear()
    location.reload()
  }
}
</script>

<template>
  <div class="home" :class="{ weird: weirdMode }">
    <img
      class="mzk-img"
      :src="weirdMode ? 'https://faceround.cn/games/find-mzk/%E6%80%AA%E6%A0%B8mzk.png' : 'https://faceround.cn/games/find-mzk/%E5%A4%A7%E7%9C%BCmzk.png'"
      :alt="weirdMode ? '怪核mzk' : '大眼mzk'"
      fetchpriority="high"
    />

    <h1 v-if="!weirdMode" class="title">晓山瑞希，你在哪？</h1>
    <h1 v-else class="title weird-title">为什么没有第六关！！</h1>

    <p v-if="!weirdMode" class="subtitle">晓山瑞希，我好想你，你在哪里？</p>
    <p v-else class="subtitle weird-subtitle">为什么没有第六关！！为什么没有第六关！！</p>

    <div class="btns">
      <button class="btn btn-main" @click="startOrContinue">
        {{ store.hasProgress ? '继续游戏' : '开始游戏' }}
      </button>
      <button v-if="store.hasProgress" class="btn btn-new" @click="router.push('/1')">新游戏</button>
      <button class="btn btn-secondary" @click="showSelect = true">选 关</button>
      <button class="btn btn-secondary" @click="router.push('/mzk-test')">测试你是哪种晓山瑞希</button>
      <button class="btn btn-secondary" @click="showMinigames = true">更多小游戏</button>
    </div>

    <button class="btn-clear" @click="clearSave">清除存档</button>
  </div>

  <LevelSelect v-if="showSelect" @close="showSelect = false" />

  <!-- 恐怖内容免责声明 -->
  <Teleport to="body">
    <div v-if="showDisclaimer" class="disclaimer-overlay">
      <div class="disclaimer-card">
        <span class="disclaimer-icon">⚠</span>
        <h2 class="disclaimer-title">内容警告</h2>
        <p class="disclaimer-text">
          本游戏含有<strong>轻微恐怖元素</strong>，包括但不限于：突然闪烁的画面、诡异的图像与氛围、令人不安的视觉效果。
        </p>
        <p class="disclaimer-text">
          如果你对此类内容感到不适，请谨慎游玩。
        </p>
        <p class="disclaimer-note">本游戏仅供娱乐，所有内容均为虚构。</p>
        <button class="btn btn-main disclaimer-btn" @click="acceptDisclaimer">我已了解，继续游戏</button>
      </div>
    </div>
  </Teleport>

  <!-- 全关通关结算画面 -->
  <Teleport to="body">
    <div v-if="showEndScreen" class="end-screen">
      <img class="end-bg" :src="BG_SLIDES[currentSlide].src" :style="{ opacity: slideOpacity }" alt="" />
      <img v-if="showFlash" class="end-bg end-flash" :src="flashImage" alt="" />
      <div class="end-text-wrap">
        <h1 class="end-title">你已经通过所有关卡</h1>
        <p class="end-subtitle">...真的是这样吗？</p>
        <button class="btn btn-end" @click="closeEndScreen">返回首页</button>
      </div>
    </div>
  </Teleport>

  <!-- Minigames Modal -->
  <div v-if="showMinigames" class="modal-overlay" @click="showMinigames = false">
    <div class="modal-content" @click.stop>
      <h2 class="modal-title">更多小游戏</h2>
      <div class="minigames-list">
        <div
          v-for="game in minigames.games"
          :key="game.id"
          class="minigame-item"
          :class="{ disabled: !game.enabled }"
          @click="game.enabled && router.push(game.route)"
        >
          <span class="game-icon">{{ game.icon }}</span>
          <div class="game-info">
            <h3>{{ game.name }}</h3>
            <p>{{ game.description }}</p>
          </div>
        </div>
      </div>
      <button class="btn btn-secondary modal-close" @click="showMinigames = false">关闭</button>
    </div>
  </div>
</template>

<style scoped>
.home {
  min-height: 100svh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 10svh;
  padding-bottom: 32px;
  gap: clamp(14px, 3.5vw, 24px);
  background: linear-gradient(160deg, #fff0f5 0%, #fdf6ff 100%);
  transition: background 0.5s;
}

.home.weird {
  background: linear-gradient(160deg, #1a0000 0%, #330000 100%);
  animation: glitch 0.3s infinite;
}

@keyframes glitch {
  0%, 100% {
    filter: hue-rotate(0deg);
  }
  50% {
    filter: hue-rotate(10deg) contrast(1.2);
  }
}

.mzk-img {
  width: min(72vw, 300px);
  height: min(72vw, 300px);
  object-fit: contain;
  border-radius: 50%;
  box-shadow: 0 8px 32px rgba(246, 177, 181, 0.45);
  transition: transform 0.3s;
  -webkit-tap-highlight-color: transparent;
}

.weird .mzk-img {
  box-shadow: 0 8px 32px rgba(255, 0, 0, 0.8);
  animation: shake 0.5s infinite;
}

@keyframes shake {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(-5px, 5px) rotate(-2deg); }
  75% { transform: translate(5px, -5px) rotate(2deg); }
}

@media (hover: hover) {
  .mzk-img:hover {
    transform: scale(1.03);
  }
}

.title {
  font-size: clamp(1.5rem, 6vw, 2.2rem);
  color: #F6B1B5;
  margin: 0;
  text-align: center;
  letter-spacing: 0.05em;
  padding: 0 16px;
}

.weird-title {
  color: #ff0000;  animation: blink 0.3s infinite;
  text-shadow: 0 0 20px #ff0000, 0 0 40px #ff0000;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.subtitle {
  color: #aaa;
  font-size: clamp(0.85rem, 3.5vw, 0.95rem);
  margin: 0;
}

.weird-subtitle {
  color: #ff0000;
  font-weight: bold;
  animation: blink 0.3s infinite;
}

.btns {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: min(320px, 80vw);
}

.btn {
  width: 100%;
  min-height: 52px;
  border-radius: 32px;
  border: none;
  font-size: clamp(1rem, 4vw, 1.1rem);
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s, box-shadow 0.15s;
}

.btn:active {
  transform: scale(0.97);
}

@media (hover: hover) {
  .btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }
}

.btn-main {
  background: linear-gradient(135deg, #F6B1B5, #d97ca8);
  color: #fff;
  font-weight: bold;}

.btn-new {
  background: transparent;
  border: 2px solid #ddd;
  color: #888;
}

.btn-new:active {
  background: #f5f5f5;
}

@media (hover: hover) {
  .btn-new:hover {
    background: #f5f5f5;
  }
}

.btn-secondary {
  background: transparent;
  border: 2px solid #F6B1B5;
  color: #c07090;
  font-weight: bold;
}

.btn-secondary:active {
  background: #ffe0e5;
}

@media (hover: hover) {
  .btn-secondary:hover {
    background: #ffe0e5;
  }
}

.btn-clear {
  margin-top: 20px;
  padding: 8px 20px;
  background: transparent;
  border: 1px solid #ddd;
  border-radius: 20px;
  color: #999;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-clear:hover {
  background: #f5f5f5;
  border-color: #ccc;
  color: #666;
}

.btn-clear:active {
  transform: scale(0.95);
}

/* Desktop: side-by-side buttons */
@media (min-width: 600px) {
  .btns {
    flex-direction: row;
    width: auto;
  }

  .btn {
    width: auto;
    padding: 0 40px;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 30px;
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-title {
  font-size: 1.5rem;
  color: #F6B1B5;
  margin: 0 0 20px 0;
  text-align: center;
}

.minigames-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.minigame-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border: 2px solid #F6B1B5;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.minigame-item:hover {
  background: #ffe0e5;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(246, 177, 181, 0.3);
}

.minigame-item:active {
  transform: scale(0.98);
}

.minigame-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  border-color: #ddd;
}

.minigame-item.disabled:hover {
  background: white;
  transform: none;
  box-shadow: none;
}

.game-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.game-info {
  flex: 1;
}

.game-info h3 {
  margin: 0 0 4px 0;
  font-size: 1.1rem;
  color: #333;
}

.game-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #666;
}

.modal-close {
  width: 100%;
}

/* ── 全关通关结算画面 ── */
.end-screen {
  position: fixed; inset: 0; z-index: 2000;
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
.btn-end {
  margin-top: 12px; padding: 12px 36px; border-radius: 24px;
  border: 2px solid rgba(0,0,0,0.5); background: rgba(255,255,255,0.15);
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  color: #000; font-size: 1rem; font-weight: bold; cursor: pointer;
  text-shadow: 0 0 4px rgba(0,0,0,0.4); transition: background 0.2s;
}
.btn-end:active { background: rgba(255,255,255,0.3); }

/* ── 恐怖内容免责声明 ── */
.disclaimer-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0, 0, 0, 0.7);
  display: flex; align-items: center; justify-content: center;
  padding: 20px;
}
.disclaimer-card {
  background: #fff; border-radius: 20px;
  padding: 32px 28px; width: min(400px, 100%);
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
.disclaimer-icon {
  font-size: 2.5rem; line-height: 1;
}
.disclaimer-title {
  font-size: 1.3rem; color: #c44; margin: 0; font-weight: bold;
}
.disclaimer-text {
  font-size: 0.88rem; color: #555; margin: 0; line-height: 1.6;
}
.disclaimer-text strong { color: #c44; }
.disclaimer-note {
  font-size: 0.75rem; color: #aaa; margin: 0;
}
.disclaimer-btn {
  margin-top: 8px; width: 100%;
}
</style>
