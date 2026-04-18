<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../../store/game.js'
import LoadingScreen from '../../components/LoadingScreen.vue'

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
  }
}
</script>

<template>
  <LoadingScreen text="正在生成晓山瑞希" />
  <!-- 顶部说明栏 -->
  <header class="top-bar">
    <router-link class="home-link" to="/index">
      <img class="home-link-icon" src="https://faceround.cn/games/find-mzk/%E5%A4%A7%E7%9C%BCmzk.png" alt="首页" />
      <span class="home-link-text">首页</span>
    </router-link>
    <div class="hint">
      <span class="hint-title">好多晓山瑞希</span>
      <span class="hint-sub">
        67个晓山瑞希中，只有1个在生气！<img class="hint-emoji" src="https://faceround.cn/games/find-mzk/%E7%94%9F%E6%B0%94mzk.png" alt="生气" />
      </span>
    </div>
    <span class="level-tag">第 2 关</span>
  </header>

  <!-- mzk游乐场 -->
  <div class="playground">
    <div
      v-for="mzk in mzkList"
      :key="mzk.id"
      class="mzk-item"
      :class="{ 'mzk-target': mzk.isTarget }"
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
  <Teleport to="body">
    <div v-if="found" class="overlay">
      <div class="result-wrapper">
        <img
          class="result-mzk"
          src="https://faceround.cn/games/find-mzk/%E7%94%9F%E6%B0%94mzk.png"
          alt="生气晓山瑞希"
        />
        <div class="result-card">
          <h2 class="result-title">你找到生气的晓山瑞希了！</h2>
          <p class="result-sub">第 2 关 · 好多晓山瑞希 · 通关</p>
          <div class="result-btns">
            <button class="btn btn-stay" @click="found = false; mzkList = generateMzkList()">重玩</button>
            <button class="btn btn-home" @click="router.push('/index')">返回</button>
            <button class="btn btn-next" @click="router.push('/3')">下一关</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ── 顶部栏 ── */
.top-bar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 12px 18px;
  background: rgba(255, 240, 245, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid #f6c8cc;
}

@media (max-width: 640px) {
  .top-bar {
    padding: 9px 15px;
    gap: 12px;
  }
}

.home-link {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  border-radius: 30px;
  background: #fff;
  border: 2px solid #f6c8cc;
  color: #c07090;
  font-size: 1.23rem;
  white-space: nowrap;
  flex-shrink: 0;
  touch-action: manipulation;
  transition: background 0.15s;
}

@media (max-width: 640px) {
  .home-link {
    padding: 6px 12px;
    font-size: 1.125rem;
  }
}

.home-link:active {
  background: #ffe0e8;
}

@media (hover: hover) {
  .home-link:hover {
    background: #ffe0e8;
  }
}

.home-link-icon {
  height: 1em;
  width: auto;
  object-fit: contain;
  flex-shrink: 0;
}

.hint {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.hint-title {
  font-size: 1.425rem;
  font-weight: bold;
  color: #F6B1B5;}

@media (max-width: 640px) {
  .hint-title {
    font-size: 1.2rem;  }
}

.hint-sub {
  font-size: 1.08rem;
  color: #aaa;
  max-width: 100%;
  display: flex;
  align-items: center;
  gap: 4px;
}

.hint-emoji {
  width: 1em;
  height: 1em;
  object-fit: contain;
  vertical-align: middle;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .hint-sub {
    font-size: 0.75rem;
  }
}

.level-tag {
  font-size: 1.17rem;
  font-weight: bold;
  color: #c07090;
  background: #fff;
  border: 2px solid #f6c8cc;
  border-radius: 30px;
  padding: 7.5px 15px;
  white-space: nowrap;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .level-tag {
    font-size: 1.05rem;
    padding: 6px 12px;
  }
}

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

.mzk-target {
  z-index: 100;
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

/* ── 通关弹窗 ── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 20px;
}

.result-wrapper {
  position: relative;
  width: min(380px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.result-mzk {
  width: 180px;
  height: 180px;
  object-fit: contain;
  margin-bottom: -90px;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}

.result-card {
  position: relative;
  z-index: 1;
  background: #fff;
  border-radius: 30px;
  padding: 108px 36px 36px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  text-align: center;
}

.result-title {
  font-size: 1.95rem;
  color: #F6B1B5;  margin: 0;
}

.result-sub {
  font-size: 1.275rem;
  color: #aaa;
  margin: 0;
}

.result-btns {
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
  margin-top: 12px;
}

.btn {
  width: 100%;
  min-height: 72px;
  border-radius: 48px;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s;
}

@media (max-width: 640px) {
  .btn {
    min-height: 63px;
    font-size: 1.35rem;
  }
}

.btn:active {
  transform: scale(0.97);
}

.btn-next {
  background: linear-gradient(135deg, #F6B1B5, #d97ca8);
  color: #fff;
  font-weight: bold;
}

.btn-home {
  background: transparent;
  border: 3px solid #ddd;
  color: #888;
}

.btn-stay {
  background: transparent;
  border: 3px solid #F6B1B5;
  color: #c07090;
  font-size: 1.35rem;
}

@media (min-width: 400px) {
  .result-btns {
    flex-direction: row;
  }
}
</style>
