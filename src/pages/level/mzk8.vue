<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../../store/game.js'
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
const BASE = 'https://faceround.cn/games/find-mzk/'

const currentApp = ref(null)
const toastMsg = ref('')
const toastOn = ref(false)

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

const state = reactive({
  crackedPasswords: {},
  cocoLoggedIn: [],
  comailLoggedIn: [],
  evidenceSQL: false,
  evidenceTweet: false,
  evidenceCoCo: false,
  won: false,
  trueEnding: false,
  wrongAttempts: 0
})

function toast(msg) { toastMsg.value = msg; toastOn.value = true; setTimeout(() => { toastOn.value = false }, 2000) }
function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => toast('已复制')).catch(() => toast('复制失败'))
  } else {
    toast('浏览器不支持复制功能')
  }
}
function goHome() { router.push('/index') }
function openApp(app) { currentApp.value = app.id }
function closeApp() {
  currentApp.value = null
  // reset sub-views
  sqlResult.value = null; sqlName.value = ''; sqlExtra.value = ''
  crackResult.value = null; crackName.value = ''; crackSS.value = ''; crackNick.value = ''; crackCoCo.value = ''; crackBirth.value = ''; crackAddr.value = ''
  cocoAccount.value = ''; cocoPwd.value = ''; cocoShowPwd.value = false; cocoLoggedUser.value = null; cocoActiveChat.value = null
  comailAccount.value = ''; comailPwd.value = ''; comailShowPwd.value = false; comailLoggedUser.value = null; comailActiveEmail.value = null
  browserView.value = 'home'; browserSearch.value = ''; browserSearchResults.value = []
  txitterProfile.value = null
  forumView.value = null
  smsInput.value = ''
}

// ─── 99ECoSQL ───
const sqlName = ref('')
const sqlExtra = ref('')
const sqlResult = ref(null)
function searchCitizen() {
  const name = sqlName.value.trim()
  const extra = sqlExtra.value.trim()
  if (!name) { toast('请输入姓名'); return }
  const found = citizens.find(c => {
    if (c.name !== name) return false
    if (!extra) return true
    return c.CoCo === extra || c.phone === extra || c.socialSecurity === extra || c.birthDate === extra || c.email === extra
  })
  sqlResult.value = found || 'NOT_FOUND'
  if (found && found.name === '侦探mzk') state.evidenceSQL = true
}
function copyCitizenInfo(c) {
  const info = `姓名：${c.name}\n社会保障号：${c.socialSecurity}\n出生日期：${c.birthDate}\n地址：${c.address}\n电话：${c.phone}\nCoCo号：${c.CoCo}\n邮箱：${c.email}`
  navigator.clipboard?.writeText(info); toast('户籍信息已复制')
}

// ─── PasswordCracker ───
const crackName = ref('')
const crackSS = ref('')
const crackNick = ref('')
const crackCoCo = ref('')
const crackBirth = ref('')
const crackAddr = ref('')
const crackResult = ref(null)
const crackProgress = ref(0)
const cracking = ref(false)

function crackPassword() {
  const name = crackName.value.trim(), ss = crackSS.value.trim()
  const nick = crackNick.value.trim(), coco = crackCoCo.value.trim()
  const birth = crackBirth.value.trim(), addr = crackAddr.value.trim()
  if (!name || !ss || !nick || !coco || !birth || !addr) { toast('请填写全部六项信息'); return }

  const target = citizens.find(c =>
    c.name === name && c.socialSecurity === ss &&
    c.nickname === nick && c.CoCo === coco &&
    c.birthDate === birth && c.address.includes(addr)
  )
  if (!target) { crackResult.value = 'FAIL'; return }
  const rule = passwordRules.find(r => r.targetName === target.name)
  if (!rule) { crackResult.value = 'FAIL'; return }

  // 开始破解动画
  cracking.value = true
  crackProgress.value = 0
  crackResult.value = null

  const interval = setInterval(() => {
    crackProgress.value += 10
    if (crackProgress.value >= 100) {
      clearInterval(interval)
      cracking.value = false

      // 判断密码是否相同
      if (rule.cocoPassword === rule.emailPassword) {
        crackResult.value = { name: target.name, password: rule.cocoPassword, samePassword: true }
      } else {
        crackResult.value = { name: target.name, coco: rule.cocoPassword, email: rule.emailPassword, samePassword: false }
      }
      state.crackedPasswords[target.name] = { coco: rule.cocoPassword, email: rule.emailPassword }
    }
  }, 150)
}

// ─── CoCo ───
const cocoAccount = ref('')
const cocoPwd = ref('')
const cocoShowPwd = ref(false)
const cocoLoggedUser = ref(null)
const cocoActiveChat = ref(null)
function cocoLogin() {
  const acc = cocoAccount.value.trim(), pwd = cocoPwd.value.trim()
  if (!acc || !pwd) { toast('请输入账号和密码'); return }
  const userData = cocoData[acc]
  if (!userData) { toast('账号不存在'); return }
  const rule = passwordRules.find(r => r.targetName === userData.owner)
  if (!rule || rule.cocoPassword !== pwd) { toast('密码错误'); return }
  const citizen = citizens.find(c => c.name === userData.owner)
  cocoLoggedUser.value = { account: acc, avatar: citizen?.avatar || '', ...userData }
  if (!state.cocoLoggedIn.includes(acc)) state.cocoLoggedIn.push(acc)
}

function getContactAvatar(contactName) {
  const citizen = citizens.find(c => c.nickname === contactName || c.name === contactName)
  return citizen?.avatar || ''
}

// ─── CoMail ───
const comailAccount = ref('')
const comailPwd = ref('')
const comailShowPwd = ref(false)
const comailLoggedUser = ref(null)
const comailActiveEmail = ref(null)
function comailLogin() {
  const acc = comailAccount.value.trim(), pwd = comailPwd.value.trim()
  if (!acc || !pwd) { toast('请输入邮箱和密码'); return }
  const userData = comailData[acc]
  if (!userData) { toast('邮箱不存在'); return }
  const rule = passwordRules.find(r => r.targetName === userData.owner)
  if (!rule || rule.emailPassword !== pwd) { toast('密码错误'); return }
  comailLoggedUser.value = { account: acc, ...userData }
  if (!state.comailLoggedIn.includes(acc)) state.comailLoggedIn.push(acc)
}

// ─── Krome 浏览器 ───
const browserView = ref('home') // home | search | forum | txitter
const browserSearch = ref('')
const browserSearchResults = ref([])
const txitterProfile = ref(null)
const forumView = ref(null)

// TXitter 随机无关推文（快捷入口首页展示）
const randomTweets = [
  { id: 'r1', author: '吃货小mzk', content: '今天吃了三碗拉面，幸福感爆棚～🍜', time: '3小时前', likes: 45 },
  { id: 'r2', author: '跑步达人', content: '晨跑5公里打卡！天气真好', time: '5小时前', likes: 23 },
  { id: 'r3', author: '猫猫控mzk', content: '我家猫又把花瓶打翻了...第三次了', time: '6小时前', likes: 89 },
  { id: 'r4', author: '学霸笔记', content: '期末复习第七天，数学终于搞懂了', time: '8小时前', likes: 12 },
  { id: 'r5', author: '摄影新手', content: '今天拍到了超美的夕阳🌅', time: '10小时前', likes: 67 },
  { id: 'r6', author: '游戏废人', content: '又肝了一个通宵，眼睛要瞎了', time: '12小时前', likes: 34 },
  { id: 'r7', author: '天气预报员', content: 'mzk市明天多云转晴，适合出门', time: '1天前', likes: 8 },
]

function browserDoSearch() {
  const q = browserSearch.value.trim()
  if (!q) return
  // 收集所有匹配结果
  const results = []
  // 检查TXitter用户名匹配
  const txProfile = browserData.txitterProfiles[q]
  if (txProfile) {
    results.push({ type: 'txitter', name: q, profile: txProfile })
  }
  // 检查普通搜索结果
  const keys = Object.keys(browserData.searchResults)
  const match = keys.find(k => q.includes(k) || k.includes(q))
  if (match) {
    results.push({ type: 'web', data: browserData.searchResults[match] })
  }
  if (results.length === 0) {
    results.push({ type: 'web', data: { title: '无结果', content: '未找到相关内容。' } })
  }
  browserSearchResults.value = results
  browserView.value = 'search'
}
function openSearchTxitter(item) {
  txitterProfile.value = { ...item.profile, name: item.name, feeds: browserData.txitterFeeds[item.profile.twitterId] || [] }
  browserView.value = 'txitter-profile'
}

// ─── TXitter 登录 ───
const txitterLoginView = ref(false)
const txitterLoginId = ref('')
const txitterLoginPwd = ref('')
const txitterShowPwd = ref(false)
const txitterLoggedUser = ref(null)
function txitterLogin() {
  const id = txitterLoginId.value.trim(), pwd = txitterLoginPwd.value.trim()
  if (!id || !pwd) { toast('请输入账号和密码'); return }
  // 用TXitter ID或昵称查找用户，密码和CoCo密码一致
  const entry = Object.entries(browserData.txitterProfiles).find(([name, p]) =>
    p.twitterId === id || p.nickname === id || name === id
  )
  if (!entry) { toast('用户不存在'); return }
  const [name, profile] = entry
  const rule = passwordRules.find(r => r.targetName === name)
  if (!rule || rule.cocoPassword !== pwd) { toast('密码错误'); return }
  txitterLoggedUser.value = { ...profile, name, feeds: browserData.txitterFeeds[profile.twitterId] || [] }
  txitterLoginView.value = false
  txitterProfile.value = txitterLoggedUser.value
  browserView.value = 'txitter-profile'
  if (name === '侦探mzk') state.evidenceTweet = true
}
function txitterLogout() {
  txitterLoggedUser.value = null
  txitterLoginId.value = ''; txitterLoginPwd.value = ''; txitterShowPwd.value = false
}
function openForum() { browserView.value = 'forum'; forumView.value = browserData.shortcuts[0].hotPosts[0] }
function openTxitter() { browserView.value = 'txitter' }

function formatTweetTime(t) {
  const d = new Date(t)
  return `${d.getMonth() + 1}月${d.getDate()}日 · ${d.getFullYear()}`
}

// ─── 短信 ───
const smsInput = ref('')
const smsLog = reactive([...smsData])
function sendSms() {
  const text = smsInput.value.trim()
  if (!text) return
  smsLog.push({ id: 'user_' + Date.now(), sender: '侦探mzk', content: text, timestamp: nowTime(), read: true })
  smsInput.value = ''

  setTimeout(() => {
    // 检查是否是正确答案（怪核mzk的户籍信息）
    const weirdMzk = citizens.find(c => c.name === '怪核mzk')
    if (text.includes('怪核mzk') && (text.includes(weirdMzk.socialSecurity) || text.includes(weirdMzk.address) || text.includes(weirdMzk.birthDate))) {
      triggerWin()
    } else {
      state.wrongAttempts++
      smsLog.push({
        id: 'reply_err_' + state.wrongAttempts,
        sender: 'mzk市公安局',
        content: '大名鼎鼎的侦探mzk，很明显你找错人了，请再试试！\n提示：真正的凶手可能另有其人...',
        timestamp: nowTime(),
        read: true
      })
    }
  }, 500)
}

function nowTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function triggerWin() {
  state.won = true
  store.completeLevel(8)
  if (state.evidenceSQL && state.evidenceTweet && state.evidenceCoCo) {
    state.trueEnding = true
    smsLog.push({
      id: 'true_ending',
      sender: 'mzk市公安局',
      content: '【mzk市公安局 重案通知】\n侦探mzk，我们复查了案件，发现你与怪核mzk有大额资金往来、私密通讯记录。\n你才是炸弹的提供者，这场「破案」只是你的表演。\n我们已对你展开调查，不要试图逃跑。',
      timestamp: nowTime(),
      read: false
    })
  } else {
    smsLog.push({
      id: 'win_msg',
      sender: 'mzk市公安局',
      content: '感谢侦探mzk！真凶果然是怪核mzk！\n我们已经将其逮捕归案。\n他供认不讳，承认嫁祸给开心mzk。\n你又一次拯救了mzk小区！',
      timestamp: nowTime(),
      read: false
    })
  }
}
</script>

<template>
<div class="phone-frame">
  <!-- 顶部栏 -->
  <div class="top-bar">
    <a class="home-link" @click.prevent="goHome">
      <img class="home-link-icon" :src="`${BASE}大眼mzk.png`" alt="" /> <span>首页</span>
    </a>
    <div class="hint">
      <span class="hint-title">{{ settings.title }}</span>
      <span class="hint-sub">{{ settings.subtitle }}</span>
    </div>
    <span class="level-tag">Lv.8</span>
  </div>

  <!-- ═══ 秘钥验证弹窗 ═══ -->
  <div v-if="phase === 'gate'" class="gate-overlay">
    <div class="gate-card">
      <span class="gate-icon">🔒</span>
      <h2 class="gate-title">本关已被封锁</h2>
      <p class="gate-desc">请输入秘钥以解锁第八关</p>
      <input v-model="gateInput" class="gate-input" placeholder="输入秘钥..." @keyup.enter="checkGate" />
      <p v-if="gateError" class="gate-error">秘钥错误，请重试</p>
      <button class="gate-btn" @click="checkGate">确认</button>
    </div>
  </div>

  <!-- ═══ 锁屏 + 滑动解锁 ═══ -->
  <div v-if="phase === 'lockscreen'" class="lockscreen">
    <div class="lock-wallpaper" :style="{ backgroundImage: `url(${BASE}调查04.jpg)` }"></div>
    <div class="lock-time">
      <span class="lock-hour">09:41</span>
      <span class="lock-date">1 月 28 日 · 侦探mzk的手机</span>
    </div>
    <div class="slide-area">
      <div
        ref="slideTrackRef"
        class="slide-track"
        @mousemove="slideMove"
        @mouseup="slideEnd"
        @mouseleave="slideEnd"
        @touchmove.passive="slideMove"
        @touchend="slideEnd"
      >
        <div class="slide-fill" :style="{ width: slideX + THUMB_W + 'px' }"></div>
        <div
          class="slide-thumb"
          :class="{ success: slideSuccess }"
          :style="{ transform: `translateX(${slideX}px)` }"
          @mousedown.prevent="slideStart"
          @touchstart.passive="slideStart"
        >▶</div>
        <span class="slide-text" :style="{ opacity: 1 - slideX / 120 }">滑动解锁</span>
      </div>
    </div>
  </div>

  <!-- ═══ 桌面 ═══ -->
  <template v-if="phase === 'desktop'">

  <!-- 状态栏 -->
  <div class="status-bar">
    <span>████ 📶</span><span>09:41</span><span>🔋 100%</span>
  </div>

  <!-- 桌面 -->
  <div v-if="!currentApp" class="desktop" :style="{ backgroundImage: `url(${BASE}调查04.jpg)` }">
    <div class="app-grid">
      <div v-for="app in apps" :key="app.id" class="app-icon" @click="openApp(app)">
        <span class="app-emoji">{{ app.icon }}</span>
        <span class="app-name">{{ app.name }}</span>
      </div>
    </div>
  </div>

  <!-- App 内容区 -->
  <div v-else class="app-view">
    <div class="app-header">
      <button class="back-btn" @click="closeApp">← 返回</button>
      <span class="app-title">{{ apps.find(a => a.id === currentApp)?.name }}</span>
    </div>
    <div class="app-body">

      <!-- ═══ 短信 ═══ -->
      <div v-if="currentApp === 'sms'" class="sms-app">
        <div class="sms-body">
          <div v-for="(m, i) in smsLog" :key="i" class="sms-bubble" :class="{ self: m.sender === '侦探mzk' }">
            <p>{{ m.content }}</p>
            <span class="sms-time">{{ m.timestamp }}</span>
          </div>
        </div>
        <div class="sms-input">
          <input v-model="smsInput" placeholder="发短信给公安局" @keyup.enter="sendSms" />
          <button class="btn-action" @click="sendSms">发送</button>
        </div>
      </div>

      <!-- ═══ 备忘录 ═══ -->
      <div v-if="currentApp === 'memo'" class="memo-app">
        <div v-for="(note, i) in memoData.notes" :key="i" class="memo-card">
          <h3>{{ note.title }}</h3>
          <p style="white-space:pre-wrap">{{ note.content }}</p>
        </div>
      </div>

      <!-- ═══ 99ECoSQL ═══ -->
      <div v-if="currentApp === 'sql'" class="sql-app">
        <div class="sql-search">
          <input v-model="sqlName" class="input" placeholder="姓名" />
          <input v-model="sqlExtra" class="input" placeholder="补充信息（昵称/CoCo号/邮箱/电话/社会保障号，可选）" />
          <button class="btn-action" @click="searchCitizen">查询</button>
        </div>
        <div v-if="sqlResult && sqlResult !== 'NOT_FOUND'" class="citizen-card">
          <img :src="sqlResult.avatar" class="citizen-avatar" alt="" />
          <div class="citizen-info">
            <p><b>姓名：</b>{{ sqlResult.name }}</p>
            <p><b>社会保障号：</b>{{ sqlResult.socialSecurity }}</p>
            <p><b>出生日期：</b>{{ sqlResult.birthDate }}</p>
            <p><b>地址：</b>{{ sqlResult.address }}</p>
            <p><b>电话：</b>{{ sqlResult.phone }}</p>
            <p><b>CoCo号：</b>{{ sqlResult.CoCo }}</p>
            <p><b>邮箱：</b>{{ sqlResult.email }}</p>
          </div>
          <button class="btn-action" @click="copyCitizenInfo(sqlResult)">📋 复制户籍信息</button>
        </div>
        <p v-else-if="sqlResult === 'NOT_FOUND'" class="no-result">未找到该人物信息。</p>
      </div>

      <!-- ═══ PasswordCracker ═══ -->
      <div v-if="currentApp === 'cracker'" class="cracker-app">
        <p class="cracker-title">🔐 目标账号破解</p>
        <input v-model="crackName" class="input" placeholder="姓名" />
        <input v-model="crackSS" class="input" placeholder="社会保障号" />
        <input v-model="crackNick" class="input" placeholder="常用网名" />
        <input v-model="crackCoCo" class="input" placeholder="CoCo号" />
        <input v-model="crackBirth" class="input" placeholder="出生日期(如20100515)" />
        <input v-model="crackAddr" class="input" placeholder="门牌号(如66)" />
        <button class="btn-action" @click="crackPassword" :disabled="cracking">{{ cracking ? '破解中...' : '破解密码' }}</button>

        <div v-if="cracking" class="crack-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: crackProgress + '%' }"></div>
          </div>
          <p class="progress-text">正在破解密码... {{ crackProgress }}%</p>
        </div>

        <div v-if="crackResult && crackResult !== 'FAIL'" class="crack-success">
          <p>✅ 成功获取 <b>{{ crackResult.name }}</b> 的密码！</p>
          <p v-if="crackResult.samePassword">常用密码: <code>{{ crackResult.password }}</code> <button class="btn-copy" @click="copyToClipboard(crackResult.password)">📋</button></p>
          <p v-else>CoCo密码: <code>{{ crackResult.coco }}</code> <button class="btn-copy" @click="copyToClipboard(crackResult.coco)">📋</button></p>
        </div>
        <p v-else-if="crackResult === 'FAIL'" class="no-result">❌ 破解失败，信息不匹配。</p>
      </div>

      <!-- ═══ CoCo 聊天 ═══ -->
      <div v-if="currentApp === 'coco'" class="coco-app">
        <div v-if="!cocoLoggedUser" class="login-form">
          <p class="login-title">💬 CoCo - 登录</p>
          <input v-model="cocoAccount" class="input" placeholder="CoCo号" />
          <div class="pwd-row">
            <input v-model="cocoPwd" class="input pwd-input" :type="cocoShowPwd ? 'text' : 'password'" placeholder="密码" />
            <button class="pwd-eye" @click="cocoShowPwd = !cocoShowPwd"><img class="pwd-eye-img" :src="`${BASE}${cocoShowPwd ? '大眼mzk.png' : '打坐mzk.png'}`" alt="" /></button>
          </div>
          <button class="btn-action" @click="cocoLogin">登录</button>
          <p class="login-hint">提示：请先使用PasswordCracker破解目标账号密码。</p>
        </div>
        <div v-else-if="!cocoActiveChat" class="chat-list">
          <p class="chat-owner">{{ cocoLoggedUser.owner }}的聊天记录</p>
          <div v-for="chat in cocoLoggedUser.chats" :key="chat.contactId" class="chat-item" @click="cocoActiveChat = chat; if (cocoLoggedUser.account === '1930409680' && chat.contactName === '█怪█核█') state.evidenceCoCo = true">
            <span class="chat-contact">👤 {{ chat.contactName }}</span>
            <span class="chat-last">{{ chat.messages.filter(m => !m.isDeleted).slice(-1)[0]?.content.slice(0, 20) }}...</span>
          </div>
          <button class="btn-secondary" @click="cocoLoggedUser = null">退出登录</button>
        </div>
        <div v-else class="chat-detail">
          <p class="chat-with">与 {{ cocoActiveChat.contactName }} 的聊天</p>
          <div class="msg-list">
            <div v-for="(msg, i) in cocoActiveChat.messages" :key="i" class="message-wrapper" :class="msg.sender === cocoLoggedUser.nickname ? 'user' : 'character'">
              <img v-if="msg.sender !== cocoLoggedUser.nickname" :src="getContactAvatar(cocoActiveChat.contactName)" class="message-avatar" alt="" />
              <div class="message-bubble" :class="{ deleted: msg.isDeleted }">
                <span class="msg-content" v-if="!msg.isDeleted">{{ msg.content }}</span>
                <span class="msg-content deleted-text" v-else>[已撤回的消息]</span>
                <span class="msg-time">{{ msg.time }}</span>
              </div>
              <img v-if="msg.sender === cocoLoggedUser.nickname" :src="cocoLoggedUser.avatar" class="message-avatar" alt="" />
            </div>
          </div>
          <button class="btn-secondary" @click="cocoActiveChat = null">返回列表</button>
        </div>
      </div>

      <!-- ═══ CoMail 邮箱 ═══ -->
      <div v-if="currentApp === 'comail'" class="comail-app">
        <div v-if="!comailLoggedUser" class="login-form">
          <p class="login-title">📧 CoMail - 登录</p>
          <input v-model="comailAccount" class="input" placeholder="邮箱地址" />
          <div class="pwd-row">
            <input v-model="comailPwd" class="input pwd-input" :type="comailShowPwd ? 'text' : 'password'" placeholder="密码" />
            <button class="pwd-eye" @click="comailShowPwd = !comailShowPwd"><img class="pwd-eye-img" :src="`${BASE}${comailShowPwd ? '大眼mzk.png' : '打坐mzk.png'}`" alt="" /></button>
          </div>
          <button class="btn-action" @click="comailLogin">登录</button>
        </div>
        <div v-else-if="!comailActiveEmail" class="email-list">
          <p class="email-owner">收件箱 - {{ comailLoggedUser.account }}</p>
          <div v-for="mail in comailLoggedUser.inbox" :key="mail.id" class="email-item" :class="{ unread: !mail.read }" @click="comailActiveEmail = mail">
            <span class="email-from">📨 {{ mail.from }}</span>
            <span class="email-subject">{{ mail.subject || '（无主题）' }}</span>
            <span class="email-time">{{ mail.time }}</span>
          </div>
          <button class="btn-secondary" @click="comailLoggedUser = null">退出登录</button>
        </div>
        <div v-else class="email-detail">
          <p class="email-detail-from">发件人：{{ comailActiveEmail.from }} &lt;{{ comailActiveEmail.fromEmail }}&gt;</p>
          <p class="email-detail-time">时间：{{ comailActiveEmail.time }}</p>
          <p class="email-detail-subject">主题：{{ comailActiveEmail.subject || '（无）' }}</p>
          <div class="email-body" style="white-space:pre-wrap">{{ comailActiveEmail.content }}</div>
          <button class="btn-secondary" @click="comailActiveEmail = null">返回收件箱</button>
        </div>
      </div>

      <!-- ═══ Krome 浏览器 ═══ -->
      <div v-if="currentApp === 'krome'" class="krome-app">
        <!-- 浏览器首页 -->
        <div v-if="browserView === 'home'" class="browser-home">
          <div class="search-bar">
            <input v-model="browserSearch" class="input" placeholder="🔍 搜索..." @keyup.enter="browserDoSearch" />
            <button class="btn-action" @click="browserDoSearch">搜索</button>
          </div>
          <p class="section-label">📌 常用快捷入口</p>
          <div class="shortcut-grid">
            <div class="shortcut-item" @click="openForum">
              <span class="shortcut-icon">💬</span><span>mzk forum</span>
            </div>
            <div class="shortcut-item" @click="openTxitter">
              <span class="shortcut-icon">🐦</span><span>TXitter</span>
            </div>
          </div>
        </div>
        <!-- 搜索结果列表 -->
        <div v-else-if="browserView === 'search'" class="browser-results">
          <p class="results-label">搜索结果</p>
          <div v-for="(item, i) in browserSearchResults" :key="i">
            <!-- TXitter 用户缩略卡 -->
            <div v-if="item.type === 'txitter'" class="result-card txitter-card" @click="openSearchTxitter(item)">
              <img :src="item.profile.avatar" class="result-avatar" alt="" />
              <div class="result-info">
                <p class="result-title">🐦 {{ item.profile.nickname }}</p>
                <p class="result-sub">{{ item.profile.twitterId }} · TXitter用户</p>
                <p class="result-bio">{{ item.profile.bio }}</p>
              </div>
              <span class="result-arrow">›</span>
            </div>
            <!-- 普通网页结果 -->
            <div v-else class="result-card" @click="item.data.jumpToShortcut ? openForum() : null">
              <div class="result-info">
                <p class="result-title">{{ item.data.title }}</p>
                <p class="result-sub">{{ item.data.content }}</p>
              </div>
              <span v-if="item.data.jumpToShortcut" class="result-arrow">›</span>
            </div>
          </div>
          <button class="btn-secondary" @click="browserView = 'home'">返回</button>
        </div>
        <!-- 论坛 -->
        <div v-else-if="browserView === 'forum'" class="forum-view">
          <h3>💬 mzk城市论坛</h3>
          <div v-if="forumView" class="forum-post">
            <h4>{{ forumView.title }}</h4>
            <p class="forum-meta">{{ forumView.author }} · {{ forumView.time }}</p>
            <p>{{ forumView.content }}</p>
            <div v-for="(c, i) in forumView.comments.filter(c => !c.isHidden)" :key="i" class="forum-comment">
              <span class="comment-author">{{ c.author }}</span>
              <span class="comment-time">{{ c.time }}</span>
              <p>{{ c.content }}</p>
            </div>
          </div>
          <button class="btn-secondary" @click="browserView = 'home'">返回</button>
        </div>
        <!-- TXitter 首页（随机推文） -->
        <div v-else-if="browserView === 'txitter'" class="txitter-view">
          <div class="txitter-header">
            <h3>🐦 TXitter</h3>
            <button v-if="!txitterLoggedUser" class="txitter-login-btn" @click="txitterLoginView = true">登录</button>
            <span v-else class="txitter-logged">{{ txitterLoggedUser.nickname }} <button class="txitter-logout-btn" @click="txitterLogout">退出</button></span>
          </div>
          <!-- 登录弹窗 -->
          <div v-if="txitterLoginView" class="txitter-login-form">
            <p class="login-title">🐦 TXitter 登录</p>
            <input v-model="txitterLoginId" class="input" placeholder="用户名 / TXitter ID" />
            <div class="pwd-row">
              <input v-model="txitterLoginPwd" class="input pwd-input" :type="txitterShowPwd ? 'text' : 'password'" placeholder="密码" />
              <button class="pwd-eye" @click="txitterShowPwd = !txitterShowPwd"><img class="pwd-eye-img" :src="`${BASE}${txitterShowPwd ? '大眼mzk.png' : '打坐mzk.png'}`" alt="" /></button>
            </div>
            <button class="btn-action" @click="txitterLogin">登录</button>
            <button class="btn-secondary" @click="txitterLoginView = false">取消</button>
          </div>
          <template v-else>
            <p class="txitter-subtitle">热门推文</p>
            <div v-for="t in randomTweets" :key="t.id" class="tweet">
              <p class="tweet-author">{{ t.author }}</p>
              <p class="tweet-content">{{ t.content }}</p>
              <p class="tweet-stats">❤️ {{ t.likes }} · {{ t.time }}</p>
            </div>
          </template>
          <button class="btn-secondary" @click="browserView = 'home'">返回</button>
        </div>
        <!-- TXitter 用户资料（从浏览器搜索进入） -->
        <div v-else-if="browserView === 'txitter-profile'" class="txitter-view">
          <h3>🐦 TXitter</h3>
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
          <button class="btn-secondary" @click="browserView = 'home'">返回</button>
        </div>
      </div>
    </div>
  </div>

  </template><!-- end desktop phase -->

  <!-- Toast -->
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="toastOn" class="toast">{{ toastMsg }}</div>
    </Transition>
  </Teleport>

  <!-- 通关画面 -->
  <Teleport to="body">
    <div v-if="state.won" class="win-screen">
      <div class="win-content">
        <h1 class="win-title" v-if="state.trueEnding">真相大白</h1>
        <h1 class="win-title" v-else>案件告破！</h1>
        <p class="win-sub" v-if="state.trueEnding">你发现了隐藏的真相——侦探mzk才是幕后黑手。公安局已对其展开调查。</p>
        <p class="win-sub" v-else>怪核mzk已被逮捕，但似乎还有更深的秘密...</p>
        <button class="btn btn-end" @click="goHome">返回首页</button>
      </div>
    </div>
  </Teleport>
</div>
</template>

<style scoped>
.phone-frame { min-height: 100svh; background: #f5f5f5; display: flex; flex-direction: column; }
/* ─── 秘钥验证 ─── */
.gate-overlay {
  flex: 1; display: flex; align-items: center; justify-content: center;
  background: rgba(0,0,0,0.85); padding: 20px;
}
.gate-card {
  background: #1a1a1a; color: #eee; border-radius: 20px; padding: 32px 24px;
  width: min(360px, 100%); display: flex; flex-direction: column; align-items: center;
  gap: 12px; text-align: center; border: 1px solid #444;
}
.gate-icon { font-size: 2.5rem; }
.gate-title { font-size: 1.2rem; color: #F6B1B5; margin: 0; }
.gate-desc { font-size: 0.85rem; color: #aaa; margin: 0; }
.gate-input {
  width: 200px; padding: 10px; border: 1px solid #555; border-radius: 10px;
  background: rgba(0,0,0,0.5); color: #fff; font-size: 1rem; text-align: center; outline: none;
}
.gate-input:focus { border-color: #F6B1B5; }
.gate-error { color: #ff7878; font-size: 0.85rem; margin: 0; }
.gate-btn {
  padding: 10px 32px; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #F6B1B5, #d97ca8); color: #fff;
  font-weight: bold; font-size: 0.9rem; cursor: pointer;
}
.gate-btn:active { opacity: 0.8; }
/* ─── 锁屏 ─── */
.lockscreen {
  flex: 1; position: relative; display: flex; flex-direction: column;
  align-items: center; padding: 60px 20px; justify-content: space-between;
}
.lock-wallpaper {
  position: absolute; inset: 0; background-size: cover; background-position: center;
  filter: brightness(0.5) blur(2px);
}
.lock-time { position: relative; text-align: center; }
.lock-hour { display: block; font-size: 3.5rem; font-weight: 200; color: #fff; }
.lock-date { display: block; font-size: 0.85rem; color: #ccc; }
.slide-area { position: relative; display: flex; justify-content: center; width: 100%; margin-bottom: 40px; }
.slide-track {
  position: relative; width: min(300px, 80vw); height: 52px;
  background: rgba(255,255,255,0.12); border-radius: 26px;
  overflow: hidden; user-select: none; touch-action: none;
}
.slide-fill {
  position: absolute; left: 0; top: 0; height: 100%;
  background: linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05));
  border-radius: 26px; transition: width 0.05s;
}
.slide-thumb {
  position: absolute; left: 0; top: 0;
  width: 52px; height: 52px; border-radius: 50%;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.3);
  color: rgba(255,255,255,0.6); font-size: 1.1rem;
  display: flex; align-items: center; justify-content: center;
  cursor: grab; z-index: 2;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  transition: transform 0.15s ease;
}
.slide-thumb:active { cursor: grabbing; }
.slide-thumb.success {
  background: rgba(246,177,181,0.3); color: rgba(246,177,181,0.9);
  border-color: rgba(246,177,181,0.5);
  box-shadow: 0 0 12px rgba(246,177,181,0.4);
}
.slide-text {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.5); font-size: 0.88rem; letter-spacing: 4px;
  pointer-events: none; transition: opacity 0.1s;
}
.top-bar { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #fff; border-bottom: 1.5px solid #f6c8cc; position: sticky; top: 0; z-index: 100; }
.home-link { text-decoration: none; display: flex; align-items: center; gap: 4px; padding: 6px 12px; border-radius: 20px; background: #fff; border: 1.5px solid #f6c8cc; color: #c07090; font-size: 0.82rem; cursor: pointer; }
.home-link:active { background: #ffe0e8; }
.home-link-icon { height: 1em; width: auto; }
.hint { flex: 1; display: flex; flex-direction: column; align-items: center; }
.hint-title { font-size: 0.95rem; font-weight: bold; color: #F6B1B5; }
.hint-sub { font-size: 0.72rem; color: #aaa; }
.level-tag { font-size: 0.75rem; color: #999; }
.status-bar { display: flex; justify-content: space-between; padding: 4px 16px; background: #1a1a2e; color: #aaa; font-size: 0.7rem; }
.desktop { flex: 1; padding: 24px 16px; background-size: cover; background-position: center; position: relative; }
.desktop::before { content: ''; position: absolute; inset: 0; background: rgba(0,0,0,0.3); pointer-events: none; }
.app-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; position: relative; z-index: 1; }
.app-icon { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; padding: 12px 4px; border-radius: 16px; transition: background 0.15s; }
.app-icon:active { background: rgba(0,0,0,0.05); }
.app-emoji { font-size: 2rem; }
.app-name { font-size: 0.7rem; color: #fff; text-align: center; text-shadow: 0 1px 3px rgba(0,0,0,0.6); }
.app-view { flex: 1; display: flex; flex-direction: column; }
.app-header { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: #fff; border-bottom: 1px solid #eee; }
.back-btn { background: none; border: none; font-size: 1rem; color: #c07090; cursor: pointer; padding: 4px 8px; }
.app-title { font-weight: bold; color: #333; }
.app-body { flex: 1; padding: 16px; overflow-y: auto; }
/* ─── 通用组件 ─── */
.input { width: 100%; padding: 10px 12px; border: 1.5px solid #ddd; border-radius: 10px; font-size: 0.9rem; box-sizing: border-box; margin-bottom: 8px; }
.input:focus { border-color: #F6B1B5; outline: none; }
.btn-action { width: 100%; padding: 10px; border: none; border-radius: 10px; background: linear-gradient(135deg, #F6B1B5, #d97ca8); color: #fff; font-weight: bold; font-size: 0.9rem; cursor: pointer; margin-bottom: 8px; }
.btn-action:active { opacity: 0.8; }
.btn-secondary { width: 100%; padding: 10px; border: 1.5px solid #ddd; border-radius: 10px; background: #fff; color: #888; font-size: 0.85rem; cursor: pointer; margin-top: 8px; }
.btn-copy { background: none; border: none; cursor: pointer; font-size: 0.9rem; }
.no-result { color: #999; text-align: center; padding: 20px; }
.section-label { font-size: 0.85rem; color: #888; margin: 16px 0 8px; }
/* ─── 短信 ─── */
.sms-app { background: #f5f5f7; color: #222; display: flex; flex-direction: column; height: 100%; }
.sms-body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.sms-bubble {
  background: #fff; padding: 8px 12px; border-radius: 14px;
  max-width: 75%; align-self: flex-start;
}
.sms-bubble.self { background: #ff4b7d; color: #fff; align-self: flex-end; }
.sms-bubble p { margin: 0; font-size: 0.88rem; line-height: 1.4; }
.sms-time { font-size: 0.65rem; color: #aaa; }
.sms-bubble.self .sms-time { color: rgba(255,255,255,0.75); }
.sms-input {
  display: flex; gap: 8px; padding: 10px; background: #fff; border-top: 1px solid #eee;
}
.sms-input input {
  flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 18px;
  outline: none; font-size: 0.88rem;
}
.sms-input .btn-action { width: auto; padding: 8px 16px; margin-bottom: 0; }
/* ─── 备忘录 ─── */
.memo-card { background: #fffbe6; border-radius: 12px; padding: 16px; margin-bottom: 12px; border: 1px solid #f0e6b0; }
.memo-card h3 { margin: 0 0 8px; color: #8b7000; font-size: 0.95rem; }
.memo-card p { margin: 0; color: #555; font-size: 0.85rem; line-height: 1.6; }
/* ─── SQL ─── */
.sql-search { margin-bottom: 16px; }
.citizen-card { background: #fff; border-radius: 12px; padding: 16px; border: 1px solid #eee; display: flex; flex-direction: column; align-items: center; text-align: center; }
.citizen-avatar { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; margin-bottom: 12px; }
.citizen-info p { margin: 4px 0; font-size: 0.85rem; color: #444; }
/* ─── PasswordCracker ─── */
.cracker-title { font-weight: bold; font-size: 1rem; margin-bottom: 12px; }
.crack-progress { margin-top: 16px; }
.progress-bar { width: 100%; height: 24px; background: #e0e0e0; border-radius: 12px; overflow: hidden; margin-bottom: 8px; }
.progress-fill { height: 100%; background: linear-gradient(90deg, #F6B1B5, #d97ca8); transition: width 0.15s linear; }
.progress-text { text-align: center; font-size: 0.85rem; color: #666; }
.crack-success { background: #e8f5e9; border-radius: 12px; padding: 16px; margin-top: 12px; }
.crack-success p { margin: 4px 0; font-size: 0.85rem; }
.crack-success code { background: #c8e6c9; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
.btn-copy { background: none; border: none; cursor: pointer; font-size: 1rem; padding: 0 4px; }
/* ─── CoCo ─── */
.login-form { display: flex; flex-direction: column; gap: 8px; }
.login-title { font-weight: bold; font-size: 1rem; text-align: center; margin-bottom: 8px; }
.login-hint { font-size: 0.75rem; color: #999; text-align: center; }
.pwd-row { display: flex; align-items: center; gap: 4px; }
.pwd-input { flex: 1; margin-bottom: 0; }
.pwd-eye { background: none; border: none; cursor: pointer; padding: 4px; flex-shrink: 0; }
.pwd-eye-img { width: 28px; height: 28px; object-fit: contain; border-radius: 50%; }
.chat-owner { font-weight: bold; color: #333; margin-bottom: 12px; }
.chat-list { display: flex; flex-direction: column; gap: 8px; }
.chat-item { padding: 12px; background: #fff; border-radius: 12px; cursor: pointer; border: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
.chat-contact { font-weight: bold; font-size: 0.9rem; }
.chat-last { font-size: 0.75rem; color: #999; }
.chat-with { font-weight: bold; margin-bottom: 12px; }
.msg-list { display: flex; flex-direction: column; gap: 12px; max-height: 50vh; overflow-y: auto; padding: 12px; }
.message-wrapper { display: flex; align-items: flex-end; gap: 8px; animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.message-wrapper.user { flex-direction: row; justify-content: flex-end; }
.message-wrapper.character { flex-direction: row; justify-content: flex-start; }
.message-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.message-bubble { max-width: 70%; padding: 10px 14px; border-radius: 16px; display: flex; flex-direction: column; gap: 4px; }
.message-wrapper.user .message-bubble { background: linear-gradient(135deg, #F6B1B5, #d97ca8); color: #fff; border-bottom-right-radius: 4px; }
.message-wrapper.character .message-bubble { background: #fff; color: #333; border: 1px solid #f6c8cc; border-bottom-left-radius: 4px; }
.message-bubble.deleted { opacity: 0.5; }
.msg-content { font-size: 0.9rem; line-height: 1.4; word-wrap: break-word; }
.deleted-text { font-style: italic; color: #bbb; }
.message-wrapper.user .deleted-text { color: rgba(255, 255, 255, 0.7); }
.msg-time { font-size: 0.7rem; color: #999; align-self: flex-end; }
.message-wrapper.user .msg-time { color: rgba(255, 255, 255, 0.8); }
/* ─── CoMail ─── */
.email-owner { font-weight: bold; color: #333; margin-bottom: 12px; }
.email-list { display: flex; flex-direction: column; gap: 8px; }
.email-item { padding: 12px; background: #fff; border-radius: 12px; cursor: pointer; border: 1px solid #eee; }
.email-item.unread { border-left: 3px solid #F6B1B5; }
.email-from { font-weight: bold; font-size: 0.85rem; display: block; }
.email-subject { font-size: 0.8rem; color: #666; display: block; margin-top: 2px; }
.email-time { font-size: 0.7rem; color: #bbb; display: block; margin-top: 2px; }
.email-detail-from, .email-detail-time, .email-detail-subject { font-size: 0.85rem; color: #555; margin: 4px 0; }
.email-body { background: #fff; border-radius: 12px; padding: 16px; margin-top: 12px; border: 1px solid #eee; color: #333; line-height: 1.6; }
/* ─── Krome 浏览器 ─── */
.search-bar { display: flex; gap: 8px; margin-bottom: 12px; }
.search-bar .input { flex: 1; margin-bottom: 0; }
.search-bar .btn-action { width: auto; padding: 10px 16px; margin-bottom: 0; }
.shortcut-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.shortcut-item { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 16px; background: #fff; border-radius: 12px; cursor: pointer; border: 1px solid #eee; }
.shortcut-item:active { background: #f5f5f5; }
.shortcut-icon { font-size: 1.5rem; }
.results-label { font-size: 0.85rem; color: #888; margin: 0 0 12px; }
.result-card {
  display: flex; align-items: center; gap: 12px; padding: 12px;
  background: #fff; border-radius: 12px; border: 1px solid #eee; margin-bottom: 8px; cursor: pointer;
}
.result-card:active { background: #f9f9f9; }
.result-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.result-info { flex: 1; min-width: 0; }
.result-title { font-weight: bold; font-size: 0.9rem; margin: 0; color: #333; }
.result-sub { font-size: 0.8rem; color: #888; margin: 2px 0 0; }
.result-bio { font-size: 0.75rem; color: #aaa; margin: 2px 0 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.result-arrow { font-size: 1.2rem; color: #ccc; flex-shrink: 0; }
.txitter-card { border-left: 3px solid #1da1f2; }
.forum-view h3 { margin: 0 0 12px; }
.forum-post { background: #fff; border-radius: 12px; padding: 16px; }
.forum-post h4 { margin: 0 0 4px; color: #c44; }
.forum-meta { font-size: 0.75rem; color: #999; margin: 0 0 8px; }
.forum-comment { background: #f9f9f9; border-radius: 8px; padding: 10px; margin-top: 8px; }
.comment-author { font-weight: bold; font-size: 0.8rem; color: #555; }
.comment-time { font-size: 0.7rem; color: #bbb; margin-left: 8px; }
.txitter-view h3 { margin: 0; }
.txitter-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.txitter-login-btn {
  padding: 6px 14px; border: 1.5px solid #1da1f2; border-radius: 16px;
  background: #1da1f2; color: #fff; font-size: 0.8rem; font-weight: bold; cursor: pointer;
}
.txitter-login-btn:active { opacity: 0.8; }
.txitter-logged { font-size: 0.8rem; color: #555; display: flex; align-items: center; gap: 6px; }
.txitter-logout-btn { background: none; border: none; color: #999; font-size: 0.75rem; cursor: pointer; text-decoration: underline; }
.txitter-login-form { background: #f9f9f9; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
.txitter-subtitle { font-size: 0.85rem; color: #888; margin: 0 0 12px; }
.profile-header { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
.profile-avatar { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
.profile-name { font-weight: bold; margin: 0; }
.profile-id { color: #71767b; font-size: 0.85rem; margin: 0; }
.profile-bio { color: #e7e9ea; font-size: 0.85rem; margin: 4px 0 0; color: #555; }
.tweet { background: #fff; border-radius: 12px; padding: 12px; margin-bottom: 8px; border: 1px solid #eee; }
.tweet-author { font-weight: bold; font-size: 0.85rem; margin: 0; }
.tweet-id { color: #71767b; font-weight: normal; font-size: 0.8rem; }
.tweet-content { margin: 8px 0; color: #333; }
.tweet-stats { font-size: 0.75rem; color: #999; margin: 0; }
/* ─── Toast ─── */
.toast { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); color: #fff; padding: 10px 24px; border-radius: 20px; font-size: 0.85rem; z-index: 9999; }
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; }
/* ─── 通关画面 ─── */
.win-screen { position: fixed; inset: 0; z-index: 2000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.85); }
.win-content { text-align: center; padding: 32px; max-width: 400px; }
.win-title { font-size: 1.8rem; color: #F6B1B5; margin: 0 0 16px; }
.win-sub { color: #ccc; font-size: 0.95rem; line-height: 1.6; margin: 0 0 12px; }
.win-hint { color: #ff9; font-size: 0.85rem; margin: 12px 0; }
.btn { border: none; border-radius: 24px; padding: 12px 36px; font-size: 1rem; font-weight: bold; cursor: pointer; }
.btn-end { background: linear-gradient(135deg, #F6B1B5, #d97ca8); color: #fff; margin-top: 16px; }
.btn-end:active { opacity: 0.8; }
@media (max-width: 640px) {
  .app-grid { grid-template-columns: repeat(3, 1fr); }
  .home-link { padding: 4px 8px; font-size: 0.75rem; }
  .hint-title { font-size: 0.8rem; }
}
</style>
