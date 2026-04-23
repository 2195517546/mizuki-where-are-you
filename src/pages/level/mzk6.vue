<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../../store/game.js'
import vediosData from '../../data/level67/vedios.json'
import messagesData from '../../data/level67/messages.json'
import commentData from '../../data/level67/comment.json'
import LoadingScreen from '../../components/LoadingScreen.vue'
import TopBar from '../../components/game/TopBar.vue'
import ResultModal from '../../components/game/ResultModal.vue'

const router = useRouter()
const store = useGameStore()

const BASE = ''
const COVER_BASE = import.meta.env.BASE_URL + 'vediocover/'

// ─── 用户 & mzk 角色 ───
const USERS = [
  'ENnA', 'MortDollis', 'RiSelf', '五字🐟️', '尤珞理希',
  '日本一枝花❀', '梅历亚斯', '蛋⑨', '蜜饼',
  '超级无敌松鼠大王', '龟☆酱☆', '日本七枝花❀'
]
const MZK_CHARS = new Set([
  '普通mzk', '开心mzk', '偷听mzk', '生气mzk', '飞行mzk', '通通mzk',
  '讲话mzk', '走路mzk', '鲨鱼mzk', 'emumzk', '打坐mzk', '惊吓mzk',
  '怪核mzk', '大眼mzk', '吐舌mzk', '跑mzk', '倒立mzk', '倒立走mzk',
  '呼啦啦mzk', '右立mzk', '松鼠mzk'
])

function avatarUrl(name) {
  if (MZK_CHARS.has(name)) return `${BASE}${encodeURIComponent(name)}.png`
  return `${BASE}avatar/${encodeURIComponent(name)}.jpg`
}
function coverUrl(cover) {
  return `${COVER_BASE}${encodeURIComponent(cover)}`
}

// ─── 解锁弹窗 ───
const UNLOCK_KEY = 'mzk-level6-unlocked'
const isUnlocked = ref(localStorage.getItem(UNLOCK_KEY) === 'true')
const unlockInput = ref('')
const unlockError = ref(false)

function tryUnlock() {
  if (unlockInput.value.trim() === '91') {
    localStorage.setItem(UNLOCK_KEY, 'true')
    isUnlocked.value = true
  } else {
    unlockError.value = true
    setTimeout(() => (unlockError.value = false), 1500)
  }
}

// ─── 随机头像（存档固定） ───
const AVATAR_KEY = 'mzk-level6-avatar'
let savedAvatar = localStorage.getItem(AVATAR_KEY)
if (!savedAvatar) {
  savedAvatar = USERS[Math.floor(Math.random() * USERS.length)]
  localStorage.setItem(AVATAR_KEY, savedAvatar)
}
const userAvatar = ref(savedAvatar)

// ─── 视图状态 ───
const currentView = ref('home') // home | video | messages | chat
const selectedChat = ref(null)

// ─── Toast ───
const toastMsg = ref('')
const showToast = ref(false)
function blocked(msg = '被神秘的力量阻止了') {
  toastMsg.value = msg
  showToast.value = true
  setTimeout(() => (showToast.value = false), 1500)
}

// ─── 分类 Tab ───
const categories = ['推荐', '热门', '动画', '影视', '新征程']
const activeCategory = ref('推荐')
function selectCategory(cat) {
  if (cat !== '推荐') { blocked(); return }
  activeCategory.value = cat
}

// ─── 视频卡片 ───
const UP_TAGS = ['2千点赞', '4千点赞', '8千点赞', '1万点赞', '2万点赞', '5万点赞', '竖屏']

const refreshCount = ref(0)
const MIN_REFRESHES = 6

function buildCards() {
  const others = vediosData.filter(v => !v.broken)
  let pool

  if (refreshCount.value >= MIN_REFRESHES) {
    // 刷新够了，加入损坏视频
    const brokenVideo = vediosData.find(v => v.broken)
    const picked = [...others].sort(() => Math.random() - 0.5).slice(0, 5)
    pool = [brokenVideo, ...picked].sort(() => Math.random() - 0.5)
  } else {
    // 前6次不出现损坏视频
    pool = [...others].sort(() => Math.random() - 0.5).slice(0, 6)
  }

  return pool.map(v => {
    const play = (Math.random() * 190 + 10).toFixed(1)
    const danmaku = Math.floor(Math.random() * (parseFloat(play) * 10 - 100) + 100)
    const r = Math.random()
    let upDisplay
    if (r < 0.8) {
      upDisplay = { type: 'up', name: v.author }
    } else if (r < 0.9) {
      const tag = UP_TAGS[Math.floor(Math.random() * UP_TAGS.length)]
      upDisplay = { type: 'tag', tag, name: tag === '竖屏' ? v.author : '' }
    } else {
      upDisplay = { type: 'followed', name: v.author }
    }
    return { ...v, playCount: `${play}万`, danmakuCount: danmaku, upDisplay }
  })
}

const videoCards = ref(buildCards())

function refreshVideos() {
  refreshCount.value++
  videoCards.value = buildCards()
}

// ─── 手机端下拉刷新 ───
const pullStartY = ref(0)
const pulling = ref(false)
const pullDistance = ref(0)
const PULL_THRESHOLD = 80
const videoGridRef = ref(null)

function getScrollTop() {
  // 尝试多种方式获取滚动位置，兼容各种手机浏览器
  if (videoGridRef.value) {
    const rect = videoGridRef.value.getBoundingClientRect()
    // 如果视频网格顶部接近或超过视口顶部，说明页面在顶部
    if (rect.top >= 0) return 0
  }
  return Math.max(
    window.pageYOffset || 0,
    document.documentElement.scrollTop || 0,
    document.body.scrollTop || 0
  )
}

function onTouchStart(e) {
  const scrollTop = getScrollTop()
  if (scrollTop <= 5) {
    pullStartY.value = e.touches[0].clientY
    pulling.value = true
  }
}
function onTouchMove(e) {
  if (!pulling.value) return
  const dy = e.touches[0].clientY - pullStartY.value
  if (dy > 0) {
    pullDistance.value = Math.min(dy * 0.5, 120)
    // 阻止页面原生滚动，避免与下拉刷新冲突
    if (pullDistance.value > 5) {
      e.preventDefault()
    }
  } else {
    // 向上滑动时取消下拉状态
    pulling.value = false
    pullDistance.value = 0
  }
}
function onTouchEnd() {
  if (pullDistance.value >= PULL_THRESHOLD) {
    refreshVideos()
  }
  pullDistance.value = 0
  pulling.value = false
}

function clickVideo(v) {
  if (v.broken) { currentView.value = 'video' }
  else { blocked() }
}

// ─── 通关 ───
const won = ref(false)

// ─── 从 JSON 读取答案配置和会话列表 ───
const conversationsList = messagesData.conversations
const LEVEL_ANSWER = messagesData.answer
const ANSWER_PREFIX = messagesData.answerPrefix

// ─── 聊天输入 & 发送 ───
const chatInput = ref('')
const chatBodyRef = ref(null)
const extraMessages = ref({})

const chatMessages = computed(() => {
  if (!selectedChat.value) return []
  const base = selectedChat.value.messages || []
  const extra = extraMessages.value[selectedChat.value.id] || []
  return [...base, ...extra]
})

function getAutoReply(charName, text) {
  const conv = conversationsList.find(c => c.username === charName)
  if (!conv || !conv.replies) return '……'
  const lower = text.toLowerCase()
  for (const [keyword, reply] of Object.entries(conv.replies)) {
    if (lower.includes(keyword.toLowerCase())) return reply
  }
  const defs = conv.defaults || []
  return defs.length ? defs[Math.floor(Math.random() * defs.length)] : '……'
}

function nowTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function sendChat() {
  const text = chatInput.value.trim()
  if (!text || !selectedChat.value || won.value) return

  const chatId = selectedChat.value.id
  if (!extraMessages.value[chatId]) extraMessages.value[chatId] = []

  // 追加玩家消息
  extraMessages.value[chatId].push({ from: 'self', content: text, time: nowTime() })
  chatInput.value = ''
  scrollChatBottom()

  // 检查答案
  const cleaned = text.replace(/\/$/, '')

  if (cleaned === LEVEL_ANSWER) {
    setTimeout(() => {
      extraMessages.value[chatId].push({
        from: 'other', content: messagesData.correctReply,
        avatar: selectedChat.value.avatar, time: nowTime()
      })
      scrollChatBottom()
      setTimeout(() => { won.value = true }, 800)
    }, 600)
  } else if (cleaned.startsWith(ANSWER_PREFIX) || text.replace(/\/$/, '').startsWith(ANSWER_PREFIX)) {
    // 接近答案的提示
    setTimeout(() => {
      extraMessages.value[chatId].push({
        from: 'other', content: messagesData.nearReply,
        avatar: selectedChat.value.avatar, time: nowTime()
      })
      scrollChatBottom()
    }, 400 + Math.random() * 400)
  } else {
    // 关键词自动回复
    setTimeout(() => {
      const reply = getAutoReply(selectedChat.value.username, text)
      extraMessages.value[chatId].push({
        from: 'other', content: reply,
        avatar: selectedChat.value.avatar, time: nowTime()
      })
      scrollChatBottom()
    }, 400 + Math.random() * 400)
  }
}

async function scrollChatBottom() {
  await nextTick()
  if (chatBodyRef.value) chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
}

function goToEndScreen() {
  won.value = false
  router.push('/6-end')
}

// ─── 私信 ───
function openMessages() { currentView.value = 'messages' }
function openChat(msg) { selectedChat.value = msg; currentView.value = 'chat' }
function backToMessages() { selectedChat.value = null; currentView.value = 'messages' }
function backToHome() { selectedChat.value = null; currentView.value = 'home' }

// ─── 底部 Tab ───
function clickBottomTab(name) {
  if (name !== '首页') blocked()
}

// ─── 格式化 ───
const totalCommentCount = computed(() => {
  return commentData.reduce((sum, c) => sum + 1 + (c.replies ? c.replies.length : 0), 0)
})

function formatLikes(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  if (n >= 1000) return (n / 1000).toFixed(1) + '千'
  return String(n)
}

function goHome() {
  router.push('/index')
}
</script>

<template>
  <LoadingScreen text="正在加载中" />

  <!-- 游戏顶部栏 -->
  <TopBar
    title="接近晓山瑞希"
    subtitle="我想看晓山瑞希发布的mv！"
    level="6"
    @home="goHome"
  />

  <!-- ═══ 解锁弹窗 ═══ -->
  <Teleport to="body">
    <div v-if="!isUnlocked" class="overlay">
      <div class="unlock-card">
        <img class="unlock-mzk" :src="`${BASE}惊吓mzk.png`" alt="mzk" />
        <h2 class="unlock-title">第六关已被封锁</h2>
        <p class="unlock-desc">输入第一关中眼睛的数量即可解锁</p>
        <input
          v-model="unlockInput"
          type="text"
          class="unlock-input"
          placeholder="请输入数字..."
          @keyup.enter="tryUnlock"
        />
        <p v-if="unlockError" class="unlock-error">数字不对哦，再想想？</p>
        <div class="unlock-btns">
          <button class="btn btn-back" @click="router.push('/index')">返回首页</button>
          <button class="btn btn-confirm" @click="tryUnlock">确认</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══ 主内容 ═══ -->
  <div v-if="isUnlocked" class="bili-app">

    <!-- ══ 首页视图 ══ -->
    <template v-if="currentView === 'home'">
      <!-- 下拉刷新指示器（手机端） -->
      <div
        class="pull-indicator mobile-only-block"
        :style="{ height: pullDistance + 'px', opacity: pullDistance / PULL_THRESHOLD }"
      >
        <span v-if="pullDistance >= PULL_THRESHOLD">松手刷新</span>
        <span v-else>下拉刷新视频</span>
      </div>

      <!-- B站顶栏 -->
      <div class="bili-header">
        <img class="bili-avatar" :src="avatarUrl(userAvatar)" :alt="userAvatar" />
        <div class="bili-search" @click="blocked()">
          <span class="bili-search-text">搜索</span>
        </div>
        <div class="bili-msg-wrap" @click="openMessages">
          <img
            class="bili-msg-icon"
            src="icons/%E7%A7%81%E4%BF%A1.svg"
            alt="私信"
          />
          <span class="bili-msg-badge">10</span>
        </div>
      </div>

      <!-- 分类标签 -->
      <div class="bili-tabs">
        <span
          v-for="cat in categories"
          :key="cat"
          class="bili-tab"
          :class="{ active: cat === activeCategory }"
          @click="selectCategory(cat)"
        >{{ cat }}</span>
      </div>

      <!-- 视频列表 -->
      <div
        ref="videoGridRef"
        class="video-grid"
        @touchstart.passive="onTouchStart"
        @touchmove="onTouchMove"
        @touchend="onTouchEnd"
      >
        <div
          v-for="v in videoCards"
          :key="v.id"
          class="video-card"
          @click="clickVideo(v)"
        >
          <!-- 封面 -->
          <div class="cover-wrap" :class="{ broken: v.broken }">
            <img class="cover-img" :src="coverUrl(v.cover)" :alt="v.title" />
            <div v-if="v.broken" class="broken-overlay">
              <span class="broken-icon">⚠</span>
              <span class="broken-text">封面已损坏</span>
            </div>
            <div class="cover-info">
              <span class="cover-stat">
                <img class="stat-icon" src="icons/%E6%92%AD%E6%94%BE%E9%87%8F.svg" alt="" />
                {{ v.playCount }}
              </span>
              <span class="cover-stat">
                <img class="stat-icon" src="icons/%E6%92%AD%E6%94%BE%E9%87%8F.svg" alt="" />
                {{ v.danmakuCount }}
              </span>
              <span class="cover-time">{{ v.time }}</span>
            </div>
          </div>
          <!-- 标题 -->
          <div class="video-title">{{ v.title }}</div>
          <!-- UP 信息 -->
          <div class="video-up-row">
            <template v-if="v.upDisplay.type === 'up'">
              <img class="up-icon" src="icons/UP%E4%B8%BB.svg" alt="UP" />
              <span class="up-name">{{ v.upDisplay.name }}</span>
            </template>
            <template v-else-if="v.upDisplay.type === 'tag'">
              <span class="up-tag">{{ v.upDisplay.tag }}</span>
              <span v-if="v.upDisplay.name" class="up-name">{{ v.upDisplay.name }}</span>
            </template>
            <template v-else>
              <img class="followed-icon" src="icons/%E5%B7%B2%E5%85%B3%E6%B3%A8.svg" alt="" />
              <span class="up-name followed">已关注 {{ v.upDisplay.name }}</span>
            </template>
            <img class="more-icon" src="icons/%E6%9B%B4%E5%A4%9A.svg" alt="更多" @click.stop="blocked()" />
          </div>
        </div>
      </div>

      <!-- 刷新按钮（手机+电脑均可见） -->
      <div class="refresh-row">
        <span class="refresh-btn" @click="refreshVideos">刷新视频</span>
      </div>

      <!-- 底部 Tabbar -->
      <nav class="bili-bottom">
        <div class="bottom-item active" @click="clickBottomTab('首页')">
          <img class="bottom-icon" src="icons/%E9%A6%96%E9%A1%B5.svg" alt="" />
          <span>首页</span>
        </div>
        <div class="bottom-item" @click="clickBottomTab('关注')">
          <img class="bottom-icon" src="icons/%E5%85%B3%E6%B3%A8.svg" alt="" />
          <span>关注</span>
        </div>
        <div class="bottom-item center" @click="clickBottomTab('发布')">
          <img class="bottom-center-icon" :src="`${BASE}生气mzk.png`" alt="mzk" />
        </div>
        <div class="bottom-item" @click="clickBottomTab('会员购')">
          <img class="bottom-icon" src="icons/%E4%BC%9A%E5%91%98%E8%B4%AD.svg" alt="" />
          <span>会员购</span>
        </div>
        <div class="bottom-item" @click="clickBottomTab('我的')">
          <img class="bottom-icon" src="icons/%E6%88%91%E7%9A%84.svg" alt="" />
          <span>我的</span>
        </div>
      </nav>
    </template>

    <!-- ══ 视频播放视图 ══ -->
    <template v-if="currentView === 'video'">
      <div class="video-player-page">
        <button class="back-arrow" @click="backToHome">＜</button>

        <video
          class="video-element"
          src="压缩67晓山瑞希视频.mp4"
          controls
          playsinline
        ></video>

        <div class="video-detail-title">你很熟悉这里，因为你见过。。</div>
        <div class="video-detail-author">
          <img class="video-detail-avatar" :src="avatarUrl('怪核mzk')" alt="" />
          <span>怪核mzk</span>
        </div>

        <!-- 评论区 -->
        <div class="comment-section">
          <h3 class="comment-title">评论 ({{ totalCommentCount }})</h3>
          <div v-for="c in commentData" :key="c.id" class="comment-item">
            <img class="comment-avatar" :src="avatarUrl(c.avatar)" :alt="c.username" />
            <div class="comment-body">
              <div class="comment-header">
                <span class="comment-name">{{ c.username }}</span>
                <span class="comment-time">{{ c.time }}</span>
              </div>
              <p class="comment-text">{{ c.content }}</p>
              <span class="comment-likes">👍 {{ formatLikes(c.likes) }}</span>
              <!-- 子回复 -->
              <div v-if="c.replies && c.replies.length" class="reply-list">
                <div v-for="r in c.replies" :key="r.id" class="reply-item">
                  <img class="reply-avatar" :src="avatarUrl(r.avatar)" :alt="r.username" />
                  <div class="reply-body">
                    <div class="comment-header">
                      <span class="comment-name">{{ r.username }}</span>
                      <span class="comment-time">{{ r.time }}</span>
                    </div>
                    <p class="comment-text"><span class="reply-at">回复 @{{ c.username }} ：</span>{{ r.content }}</p>
                    <span class="comment-likes">👍 {{ formatLikes(r.likes) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ══ 私信列表视图 ══ -->
    <template v-if="currentView === 'messages'">
      <div class="messages-page">
        <div class="messages-header">
          <button class="back-arrow" @click="backToHome">＜</button>
          <h2 class="messages-title">私信</h2>
        </div>
        <div class="messages-list">
          <div
            v-for="m in conversationsList"
            :key="m.id"
            class="message-row"
            @click="openChat(m)"
          >
            <div class="msg-avatar-wrap">
              <img class="msg-avatar" :src="avatarUrl(m.avatar)" :alt="m.username" />
              <span v-if="m.unread" class="msg-badge">{{ m.unread }}</span>
            </div>
            <div class="msg-info">
              <div class="msg-top">
                <span class="msg-name">{{ m.username }}</span>
                <span class="msg-time">{{ m.time }}</span>
              </div>
              <p class="msg-preview">{{ m.preview }}</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- ══ 聊天视图 ══ -->
    <template v-if="currentView === 'chat'">
      <div class="chat-page">
        <div class="chat-header">
          <button class="back-arrow" @click="backToMessages">＜</button>
          <h2 class="chat-title">{{ selectedChat.username }}</h2>
        </div>
        <div class="chat-body" ref="chatBodyRef">
          <div v-for="(msg, i) in chatMessages" :key="i" class="chat-bubble-wrap" :class="{ 'is-self': msg.from === 'self' }">
            <img v-if="msg.from !== 'self'" class="chat-avatar" :src="avatarUrl(msg.avatar || selectedChat.avatar)" alt="" />
            <div class="chat-bubble" :class="{ 'bubble-self': msg.from === 'self' }">
              <p class="chat-text">{{ msg.content }}</p>
              <img v-if="msg.mzkImage" class="chat-mzk-img" :src="msg.mzkImage" alt="" />
              <span class="chat-time">{{ msg.time }}</span>
            </div>
            <img v-if="msg.from === 'self'" class="chat-avatar" :src="avatarUrl(userAvatar)" alt="" />
          </div>
        </div>
        <!-- 聊天输入栏 -->
        <div class="chat-input-bar">
          <input
            v-model="chatInput"
            type="text"
            class="chat-input"
            placeholder="发送消息..."
            @keyup.enter="sendChat"
          />
          <button class="chat-send-btn" @click="sendChat">发送</button>
        </div>
      </div>
    </template>
  </div>

  <!-- ═══ Toast ═══ -->
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="showToast" class="toast">{{ toastMsg }}</div>
    </Transition>
  </Teleport>

  <!-- ═══ 通关弹窗 ═══ -->
  <ResultModal
    :show="won"
    :success="true"
    title="你找到线索了！"
    message="第 6 关 · 小心晓山瑞希 · 通关"
    :show-next="true"
    @home="goHome"
    @next="goToEndScreen"
  />
</template>

<style scoped>
/* ── B站风格容器 ── */
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px;
}
.unlock-card {
  background: #fff; border-radius: 20px; padding: 32px 24px; width: min(360px, 100%);
  display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center;
}
.unlock-mzk { width: 80px; height: 80px; object-fit: contain; }
.unlock-title { font-size: 1.2rem; color: #FF679A; margin: 0; }
.unlock-desc { font-size: 0.85rem; color: #888; margin: 0; }
.unlock-input {
  width: 100%; padding: 12px 16px; border: 2px solid #ffc0cb; border-radius: 12px;
  font-size: 1rem; text-align: center; outline: none; transition: border-color 0.2s;
}
.unlock-input:focus { border-color: #FF679A; }
.unlock-error { color: #e74c3c; font-size: 0.85rem; margin: 0; }
.unlock-btns { display: flex; gap: 12px; width: 100%; margin-top: 8px; }

/* ── 通用按钮 ── */
.btn {
  flex: 1; min-height: 44px; border-radius: 22px; border: none;
  font-size: 0.95rem; cursor: pointer; touch-action: manipulation; transition: transform 0.15s;
}
.btn:active { transform: scale(0.97); }
.btn-confirm { background: linear-gradient(135deg, #FF679A, #e05580); color: #fff; font-weight: bold; }
.btn-back, .btn-home { background: transparent; border: 2px solid #ddd; color: #888; }
.btn-next { background: linear-gradient(135deg, #FF679A, #e05580); color: #fff; font-weight: bold; }

/* ── B站风格容器 ── */
.bili-app {
  min-height: calc(100vh - 46px);
  background: #f5f5f5;
  padding-bottom: 60px;
  /* 禁用浏览器原生下拉刷新，避免与自定义下拉冲突 */
  overscroll-behavior-y: contain;
}

/* ── B站顶栏 ── */
.bili-header {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; background: #FF679A;
}
.bili-avatar {
  width: 32px; height: 32px; border-radius: 50%; object-fit: cover;
  border: 2px solid rgba(255,255,255,0.6);
}
.bili-search {
  flex: 1; background: #fff; border-radius: 20px; padding: 8px 16px; cursor: pointer;
}
.bili-search-text { color: #999; font-size: 0.85rem; }
.bili-msg-wrap { position: relative; cursor: pointer; flex-shrink: 0; }
.bili-msg-icon { width: 24px; height: 24px; filter: brightness(0) invert(1); }
.bili-msg-badge {
  position: absolute; top: -6px; right: -8px;
  background: #FF3B30; color: #fff; font-size: 0.55rem; font-weight: bold;
  min-width: 16px; height: 14px; border-radius: 7px;
  display: flex; align-items: center; justify-content: center;
  padding: 0 4px; border: 2.5px solid #fff; line-height: 1;
}

/* ── 下拉刷新指示器 ── */
.pull-indicator {
  display: flex; align-items: flex-end; justify-content: center;
  overflow: hidden; font-size: 0.78rem; color: #FF679A;
  padding-bottom: 6px; transition: opacity 0.15s;
}

/* ── 电脑端刷新按钮 ── */
.refresh-row {
  text-align: center; padding: 12px 0 4px;
}
.refresh-btn {
  font-size: 0.8rem; color: #FF679A; cursor: pointer;
  text-decoration: none; user-select: none;
}
.refresh-btn:active { opacity: 0.6; }

/* ── 响应式 block 版本 ── */
.mobile-only-block { display: block; }
.desktop-only-block { display: none; }
@media (hover: hover) and (pointer: fine) {
  .mobile-only-block { display: none !important; }
  .desktop-only-block { display: block !important; }
}

/* ── 分类标签 ── */
.bili-tabs {
  display: flex; gap: 0; background: #fff; padding: 0 8px;
  border-bottom: 1px solid #eee; overflow-x: auto;
}
.bili-tab {
  padding: 10px 16px; font-size: 0.88rem; color: #666; cursor: pointer;
  white-space: nowrap; position: relative; transition: color 0.2s;
}
.bili-tab.active {
  color: #FF679A; font-weight: bold;
}
.bili-tab.active::after {
  content: ''; position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 20px; height: 3px; background: #FF679A; border-radius: 2px;
}

/* ── 视频网格 ── */
.video-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
  padding: 8px;
}
.video-card {
  background: #fff; border-radius: 8px; overflow: hidden; cursor: pointer;
  transition: transform 0.15s;
}
.video-card:active { transform: scale(0.98); }

/* 封面 */
.cover-wrap {
  position: relative; width: 100%; aspect-ratio: 16/10; overflow: hidden; background: #eee;
}
.cover-img { width: 100%; height: 100%; object-fit: cover; }
.cover-wrap.broken .cover-img {
  filter: grayscale(0.6) contrast(1.3) brightness(0.7);
}
.broken-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.4);
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
}
.broken-icon { font-size: 1.5rem; }
.broken-text { color: #fff; font-size: 0.72rem; }
.cover-info {
  position: absolute; bottom: 0; left: 0; right: 0;
  display: flex; align-items: center; gap: 8px;
  padding: 4px 6px; background: linear-gradient(transparent, rgba(0,0,0,0.6));
  color: #fff; font-size: 0.68rem;
}
.cover-stat { display: flex; align-items: center; gap: 2px; }
.stat-icon { width: 12px; height: 12px; filter: brightness(10); }
.cover-time { margin-left: auto; background: rgba(0,0,0,0.5); padding: 1px 4px; border-radius: 3px; }

/* 标题 */
.video-title {
  padding: 6px 8px 2px; font-size: 0.8rem; color: #333; font-weight: 500;
  line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
  min-height: 2.6em;
}

/* UP 信息行 */
.video-up-row {
  display: flex; align-items: center; gap: 4px;
  padding: 4px 8px 8px; font-size: 0.7rem; color: #999;
}
.up-icon { width: 14px; height: 14px; flex-shrink: 0; }
.up-tag {
  background: #fff3e0; color: #e65100; font-size: 0.65rem;
  padding: 2px 6px; border-radius: 10px;
}
.up-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.up-name.followed { color: #FF679A; }
.followed-icon { width: 14px; height: 14px; }
.more-icon { width: 16px; height: 16px; margin-left: auto; opacity: 0.5; flex-shrink: 0; }

/* ── 底部 Tabbar ── */
.bili-bottom {
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
  display: flex; align-items: center; justify-content: space-around;
  background: #fff; border-top: 1px solid #eee; padding: 4px 0 env(safe-area-inset-bottom, 4px);
  height: 56px;
}
.bottom-item {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  font-size: 0.65rem; color: #999; cursor: pointer;
}
.bottom-item.active { color: #FF679A; }
.bottom-icon { width: 22px; height: 22px; }
.bottom-item.center { margin-top: -12px; }
.bottom-center-icon { width: 42px; height: 42px; object-fit: contain; }

/* ── 视频播放页 ── */
.video-player-page { padding: 0 0 40px; background: #fff; }
.back-arrow {
  background: none; border: none; color: #333; font-size: 1.3rem;
  padding: 10px 14px; cursor: pointer; line-height: 1; font-weight: 300;
}
.video-element { width: 100%; max-height: 50vh; background: #000; }
.video-detail-title { padding: 12px 16px 4px; font-size: 1rem; font-weight: bold; color: #333; }
.video-detail-author {
  display: flex; align-items: center; gap: 8px; padding: 8px 16px 12px;
  font-size: 0.85rem; color: #666;
}
.video-detail-avatar { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; }

/* 评论区 */
.comment-section { padding: 0 16px 20px; }
.comment-title { font-size: 1rem; color: #333; margin: 16px 0 12px; }
.comment-item { display: flex; gap: 10px; padding: 12px 0; border-bottom: 1px solid #f0f0f0; }
.comment-avatar { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.comment-body { flex: 1; }
.comment-header { display: flex; justify-content: space-between; margin-bottom: 4px; }
.comment-name { font-size: 0.8rem; font-weight: 500; color: #333; }
.comment-time { font-size: 0.7rem; color: #bbb; }
.comment-text { margin: 0; font-size: 0.85rem; color: #555; line-height: 1.5; }
.comment-likes { font-size: 0.75rem; color: #999; margin-top: 4px; display: inline-block; }

/* 子回复列表 */
.reply-list {
  margin-top: 10px; padding: 10px 12px;
  background: #f6f7f8; border-radius: 8px;
  display: flex; flex-direction: column; gap: 10px;
}
.reply-item { display: flex; gap: 8px; }
.reply-avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; flex-shrink: 0; margin-top: 2px; }
.reply-body { flex: 1; }
.reply-at { color: #5B9BD5; font-size: 0.82rem; }

/* ── 私信页 ── */
.messages-page { background: #fff; min-height: calc(100vh - 46px); }
.messages-header {
  display: flex; align-items: center; gap: 8px; padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
}
.messages-title { font-size: 1rem; margin: 0; color: #333; }
.messages-list { padding: 0; }
.message-row {
  display: flex; align-items: center; gap: 12px; padding: 14px 16px;
  border-bottom: 1px solid #f5f5f5; cursor: pointer; transition: background 0.15s;
}
.message-row:active { background: #fafafa; }
.msg-avatar-wrap { position: relative; flex-shrink: 0; }
.msg-avatar { width: 44px; height: 44px; border-radius: 50%; object-fit: cover; }
.msg-badge {
  position: absolute; top: -4px; right: -4px;
  background: #FF679A; color: #fff; font-size: 0.6rem; font-weight: bold;
  min-width: 16px; height: 16px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; padding: 0 4px;
}
.msg-info { flex: 1; min-width: 0; }
.msg-top { display: flex; justify-content: space-between; margin-bottom: 4px; }
.msg-name { font-size: 0.9rem; font-weight: 500; color: #333; }
.msg-time { font-size: 0.72rem; color: #bbb; }
.msg-preview {
  margin: 0; font-size: 0.8rem; color: #999;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ── 聊天页 ── */
.chat-page { background: #f5f5f5; min-height: calc(100vh - 46px); }
.chat-header {
  display: flex; align-items: center; gap: 8px; padding: 4px 0;
  background: #fff; border-bottom: 1px solid #f0f0f0;
}
.chat-title { font-size: 1rem; margin: 0; color: #333; }
.chat-body {
  padding: 16px; display: flex; flex-direction: column; gap: 16px;
  flex: 1; overflow-y: auto;
}
.chat-page {
  display: flex; flex-direction: column;
}
.chat-bubble-wrap { display: flex; gap: 10px; align-items: flex-start; }
.chat-bubble-wrap.is-self { justify-content: flex-end; }
.chat-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.chat-bubble {
  background: #fff; padding: 10px 14px; border-radius: 0 12px 12px 12px;
  max-width: 75%; box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.bubble-self {
  background: #FF679A; color: #fff; border-radius: 12px 0 12px 12px;
}
.bubble-self .chat-text { color: #fff; }
.bubble-self .chat-time { color: rgba(255,255,255,0.7); }
.chat-text { margin: 0; font-size: 0.88rem; color: #333; line-height: 1.5; }
.chat-mzk-img { width: 80px; height: 80px; object-fit: contain; margin-top: 6px; border-radius: 8px; }
.chat-time { display: block; font-size: 0.65rem; color: #bbb; margin-top: 4px; text-align: right; }

/* 聊天输入栏 */
.chat-input-bar {
  display: flex; gap: 8px; padding: 10px 12px;
  background: #fff; border-top: 1px solid #eee;
  position: sticky; bottom: 0;
}
.chat-input {
  flex: 1; padding: 10px 14px; border: 1.5px solid #eee; border-radius: 20px;
  font-size: 0.88rem; outline: none; transition: border-color 0.2s;
}
.chat-input:focus { border-color: #FF679A; }
.chat-send-btn {
  padding: 0 20px; border: none; border-radius: 20px;
  background: #FF679A; color: #fff; font-size: 0.88rem; font-weight: bold;
  cursor: pointer; transition: opacity 0.15s;
}
.chat-send-btn:active { opacity: 0.7; }

/* ── Toast ── */
</style>
