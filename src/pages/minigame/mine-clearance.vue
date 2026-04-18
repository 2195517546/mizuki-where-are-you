<template>
  <div class="minesweeper">
    <div class="header">
      <button class="btn-back" @click="router.push('/index')">← 返回</button>
      <h1 class="title">扫晓山瑞希！</h1>
      <span class="header-tagline">你扫不扫晓山瑞希！？</span>
    </div>

    <!-- Game Info -->
    <div class="game-info">
      <div class="info-item">
        <span class="label">💣</span>
        <span class="value">{{ remainingMines }}</span>
      </div>
      <div class="info-item">
        <span class="label">⏱️</span>
        <span class="value">{{ formatTime(elapsedTime) }}</span>
      </div>
      <div class="info-item">
        <button class="btn-reset" @click="resetGame">🔄</button>
      </div>
    </div>

    <!-- Difficulty Selection -->
    <div v-if="!gameStarted" class="difficulty-panel">
      <h2>选择难度</h2>
      <div class="difficulty-btns">
        <button class="btn-difficulty" @click="startGame('easy')">
          <div>简单</div>
          <small>9×9 (10雷)</small>
        </button>
        <button class="btn-difficulty" @click="startGame('medium')">
          <div>普通</div>
          <small>16×16 (40雷)</small>
        </button>
        <button class="btn-difficulty" @click="startGame('hard')">
          <div>困难</div>
          <small>16×30 (99雷)</small>
        </button>
        <button class="btn-difficulty" @click="showCustom = true">
          <div>自定义</div>
          <small>最大24×30</small>
        </button>
      </div>
    </div>

    <!-- Custom Difficulty Modal -->
    <div v-if="showCustom" class="modal-overlay" @click="showCustom = false">
      <div class="modal-content" @click.stop>
        <h2>自定义难度</h2>
        <div class="custom-inputs">
          <label>
            行数 (最大24):
            <input v-model.number="customRows" type="number" min="5" max="24" />
          </label>
          <label>
            列数 (最大30):
            <input v-model.number="customCols" type="number" min="5" max="30" />
          </label>
          <label>
            雷数:
            <input v-model.number="customMines" type="number" min="1" :max="customRows * customCols - 1" />
          </label>
        </div>
        <div class="modal-actions">
          <button class="btn-primary" @click="startCustomGame">开始游戏</button>
          <button class="btn-secondary" @click="showCustom = false">取消</button>
        </div>
      </div>
    </div>

    <!-- Control Buttons (mobile only) -->
    <div v-if="gameStarted" class="control-btns mobile-only">
      <!-- 失败后显示提示 + 重新开始 -->
      <template v-if="gameLost">
        <div class="result-inline lose">💥 踩到晓山瑞希了...</div>
        <button class="control-btn control-btn-restart" @click="resetGame">🔄 重新开始</button>
      </template>
      <!-- 正常游戏中显示控制按钮 -->
      <template v-else-if="!gameOver">
        <button
          class="control-btn"
          :class="{ active: currentMode === 'reveal' }"
          @click="currentMode = 'reveal'"
        >
          🔍 排雷
        </button>
        <button
          class="control-btn"
          :class="{ active: currentMode === 'flag' }"
          @click="currentMode = 'flag'"
        >
          🚩 插旗
        </button>
        <button
          class="control-btn"
          :class="{ active: currentMode === 'question' }"
          @click="currentMode = 'question'"
        >
          ❓ 疑惑
        </button>
      </template>
    </div>

    <!-- Desktop: game over inline (no mode buttons needed) -->
    <div v-if="gameStarted && gameLost" class="control-btns desktop-only">
      <div class="result-inline lose">💥 踩到晓山瑞希了...</div>
      <button class="control-btn control-btn-restart" @click="resetGame">🔄 重新开始</button>
    </div>

    <!-- Desktop hint -->
    <div v-if="gameStarted && !gameOver" class="desktop-hint desktop-only">
      左键揭开 · 右键插旗 · 双击数字一键扫
    </div>

    <!-- Game Board -->
    <div v-if="gameStarted" class="board-container">
      <div
        class="board"
        :style="{ gridTemplateColumns: `repeat(${cols}, 1fr)`, '--cols': cols }"
      >
        <div
          v-for="(cell, index) in board"
          :key="index"
          class="cell"
          :class="{
            revealed: cell.revealed,
            mine: cell.isMine && cell.revealed,
            flagged: cell.flagged,
            questioned: cell.questioned,
            exploded: cell.exploded,
            triggered: cell.triggered
          }"
          @click="handleCellClick(index)"
          @contextmenu.prevent="handleRightClick(index)"
          @dblclick="handleDoubleClick(index)"
        >
          <template v-if="!cell.revealed">
            <span v-if="cell.flagged">🚩</span>
            <span v-else-if="cell.questioned">❓</span>
          </template>
          <template v-else>
            <img v-if="cell.isMine" :src="cell.mzkImage" class="mine-img" />
            <span v-else-if="cell.adjacentMines > 0" class="number" :data-num="cell.adjacentMines">
              {{ cell.adjacentMines }}
            </span>
          </template>
        </div>
      </div>
    </div>

    <!-- Win Screen: fullscreen reward image -->
    <Teleport to="body">
      <div v-if="gameWon" class="win-screen" @click="resetGame">
        <img :src="winImage" class="win-img" />
        <div class="win-overlay-text">
          <div class="win-title">🎉 扫除成功！</div>
          <div class="win-time">用时 {{ formatTime(elapsedTime) }}</div>
          <div class="win-hint">点击任意处重新开始</div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Game state
const gameStarted = ref(false)
const gameOver = ref(false)
const gameWon = ref(false)
const gameLost = ref(false)
const minesPlaced = ref(false)  // 雷是否已埋（第一次点击后才埋）
const rows = ref(9)
const cols = ref(9)
const totalMines = ref(10)
const board = ref([])
const currentMode = ref('reveal') // 'reveal', 'flag', 'question'
const elapsedTime = ref(0)
const timerInterval = ref(null)
const showCustom = ref(false)
const customRows = ref(16)
const customCols = ref(16)
const customMines = ref(40)

// 爆炸动画 timeout 列表，用于离开时清理
const explosionTimeouts = ref([])

// MZK images for mines
const mzkImages = [
  'https://faceround.cn/games/find-mzk/倒立mzk.png',
  'https://faceround.cn/games/find-mzk/倒立走mzk.png',
  'https://faceround.cn/games/find-mzk/偷听mzk.png',
  'https://faceround.cn/games/find-mzk/右立mzk.png',
  'https://faceround.cn/games/find-mzk/吐舌mzk.png',
  'https://faceround.cn/games/find-mzk/呼啦啦mzk.png',
  'https://faceround.cn/games/find-mzk/大眼mzk.png',
  'https://faceround.cn/games/find-mzk/开心mzk.png',
  'https://faceround.cn/games/find-mzk/怪核mzk.png',
  'https://faceround.cn/games/find-mzk/惊吓mzk.png',
  'https://faceround.cn/games/find-mzk/打坐mzk.png',
  'https://faceround.cn/games/find-mzk/普通mzk.png',
  'https://faceround.cn/games/find-mzk/生气mzk.png',
  'https://faceround.cn/games/find-mzk/讲话mzk.png',
  'https://faceround.cn/games/find-mzk/走路mzk.png',
  'https://faceround.cn/games/find-mzk/跑mzk.png',
  'https://faceround.cn/games/find-mzk/通通mzk.png',
  'https://faceround.cn/games/find-mzk/飞行mzk.png',
  'https://faceround.cn/games/find-mzk/鲨鱼mzk.png',
  'https://faceround.cn/games/find-mzk/emumzk.png',
  'https://faceround.cn/games/find-mzk/肌肉mzk.jpg'
]

// Win settlement images
const winImages = [
  'https://faceround.cn/games/find-mzk/扫雷结算/扫雷结算1.jpg',
  'https://faceround.cn/games/find-mzk/扫雷结算/扫雷结算2.jpg',
  'https://faceround.cn/games/find-mzk/扫雷结算/扫雷结算3.jpg',
  'https://faceround.cn/games/find-mzk/扫雷结算/扫雷结算4.jpg',
  'https://faceround.cn/games/find-mzk/扫雷结算/扫雷结算5.jpg',
]
const winImage = ref('')

function shuffleArray(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const remainingMines = computed(() => {
  const flaggedCount = board.value.filter(cell => cell.flagged).length
  return totalMines.value - flaggedCount
})

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

function startGame(difficulty) {
  switch (difficulty) {
    case 'easy':
      rows.value = 9; cols.value = 9; totalMines.value = 10; break
    case 'medium':
      rows.value = 16; cols.value = 16; totalMines.value = 40; break
    case 'hard':
      rows.value = 16; cols.value = 30; totalMines.value = 99; break
  }
  initBoard()
}

function startCustomGame() {
  rows.value = Math.min(Math.max(customRows.value, 5), 24)
  cols.value = Math.min(Math.max(customCols.value, 5), 30)
  totalMines.value = Math.min(Math.max(customMines.value, 1), rows.value * cols.value - 9)
  showCustom.value = false
  initBoard()
}

function initBoard() {
  // 清理旧的爆炸动画定时器
  clearExplosionTimeouts()

  gameStarted.value = true
  gameOver.value = false
  gameWon.value = false
  gameLost.value = false
  minesPlaced.value = false  // 第一次点击后才埋雷
  elapsedTime.value = 0
  currentMode.value = 'reveal'

  // 创建空白棋盘（不埋雷）
  const totalCells = rows.value * cols.value
  board.value = Array(totalCells).fill(null).map(() => ({
    isMine: false,
    revealed: false,
    flagged: false,
    questioned: false,
    adjacentMines: 0,
    exploded: false,
    triggered: false,
    mzkImage: ''
  }))

  // 清理旧计时器，第一次点击时才启动
  if (timerInterval.value) clearInterval(timerInterval.value)
  timerInterval.value = null
}

function startTimer() {
  if (timerInterval.value) return
  timerInterval.value = setInterval(() => {
    if (!gameOver.value) elapsedTime.value++
  }, 1000)
}

// 第一次点击后埋雷，保证点击位置及周围无雷
function placeMines(safeIndex) {
  const totalCells = rows.value * cols.value
  // 安全区域：点击格子 + 周围8格
  const safeSet = new Set([safeIndex, ...getNeighbors(safeIndex)])

  let placed = 0
  while (placed < totalMines.value) {
    const index = Math.floor(Math.random() * totalCells)
    if (!board.value[index].isMine && !safeSet.has(index)) {
      board.value[index].isMine = true
      placed++
    }
  }

  // 分配 mzk 图片
  const shuffled = shuffleArray(mzkImages)
  let imgIdx = 0
  board.value.forEach(cell => {
    if (cell.isMine) {
      cell.mzkImage = shuffled[imgIdx % shuffled.length]
      imgIdx++
    }
  })

  // 计算周围雷数
  for (let i = 0; i < totalCells; i++) {
    if (!board.value[i].isMine) {
      board.value[i].adjacentMines = countAdjacentMines(i)
    }
  }

  minesPlaced.value = true
}

function countAdjacentMines(index) {
  return getNeighbors(index).filter(i => board.value[i].isMine).length
}

function getNeighbors(index) {
  const row = Math.floor(index / cols.value)
  const col = index % cols.value
  const neighbors = []
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = row + dr, nc = col + dc
      if (nr >= 0 && nr < rows.value && nc >= 0 && nc < cols.value) {
        neighbors.push(nr * cols.value + nc)
      }
    }
  }
  return neighbors
}

// ─── 点击处理 ───

function handleCellClick(index) {
  if (gameOver.value) return
  const cell = board.value[index]

  if (currentMode.value === 'reveal') {
    if (cell.revealed || cell.flagged) return
    if (cell.questioned) cell.questioned = false
    // 第一次点击：先埋雷再揭开
    if (!minesPlaced.value) placeMines(index)
    startTimer()
    revealCell(index)
  } else if (currentMode.value === 'flag') {
    if (cell.revealed) return
    if (!minesPlaced.value) return  // 雷未布下时不允许插旗
    if (cell.questioned) cell.questioned = false
    cell.flagged = !cell.flagged
  } else if (currentMode.value === 'question') {
    if (cell.revealed) return
    if (!minesPlaced.value) return  // 雷未布下时不允许标问号
    if (cell.flagged) cell.flagged = false
    cell.questioned = !cell.questioned
  }

  checkWin()
}

// 电脑右键 → 插旗/取消旗/问号 轮转
function handleRightClick(index) {
  if (gameOver.value) return
  if (!minesPlaced.value) return  // 雷未布下时不允许右键操作
  const cell = board.value[index]
  if (cell.revealed) return

  if (!cell.flagged && !cell.questioned) {
    cell.flagged = true
  } else if (cell.flagged) {
    cell.flagged = false
    cell.questioned = true
  } else {
    cell.questioned = false
  }
}

// 电脑双击已揭开的数字格 → 一键扫（chord）
function handleDoubleClick(index) {
  if (gameOver.value) return
  const cell = board.value[index]
  if (!cell.revealed || cell.isMine || cell.adjacentMines === 0) return

  const neighbors = getNeighbors(index)
  const flagCount = neighbors.filter(i => board.value[i].flagged).length

  // 旗子数 == 数字 → 自动揭开周围未标记格子
  if (flagCount === cell.adjacentMines) {
    for (const i of neighbors) {
      if (gameOver.value) break  // 触雷后停止继续揭开
      const n = board.value[i]
      if (!n.revealed && !n.flagged) {
        revealCell(i)
      }
    }
    checkWin()
  }
}

function revealCell(index) {
  const cell = board.value[index]
  if (cell.revealed || cell.flagged) return

  cell.revealed = true

  if (cell.isMine) {
    cell.exploded = true
    cell.triggered = true  // 标记为玩家实际踩到的雷
    endGame(false)
    return
  }

  // 空格自动展开
  if (cell.adjacentMines === 0) {
    getNeighbors(index).forEach(i => {
      if (!board.value[i].revealed && !board.value[i].flagged) {
        revealCell(i)
      }
    })
  }
}

function checkWin() {
  if (gameOver.value || !minesPlaced.value) return
  const allSafeRevealed = board.value.every(cell => cell.isMine || cell.revealed)
  if (allSafeRevealed) endGame(true)
}

function endGame(won) {
  gameOver.value = true
  if (timerInterval.value) clearInterval(timerInterval.value)

  // 逐个揭开地雷位置
  const mineIndices = board.value
    .map((cell, i) => cell.isMine ? i : -1)
    .filter(i => i !== -1)

  mineIndices.forEach((idx, order) => {
    const tid = setTimeout(() => {
      board.value[idx].revealed = true
      if (!won) board.value[idx].exploded = true
    }, order * 80)
    explosionTimeouts.value.push(tid)
  })

  if (won) {
    // 等雷全部显示完 + 3秒后再弹出结算
    winImage.value = winImages[Math.floor(Math.random() * winImages.length)]
    const revealDuration = mineIndices.length * 80
    const tid = setTimeout(() => {
      gameWon.value = true
    }, revealDuration + 3000)
    explosionTimeouts.value.push(tid)
  } else {
    gameLost.value = true
  }
}

function clearExplosionTimeouts() {
  explosionTimeouts.value.forEach(tid => clearTimeout(tid))
  explosionTimeouts.value = []
}

function resetGame() {
  clearExplosionTimeouts()
  gameStarted.value = false
  gameOver.value = false
  gameWon.value = false
  gameLost.value = false
  minesPlaced.value = false
  elapsedTime.value = 0
  if (timerInterval.value) clearInterval(timerInterval.value)
}

onUnmounted(() => {
  clearExplosionTimeouts()
  if (timerInterval.value) clearInterval(timerInterval.value)
})
</script>

<style scoped>
.minesweeper {
  min-height: 100vh;
  background: linear-gradient(160deg, #fff0f5 0%, #fdf6ff 100%);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.header {
  width: 100%;
  max-width: 800px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.header .title {
  justify-self: center;
}

.header-tagline {
  justify-self: end;
  color: #aaa;
  font-size: 0.85rem;
  white-space: nowrap;
}

.btn-back {
  padding: 8px 16px;
  background: white;
  border: 2px solid #F6B1B5;
  border-radius: 20px;
  color: #F6B1B5;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: #ffe0e5;
}

.title {
  font-size: 2rem;
  color: #F6B1B5;
  margin: 0;
}

.game-info {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  background: white;
  padding: 15px 30px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: bold;
}

.btn-reset {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-reset:hover {
  transform: rotate(180deg);
}

.difficulty-panel {
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.difficulty-panel h2 {
  color: #F6B1B5;
  margin-bottom: 20px;
}

.difficulty-btns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
}

.btn-difficulty {
  padding: 20px;
  background: linear-gradient(135deg, #F6B1B5, #d97ca8);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-difficulty:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(246, 177, 181, 0.4);
}

.btn-difficulty small {
  display: block;
  margin-top: 5px;
  font-size: 0.85rem;
  opacity: 0.9;
}

/* ── 控制按钮 ── */
.control-btns {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.control-btn {
  padding: 12px 24px;
  background: white;
  border: 2px solid #F6B1B5;
  border-radius: 20px;
  color: #F6B1B5;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn.active {
  background: linear-gradient(135deg, #F6B1B5, #d97ca8);
  color: white;
  border-color: #d97ca8;
}

.control-btn:hover {
  transform: translateY(-2px);
}

/* 桌面端提示 */
.desktop-hint {
  font-size: 0.82rem;
  color: #bbb;
  margin-bottom: 12px;
}

/* 响应式：桌面/移动 切换显示 */
.mobile-only { display: flex; }
.desktop-only { display: none; }

@media (hover: hover) and (pointer: fine) {
  /* 有精确指针（鼠标）的设备 → 桌面端 */
  .mobile-only { display: none !important; }
  .desktop-only { display: flex !important; }
}

.board-container {
  overflow-x: auto;
  max-width: 100%;
}

.board {
  display: grid;
  gap: 2px;
  background: #ddd;
  padding: 2px;
  border-radius: 8px;
  margin: 0 auto;
  max-width: 100%;
  width: fit-content;
}

.cell {
  aspect-ratio: 1;
  background: linear-gradient(145deg, #f0f0f0, #e0e0e0);
  border: 2px solid #ccc;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-weight: bold;
  font-size: 1rem;
  transition: all 0.1s;
  user-select: none;
  -webkit-user-select: none;
  width: clamp(24px, calc((100vw - 60px) / var(--cols, 9)), 40px);
  height: clamp(24px, calc((100vw - 60px) / var(--cols, 9)), 40px);
}

.cell:hover:not(.revealed) {
  background: linear-gradient(145deg, #fff, #f5f5f5);
  transform: scale(0.95);
}

.cell.revealed {
  background: #fff;
  border-color: #eee;
  cursor: default;
}

.cell.mine {
  background: #ffebee;
}

.cell.exploded {
  background: #ffcdd2;
  animation: mine-pop 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}
.cell.triggered {
  background: #ff5252;
  box-shadow: 0 0 8px rgba(255, 0, 0, 0.5);
}

@keyframes mine-pop {
  0%   { transform: scale(0); opacity: 0; }
  60%  { transform: scale(1.3); opacity: 1; }
  80%  { transform: scale(0.9); }
  100% { transform: scale(1); }
}

.result-inline {
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 1rem;
  font-weight: bold;
}

.result-inline.win {
  background: linear-gradient(135deg, #c8f7c5, #a8e6cf);
  color: #2e7d32;
}

.result-inline.lose {
  background: linear-gradient(135deg, #ffd0d0, #ffb3b3);
  color: #c62828;
}

.control-btn-restart {
  background: linear-gradient(135deg, #F6B1B5, #d97ca8);
  color: white;
  border-color: #d97ca8;
}

.mine-img {
  width: 80%;
  height: 80%;
  object-fit: contain;
}

.number {
  font-size: 1.2rem;
  font-weight: bold;
}

.number[data-num="1"] { color: #000; }
.number[data-num="2"] { color: #c41e3a; }
.number[data-num="3"] { color: #d32f2f; }
.number[data-num="4"] { color: #e53935; }
.number[data-num="5"] { color: #f44336; }
.number[data-num="6"] { color: #ff5252; }
.number[data-num="7"] { color: #ff6e6e; }
.number[data-num="8"] { color: #ff8a80; }

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
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 20px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}

.modal-content h2 {
  color: #F6B1B5;
  margin: 0 0 20px 0;
  text-align: center;
}

.custom-inputs {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-bottom: 20px;
}

.custom-inputs label {
  display: flex;
  flex-direction: column;
  gap: 5px;
  color: #666;
}

.custom-inputs input {
  padding: 10px;
  border: 2px solid #F6B1B5;
  border-radius: 10px;
  font-size: 1rem;
}

.modal-actions {
  display: flex;
  gap: 10px;
}

.btn-primary, .btn-secondary {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #F6B1B5, #d97ca8);
  color: white;
}

.btn-secondary {
  background: white;
  border: 2px solid #F6B1B5;
  color: #F6B1B5;
}

.btn-primary:hover, .btn-secondary:hover {
  transform: translateY(-2px);
}

.game-over {
  text-align: center;
}

.game-over p {
  color: #666;
  margin: 10px 0;
}

.time-info {
  font-size: 1.2rem;
  font-weight: bold;
  color: #F6B1B5;
}

@media (max-width: 600px) {
  .minesweeper {
    padding: 10px 8px;
  }

  .header {
    gap: 6px;
    margin-bottom: 10px;
  }

  .header-tagline {
    display: none;
  }

  .title {
    font-size: 1.3rem;
  }

  .btn-back {
    padding: 6px 10px;
    font-size: 0.85rem;
  }

  .game-info {
    padding: 10px 16px;
    gap: 14px;
    margin-bottom: 12px;
  }

  .info-item {
    font-size: 1rem;
  }

  .difficulty-panel {
    padding: 20px 16px;
    width: 100%;
    box-sizing: border-box;
  }

  .difficulty-btns {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .btn-difficulty {
    padding: 14px 8px;
    font-size: 1rem;
  }

  .control-btns {
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
    justify-content: center;
    width: 100%;
  }

  .control-btn {
    padding: 10px 14px;
    font-size: 0.9rem;
  }

  .result-inline {
    font-size: 0.9rem;
    padding: 8px 14px;
  }
}

/* Win fullscreen */
.win-screen {
  position: fixed;
  inset: 0;
  z-index: 2000;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: win-fade-in 0.4s ease both;
}

@keyframes win-fade-in {
  from { opacity: 0; }
  to   { opacity: 1; }
}

.win-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.win-overlay-text {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
  padding: 20px 30px;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 20px;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.win-title {
  font-size: 2.2rem;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 2px 8px rgba(0,0,0,0.6);
}

.win-time {
  font-size: 1.3rem;
  color: #ffe;
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
}

.win-hint {
  font-size: 0.95rem;
  color: rgba(255,255,255,0.7);
  margin-top: 4px;
}
</style>
