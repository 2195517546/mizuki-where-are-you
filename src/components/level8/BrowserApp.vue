<script setup>
import { ref } from 'vue'
import { getImageUrl } from '../../config/constants.js'

const props = defineProps({
  browserData: {
    type: Object,
    required: true
  },
  passwordRules: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['toast', 'evidence-tweet'])

const browserView = ref('home')
const browserSearch = ref('')
const browserSearchResults = ref([])
const txitterProfile = ref(null)
const forumView = ref(null)

// TXitter登录
const txitterLoginView = ref(false)
const txitterLoginId = ref('')
const txitterLoginPwd = ref('')
const txitterShowPwd = ref(false)
const txitterLoggedUser = ref(null)

// 随机推文
const randomTweets = [
  { id: 'r1', author: '吃货小mzk', content: '今天吃了三碗拉面，幸福感爆棚～🍜', time: '3小时前', likes: 45 },
  { id: 'r2', author: '跑步达人', content: '晨跑5公里打卡！天气真好', time: '5小时前', likes: 23 },
  { id: 'r3', author: '猫猫控mzk', content: '我家猫又把花瓶打翻了...第三次了', time: '6小时前', likes: 89 },
  { id: 'r4', author: '学霸笔记', content: '期末复习第七天，数学终于搞懂了', time: '8小时前', likes: 12 },
  { id: 'r5', author: '摄影新手', content: '今天拍到了超美的夕阳🌅', time: '10小时前', likes: 67 },
]

function browserDoSearch() {
  const q = browserSearch.value.trim()
  if (!q) return
  const results = []
  const txProfile = props.browserData.txitterProfiles[q]
  if (txProfile) {
    results.push({ type: 'txitter', name: q, profile: txProfile })
  }
  const keys = Object.keys(props.browserData.searchResults)
  const match = keys.find(k => q.includes(k) || k.includes(q))
  if (match) {
    results.push({ type: 'web', data: props.browserData.searchResults[match] })
  }
  if (results.length === 0) {
    results.push({ type: 'web', data: { title: '无结果', content: '未找到相关内容。' } })
  }
  browserSearchResults.value = results
  browserView.value = 'search'
}

function openTxitterProfile(item) {
  txitterProfile.value = { ...item.profile, name: item.name, feeds: props.browserData.txitterFeeds[item.profile.twitterId] || [] }
  browserView.value = 'txitter-profile'
}

function txitterLogin() {
  const id = txitterLoginId.value.trim(), pwd = txitterLoginPwd.value.trim()
  if (!id || !pwd) {
    emit('toast', '请输入账号和密码')
    return
  }
  const entry = Object.entries(props.browserData.txitterProfiles).find(([name, p]) =>
    p.twitterId === id || p.nickname === id || name === id
  )
  if (!entry) {
    emit('toast', '用户不存在')
    return
  }
  const [name, profile] = entry
  const rule = props.passwordRules.find(r => r.targetName === name)
  if (!rule || rule.cocoPassword !== pwd) {
    emit('toast', '密码错误')
    return
  }
  txitterLoggedUser.value = { ...profile, name, feeds: props.browserData.txitterFeeds[profile.twitterId] || [] }
  txitterLoginView.value = false
  txitterProfile.value = txitterLoggedUser.value
  browserView.value = 'txitter-profile'
  if (name === '侦探mzk') {
    emit('evidence-tweet')
  }
}

function txitterLogout() {
  txitterLoggedUser.value = null
  txitterLoginId.value = ''
  txitterLoginPwd.value = ''
  txitterShowPwd.value = false
}

function openForum() {
  browserView.value = 'forum'
  forumView.value = props.browserData.shortcuts[0].hotPosts[0]
}

function openTxitter() {
  browserView.value = 'txitter'
}

function formatTweetTime(t) {
  const d = new Date(t)
  return `${d.getMonth() + 1}月${d.getDate()}日 · ${d.getFullYear()}`
}
</script>

<template>
  <div class="browser-app">
    <!-- 首页 -->
    <div v-if="browserView === 'home'" class="browser-home">
      <div class="search-bar">
        <input v-model="browserSearch" class="game-input" placeholder="搜索..." @keyup.enter="browserDoSearch" />
        <button class="game-btn game-btn-primary" @click="browserDoSearch">搜索</button>
      </div>
      <div class="shortcut-grid">
        <div class="shortcut-item" @click="openForum">
          <span class="shortcut-icon">📰</span>
          <span>{{ browserData.shortcuts[0].name }}</span>
        </div>
        <div class="shortcut-item" @click="openTxitter">
          <span class="shortcut-icon">🐦</span>
          <span>TXitter</span>
        </div>
      </div>
    </div>

    <!-- 搜索结果 -->
    <div v-else-if="browserView === 'search'" class="search-results">
      <p class="results-label">搜索结果</p>
      <div v-for="(item, i) in browserSearchResults" :key="i">
        <div v-if="item.type === 'txitter'" class="result-card" @click="openTxitterProfile(item)">
          <img :src="item.profile.avatar" class="result-avatar" alt="" />
          <div class="result-info">
            <p class="result-name">{{ item.profile.nickname }}</p>
            <p class="result-id">{{ item.profile.twitterId }}</p>
          </div>
        </div>
        <div v-else class="game-card">
          <h3>{{ item.data.title }}</h3>
          <p>{{ item.data.content }}</p>
        </div>
      </div>
      <button class="game-btn game-btn-secondary" @click="browserView = 'home'">返回</button>
    </div>

    <!-- TXitter首页 -->
    <div v-else-if="browserView === 'txitter'" class="txitter-home">
      <div class="txitter-header">
        <h3>TXitter</h3>
        <button class="game-btn game-btn-primary" style="height: 32px; padding: 0 12px;" @click="txitterLoginView = true">登录</button>
      </div>
      <div v-for="tweet in randomTweets" :key="tweet.id" class="tweet">
        <p class="tweet-author">{{ tweet.author }} · {{ tweet.time }}</p>
        <p class="tweet-content">{{ tweet.content }}</p>
        <p class="tweet-stats">❤️ {{ tweet.likes }}</p>
      </div>
      <button class="game-btn game-btn-secondary" @click="browserView = 'home'">返回</button>
    </div>

    <!-- TXitter个人主页 -->
    <div v-else-if="browserView === 'txitter-profile'" class="txitter-profile-view">
      <div v-if="txitterProfile" class="txitter-profile">
        <div class="profile-header">
          <img :src="txitterProfile.avatar" class="profile-avatar" alt="" />
          <div>
            <p class="profile-name">{{ txitterProfile.nickname }}</p>
            <p class="profile-id">{{ txitterProfile.twitterId }}</p>
            <p class="profile-bio">{{ txitterProfile.bio }}</p>
          </div>
        </div>
        <div v-for="tweet in txitterProfile.feeds.filter(t => !t.isPrivate || (txitterLoggedUser && txitterLoggedUser.twitterId === txitterProfile.twitterId))" :key="tweet.id" class="tweet">
          <p class="tweet-author">{{ txitterProfile.nickname }} <span class="tweet-id">{{ txitterProfile.twitterId }} · {{ formatTweetTime(tweet.time) }}</span></p>
          <p class="tweet-content">{{ tweet.content }}</p>
          <p class="tweet-stats">💬 {{ tweet.comments || 0 }}  🔁 {{ tweet.retweets || 0 }}  ❤️ {{ tweet.likes || 0 }}</p>
        </div>
      </div>
      <button v-if="txitterLoggedUser" class="game-btn game-btn-secondary" @click="txitterLogout(); browserView = 'txitter'">退出登录</button>
      <button class="game-btn game-btn-secondary" @click="browserView = 'home'">返回</button>
    </div>

    <!-- 论坛 -->
    <div v-else-if="browserView === 'forum'" class="forum-view">
      <div v-if="forumView" class="game-card">
        <h3>{{ forumView.title }}</h3>
        <p class="forum-meta">作者：{{ forumView.author }} | {{ forumView.time }}</p>
        <p style="white-space:pre-wrap">{{ forumView.content }}</p>
      </div>
      <button class="game-btn game-btn-secondary" @click="browserView = 'home'">返回</button>
    </div>

    <!-- TXitter登录弹窗 -->
    <div v-if="txitterLoginView" class="login-overlay" @click.self="txitterLoginView = false">
      <div class="login-modal">
        <h3>登录TXitter</h3>
        <input v-model="txitterLoginId" class="game-input" placeholder="用户名/昵称/TXitter ID" />
        <div class="pwd-row">
          <input v-model="txitterLoginPwd" class="game-input pwd-input" :type="txitterShowPwd ? 'text' : 'password'" placeholder="密码" />
          <button class="pwd-eye" @click="txitterShowPwd = !txitterShowPwd">
            <img class="pwd-eye-img" :src="getImageUrl(txitterShowPwd ? '大眼mzk.png' : '打坐mzk.png')" alt="" />
          </button>
        </div>
        <button class="game-btn game-btn-primary" @click="txitterLogin">登录</button>
        <button class="game-btn game-btn-secondary" @click="txitterLoginView = false">取消</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.browser-app {
  padding: var(--spacing-md);
}

.browser-home {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.search-bar {
  display: flex;
  gap: var(--spacing-sm);
}

.search-bar .game-input {
  flex: 1;
  margin-bottom: 0;
}

.shortcut-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.shortcut-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-xs);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  border: 1px solid var(--color-border);
}

.shortcut-item:active {
  background: var(--color-bg-secondary);
}

.shortcut-icon {
  font-size: 1.5rem;
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.results-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 0;
}

.result-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  cursor: pointer;
}

.result-card:active {
  background: var(--color-bg-secondary);
}

.result-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-name {
  font-weight: bold;
  font-size: var(--font-size-base);
  margin: 0;
}

.result-id {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 2px 0 0;
}

.txitter-home,
.txitter-profile-view,
.forum-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.txitter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.txitter-header h3 {
  margin: 0;
  font-size: var(--font-size-lg);
}

.txitter-profile {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.profile-header {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.profile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.profile-name {
  font-weight: bold;
  font-size: var(--font-size-md);
  margin: 0;
}

.profile-id {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: 2px 0;
}

.profile-bio {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin: 4px 0 0;
}

.tweet {
  padding: var(--spacing-md);
  background: var(--color-bg-primary);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.tweet-author {
  font-weight: bold;
  font-size: var(--font-size-sm);
  margin: 0 0 var(--spacing-xs);
}

.tweet-id {
  font-weight: normal;
  color: var(--color-text-muted);
}

.tweet-content {
  font-size: var(--font-size-base);
  margin: var(--spacing-xs) 0;
  line-height: 1.5;
}

.tweet-stats {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: var(--spacing-xs) 0 0;
}

.forum-meta {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin: var(--spacing-xs) 0;
}

.login-overlay {
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
}

.login-modal {
  background: white;
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  max-width: 400px;
  width: 90%;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.login-modal h3 {
  margin: 0;
  text-align: center;
}

.pwd-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.pwd-input {
  flex: 1;
  margin-bottom: 0;
}

.pwd-eye {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  flex-shrink: 0;
}

.pwd-eye-img {
  width: 28px;
  height: 28px;
  object-fit: contain;
  border-radius: 50%;
}
</style>
