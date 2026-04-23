<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../../store/game.js'
import { getImageUrl } from '../../config/constants.js'
import LoadingScreen from '../../components/LoadingScreen.vue'
import TopBar from '../../components/game/TopBar.vue'
import ResultModal from '../../components/game/ResultModal.vue'

const router = useRouter()
const store = useGameStore()
const found = ref(false)

const MZK = '普通mzk'
const FILLERS = ['普通knd', '普通ena', '普通mfy']

function imgUrl(name) {
  return getImageUrl(`${name}.png`)
}

function goHome() {
  router.push('/index')
}

function handleReplay() {
  router.go(0)
}

function handleNext() {
  router.push('/2')
}

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

function onFound() {
  if (found.value) return
  found.value = true
  store.completeLevel(1)
}
</script>

<template>
  <LoadingScreen text="正在找到晓山瑞希" />

  <!-- 顶部栏 -->
  <TopBar
    title="找到晓山瑞希"
    subtitle="晓山瑞希就藏在眼神里！点击他，你过关！"
    level="1"
    @home="goHome"
  />

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
  <ResultModal
    :show="found"
    :success="true"
    title="你找到晓山瑞希了！"
    message="第 1 关 · 找到晓山瑞希 · 通关"
    :show-next="true"
    @replay="handleReplay"
    @next="handleNext"
    @home="goHome"
  />
</template>

<style scoped>
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
  color: var(--color-text-primary);
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
</style>
