<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../../store/game.js'
import messagesData from '../../data/messages.json'
import LoadingScreen from '../../components/LoadingScreen.vue'

const router = useRouter()
const store = useGameStore()

const currentCharacter = ref(null)
const messages = ref([])
const userInput = ref('')
const won = ref(false)
const chatContainer = ref(null)

// 关卡知识回复（所有mzk共享）
const LEVEL_FACTS = {
  '第一关': '第一关有91个眼镜哦！',
  '眼镜': '第一关一共有91个眼镜！',
  '第二关': '第二关有67个mzk呢！',
  '第三关': '第三关有20个方块哦！',
  '方块': '第三关有20个方块！',
  '第四关': '第四关一共会遇见10个mzk！包括我哦～',
  '第五关': '第五关有4篇帖子！',
  '帖子': '第五关有4篇帖子哦！',
  '第六关': '第六关的视频里有30个mzk！',
  '视频': '第六关的视频里有30个mzk！',
  '这里': '问我关于这里的一切我都知道哦～第一关有91个眼镜，第二关有67个mzk，第三关有20个方块，第四关有10个mzk，第五关有4篇帖子，第六关的视频有30个mzk！',
  '关卡': '问我关于这里的一切我都知道哦～第一关有91个眼镜，第二关有67个mzk，第三关有20个方块，第四关有10个mzk，第五关有4篇帖子，第六关的视频有30个mzk！'
}

// 洗牌队列，遍历完所有角色后再重新洗牌，避免连续重复
let characterQueue = []

function shuffleQueue() {
  const arr = [...messagesData]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  // 如果洗牌后第一个和上一轮最后一个相同，把它挪到后面
  if (currentCharacter.value && arr.length > 1 && arr[0] === currentCharacter.value) {
    const swap = 1 + Math.floor(Math.random() * (arr.length - 1))
    ;[arr[0], arr[swap]] = [arr[swap], arr[0]]
  }
  return arr
}

function selectRandomCharacter() {
  if (characterQueue.length === 0) {
    characterQueue = shuffleQueue()
  }
  currentCharacter.value = characterQueue.shift()

  // 添加开场白
  messages.value = [
    {
      type: 'character',
      text: currentCharacter.value.greeting
    },
    {
      type: 'character',
      text: '问我关于这里的一切我都知道哦～'
    }
  ]
}

// 滚动到底部
async function scrollToBottom() {
  await nextTick()
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

// 检查是否包含答案
function checkAnswer(input) {
  const lowerInput = input.toLowerCase().trim()
  return currentCharacter.value.answers.some(answer =>
    lowerInput.includes(answer.toLowerCase())
  )
}

// 获取回复
function getReply(input) {
  const lowerInput = input.toLowerCase()

  // 检查关卡知识
  for (const [keyword, reply] of Object.entries(LEVEL_FACTS)) {
    if (lowerInput.includes(keyword.toLowerCase())) {
      return reply
    }
  }

  // 检查是否匹配角色关键词
  for (const [keyword, reply] of Object.entries(currentCharacter.value.replies)) {
    if (lowerInput.includes(keyword.toLowerCase())) {
      return reply
    }
  }

  // 默认回复
  const defaultReplies = [
    '嗯...我不太明白你的意思...',
    '你想说什么呢？',
    '这个问题...我该怎么回答呢？',
    '或许你可以换个方式问问看？'
  ]
  return defaultReplies[Math.floor(Math.random() * defaultReplies.length)]
}

// 发送消息
async function sendMessage() {
  const input = userInput.value.trim()
  if (!input || won.value) return

  // 添加用户消息
  messages.value.push({
    type: 'user',
    text: input
  })

  userInput.value = ''
  await scrollToBottom()

  // 检查是否是正确答案
  if (checkAnswer(input)) {
    setTimeout(async () => {
      messages.value.push({
        type: 'character',
        text: '......你真的明白了吗？谢谢你。'
      })
      await scrollToBottom()

      setTimeout(() => {
        won.value = true
        store.completeLevel(4)
      }, 1000)
    }, 800)
    return
  }

  // 获取回复
  setTimeout(async () => {
    const reply = getReply(input)
    messages.value.push({
      type: 'character',
      text: reply
    })
    await scrollToBottom()
  }, 600)
}

// 处理回车发送
function handleKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

onMounted(() => {
  selectRandomCharacter()
  scrollToBottom()
})
</script>

<template>
  <LoadingScreen text="正在加载中" />
  <!-- 顶部栏 -->
  <header class="top-bar">
    <router-link class="home-link" to="/index">
      <img class="home-link-icon" src="https://faceround.cn/games/find-mzk/%E5%A4%A7%E7%9C%BCmzk.png" alt="首页" />
      <span class="home-link-text">首页</span>
    </router-link>
    <div class="hint">
      <span class="hint-title">询问晓山瑞希</span>
      <span class="hint-sub">安慰这群可爱的晓山瑞希！</span>
    </div>
    <span class="level-tag">第 4 关</span>
  </header>

  <!-- 游戏区域 -->
  <div class="game-container">
    <!-- 角色信息 -->
    <div v-if="currentCharacter" class="character-info">
      <img :src="currentCharacter.avatar" :alt="currentCharacter.name" class="character-avatar" @click="selectRandomCharacter" title="点击换一个mzk" />
      <span class="character-name">{{ currentCharacter.name }}</span>
    </div>

    <!-- 对话区域 -->
    <div ref="chatContainer" class="chat-container">
      <div
        v-for="(msg, index) in messages"
        :key="index"
        class="message-wrapper"
        :class="msg.type"
      >
        <img
          v-if="msg.type === 'character'"
          :src="currentCharacter.avatar"
          :alt="currentCharacter.name"
          class="message-avatar"
        />
        <div class="message-bubble">
          {{ msg.text }}
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <input
        v-model="userInput"
        type="text"
        class="message-input"
        placeholder="输入你的回答..."
        @keydown="handleKeydown"
        :disabled="won"
      />
      <button class="send-btn" @click="sendMessage" :disabled="!userInput.trim() || won">
        发送
      </button>
    </div>
  </div>

  <!-- 通关弹窗 -->
  <Teleport to="body">
    <div v-if="won" class="overlay">
      <div class="result-wrapper">
        <img
          class="result-mzk"
          :src="currentCharacter.avatar"
          :alt="currentCharacter.name"
        />
        <div class="result-card">
          <h2 class="result-title">你找到了答案！</h2>
          <p class="result-sub">第 4 关 · 询问晓山瑞希 · 通关</p>
          <div class="result-btns">
            <button class="btn btn-stay" @click="won = false; selectRandomCharacter()">重玩</button>
            <button class="btn btn-home" @click="router.push('/index')">返回</button>
            <button class="btn btn-next" @click="router.push('/5')">下一关</button>
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

/* ── 游戏区域 ── */
.game-container {
  height: calc(100vh - 60px);
  background: linear-gradient(135deg, #fff5f7 0%, #ffe8f0 100%);
  display: flex;
  flex-direction: column;
}

/* ── 角色信息 ── */
.character-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.9);
  border-bottom: 1px solid #f6c8cc;
}

.character-avatar {
  width: 48px;
  height: 48px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  cursor: pointer;
  transition: transform 0.15s;
}
.character-avatar:active { transform: scale(0.9); }

.character-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: #c07090;
}

/* ── 对话区域 ── */
.chat-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-wrapper.user {
  justify-content: flex-end;
}

.message-wrapper.character {
  justify-content: flex-start;
}

.message-avatar {
  width: 40px;
  height: 40px;
  object-fit: contain;
  flex-shrink: 0;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 18px;
  font-size: 0.95rem;
  line-height: 1.5;
  word-wrap: break-word;
}

.message-wrapper.user .message-bubble {
  background: linear-gradient(135deg, #F6B1B5, #d97ca8);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.message-wrapper.character .message-bubble {
  background: #fff;
  color: #333;
  border: 1px solid #f6c8cc;
  border-bottom-left-radius: 4px;
}

/* ── 输入区域 ── */
.input-area {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.95);
  border-top: 1px solid #f6c8cc;
}

.message-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #f6c8cc;
  border-radius: 24px;
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s;
}

.message-input:focus {
  border-color: #F6B1B5;
}

.message-input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.send-btn {
  padding: 12px 24px;
  background: linear-gradient(135deg, #F6B1B5, #d97ca8);
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 0.95rem;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.15s, opacity 0.2s;
  white-space: nowrap;
}

.send-btn:active {
  transform: scale(0.95);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (hover: hover) {
  .send-btn:hover:not(:disabled) {
    transform: scale(1.05);
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
}

@media (min-width: 400px) {
  .result-btns {
    flex-direction: row;
  }
}
</style>
