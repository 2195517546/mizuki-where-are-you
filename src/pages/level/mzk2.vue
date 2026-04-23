<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../../store/game.js'
import LoadingScreen from '../../components/LoadingScreen.vue'
import TopBar from '../../components/game/TopBar.vue'
import ResultModal from '../../components/game/ResultModal.vue'

const router = useRouter()
const store = useGameStore()
const found = ref(false)

const BASE = 'https://faceround.cn/games/find-mzk/'
const TARGET = '生气mzk'
const FILLERS = [
  '倒立mzk', '倒立走mzk', '偷听mzk', '右立mzk', '吐舌mzk',
  '呼啦啦mzk', '大眼mzk', '开心mzk', '惊吓mzk',
  '打坐mzk', '普通mzk', '讲话mzk', '走路mzk', '跑mzk',
  '通通mzk', '飞行mzk', '鲨鱼mzk', 'emumzk'
]

const TOTAL = 67
const mzkList = ref([])

// 生成随机位置的mzk列表
function generateMzkList() {
  const list = []
  const targetIndex = Math.floor(Math.random() * TOTAL)
  const minDistance = 8 // 最小距离百分比，防止重叠

  // 检查两个位置是否太近
  function isTooClose(x1, y1, x2, y2) {
    const dx = x1 - x2
    const dy = y1 - y2
    return Math.sqrt(dx * dx + dy * dy) < minDistance
  }

  for (let i = 0; i < TOTAL; i++) {
    const isTarget = i === targetIndex
    const name = isTarget ? TARGET : FILLERS[Math.floor(Math.random() * FILLERS.length)]

    let x, y, attempts = 0
    const maxAttempts = 50

    // 尝试找到一个不重叠的位置
    do {
      x = Math.random() * 70 + 15 // 15% - 85%
      y = Math.random() * 70 + 15 // 15% - 85%
      attempts++

      // 如果尝试太多次，放宽距离限制
      if (attempts > maxAttempts) break
    } while (list.some(mzk => isTooClose(x, y, mzk.x, mzk.y)))

    list.push({
      id: i,
      name,
      isTarget,
      x,
      y,
      rotation: Math.random() * 360
    })
  }

  return list
}

onMounted(() => {
  mzkList.value = generateMzkList()
})

function imgUrl(key) {
  return `${BASE}${key}.png`
}

function onFound() {
  if (found.value) return
  found.value = true
  store.completeLevel(2)
}

function handleClick(mzk) {
  if (mzk.isTarget) {
    onFound()
  } else if (!mzk.dismissed) {
    mzk.dismissed = true
  }
}

function goHome() {
  router.push('/index')
}

function handleReplay() {
  mzkList.value = generateMzkList()
  found.value = false
}

function handleNext() {
  router.push('/3')
}
</script>

<template>
  <LoadingScreen text="正在生成晓山瑞希" />

  <!-- 顶部栏 -->
  <TopBar
    title="好多晓山瑞希"
    subtitle="67个晓山瑞希中，只有1个在生气！"
    level="2"
    @home="goHome"
  />

  <!-- mzk游乐场 -->
  <div class="playground">
    <div
      v-for="mzk in mzkList"
      :key="mzk.id"
      class="mzk-item"
      :class="{ 'mzk-dismissed': mzk.dismissed }"
      :style="{
        left: `${mzk.x}%`,
        top: `${mzk.y}%`,
        transform: `translate(-50%, -50%) rotate(${mzk.rotation}deg)`
      }"
      @click="handleClick(mzk)"
    >
      <img
        :src="imgUrl(mzk.name)"
        :alt="mzk.name"
        class="mzk-img"
      />
    </div>
  </div>

  <!-- 通关弹窗 -->
  <ResultModal
    :show="found"
    :success="true"
    title="你找到生气的晓山瑞希了！"
    message="第 2 关 · 好多晓山瑞希 · 通关"
    :show-next="true"
    @replay="handleReplay"
    @next="handleNext"
    @home="goHome"
  />
</template>

<style scoped>
/* ── 游乐场 ── */
.playground {
  position: relative;
  width: 100%;
  height: calc(100vh - 60px);
  background: linear-gradient(135deg, #fff5f7 0%, #ffe8f0 100%);
  overflow: hidden;
}

.mzk-item {
  position: absolute;
  cursor: pointer;
  transition: transform 0.2s;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

.mzk-dismissed {
  animation: spin-out 0.5s ease-in forwards;
  pointer-events: none;
}

@keyframes spin-out {
  0% { opacity: 1; transform: translate(-50%, -50%) rotate(0deg) scale(1); }
  100% { opacity: 0; transform: translate(-50%, -50%) rotate(720deg) scale(0); }
}

.mzk-item:active {
  transform: translate(-50%, -50%) scale(1.1) !important;
}

@media (hover: hover) {
  .mzk-item:hover {
    transform: translate(-50%, -50%) scale(1.15) !important;
  }
}

.mzk-img {
  width: 120px;
  height: 120px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  pointer-events: none;
}

@media (max-width: 640px) {
  .mzk-img {
    width: 96px;
    height: 96px;
  }
}
</style>
