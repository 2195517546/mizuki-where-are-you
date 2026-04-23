<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../../store/game.js'
import { getImageUrl } from '../../config/constants.js'
import TopBar from '../../components/game/TopBar.vue'
import ResultModal from '../../components/game/ResultModal.vue'
import Toast from '../../components/game/Toast.vue'
import SQLApp from '../../components/level8/SQLApp.vue'
import CrackerApp from '../../components/level8/CrackerApp.vue'
import MemoApp from '../../components/level8/MemoApp.vue'
import SMSApp from '../../components/level8/SMSApp.vue'
import CoCoApp from '../../components/level8/CoCoApp.vue'
import CoMailApp from '../../components/level8/CoMailApp.vue'
import BrowserApp from '../../components/level8/BrowserApp.vue'

import apps from '../../data/level8/apps.json'
import settings from '../../data/level8/settings.json'
import citizens from '../../data/level8/citizens.json'
import smsData from '../../data/level8/sms.json'
import browserData from '../../data/level8/browser.json'
import cocoData from '../../data/level8/coco_chats.json'
import comailData from '../../data/level8/comail.json'
import passwordRules from '../../data/level8/password_rules.json'
import memoData from '../../data/level8/memo.json'

const router = useRouter()
const store = useGameStore()

const currentApp = ref(null)
const toastMsg = ref('')
const toastOn = ref(false)
const smsAppRef = ref(null)

// ─── 秘钥验证 ───
const phase = ref('gate') // gate | lockscreen | desktop
const gateInput = ref('')
const gateError = ref(false)

function checkGate() {
  if (gateInput.value.trim() === 'dingding10') {
    phase.value = 'lockscreen'
  } else {
    gateError.value = true
    setTimeout(() => { gateError.value = false }, 1500)
  }
}

// ─── 锁屏 / 滑动解锁 ───
const slideTrackRef = ref(null)
const slideX = ref(0)
const sliding = ref(false)
const slideSuccess = ref(false)
let slideStartX = 0
let trackWidth = 0
const THUMB_W = 52

function slideStart(e) {
  if (slideSuccess.value) return
  sliding.value = true
  slideStartX = (e.touches ? e.touches[0].clientX : e.clientX) - slideX.value
  trackWidth = slideTrackRef.value ? slideTrackRef.value.offsetWidth - THUMB_W : 260
}

function slideMove(e) {
  if (!sliding.value) return
  const cx = e.touches ? e.touches[0].clientX : e.clientX
  slideX.value = Math.max(0, Math.min(cx - slideStartX, trackWidth))
  if (e.cancelable) e.preventDefault()
}

function slideEnd() {
  if (!sliding.value) return
  sliding.value = false
  if (slideX.value >= trackWidth * 0.85) {
    slideSuccess.value = true
    slideX.value = trackWidth
    setTimeout(() => { phase.value = 'desktop' }, 400)
  } else {
    slideX.value = 0
  }
}

// 添加全局事件监听
onMounted(() => {
  document.addEventListener('mousemove', slideMove)
  document.addEventListener('mouseup', slideEnd)
  document.addEventListener('touchmove', slideMove, { passive: false })
  document.addEventListener('touchend', slideEnd)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', slideMove)
  document.removeEventListener('mouseup', slideEnd)
  document.removeEventListener('touchmove', slideMove)
  document.removeEventListener('touchend', slideEnd)
})

// ─── 游戏状态 ───
const state = reactive({
  evidenceSQL: false,
  evidenceTweet: false,
  evidenceCoCo: false,
  won: false,
  trueEnding: false,
  wrongAttempts: 0
})

function toast(msg) {
  toastMsg.value = msg
  toastOn.value = true
  setTimeout(() => { toastOn.value = false }, 2000)
}

function goHome() {
  router.push('/index')
}

function openApp(app) {
  currentApp.value = app.id
}

function closeApp() {
  currentApp.value = null
}

// ─── 事件处理 ───
function handleQueryDetective() {
  state.evidenceSQL = true
}

function handleEvidenceTweet() {
  state.evidenceTweet = true
}

function handleEvidenceCoCo() {
  state.evidenceCoCo = true
}

function handleWin() {
  state.won = true
  store.completeLevel(8)

  if (state.evidenceSQL && state.evidenceTweet && state.evidenceCoCo) {
    state.trueEnding = true
    if (smsAppRef.value) {
      smsAppRef.value.smsLog.push({
        id: 'true_ending',
        sender: 'mzk市公安局',
        content: '【mzk市公安局 重案通知】\n侦探mzk，我们复查了案件，发现你与怪核mzk有大额资金往来、私密通讯记录。\n你才是炸弹的提供者，这场「破案」只是你的表演。\n我们已对你展开调查，不要试图逃跑。',
        timestamp: nowTime(),
        read: false
      })
    }
  } else {
    if (smsAppRef.value) {
      smsAppRef.value.smsLog.push({
        id: 'win_msg',
        sender: 'mzk市公安局',
        content: '感谢侦探mzk！真凶果然是怪核mzk！\n我们已经将其逮捕归案。\n他供认不讳，承认嫁祸给开心mzk。\n你又一次拯救了mzk小区！',
        timestamp: nowTime(),
        read: false
      })
    }
  }
}

function handleWrongAttempt() {
  state.wrongAttempts++
}

function nowTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function handleReplay() {
  router.go(0)
}
</script>

<template>
  <div class="phone-frame">
    <!-- 顶部栏 -->
    <TopBar
      :title="settings.title"
      :subtitle="settings.subtitle"
      level="8"
      @home="goHome"
    />

    <!-- ═══ 秘钥验证弹窗 ═══ -->
    <div v-if="phase === 'gate'" class="gate-overlay">
      <div class="gate-card">
        <span class="gate-icon">🔒</span>
        <h2 class="gate-title">本关已被封锁</h2>
        <p class="gate-desc">请输入秘钥以解锁第八关</p>
        <input v-model="gateInput" class="game-input" placeholder="输入秘钥..." @keyup.enter="checkGate" />
        <p v-if="gateError" class="gate-error">秘钥错误，请重试</p>
        <button class="game-btn game-btn-primary" @click="checkGate">确认</button>
      </div>
    </div>

    <!-- ═══ 锁屏 ═══ -->
    <div v-else-if="phase === 'lockscreen'" class="lockscreen" :style="{ backgroundImage: `url(${getImageUrl('调查04.jpg')})` }">
      <div class="lock-time">{{ new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }}</div>
      <div class="lock-date">{{ new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }) }}</div>
      <div class="slide-unlock">
        <div ref="slideTrackRef" class="slide-track">
          <div class="slide-thumb" :style="{ left: slideX + 'px' }" @mousedown="slideStart" @touchstart="slideStart">
            <span v-if="!slideSuccess">→</span>
            <span v-else>✓</span>
          </div>
          <span class="slide-text">{{ slideSuccess ? '已解锁' : '滑动解锁' }}</span>
        </div>
      </div>
    </div>

    <!-- ═══ 桌面 ═══ -->
    <div v-else-if="phase === 'desktop'" class="desktop" :style="{ backgroundImage: `url(${getImageUrl('调查04.jpg')})` }">
      <div v-if="!currentApp" class="app-grid">
        <div v-for="app in apps" :key="app.id" class="app-icon" @click="openApp(app)">
          <div class="icon-img">{{ app.icon }}</div>
          <div class="icon-label">{{ app.name }}</div>
        </div>
      </div>

      <!-- ═══ APP容器 ═══ -->
      <div v-else class="app-container">
        <div class="app-header">
          <button class="app-back" @click="closeApp">＜</button>
          <span class="app-title">{{ apps.find(a => a.id === currentApp)?.name }}</span>
        </div>
        <div class="app-content">
          <SQLApp
            v-if="currentApp === 'sql'"
            :citizens="citizens"
            @query-detective="handleQueryDetective"
            @toast="toast"
          />
          <CrackerApp
            v-else-if="currentApp === 'cracker'"
            :citizens="citizens"
            :password-rules="passwordRules"
            @toast="toast"
          />
          <MemoApp
            v-else-if="currentApp === 'memo'"
            :memo-data="memoData"
          />
          <SMSApp
            v-else-if="currentApp === 'sms'"
            ref="smsAppRef"
            :sms-data="smsData"
            :citizens="citizens"
            @win="handleWin"
            @wrong-attempt="handleWrongAttempt"
          />
          <CoCoApp
            v-else-if="currentApp === 'coco'"
            :coco-data="cocoData"
            :password-rules="passwordRules"
            :citizens="citizens"
            @toast="toast"
            @evidence-coco="handleEvidenceCoCo"
          />
          <CoMailApp
            v-else-if="currentApp === 'comail'"
            :comail-data="comailData"
            :password-rules="passwordRules"
            @toast="toast"
          />
          <BrowserApp
            v-else-if="currentApp === 'krome'"
            :browser-data="browserData"
            :password-rules="passwordRules"
            @toast="toast"
            @evidence-tweet="handleEvidenceTweet"
          />
        </div>
      </div>
    </div>

    <!-- 结果弹窗 -->
    <ResultModal
      :show="state.won"
      :success="true"
      :title="state.trueEnding ? '🎭 真相大白' : '🎉 案件告破'"
      :message="state.trueEnding ? '第 8 关 · 找到真凶 · 真结局' : '第 8 关 · 找到真凶 · 通关'"
      :show-next="false"
      :show-replay="!state.trueEnding"
      @replay="handleReplay"
      @home="goHome"
    >
      <template #custom-content>
        <p v-if="state.trueEnding" class="ending-text">你发现了隐藏的真相！</p>
        <p v-if="state.trueEnding" class="ending-text">侦探mzk才是真正的幕后黑手！</p>
        <p v-if="!state.trueEnding" class="ending-hint">你成功找到了真凶怪核mzk！</p>
        <p v-if="!state.trueEnding" class="ending-hint warning">但似乎还有更多秘密等待探索...</p>
      </template>
    </ResultModal>

    <!-- Toast -->
    <Toast :show="toastOn" :message="toastMsg" />
  </div>
</template>

<style scoped>
.phone-frame {
  max-width: 414px;
  margin: 0 auto;
  background: #fff;
  min-height: 100vh;
  position: relative;
  display: flex;
  flex-direction: column;
}

/* ═══ 秘钥验证 ═══ */
.gate-overlay {
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
}

.gate-card {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-2xl);
  max-width: 400px;
  width: 100%;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.gate-icon {
  font-size: 4rem;
}

.gate-title {
  font-size: var(--font-size-xl);
  margin: 0;
}

.gate-desc {
  color: var(--color-text-secondary);
  margin: 0;
}

.gate-error {
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin: 0;
}

/* ═══ 锁屏 ═══ */
.lockscreen {
  flex: 1;
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.lock-time {
  font-size: 4rem;
  font-weight: 300;
  margin-bottom: var(--spacing-sm);
}

.lock-date {
  font-size: var(--font-size-lg);
  margin-bottom: var(--spacing-2xl);
}

.slide-unlock {
  width: 90%;
  max-width: 320px;
}

.slide-track {
  position: relative;
  height: 52px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 26px;
  backdrop-filter: blur(10px);
}

.slide-thumb {
  position: absolute;
  width: 52px;
  height: 52px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  cursor: grab;
  user-select: none;
  box-shadow: var(--shadow-md);
}

.slide-thumb:active {
  cursor: grabbing;
}

.slide-text {
  position: absolute;
  width: 100%;
  text-align: center;
  line-height: 52px;
  font-size: var(--font-size-base);
  pointer-events: none;
}

/* ═══ 桌面 ═══ */
.desktop {
  flex: 1;
  background-size: cover;
  background-position: center;
  padding: var(--spacing-lg);
  overflow-y: auto;
}

.app-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--spacing-lg);
  padding: var(--spacing-lg) 0;
}

.app-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  cursor: pointer;
}

.icon-img {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  box-shadow: var(--shadow-sm);
}

.icon-label {
  font-size: var(--font-size-xs);
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  text-align: center;
}

/* ═══ APP容器 ═══ */
.app-container {
  background: #f5f5f5;
  border-radius: var(--radius-lg);
  overflow: hidden;
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.app-header {
  background: var(--color-bg-primary);
  padding: var(--spacing-md);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  border-bottom: 1px solid var(--color-border);
}

.app-back {
  background: none;
  border: none;
  font-size: var(--font-size-lg);
  cursor: pointer;
  padding: var(--spacing-xs);
}

.app-title {
  font-weight: 600;
  font-size: var(--font-size-md);
}

.app-content {
  flex: 1;
  overflow-y: auto;
  background: #f5f5f5;
}

@media (pointer: coarse) {
  .slide-track {
    touch-action: none;
  }
}

/* 结局文字样式 */
.ending-text {
  font-size: 1rem;
  color: var(--color-text-primary);
  margin: var(--spacing-sm) 0;
  line-height: 1.6;
}

.ending-hint {
  font-size: 0.95rem;
  color: var(--color-text-secondary);
  margin: var(--spacing-sm) 0;
  line-height: 1.6;
}

.ending-hint.warning {
  color: #ff6b6b;
  font-weight: 600;
  animation: pulse-warning 2s ease-in-out infinite;
}

@keyframes pulse-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
</style>
