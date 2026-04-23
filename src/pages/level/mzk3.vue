<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../../store/game.js'
import LoadingScreen from '../../components/LoadingScreen.vue'
import TopBar from '../../components/game/TopBar.vue'
import ResultModal from '../../components/game/ResultModal.vue'

const router = useRouter()
const store = useGameStore()

const BASE = 'https://faceround.cn/games/find-mzk/'
const MZK_TYPES = [
  '倒立mzk', '倒立走mzk', '偷听mzk', '右立mzk', '吐舌mzk',
  '呼啦啦mzk', '大眼mzk', '开心mzk', '怪核mzk', '惊吓mzk',
  '打坐mzk', '普通mzk', '生气mzk', '讲话mzk', '走路mzk',
  '跑mzk', '通通mzk', '飞行mzk', '鲨鱼mzk', 'emumzk','松鼠mzk'
]

const ROWS = 5
const COLS = 4
const TIME_LIMIT = 180 // 3分钟
const TILE_COUNT = 10 // 使用10种图片

const grid = ref([])
const selected = ref(null)
const matchPath = ref([])
const pathPoints = ref('')
const gridRef = ref(null)
const timeLeft = ref(TIME_LIMIT)
const gameOver = ref(false)
const won = ref(false)
let timer = null

// 随机生成棋盘
function randomGrid() {
  const shuffledTypes = [...MZK_TYPES].sort(() => Math.random() - 0.5)
  const selectedTypes = shuffledTypes.slice(0, TILE_COUNT)

  const tiles = []
  selectedTypes.forEach(type => {
    tiles.push({ type, id: Math.random() })
    tiles.push({ type, id: Math.random() })
  })

  // 洗牌
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]]
  }

  const newGrid = []
  let idx = 0
  for (let r = 0; r < ROWS; r++) {
    newGrid[r] = []
    for (let c = 0; c < COLS; c++) {
      newGrid[r][c] = tiles[idx++]
    }
  }
  return newGrid
}

// 用求解器检查棋盘是否有解（贪心模拟：反复找可连接的配对并消除）
function isSolvable(testGrid) {
  // 深拷贝棋盘（只需要 type 和是否存在）
  const g = testGrid.map(row => row.map(cell => cell ? cell.type : null))

  function hClear(r, c1, c2) {
    if (r < 0 || r >= ROWS) return true
    const [s, e] = c1 < c2 ? [c1, c2] : [c2, c1]
    for (let c = s + 1; c < e; c++) {
      if (c >= 0 && c < COLS && g[r][c] !== null) return false
    }
    return true
  }
  function vClear(c, r1, r2) {
    if (c < 0 || c >= COLS) return true
    const [s, e] = r1 < r2 ? [r1, r2] : [r2, r1]
    for (let r = s + 1; r < e; r++) {
      if (r >= 0 && r < ROWS && g[r][c] !== null) return false
    }
    return true
  }
  function canLink(r1, c1, r2, c2) {
    if (r1 === r2 && hClear(r1, c1, c2)) return true
    if (c1 === c2 && vClear(c1, r1, r2)) return true
    // 一个转角
    if ((r1 !== r2 || c1 !== c2) && g[r1]?.[c2] === null && hClear(r1, c1, c2) && vClear(c2, r1, r2)) return true
    if ((r1 !== r2 || c1 !== c2) && g[r2]?.[c1] === null && vClear(c1, r1, r2) && hClear(r2, c1, c2)) return true
    // 两个转角（横-竖-横）
    for (let r = -1; r <= ROWS; r++) {
      const e1 = (r < 0 || r >= ROWS || c1 < 0 || c1 >= COLS) || g[r][c1] === null
      const e2 = (r < 0 || r >= ROWS || c2 < 0 || c2 >= COLS) || g[r][c2] === null
      if (e1 && e2 && vClear(c1, Math.min(r1, r), Math.max(r1, r)) && vClear(c2, Math.min(r2, r), Math.max(r2, r)) && hClear(r, c1, c2)) return true
    }
    // 两个转角（竖-横-竖）
    for (let c = -1; c <= COLS; c++) {
      const e1 = (c < 0 || c >= COLS || r1 < 0 || r1 >= ROWS) || g[r1][c] === null
      const e2 = (c < 0 || c >= COLS || r2 < 0 || r2 >= ROWS) || g[r2][c] === null
      if (e1 && e2 && hClear(r1, Math.min(c1, c), Math.max(c1, c)) && hClear(r2, Math.min(c2, c), Math.max(c2, c)) && vClear(c, Math.min(r1, r2), Math.max(r1, r2))) return true
    }
    return false
  }

  // 反复寻找可消除的配对
  let remaining = g.flat().filter(x => x !== null).length
  while (remaining > 0) {
    let found = false
    // 收集所有非空格子
    const cells = []
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        if (g[r][c] !== null) cells.push([r, c])

    // 尝试所有配对
    for (let i = 0; i < cells.length && !found; i++) {
      for (let j = i + 1; j < cells.length && !found; j++) {
        const [r1, c1] = cells[i]
        const [r2, c2] = cells[j]
        if (g[r1][c1] === g[r2][c2] && canLink(r1, c1, r2, c2)) {
          g[r1][c1] = null
          g[r2][c2] = null
          remaining -= 2
          found = true
        }
      }
    }
    if (!found) return false // 无法消除任何一对，无解
  }
  return true
}

// 生成保证有解的棋盘
function generateGrid() {
  let attempt = 0
  while (true) {
    const g = randomGrid()
    attempt++
    if (isSolvable(g) || attempt > 200) return g
  }
}

// 检查两点是否可以连接
function canConnect(r1, c1, r2, c2) {
  // 直线连接（横向或纵向）
  if (r1 === r2 && isHorizontalClear(r1, c1, c2)) {
    return [[r1, c1], [r1, c2]]
  }
  if (c1 === c2 && isVerticalClear(c1, r1, r2)) {
    return [[r1, c1], [r2, c1]]
  }

  // 一个转角连接
  // 先横后竖：转角点必须为空
  const corner1 = grid.value[r1]?.[c2]
  if (corner1 === null && isHorizontalClear(r1, c1, c2) && isVerticalClear(c2, r1, r2)) {
    return [[r1, c1], [r1, c2], [r2, c2]]
  }
  // 先竖后横：转角点必须为空
  const corner2 = grid.value[r2]?.[c1]
  if (corner2 === null && isVerticalClear(c1, r1, r2) && isHorizontalClear(r2, c1, c2)) {
    return [[r1, c1], [r2, c1], [r2, c2]]
  }

  // 两个转角连接（横-竖-横）
  for (let r = -1; r <= ROWS; r++) {
    // 检查两个转角点是否都为空
    const corner1Empty = (r < 0 || r >= ROWS || c1 < 0 || c1 >= COLS) || grid.value[r][c1] === null
    const corner2Empty = (r < 0 || r >= ROWS || c2 < 0 || c2 >= COLS) || grid.value[r][c2] === null

    if (corner1Empty && corner2Empty &&
        isVerticalClear(c1, Math.min(r1, r), Math.max(r1, r)) &&
        isVerticalClear(c2, Math.min(r2, r), Math.max(r2, r)) &&
        isHorizontalClear(r, c1, c2)) {
      return [[r1, c1], [r, c1], [r, c2], [r2, c2]]
    }
  }

  // 两个转角连接（竖-横-竖）
  for (let c = -1; c <= COLS; c++) {
    // 检查两个转角点是否都为空
    const corner1Empty = (c < 0 || c >= COLS || r1 < 0 || r1 >= ROWS) || grid.value[r1][c] === null
    const corner2Empty = (c < 0 || c >= COLS || r2 < 0 || r2 >= ROWS) || grid.value[r2][c] === null

    if (corner1Empty && corner2Empty &&
        isHorizontalClear(r1, Math.min(c1, c), Math.max(c1, c)) &&
        isHorizontalClear(r2, Math.min(c2, c), Math.max(c2, c)) &&
        isVerticalClear(c, Math.min(r1, r2), Math.max(r1, r2))) {
      return [[r1, c1], [r1, c], [r2, c], [r2, c2]]
    }
  }

  return null
}

function isHorizontalClear(r, c1, c2) {
  // 边界外的行总是畅通的
  if (r < 0 || r >= ROWS) return true

  const [start, end] = c1 < c2 ? [c1, c2] : [c2, c1]
  for (let c = start + 1; c < end; c++) {
    if (c >= 0 && c < COLS && grid.value[r][c] !== null) return false
  }
  return true
}

function isVerticalClear(c, r1, r2) {
  // 边界外的列总是畅通的
  if (c < 0 || c >= COLS) return true

  const [start, end] = r1 < r2 ? [r1, r2] : [r2, r1]
  for (let r = start + 1; r < end; r++) {
    if (r >= 0 && r < ROWS && grid.value[r][c] !== null) return false
  }
  return true
}

function imgUrl(type) {
  return `${BASE}${encodeURIComponent(type)}.png`
}

function calculatePathPoints() {
  if (!gridRef.value || matchPath.value.length === 0) {
    pathPoints.value = ''
    return
  }

  const gridRect = gridRef.value.getBoundingClientRect()
  const cellWidth = gridRect.width / COLS
  const cellHeight = gridRect.height / ROWS

  const points = matchPath.value.map(([r, c]) => {
    // 如果坐标在边界外，计算虚拟位置
    if (r < 0 || r >= ROWS || c < 0 || c >= COLS) {
      // 边界外的虚拟坐标
      const x = (c + 0.5) * cellWidth
      const y = (r + 0.5) * cellHeight
      return `${x},${y}`
    }

    // 边界内的实际DOM元素
    const cellEl = gridRef.value.querySelector(`[data-row="${r}"][data-col="${c}"]`)
    if (cellEl) {
      const rect = cellEl.getBoundingClientRect()
      const x = rect.left + rect.width / 2 - gridRect.left
      const y = rect.top + rect.height / 2 - gridRect.top
      return `${x},${y}`
    }
    return '0,0'
  })

  pathPoints.value = points.join(' ')
}

function handleClick(r, c) {
  if (gameOver.value || won.value) return
  if (grid.value[r][c] === null) return

  if (selected.value === null) {
    selected.value = { r, c }
  } else {
    const { r: r1, c: c1 } = selected.value

    if (r === r1 && c === c1) {
      selected.value = null
      return
    }

    if (grid.value[r1][c1].type === grid.value[r][c].type) {
      const path = canConnect(r1, c1, r, c)
      if (path) {
        matchPath.value = path
        calculatePathPoints()
        setTimeout(() => {
          grid.value[r1][c1] = null
          grid.value[r][c] = null
          matchPath.value = []
          pathPoints.value = ''
          selected.value = null

          // 检查是否全部消除
          if (grid.value.every(row => row.every(cell => cell === null))) {
            won.value = true
            store.completeLevel(3)
          }
        }, 300)
        return
      }
    }

    selected.value = { r, c }
  }
}

function startTimer() {
  timer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      gameOver.value = true
      clearInterval(timer)
    }
  }, 1000)
}

function resetGame() {
  grid.value = generateGrid()
  selected.value = null
  matchPath.value = []
  timeLeft.value = TIME_LIMIT
  gameOver.value = false
  won.value = false
  if (timer) clearInterval(timer)
  startTimer()
}

const timeDisplay = computed(() => {
  const min = Math.floor(timeLeft.value / 60)
  const sec = timeLeft.value % 60
  return `${min}:${sec.toString().padStart(2, '0')}`
})

onMounted(() => {
  resetGame()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function goHome() {
  router.push('/index')
}

function handleNext() {
  router.push('/4')
}
</script>

<template>
  <LoadingScreen text="正在连接晓山瑞希" />

  <!-- 顶部栏 -->
  <TopBar
    title="连接晓山瑞希"
    subtitle="连连看消除所有方块！"
    level="3"
    @home="goHome"
  />

  <!-- 游戏区域 -->
  <div class="game-container">
    <div class="timer" :class="{ warning: timeLeft <= 30 }">
      ⏱ {{ timeDisplay }}
    </div>

    <div class="grid-wrapper">
      <div class="grid" ref="gridRef">
        <div
          v-for="(row, r) in grid"
          :key="r"
          class="grid-row"
        >
          <div
            v-for="(cell, c) in row"
            :key="c"
            class="grid-cell"
            :class="{
              selected: selected && selected.r === r && selected.c === c,
              empty: cell === null
            }"
            :data-row="r"
            :data-col="c"
            @click="handleClick(r, c)"
          >
            <img
              v-if="cell"
              :src="imgUrl(cell.type)"
              :alt="cell.type"
              class="cell-img"
            />
          </div>
        </div>
      </div>

      <svg class="path-svg" ref="svgRef">
        <polyline
          v-if="matchPath.length > 0 && pathPoints"
          :points="pathPoints"
          class="match-line"
        />
      </svg>
    </div>
  </div>

  <!-- 游戏结束弹窗 -->
  <ResultModal
    :show="gameOver && !won"
    :success="false"
    title="时间到了！"
    message="第 3 关 · 连接晓山瑞希 · 未通关"
    :show-next="false"
    @replay="resetGame"
    @home="goHome"
  />

  <!-- 通关弹窗 -->
  <ResultModal
    :show="won"
    :success="true"
    title="全部连接成功！"
    message="第 3 关 · 连接晓山瑞希 · 通关"
    :show-next="true"
    @replay="resetGame"
    @next="handleNext"
    @home="goHome"
  />
</template>

<style scoped>
/* ── 游戏区域 ── */
.game-container {
  min-height: calc(100vh - 60px);
  background: linear-gradient(135deg, #fff5f7 0%, #ffe8f0 100%);
  padding: 30px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

@media (max-width: 640px) {
  .game-container {
    padding: 20px 10px;
    gap: 16px;
  }
}

.timer {
  font-size: 2.25rem;
  font-weight: bold;
  color: #c07090;
  background: #fff;
  padding: 12px 30px;
  border-radius: 24px;
  border: 2px solid #f6c8cc;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

@media (max-width: 640px) {
  .timer {
    font-size: 1.8rem;
    padding: 10px 24px;
  }
}

.timer.warning {
  color: #e74c3c;
  border-color: #e74c3c;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.grid-wrapper {
  position: relative;
  display: inline-block;
}

.path-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 5;
  overflow: visible;
}

.match-line {
  fill: none;
  stroke: #F6B1B5;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  animation: drawLine 0.3s ease-out;
}

@keyframes drawLine {
  from { stroke-dasharray: 1000; stroke-dashoffset: 1000; }
  to { stroke-dasharray: 1000; stroke-dashoffset: 0; }
}

.grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(255, 255, 255, 0.5);
  padding: 12px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.grid-row {
  display: flex;
  gap: 6px;
}

.grid-cell {
  width: 90px;
  height: 90px;
  background: #fff;
  border: 2px solid #f6c8cc;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

@media (max-width: 768px) {
  .grid-cell {
    width: 80px;
    height: 80px;
  }
}

@media (max-width: 480px) {
  .grid-cell {
    width: 20vw;
    height: 20vw;
    max-width: 90px;
    max-height: 90px;
  }
}

.grid-cell.empty {
  background: transparent;
  border-color: transparent;
  cursor: default;
}

.grid-cell.selected {
  background: #ffe0e8;
  border-color: #F6B1B5;
  transform: scale(1.1);
  box-shadow: 0 0 12px rgba(246, 177, 181, 0.6);
}

.grid-cell:not(.empty):active {
  transform: scale(0.95);
}

@media (hover: hover) {
  .grid-cell:not(.empty):hover {
    transform: scale(1.05);
    border-color: #F6B1B5;
  }
}

.cell-img {
  width: 90%;
  height: 90%;
  object-fit: contain;
  pointer-events: none;
}
</style>
