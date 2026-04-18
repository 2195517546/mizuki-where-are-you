<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../../store/game.js'
import LoadingScreen from '../../components/LoadingScreen.vue'

const router = useRouter()
const store = useGameStore()
const found = ref(false)

const BASE = 'https://faceround.cn/games/find-mzk/'
const MZK = '普通mzk'
const FILLERS = ['普通knd', '普通ena', '普通mfy']

// 原始文本，${图片占位} 为待随机填充的图片槽
const rawText = `你这是什么眼神👁👁👁
果然是这种眼神\${图片占位}\${图片占位}\${图片占位}
早就习以为常了\${图片占位}\${图片占位}\${图片占位}
你这是什么眼神👁👁👁
别这样看我\${图片占位}\${图片占位}\${图片占位}
只是喜欢可爱的东西\${图片占位}
却像是犯了滔天大罪\${图片占位}
错开了\${图片占位}错开了\${图片占位}
就要奔溃了\${图片占位}
错开着\${图片占位}
就要精神错乱了\${图片占位}
只是一个秘密\${图片占位}而轰然倒塌了\${图片占位}
要坏掉了\${图片占位}对不起\${图片占位}\${图片占位}\${图片占位}
别看我\${图片占位}你也理解不了吧\${图片占位}
宛若不经意间绽放的
怪物之花👁👁👁
无法诉诸于口\${图片占位}
无法抹去\${图片占位}
眉间粉黛映得我是何等丑陋\${图片占位}
别看我了\${图片占位}你肯定没法理解吧\${图片占位}
宛若不经意间绽放的\${图片占位}
怪物之花👁👁👁
回望过往\${图片占位}早已无法回头\${图片占位}
👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔👁噔`

// 解析文本：切出 text 段和 img 槽（带序号 idx）
function parseText(text) {
  const MARKER = '${图片占位}'
  const parts = []
  let pos = 0
  let count = 0
  while (pos < text.length) {
    const found = text.indexOf(MARKER, pos)
    if (found === -1) {
      parts.push({ type: 'text', value: text.slice(pos) })
      break
    }
    if (found > pos) parts.push({ type: 'text', value: text.slice(pos, found) })
    parts.push({ type: 'img', idx: count++ })
    pos = found + MARKER.length
  }
  return { parts, total: count }
}

const { parts, total } = parseText(rawText)

// 随机分配：mzk 只出现一次，位置限定在后半段，其余从 FILLERS 随机选
function buildAssignments(n) {
  const half = Math.ceil(n / 2)
  const mzkPos = half + Math.floor(Math.random() * (n - half))
  return Array.from({ length: n }, (_, i) =>
    i === mzkPos ? MZK : FILLERS[Math.floor(Math.random() * FILLERS.length)]
  )
}

const assignments = buildAssignments(total)

function imgUrl(key) {
  return `${BASE}${encodeURIComponent(key)}.png`
}

function onFound() {
  if (found.value) return
  found.value = true
  store.completeLevel(1)
}
</script>

<template>
  <LoadingScreen text="正在找到晓山瑞希" />
  <!-- 顶部说明栏 -->
  <header class="top-bar">
    <router-link class="home-link" to="/index">
      <img class="home-link-icon" src="https://faceround.cn/games/find-mzk/%E5%A4%A7%E7%9C%BCmzk.png" alt="首页" />
      <span class="home-link-text">首页</span>
    </router-link>
    <div class="hint">
      <span class="hint-title">找到晓山瑞希</span>
      <span class="hint-sub">晓山瑞希就藏在眼神里！点击他，你过关！</span>
    </div>
    <span class="level-tag">第 1 关</span>
  </header>

  <!-- 文本主体 -->
  <div class="text-wrap">
    <p class="story-text">
      <template v-for="(part, i) in parts" :key="i">
        <span v-if="part.type === 'text'">{{ part.value }}</span>
        <img
          v-else
          :src="imgUrl(assignments[part.idx])"
          :alt="assignments[part.idx]"
          class="char-img"
          :class="{ 'target-mzk': assignments[part.idx] === MZK }"
          @click="assignments[part.idx] === MZK && onFound()"
        />
      </template>
    </p>
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
          <h2 class="result-title">你找到晓山瑞希了！</h2>
          <p class="result-sub">第 1 关 · 找到晓山瑞希 · 通关</p>
          <div class="result-btns">
            <button class="btn btn-stay" @click="found = false">重玩</button>
            <button class="btn btn-home" @click="router.push('/index')">返回</button>
            <button class="btn btn-next" @click="router.push('/2')">下一关</button>
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
  gap: 12px;
  padding: 8px 12px;
  background: rgba(255, 240, 245, 0.92);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border-bottom: 1px solid #f6c8cc;
}

@media (max-width: 640px) {
  .top-bar {
    padding: 6px 10px;
    gap: 8px;
  }
}

.home-link {
  text-decoration: none;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  background: #fff;
  border: 1.5px solid #f6c8cc;
  color: #c07090;
  font-size: 0.82rem;
  white-space: nowrap;
  flex-shrink: 0;
  touch-action: manipulation;
  transition: background 0.15s;
}

@media (max-width: 640px) {
  .home-link {
    padding: 4px 8px;
    font-size: 0.75rem;
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
  font-size: 0.95rem;
  font-weight: bold;
  color: #F6B1B5;}

@media (max-width: 640px) {
  .hint-title {
    font-size: 0.8rem;  }
}

.hint-sub {
  font-size: 0.72rem;
  color: #aaa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

@media (max-width: 640px) {
  .hint-sub {
    font-size: 0.65rem;
  }
}

.level-tag {
  font-size: 0.78rem;
  font-weight: bold;
  color: #c07090;
  background: #fff;
  border: 1.5px solid #f6c8cc;
  border-radius: 20px;
  padding: 5px 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .level-tag {
    font-size: 0.7rem;
    padding: 4px 8px;
  }
}

/* ── 文本区 ── */
.text-wrap {
  padding: 24px 20px 48px;
  max-width: 640px;
  margin: 0 auto;
  text-align: center;
}

.story-text {
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 2;
  font-size: clamp(1rem, 4.5vw, 1.15rem);
  color: #333;
}

/* 所有角色图片（emoji大小，内联） */
.char-img {
  width: 1.1em;
  height: 1.1em;
  vertical-align: -0.15em;
  display: inline;
  border-radius: 2px;
}

/* 目标mzk — 可点击，但视觉上与其他角色图片一致 */
.target-mzk {
  cursor: pointer;
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
  width: 120px;
  height: 120px;
  object-fit: contain;
  margin-bottom: -60px;
  position: relative;
  z-index: 2;
  filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
}

.result-card {
  position: relative;
  z-index: 1;
  background: #fff;
  border-radius: 20px;
  padding: 72px 24px 24px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.result-title {
  font-size: 1.3rem;
  color: #F6B1B5;  margin: 0;
}

.result-sub {
  font-size: 0.85rem;
  color: #aaa;
  margin: 0;
}

.result-btns {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  margin-top: 8px;
}

.btn {
  width: 100%;
  min-height: 48px;
  border-radius: 32px;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  transition: transform 0.15s;
}

@media (max-width: 640px) {
  .btn {
    min-height: 42px;
    font-size: 0.9rem;
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
  border: 2px solid #ddd;
  color: #888;
}

.btn-stay {
  background: transparent;
  border: 2px solid #F6B1B5;
  color: #c07090;
  font-size: 0.9rem;
}

@media (min-width: 400px) {
  .result-btns {
    flex-direction: row;
  }
}
</style>
