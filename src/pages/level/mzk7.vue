<script setup>
import { ref, computed, reactive, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useGameStore } from '../../store/game.js'
import photosData from '../../data/level7/photos.json'
import notesData from '../../data/level7/notes.json'
import messagesData from '../../data/level7/messages.json'
import calendarData from '../../data/level7/calendar.json'
import terminalData from '../../data/level7/terminal.json'
import browserData from '../../data/level7/browser.json'
import settingsData from '../../data/level7/settings.json'
import appsData from '../../data/level7/apps.json'
import filesData from '../../data/level7/files.json'
import testData from '../../data/test.json'
import forumData from '../../data/forum.json'
import level4MsgData from '../../data/messages.json'
import level6MsgData from '../../data/level67/messages.json'
import level6CommentData from '../../data/level67/comment.json'
import TopBar from '../../components/game/TopBar.vue'

const router = useRouter()
const store = useGameStore()
const BASE = ''

// ─── 双重解锁门 ───
const UNLOCK_KEY = 'mzk-level7-unlocked'
const isUnlocked = ref(localStorage.getItem(UNLOCK_KEY) === 'true')
const showWarnGate = ref(!isUnlocked.value)         // 第一道：认知滤网
const showPuzzleGate = ref(false)                    // 第二道：六个问题
const unlockError = ref(false)
const flashWhite = ref(false)

const gateQuestions = [
  { q: '第一关有多少个眼睛👁️？', a: '91' },
  { q: '第二关有多少个mzk？', a: '67' },
  { q: '第三关有多少个方块？', a: '20' },
  { q: '第四关一共会遇见多少个mzk？', a: '10' },
  { q: '第五关有多少篇帖子？', a: '4' },
  { q: '第六关视频有多少个mzk？', a: '30' }
]
const currentQuestion = ref(0)
const unlockInput = ref('')

function acceptWarn() {
  showWarnGate.value = false
  showPuzzleGate.value = true
}
function cancelWarn() {
  // 全屏闪白 → 返回关卡选择（此处回首页）
  flashWhite.value = true
  setTimeout(() => {
    flashWhite.value = false
    router.push('/index')
  }, 450)
}
function tryUnlock() {
  const q = gateQuestions[currentQuestion.value]
  if (unlockInput.value.trim() === q.a) {
    unlockInput.value = ''
    unlockError.value = false
    if (currentQuestion.value < gateQuestions.length - 1) {
      currentQuestion.value++
    } else {
      localStorage.setItem(UNLOCK_KEY, 'true')
      isUnlocked.value = true
      showPuzzleGate.value = false
      playBoot()
    }
  } else {
    unlockError.value = true
    setTimeout(() => (unlockError.value = false), 1500)
  }
}

// ─── 开机动画 / 锁屏 ───
const phase = ref('boot')  // boot | lockscreen | slideunlock | desktop
const bootGlitch = ref(false)
function playBoot() {
  phase.value = 'boot'
  setTimeout(() => { bootGlitch.value = true }, 900)
  setTimeout(() => { bootGlitch.value = false; phase.value = 'lockscreen' }, 2200)
}

onMounted(() => {
  if (isUnlocked.value) {
    phase.value = 'lockscreen'
  }
})

// ─── 锁屏：密码 0827 解锁 ───
const lockPwdInput = ref('')
const lockPwdError = ref('')
function submitLockPwd() {
  if (lockPwdInput.value === '0827') {
    phase.value = 'slideunlock'
  } else if (lockPwdInput.value.length >= 4) {
    lockPwdError.value = '密码错误……再想想？'
    setTimeout(() => { lockPwdError.value = ''; lockPwdInput.value = '' }, 2000)
  }
}

// 监听密码输入满4位自动提交
watch(lockPwdInput, (val) => {
  if (val.length === 4) submitLockPwd()
})

// ─── 滑动解锁 ───
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

// ─── 全局状态 ───
const state = reactive({
  filesPrivateUnlocked: false,
  realNameFound: false,
  note3Unlocked: false,
  note8Unlocked: false,
  dateChangedToBirthday: false,
  devTapCount: 0,
  terminalUnlocked: false,
  rootUnlocked: false,
  escapeExecuted: false,
  yllxExecuted: false,
  mysteryUnlocked: false,
  repairedPhotos: 0,
  won: false,
  perfect: false
})

// ─── App 打开 / 返回 ───
const currentApp = ref(null)
function openApp(app) {
  if (app.corrupted) { toast('应用已损坏'); return }
  if (app.id === 'terminal' && !state.terminalUnlocked) { toast('找不到应用'); return }
  currentApp.value = app.id
}
function backToDesktop() { currentApp.value = null }

// ─── Toast ───
const toastMsg = ref('')
const toastOn = ref(false)
function toast(msg) {
  toastMsg.value = msg
  toastOn.value = true
  setTimeout(() => (toastOn.value = false), 1400)
}

// ─── 应用列表（含隐藏的终端） ───
const apps = computed(() => {
  const list = [...appsData]
  if (state.terminalUnlocked) {
    list.push({ id: 'terminal', name: '终端', icon: '⌨️', corrupted: false })
  }
  return list
})

// ─── 相册 ───
const allPhotos = computed(() => {
  const list = [...photosData.daily, ...photosData.broken]
  if (state.mysteryUnlocked) list.push(...photosData.mystery)
  if (state.terminalUnlocked) list.push(...photosData.hidden)
  return list
})
const selectedPhoto = ref(null)

function photoUrl(p) { return `${photosData.cdnBase}${encodeURIComponent(p.url)}` }
function openPhoto(p) {
  selectedPhoto.value = p
  if (p.type === 'hidden') state.yllxExecuted = true
}
function closePhoto() { selectedPhoto.value = null }
const repairKeyInput = ref('')
function repairPhoto(p) {
  if (p._repaired) return
  if (repairKeyInput.value !== p.repairKey) {
    toast('秘钥错误')
    return
  }
  p._repaired = true
  state.repairedPhotos++
  repairKeyInput.value = ''
  toast('已修复：' + p.repairedNote)
}

// ─── 备忘录 ───
const notes = reactive(JSON.parse(JSON.stringify(notesData)))
const selectedNote = ref(null)
const noteUnlockInput = ref('')
function openNote(n) { selectedNote.value = n; noteUnlockInput.value = '' }
function closeNote() { selectedNote.value = null }
function tryUnlockNote() {
  const n = selectedNote.value
  if (!n || !n.locked) return
  if (noteUnlockInput.value.trim().toLowerCase() === n.unlockAnswer) {
    n.locked = false
    if (n.id === 3) state.note3Unlocked = true
    if (n.id === 8) state.note8Unlocked = true
    toast('备忘录已解锁')
  } else {
    toast('不对。再想想。')
  }
}

// ─── 浏览器 ───
const browserPages = reactive(JSON.parse(JSON.stringify(browserData.pages)))
const browserAddress = ref('')
const browserCurrentPage = ref(null)
const browserErrorCount = ref(0)
const browserRefreshCounts = reactive({})
const browserTabPwd = ref('')
const browserRefreshing = ref(false)

function browserGoHome() {
  browserCurrentPage.value = null
  browserAddress.value = ''
}
const showWinConfirm = ref(false)
function browserNavigate(url) {
  const addr = url.trim().toLowerCase()
  browserAddress.value = url.trim()
  // check win address
  if (addr === browserData.winAddress) {
    showWinConfirm.value = true
    return
  }
  if (addr === 'ena' || addr === 'ena.local') {
    toast('ENA ≠ MZK')
    return
  }
  // find matching page
  const page = browserPages.find(p => p.url.toLowerCase() === addr)
  if (page) {
    browserCurrentPage.value = page
    return
  }
  browserErrorCount.value++
  if (browserErrorCount.value >= 3) {
    toast('应用已停止运行')
    browserErrorCount.value = 0
  } else {
    toast('找不到该页面')
  }
}
function goAddress() {
  browserNavigate(browserAddress.value)
}
function confirmWin() {
  showWinConfirm.value = false
  triggerWin(false)
}
function cancelWin() {
  showWinConfirm.value = false
}
function refreshTab() {
  browserRefreshing.value = true
  setTimeout(() => { browserRefreshing.value = false }, 150)
  const p = browserCurrentPage.value
  if (p && p.refreshThreshold) {
    browserRefreshCounts[p.id] = (browserRefreshCounts[p.id] || 0) + 1
    if (browserRefreshCounts[p.id] >= p.refreshThreshold) {
      p.body = p.refreshBody
    }
  }
}
function unlockBrowserTab() {
  const p = browserCurrentPage.value
  if (!p || !p.locked) return
  if (browserTabPwd.value.toLowerCase() === p.password) {
    p.locked = false
    toast('私密博客已解锁')
  } else {
    toast('密码错误')
  }
}

// ─── 文件管理器 ───
const filesPath = ref('/')
const filesPwdInput = ref('')
const filesTree = computed(() => {
  const tree = { ...filesData.tree }
  // DCIM 从相册数据动态生成
  tree['/DCIM/'] = [...photosData.daily, ...photosData.mystery, ...photosData.broken].map(p => p.name)
  return tree
})
function enterDir(name) {
  const targetPath = filesPath.value + name
  // 检查是否是加锁目录
  const lockInfo = filesData.lockedDirs[targetPath]
  if (lockInfo && !state.filesPrivateUnlocked) {
    const pwd = prompt(lockInfo.hint)
    if (pwd && pwd.trim().toUpperCase() === lockInfo.password) {
      state.filesPrivateUnlocked = true
      state.mysteryUnlocked = true
      toast('文件夹已解锁，相册中发现了新照片')
      filesPath.value = targetPath
    } else if (pwd !== null) {
      toast('密码错误')
    }
    return
  }
  if (name.endsWith('/')) {
    filesPath.value = targetPath
  } else {
    openFile(name)
  }
}
function filesUp() {
  if (filesPath.value === '/') return
  const p = filesPath.value.replace(/\/$/, '')
  filesPath.value = p.substring(0, p.lastIndexOf('/') + 1) || '/'
}
const selectedFile = ref(null)
function openFile(name) {
  const path = filesPath.value + name
  // 特殊标记
  if (path === '/Documents/private/real_name.txt') state.realNameFound = true
  // 从 JSON 读取内容
  if (filesData.fileContents[path]) {
    selectedFile.value = { name, body: filesData.fileContents[path] }
  } else if (filesPath.value === '/DCIM/') {
    const allPhotos = [...photosData.daily, ...photosData.mystery, ...photosData.broken]
    const photo = allPhotos.find(p => p.name === name)
    if (photo) {
      selectedFile.value = { name, body: `[图片文件]\n名称：${photo.name}\n类型：${photo.type}\n${photo.meta || ''}` }
    } else {
      selectedFile.value = { name, body: '（无内容）' }
    }
  } else {
    selectedFile.value = { name, body: '（无内容）' }
  }
}

// ─── 短信 ───
const smsInput = ref('')
const smsLog = reactive([...messagesData.conversation])
function sendSms() {
  const text = smsInput.value.trim()
  if (!text) return
  smsLog.push({ from: 'self', text, time: nowTime() })
  smsInput.value = ''
  setTimeout(() => {
    const lower = text.toLowerCase()
    let reply = messagesData.defaultReply
    if (state.dateChangedToBirthday) reply = messagesData.afterDateChangeReply
    else {
      for (const r of messagesData.replies) {
        if (lower.includes(r.key.toLowerCase())) { reply = r.text; break }
      }
    }
    smsLog.push({ from: 'other', text: reply, time: nowTime() })
  }, 500)
}
function nowTime() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// ─── 日历 ───
const today = new Date()
const calYear = ref(today.getFullYear())
const calMonth = ref(8)   // 8 月默认显示
const selectedDateEvent = ref(null)
function daysInMonth(y, m) { return new Date(y, m, 0).getDate() }
function clickDate(d) {
  const key = `${calMonth.value}-${d}`
  const ev = calendarData.events[key]
  if (ev) selectedDateEvent.value = { date: key, ...ev }
  else selectedDateEvent.value = null
}
function changeSystemDateToBirthday() {
  state.dateChangedToBirthday = true
  toast('系统日期已改为 8 月 27 日')
}

// ─── 日期选择器（滚轮弹窗） ───
const showDatePicker = ref(false)
const pickerMonth = ref(8)
const pickerDay = ref(31)
const currentSystemDate = ref('8/31')
const monthWheelRef = ref(null)
const dayWheelRef = ref(null)
const wheelTouching = reactive({ month: false, day: false })
const wheelStartY = reactive({ month: 0, day: 0 })

function openDatePicker() {
  showDatePicker.value = true
}
function confirmDatePick() {
  showDatePicker.value = false
  currentSystemDate.value = `${pickerMonth.value}/${pickerDay.value}`
  if (pickerMonth.value === 8 && pickerDay.value === 27) {
    changeSystemDateToBirthday()
  } else {
    toast(`系统日期已改为 ${pickerMonth.value}月${pickerDay.value}日`)
  }
}
function cancelDatePick() {
  showDatePicker.value = false
}
function wheelStart(type, e) {
  wheelTouching[type] = true
  const y = e.touches ? e.touches[0].clientY : e.clientY
  wheelStartY[type] = y
}
function wheelMove(type, e) {
  if (!wheelTouching[type]) return
  const y = e.touches ? e.touches[0].clientY : e.clientY
  const diff = wheelStartY[type] - y
  if (Math.abs(diff) > 30) {
    if (type === 'month') {
      pickerMonth.value = diff > 0
        ? (pickerMonth.value >= 12 ? 1 : pickerMonth.value + 1)
        : (pickerMonth.value <= 1 ? 12 : pickerMonth.value - 1)
    } else {
      pickerDay.value = diff > 0
        ? (pickerDay.value >= 31 ? 1 : pickerDay.value + 1)
        : (pickerDay.value <= 1 ? 31 : pickerDay.value - 1)
    }
    wheelStartY[type] = y
  }
}
function wheelEnd(type) {
  wheelTouching[type] = false
}

// ─── 设置 ───
function tapSystemVersion() {
  state.devTapCount++
  if (state.devTapCount >= settingsData.developerTapsRequired && !state.terminalUnlocked) {
    state.terminalUnlocked = true
    toast(settingsData.usbConnectedToast)
  } else if (state.devTapCount < settingsData.developerTapsRequired) {
    toast(`再点击 ${settingsData.developerTapsRequired - state.devTapCount} 次可启用开发者选项`)
  }
}

// ─── 终端 ───
const termHistory = ref([{ type: 'sys', text: terminalData.banner }])
const termInput = ref('')
const termPromptChar = computed(() => state.rootUnlocked ? terminalData.rootPrompt : terminalData.prompt)
const awaitingSuPassword = ref(false)
const termCmdHistory = ref([])
const termHistoryIdx = ref(-1)

function termHistoryUp() {
  if (termCmdHistory.value.length === 0) return
  if (termHistoryIdx.value < termCmdHistory.value.length - 1) {
    termHistoryIdx.value++
  }
  termInput.value = termCmdHistory.value[termCmdHistory.value.length - 1 - termHistoryIdx.value]
}
function termHistoryDown() {
  if (termHistoryIdx.value <= 0) {
    termHistoryIdx.value = -1
    termInput.value = ''
    return
  }
  termHistoryIdx.value--
  termInput.value = termCmdHistory.value[termCmdHistory.value.length - 1 - termHistoryIdx.value]
}
function termKeydown(e) {
  if (e.key === 'ArrowUp') { e.preventDefault(); termHistoryUp() }
  else if (e.key === 'ArrowDown') { e.preventDefault(); termHistoryDown() }
  else if (e.key === 'Tab') { e.preventDefault(); termTabComplete() }
}

function termTabComplete() {
  const input = termInput.value.trim()
  if (!input) return

  const parts = input.split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const arg = parts[1] || ''

  // 命令补全
  if (parts.length === 1) {
    const commands = ['help', 'ls', 'cat', 'pwd', 'whoami', 'su', 'run', 'exit']
    const matches = commands.filter(c => c.startsWith(cmd))
    if (matches.length === 1) {
      termInput.value = matches[0] + ' '
    } else if (matches.length > 1) {
      termHistory.value.push({ type: 'sys', text: matches.join('  ') })
    }
    return
  }

  // 参数补全
  if (cmd === 'ls') {
    const dirs = ['data/', 'DCIM/']
    const matches = dirs.filter(d => d.startsWith(arg))
    if (matches.length === 1) {
      termInput.value = `ls ${matches[0]}`
    } else if (matches.length > 1) {
      termHistory.value.push({ type: 'sys', text: matches.join('  ') })
    }
  } else if (cmd === 'cat') {
    let candidates = []
    if (arg.startsWith('data/')) {
      const prefix = arg.replace('data/', '')
      candidates = Object.keys(dataFiles).filter(f => f.startsWith(prefix)).map(f => `data/${f}`)
    } else if (arg.startsWith('DCIM/')) {
      const prefix = arg.replace('DCIM/', '')
      const allPhotos = [...photosData.daily, ...photosData.mystery, ...photosData.broken, ...photosData.hidden]
      candidates = allPhotos.map(p => p.name).filter(f => f.startsWith(prefix)).map(f => `DCIM/${f}`)
    } else {
      // 补全目录前缀或文件
      const files = Object.keys(terminalData.files)
      const fileCandidates = files.filter(f => f.startsWith(arg))
      const dirCandidates = ['data/', 'DCIM/'].filter(d => d.startsWith(arg))
      candidates = [...fileCandidates, ...dirCandidates]
    }

    if (candidates.length === 1) {
      termInput.value = `cat ${candidates[0]}`
    } else if (candidates.length > 1) {
      termHistory.value.push({ type: 'sys', text: candidates.join('  ') })
    }
  } else if (cmd === 'run') {
    const scripts = ['escape.sh']
    const matches = scripts.filter(s => s.startsWith(arg))
    if (matches.length === 1) {
      termInput.value = `run ${matches[0]}`
    }
  }

  nextTick(() => {
    const el = document.querySelector('.term-body')
    if (el) el.scrollTop = el.scrollHeight
  })
}

// 终端虚拟 data/ 目录
const dataFiles = {
  'level1.json': '{\n  "关卡": "找到晓山瑞希",\n  "描述": "在91个眼镜中找到晓山瑞希",\n  "眼镜数量": 91\n}',
  'level2_mzk.json': '{\n  "关卡": "好多晓山瑞希",\n  "mzk种类": ["普通mzk","开心mzk","偷听mzk","生气mzk","飞行mzk","通通mzk","讲话mzk","走路mzk","鲨鱼mzk","emumzk","打坐mzk","惊吓mzk","怪核mzk","大眼mzk","吐舌mzk","跑mzk","倒立mzk","倒立走mzk","呼啦啦mzk","右立mzk","松鼠mzk"],\n  "总数": 67\n}',
  'level3_mzk.json': '{\n  "关卡": "连接晓山瑞希",\n  "方块数量": 20,\n  "mzk种类": ["普通mzk","开心mzk","偷听mzk","生气mzk","飞行mzk","鲨鱼mzk","emumzk","打坐mzk","惊吓mzk","怪核mzk","大眼mzk","吐舌mzk"]\n}',
  'test.json': (() => {
    const names = testData.questions.map((q, i) => `Q${i+1}: ${q.text}`)
    return '{\n  "测试": "测测你是哪种晓山瑞希",\n  "题目数量": ' + testData.questions.length + ',\n  "题目列表": [\n    "' + names.join('",\n    "') + '"\n  ]\n}'
  })(),
  'forum.json': (() => {
    const posts = forumData.posts.map(p => `${p.author}: ${p.title}`)
    return '{\n  "关卡": "调查晓山瑞希",\n  "帖子数量": ' + forumData.posts.length + ',\n  "帖子": [\n    "' + posts.join('",\n    "') + '"\n  ]\n}'
  })(),
  'level6_messages.json': (() => {
    const convs = level6MsgData.conversations.map(c => c.username)
    return '{\n  "关卡": "小心晓山瑞希",\n  "私信角色": ["' + convs.join('","') + '"],\n  "角色数量": ' + convs.length + '\n}'
  })(),
  'level6_comments.json': (() => {
    const comments = level6CommentData.map(c => `${c.username}: ${c.content.substring(0, 30)}...`)
    return '{\n  "视频评论数": ' + level6CommentData.length + ',\n  "评论": [\n    "' + comments.join('",\n    "') + '"\n  ]\n}'
  })()
}

function runTermCmd() {
  const raw = termInput.value.trim()
  if (!raw) return
  termCmdHistory.value.push(raw)
  termHistoryIdx.value = -1
  termHistory.value.push({ type: 'user', text: `${termPromptChar.value} ${raw}` })
  termInput.value = ''

  if (awaitingSuPassword.value) {
    awaitingSuPassword.value = false
    if (raw === terminalData.commands.rootPassword) {
      state.rootUnlocked = true
      termHistory.value.push({ type: 'sys', text: '[OK] root 权限已获取。' })
    } else {
      termHistory.value.push({ type: 'sys', text: '密码错误。' })
    }
    return
  }

  const parts = raw.split(/\s+/)
  const cmd = parts[0].toLowerCase()
  const arg = parts[1]

  if (cmd === 'help') termHistory.value.push({ type: 'sys', text: terminalData.commands.help })
  else if (cmd === 'pwd') termHistory.value.push({ type: 'sys', text: terminalData.commands.pwd })
  else if (cmd === 'whoami') termHistory.value.push({ type: 'sys', text: state.rootUnlocked ? 'root' : terminalData.commands.whoami })
  else if (cmd === 'ls') {
    if (!arg || arg === '.' || arg === '/home/mzk') {
      termHistory.value.push({ type: 'sys', text: terminalData.commands.ls + '  data/  DCIM/' })
    } else if (arg === 'data' || arg === 'data/') {
      termHistory.value.push({ type: 'sys', text: Object.keys(dataFiles).join('  ') })
    } else if (arg === 'DCIM' || arg === 'DCIM/') {
      const allPhotos = [...photosData.daily, ...photosData.mystery, ...photosData.broken, ...photosData.hidden]
      termHistory.value.push({ type: 'sys', text: allPhotos.map(p => p.name).join('  ') })
    } else {
      termHistory.value.push({ type: 'sys', text: `ls: ${arg}: 找不到目录` })
    }
  } else if (cmd === 'cat') {
    if (arg && arg.startsWith('data/')) {
      const fname = arg.replace('data/', '')
      if (dataFiles[fname]) termHistory.value.push({ type: 'sys', text: dataFiles[fname] })
      else termHistory.value.push({ type: 'sys', text: `cat: ${arg}: 找不到文件` })
    } else if (arg && arg.startsWith('DCIM/')) {
      const fname = arg.replace('DCIM/', '')
      const allPhotos = [...photosData.daily, ...photosData.mystery, ...photosData.broken, ...photosData.hidden]
      const photo = allPhotos.find(p => p.name === fname)
      if (photo) termHistory.value.push({ type: 'sys', text: `[图片文件] ${photo.name}\n类型: ${photo.type}\n${photo.meta || ''}` })
      else termHistory.value.push({ type: 'sys', text: `cat: ${arg}: 找不到文件` })
    } else {
      const f = terminalData.files[arg]
      if (f) termHistory.value.push({ type: 'sys', text: f })
      else termHistory.value.push({ type: 'sys', text: `cat: ${arg || ''}: 找不到文件` })
    }
  } else if (cmd === 'su') {
    termHistory.value.push({ type: 'sys', text: '请输入 root 密码：' })
    awaitingSuPassword.value = true
  } else if (cmd === 'run') {
    if (arg === 'escape.sh') {
      if (!state.rootUnlocked) termHistory.value.push({ type: 'sys', text: '如果运行这个sh会导致游戏通关，你还没有收集所有的内容。\n（需要 root 权限执行）' })
      else {
        state.escapeExecuted = true
        termHistory.value.push({ type: 'sys', text: terminalData.commands.runEscape })
        triggerWin(false)
      }
    } else {
      termHistory.value.push({ type: 'sys', text: `run: ${arg || ''}: 无法执行` })
    }
  } else if (cmd === 'exit') {
    backToDesktop()
  } else {
    termHistory.value.push({ type: 'sys', text: `未知命令：${cmd}` })
  }

  nextTick(() => {
    const el = document.querySelector('.term-body')
    if (el) el.scrollTop = el.scrollHeight
  })
}

// ─── 胜利 ───
function triggerWin(perfect) {
  state.won = true
  state.perfect = perfect ||
    (state.repairedPhotos === photosData.broken.length &&
     state.rootUnlocked &&
     state.escapeExecuted &&
     state.yllxExecuted &&
     state.mysteryUnlocked)
  store.completeLevel(7)
  startMzkRain()
}

// ─── mzk 雨 ───
const mzkRainDrops = ref([])
const MZK_IMGS = ['普通mzk.png', '开心mzk.png', '鲨鱼mzk.png', '飞行mzk.png', '偷听mzk.png', '讲话mzk.png', '走路mzk.png', '大眼mzk.png']
let rainTimer = null
function startMzkRain() {
  for (let i = 0; i < 40; i++) spawnDrop()
  rainTimer = setInterval(spawnDrop, 350)
}
function spawnDrop() {
  mzkRainDrops.value.push({
    id: Math.random(),
    left: Math.random() * 100,
    img: MZK_IMGS[Math.floor(Math.random() * MZK_IMGS.length)],
    size: 40 + Math.random() * 60,
    duration: 3 + Math.random() * 4,
    delay: Math.random() * 2
  })
  if (mzkRainDrops.value.length > 120) mzkRainDrops.value.splice(0, 30)
}

onUnmounted(() => {
  if (rainTimer) clearInterval(rainTimer)
})

function goHome() {
  if (rainTimer) clearInterval(rainTimer)
  router.push('/index')
}
</script>

<template>
  <!-- 顶部栏 -->
  <TopBar
    title="找到晓山瑞希"
    subtitle="mzk的手机里有什么？"
    level="7"
    @home="goHome"
  />

  <!-- 全屏闪白（取消警告时） -->
  <div v-if="flashWhite" class="flash-white"></div>

  <!-- ═══ 第一道门：认知滤网 ═══ -->
  <Teleport to="body">
    <div v-if="showWarnGate" class="overlay">
      <div class="warn-card">
        <img class="warn-mzk" :src="`${BASE}怪核mzk.png`" alt="" />
        <h2 class="warn-title">你确定要进入吗？</h2>
        <p class="warn-desc">有些门打开就再也关不上了。</p>
        <div class="warn-btns">
          <button class="btn btn-back" @click="cancelWarn">取消</button>
          <button class="btn btn-confirm" @click="acceptWarn">确定</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══ 第二道门：六个问题 ═══ -->
  <Teleport to="body">
    <div v-if="showPuzzleGate" class="overlay">
      <div class="unlock-card">
        <img class="unlock-mzk" :src="`${BASE}惊吓mzk.png`" alt="mzk" />
        <h2 class="unlock-title">第七关已被封锁</h2>
        <p class="unlock-desc">问题 {{ currentQuestion + 1 }} / {{ gateQuestions.length }}：{{ gateQuestions[currentQuestion].q }}</p>
        <input
          v-model="unlockInput"
          type="text"
          class="unlock-input glitch-input"
          placeholder="请输入答案..."
          @keyup.enter="tryUnlock"
        />
        <p v-if="unlockError" class="unlock-error">不对哦，再想想？</p>
        <div class="unlock-btns">
          <button class="btn btn-back" @click="router.push('/index')">返回首页</button>
          <button class="btn btn-confirm" @click="tryUnlock">确认</button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- ═══ 开机动画 ═══ -->
  <div v-if="isUnlocked && phase === 'boot'" class="phone-shell">
    <div class="boot-screen" :class="{ glitch: bootGlitch }">
      <img class="boot-logo" :src="`${BASE}大眼mzk.png`" alt="" />
      <p class="boot-text">mzk's wreckage</p>
      <div class="boot-bar"><div class="boot-bar-fill"></div></div>
    </div>
  </div>

  <!-- ═══ 锁屏 ═══ -->
  <div v-if="isUnlocked && phase === 'lockscreen'" class="phone-shell">
    <div class="status-bar"><span>NUL</span><span>13%</span></div>
    <div class="lockscreen">
      <div class="lock-wallpaper" :style="{ backgroundImage: `url(${BASE}调查001.jpg)` }"></div>
      <div class="lock-time">
        <span class="lock-hour">03:17</span>
        <span class="lock-date">8 月 31 日 · 晓山瑞希的手机</span>
      </div>
      <div class="lock-pwd-area">
        <p class="lock-pwd-label">请输入手机密码</p>
        <input
          v-model="lockPwdInput"
          type="password"
          class="lock-pwd-input"
          placeholder="····"
          maxlength="4"
          inputmode="numeric"
        />
        <p v-if="lockPwdError" class="dial-error">{{ lockPwdError }}</p>
        <p class="lock-hint">提示：我的生日</p>
      </div>
    </div>
  </div>

  <!-- ═══ 滑动解锁 ═══ -->
  <div v-if="isUnlocked && phase === 'slideunlock'" class="phone-shell">
    <div class="status-bar"><span>NUL</span><span>13%</span></div>
    <div class="lockscreen">
      <div class="lock-wallpaper" :style="{ backgroundImage: `url(${BASE}调查001.jpg)` }"></div>
      <div class="lock-time">
        <span class="lock-hour">03:17</span>
        <span class="lock-date">8 月 31 日 · 欢迎你。。。。。</span>
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
  </div>

  <!-- ═══ 桌面 ═══ -->
  <div v-if="isUnlocked && phase === 'desktop'" class="phone-shell">
    <div class="status-bar"><span>{{ currentSystemDate }}</span><span>NUL · 13%</span></div>

    <!-- App 视图 -->
    <div v-if="currentApp" class="app-view">
      <!-- 相册 -->
      <div v-if="currentApp === 'gallery'" class="app app-gallery">
        <div class="app-head"><button class="back" @click="backToDesktop">＜</button><span>相册</span></div>
        <p class="gallery-tip">已修复：{{ state.repairedPhotos }} / {{ photosData.broken.length }}</p>
        <div class="photo-grid">
          <div v-for="p in allPhotos" :key="p.name" class="photo-item" @click="openPhoto(p)">
            <img v-if="!p._needRepair && p.type !== 'broken'" :src="photoUrl(p)" :alt="p.name" />
            <div v-else-if="p.type === 'broken' && !p._repaired" class="photo-broken">⚠ 损坏</div>
            <img v-else :src="photoUrl(p)" :alt="p.name" />
            <span class="photo-name">{{ p.name }}</span>
          </div>
        </div>
        <div v-if="selectedPhoto" class="photo-modal" @click.self="closePhoto">
          <div class="photo-modal-inner">
            <img
              :src="photoUrl(selectedPhoto)"
              :alt="selectedPhoto.name"
              :class="{ 'photo-corrupted': selectedPhoto.type === 'broken' && !selectedPhoto._repaired }"
            />
            <p class="photo-meta">{{ selectedPhoto.name }}</p>
            <p class="photo-meta">{{ selectedPhoto.meta || '' }}</p>
            <div v-if="selectedPhoto.type === 'broken' && !selectedPhoto._repaired" class="repair-input-row">
              <input v-model="repairKeyInput" class="repair-input" placeholder="输入秘钥修复文件" @keyup.enter="repairPhoto(selectedPhoto)" />
              <span class="repair-submit" @click="repairPhoto(selectedPhoto)">→</span>
            </div>
            <p v-if="selectedPhoto._repaired" class="photo-note">{{ selectedPhoto.repairedNote }}</p>
            <button class="btn btn-back" @click="closePhoto">关闭</button>
          </div>
        </div>
      </div>

      <!-- 备忘录 -->
      <div v-if="currentApp === 'notes'" class="app app-notes">
        <div class="app-head"><button class="back" @click="backToDesktop">＜</button><span>备忘录</span></div>
        <div v-if="!selectedNote" class="notes-list">
          <div v-for="n in notes" :key="n.id" class="note-row" @click="openNote(n)">
            <span class="note-title">{{ n.title }}</span>
            <span v-if="n.locked" class="note-lock">🔒</span>
          </div>
        </div>
        <div v-else class="note-detail">
          <button class="back" @click="closeNote">＜ 返回</button>
          <h3>{{ selectedNote.title }}</h3>
          <template v-if="selectedNote.locked">
            <p class="note-hint">{{ selectedNote.unlockHint }}</p>
            <input v-model="noteUnlockInput" class="unlock-input" placeholder="输入答案..." @keyup.enter="tryUnlockNote" />
            <button class="btn btn-confirm" @click="tryUnlockNote">解锁</button>
          </template>
          <template v-else>
            <pre class="note-content">{{ selectedNote.content }}</pre>
          </template>
        </div>
      </div>

      <!-- 浏览器 -->
      <div v-if="currentApp === 'browser'" class="app app-browser">
        <div class="app-head"><button class="back" @click="backToDesktop">＜</button><span>浏览器</span></div>
        <div class="browser-bar">
          <input v-model="browserAddress" class="browser-addr" placeholder="输入地址…" @keyup.enter="goAddress" />
          <button v-if="browserCurrentPage" class="browser-bar-btn" @click="refreshTab">⟳</button>
          <button v-if="browserCurrentPage" class="browser-bar-btn browser-home-btn" @click="browserGoHome">
            <img src="icons/%E9%A6%96%E9%A1%B5.svg" alt="首页" />
          </button>
        </div>
        <!-- 页面内容 -->
        <div v-if="browserCurrentPage" class="browser-content" :class="{ 'browser-refreshing': browserRefreshing }">
          <div class="browser-page-head">
            <span class="browser-page-title">{{ browserCurrentPage.title }}</span>
          </div>
          <template v-if="browserCurrentPage.locked">
            <p class="browser-lock-hint">此页面需要密码：</p>
            <div class="browser-pwd-wrap">
              <input v-model="browserTabPwd" class="browser-pwd-input" placeholder="密码..." @keyup.enter="unlockBrowserTab" />
              <span class="browser-pwd-arrow" @click="unlockBrowserTab">→</span>
            </div>
          </template>
          <template v-else>
            <pre class="browser-body">{{ browserCurrentPage.body }}</pre>
          </template>
        </div>
        <!-- 主页：历史记录 -->
        <div v-else class="browser-home">
          <div class="browser-home-section">
            <p class="browser-section-title">历史记录</p>
            <div
              v-for="h in browserData.history" :key="h.url"
              class="browser-history-item"
              @click="browserNavigate(h.url)"
            >
              <div class="browser-history-info">
                <span class="browser-history-title">{{ h.title }}</span>
                <span class="browser-history-url">{{ h.url }}</span>
              </div>
              <span class="browser-history-time">{{ h.time }}</span>
            </div>
          </div>
        </div>
        <!-- 通关确认弹窗 -->
        <div v-if="showWinConfirm" class="browser-confirm-overlay">
          <div class="browser-confirm-box">
            <p class="browser-confirm-text">是否继续？这将会结束一切。</p>
            <div class="browser-confirm-actions">
              <button class="browser-confirm-btn cancel" @click="cancelWin">取消</button>
              <button class="browser-confirm-btn confirm" @click="confirmWin">继续</button>
            </div>
          </div>
        </div>
      </div>

      <!-- 文件 -->
      <div v-if="currentApp === 'files'" class="app app-files">
        <div class="app-head"><button class="back" @click="backToDesktop">＜</button><span>文件：{{ filesPath }}</span></div>
        <div class="files-list">
          <div v-if="filesPath !== '/'" class="file-row" @click="filesUp">
            <span>📁 ..</span>
          </div>
          <div v-for="n in (filesTree[filesPath] || [])" :key="n" class="file-row" @click="enterDir(n)">
            <span>{{ n.endsWith('/') ? '📁' : '📄' }} {{ n }}</span>
          </div>
        </div>
        <div v-if="selectedFile" class="file-modal" @click.self="selectedFile = null">
          <div class="file-modal-inner">
            <h3>{{ selectedFile.name }}</h3>
            <pre>{{ selectedFile.body }}</pre>
            <button class="btn btn-back" @click="selectedFile = null">关闭</button>
          </div>
        </div>
      </div>

      <!-- 短信 -->
      <div v-if="currentApp === 'messages'" class="app app-messages">
        <div class="app-head"><button class="back" @click="backToDesktop">＜</button><span>未知号码</span></div>
        <div class="sms-body">
          <div v-for="(m, i) in smsLog" :key="i" class="sms-bubble" :class="{ self: m.from === 'self' }">
            <p>{{ m.text }}</p>
            <span class="sms-time">{{ m.time }}</span>
          </div>
        </div>
        <div class="sms-input">
          <input v-model="smsInput" placeholder="回复..." @keyup.enter="sendSms" />
          <button class="btn btn-confirm" @click="sendSms">发送</button>
        </div>
      </div>

      <!-- 日历 -->
      <div v-if="currentApp === 'calendar'" class="app app-calendar">
        <div class="app-head"><button class="back" @click="backToDesktop">＜</button><span>日历 · {{ calYear }}-{{ calMonth }}</span></div>
        <div class="cal-grid">
          <div
            v-for="d in daysInMonth(calYear, calMonth)"
            :key="d"
            class="cal-cell"
            :class="{ marked: !!calendarData.events[`${calMonth}-${d}`] }"
            @click="clickDate(d)"
          >{{ d }}</div>
        </div>
        <div v-if="selectedDateEvent" class="cal-detail">
          <h3>{{ selectedDateEvent.date }}</h3>
          <p>{{ selectedDateEvent.label }}</p>
          <p class="cal-hint">{{ selectedDateEvent.detail }}</p>
        </div>
      </div>

      <!-- 设置 -->
      <div v-if="currentApp === 'settings'" class="app app-settings">
        <div class="app-head"><button class="back" @click="backToDesktop">＜</button><span>设置</span></div>
        <ul class="settings-list">
          <li>Wi-Fi：<span class="muted">受限</span></li>
          <li>蓝牙：<span class="muted">无法连接</span></li>
          <li>显示：<span class="muted">亮度最大</span></li>
          <li class="sep">日期与时间</li>
          <li @click="openDatePicker" class="tapable">系统日期：{{ currentSystemDate }}</li>
          <li class="sep">关于手机</li>
          <li>设备名称：{{ settingsData.about.deviceName }}</li>
          <li @click="tapSystemVersion" class="tapable">系统版本：{{ settingsData.about.systemVersion }}</li>
          <li>内核版本：{{ settingsData.about.kernelVersion }}</li>
          <li>序列号：{{ settingsData.about.serialNumber }}</li>
          <li v-if="state.terminalUnlocked" class="dev">✓ 开发者选项已启用（桌面出现「终端」）</li>
        </ul>
      </div>

      <!-- 日期选择弹窗 -->
      <Teleport to="body">
        <div v-if="showDatePicker" class="datepicker-overlay" @click.self="cancelDatePick">
          <div class="datepicker-popup">
            <div class="datepicker-title">选择日期</div>
            <div class="datepicker-wheels">
              <div class="datepicker-wheel"
                @touchstart="wheelStart('month', $event)"
                @touchmove.prevent="wheelMove('month', $event)"
                @touchend="wheelEnd('month')"
                @mousedown="wheelStart('month', $event)"
                @mousemove="wheelMove('month', $event)"
                @mouseup="wheelEnd('month')"
                @mouseleave="wheelEnd('month')"
              >
                <div class="wheel-prev">{{ pickerMonth <= 1 ? 12 : pickerMonth - 1 }}月</div>
                <div class="wheel-current">{{ pickerMonth }}月</div>
                <div class="wheel-next">{{ pickerMonth >= 12 ? 1 : pickerMonth + 1 }}月</div>
              </div>
              <div class="datepicker-wheel"
                @touchstart="wheelStart('day', $event)"
                @touchmove.prevent="wheelMove('day', $event)"
                @touchend="wheelEnd('day')"
                @mousedown="wheelStart('day', $event)"
                @mousemove="wheelMove('day', $event)"
                @mouseup="wheelEnd('day')"
                @mouseleave="wheelEnd('day')"
              >
                <div class="wheel-prev">{{ pickerDay <= 1 ? 31 : pickerDay - 1 }}日</div>
                <div class="wheel-current">{{ pickerDay }}日</div>
                <div class="wheel-next">{{ pickerDay >= 31 ? 1 : pickerDay + 1 }}日</div>
              </div>
            </div>
            <div class="datepicker-actions">
              <button class="datepicker-btn cancel" @click="cancelDatePick">取消</button>
              <button class="datepicker-btn confirm" @click="confirmDatePick">确定</button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- 终端 -->
      <div v-if="currentApp === 'terminal'" class="app app-terminal">
        <div class="app-head"><button class="back" @click="backToDesktop">＜</button><span>终端</span></div>
        <div class="term-body">
          <div v-for="(l, i) in termHistory" :key="i" class="term-line" :class="l.type">{{ l.text }}</div>
        </div>
        <div class="term-input-wrap">
          <span class="term-prompt">{{ termPromptChar }}</span>
          <input v-model="termInput" class="term-input" @keyup.enter="runTermCmd" @keydown="termKeydown" autofocus />
          <span class="term-arrow" @click="termTabComplete">⇥</span>
          <span class="term-arrow" @click="termHistoryUp">▲</span>
          <span class="term-arrow" @click="termHistoryDown">▼</span>
        </div>
      </div>
    </div>

    <!-- 桌面图标 -->
    <div v-else class="home-desktop" :style="{ backgroundImage: `url(${BASE}调查001.jpg)` }">
      <div class="app-grid">
        <div v-for="a in apps" :key="a.id" class="app-icon" :class="{ corrupted: a.corrupted, 'app-highlight': a.id === 'messages' && state.dateChangedToBirthday }" @click="openApp(a)">
          <span class="app-emoji">{{ a.icon }}</span>
          <span class="app-name">{{ a.name }}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Toast -->
  <Teleport to="body">
    <Transition name="toast">
      <div v-if="toastOn" class="toast">{{ toastMsg }}</div>
    </Transition>
  </Teleport>

  <!-- ═══ 通关画面：mzk 雨 ═══ -->
  <Teleport to="body">
    <div v-if="state.won" class="win-screen">
      <div class="rain-layer">
        <img
          v-for="d in mzkRainDrops"
          :key="d.id"
          :src="`${BASE}${encodeURIComponent(d.img)}`"
          class="rain-drop"
          :style="{
            left: d.left + '%',
            width: d.size + 'px',
            height: d.size + 'px',
            animationDuration: d.duration + 's',
            animationDelay: d.delay + 's'
          }"
        />
      </div>
      <div class="win-content">
        <h1 class="win-title">你被 mzk 欢迎到了！</h1>
        <p class="win-sub" v-if="state.perfect">你居然私自探查mzk们的手机，作为mzk的粉丝你居然……好吧，起码你今天帮了我们很多，谢谢你。</p>
        <p class="win-sub" v-else>你找到了 welcome.mzk 网站，但还有更多秘密等待发现...</p>
        <div v-if="state.perfect" class="secret-key">
          <p>请记住这个秘钥：</p>
          <div class="key-box">dingding10</div>
          <p v-if="state.yllxExecuted" class="key-hint">可以把秘钥发给。。。。</p>
          <p v-else class="key-hint">这个秘钥很有用。</p>
        </div>
        <button class="btn btn-end" @click="goHome">返回首页</button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
/* ─── 弹窗通用 ─── */
.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px;
}
.warn-card, .unlock-card {
  background: #1a1a1a; color: #eee; border-radius: 20px; padding: 32px 24px; width: min(360px, 100%);
  display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center;
  border: 1px solid #444;
}
.warn-mzk, .unlock-mzk { width: 80px; height: 80px; object-fit: contain; }
.warn-title, .unlock-title { font-size: 1.2rem; color: #ff4b7d; margin: 0; }
.warn-desc, .unlock-desc { font-size: 0.85rem; color: #aaa; margin: 0; }
.warn-btns, .unlock-btns { display: flex; gap: 12px; width: 100%; margin-top: 8px; }
.unlock-input {
  width: 100%; padding: 10px 14px; border: 1px solid #555; border-radius: 10px;
  background: #222; color: #eee; font-size: 1rem; text-align: center; outline: none;
}
.unlock-input:focus { border-color: #ff4b7d; }
.glitch-input { animation: glitch-blink 2.4s infinite; }
@keyframes glitch-blink {
  0%, 100% { opacity: 1; }
  48% { opacity: 1; }
  50% { opacity: 0.4; }
  52% { opacity: 1; }
}
.unlock-error { color: #ff7878; font-size: 0.85rem; margin: 0; }

.btn {
  flex: 1; min-height: 40px; border-radius: 20px; border: none;
  font-size: 0.9rem; cursor: pointer; transition: transform 0.15s;
}
.btn:active { transform: scale(0.97); }
.btn-confirm { background: linear-gradient(135deg, #ff4b7d, #b01c4e); color: #fff; font-weight: bold; }
.btn-back { background: transparent; border: 1px solid #555; color: #aaa; }

/* ─── 全屏闪白 ─── */
.flash-white {
  position: fixed; inset: 0; background: #fff; z-index: 9999;
  animation: flash-fade 0.45s ease-out;
}
@keyframes flash-fade {
  from { opacity: 1; } to { opacity: 0; }
}

/* ─── 手机外壳 ─── */
.phone-shell {
  min-height: 100vh; background: #000; color: #eee;
  display: flex; flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
}
.status-bar {
  display: flex; justify-content: space-between; padding: 6px 14px;
  font-size: 0.7rem; background: #0a0a0a; color: #888; border-bottom: 1px solid #111;
}

/* ─── 开机 ─── */
.boot-screen {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 16px;
  background: #000;
}
.boot-screen.glitch {
  animation: boot-glitch 0.3s infinite;
}
@keyframes boot-glitch {
  0%, 100% { filter: hue-rotate(0) contrast(1); transform: translate(0); }
  25% { filter: hue-rotate(90deg) contrast(1.5); transform: translate(-2px, 1px); }
  50% { filter: invert(1); }
  75% { transform: translate(2px, -1px); }
}
.boot-logo { width: 100px; height: 100px; object-fit: contain; }
.boot-text { color: #888; font-size: 0.9rem; }
.boot-bar { width: 180px; height: 4px; background: #222; border-radius: 2px; overflow: hidden; }
.boot-bar-fill {
  height: 100%; background: linear-gradient(90deg, #ff4b7d, #b01c4e);
  animation: boot-fill 2.2s linear forwards;
}
@keyframes boot-fill { from { width: 0; } to { width: 100%; } }

/* ─── 锁屏 ─── */
.lockscreen {
  flex: 1; position: relative; display: flex; flex-direction: column;
  align-items: center; padding: 40px 20px;
}
.lock-wallpaper {
  position: absolute; inset: 0; background-size: cover; background-position: center;
  filter: brightness(0.4) blur(2px); animation: wall-distort 15s infinite;
}
@keyframes wall-distort {
  0%, 100% { filter: brightness(0.4) blur(2px); }
  50% { filter: brightness(0.4) blur(4px) hue-rotate(20deg); }
}
.lock-time { position: relative; text-align: center; margin-bottom: 30px; }
.lock-hour { display: block; font-size: 3rem; font-weight: 200; color: #fff; }
.lock-date { display: block; font-size: 0.85rem; color: #bbb; }

.dial-error { color: #ff7878; font-size: 0.8rem; text-align: center; margin: 6px 0; }
.lock-pwd-area {
  position: relative; display: flex; flex-direction: column; align-items: center;
  gap: 10px; width: min(300px, 100%);
}
.lock-pwd-label { color: #bbb; font-size: 0.9rem; margin: 0; }
.lock-pwd-input {
  width: 160px; padding: 12px; border: 1px solid #555; border-radius: 12px;
  background: rgba(0,0,0,0.6); color: #fff; font-size: 1.6rem; text-align: center;
  letter-spacing: 8px; outline: none;
}
.lock-pwd-input:focus { border-color: #ff4b7d; }
.lock-hint { color: #777; font-size: 0.75rem; text-align: center; margin-top: 10px; }

/* ─── 滑动解锁 ─── */
.slide-area {
  position: relative; display: flex; justify-content: center;
  width: 100%; margin-top: 30px;
}
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
  background: rgba(191,255,122,0.25); color: rgba(191,255,122,0.8);
  border-color: rgba(191,255,122,0.4);
  box-shadow: 0 0 12px rgba(191,255,122,0.3);
}
.slide-text {
  position: absolute; inset: 0;
  display: flex; align-items: center; justify-content: center;
  color: rgba(255,255,255,0.5); font-size: 0.88rem; letter-spacing: 4px;
  pointer-events: none; transition: opacity 0.1s;
}

/* ─── 桌面 ─── */
.home-desktop {
  flex: 1; background-size: cover; background-position: center;
  padding: 16px; position: relative;
}
.home-desktop::before {
  content: ''; position: absolute; inset: 0; background: rgba(0,0,0,0.5); z-index: 0;
}
.app-grid {
  position: relative; z-index: 1;
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
}
.app-icon {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 8px; cursor: pointer; color: #fff;
}
.app-emoji {
  width: 52px; height: 52px; border-radius: 14px;
  background: rgba(255,255,255,0.15); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; font-size: 1.6rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}
.app-icon.corrupted .app-emoji {
  background: rgba(255,0,0,0.2); filter: grayscale(0.7) blur(0.5px);
  animation: icon-twitch 2s infinite;
}
.app-icon.app-highlight .app-emoji {
  filter: invert(1);
  animation: highlight-pulse 1.5s ease-in-out infinite;
}
@keyframes highlight-pulse {
  0%, 100% { filter: invert(1); }
  50% { filter: invert(1) brightness(1.3); }
}
@keyframes icon-twitch {
  0%, 100% { transform: translate(0); filter: grayscale(0.7) blur(0.5px); }
  49% { transform: translate(0); filter: grayscale(0.7) blur(0.5px); }
  50% { transform: translate(1px, -1px); filter: grayscale(0.2) blur(0.5px) hue-rotate(180deg); }
  52% { transform: translate(-1px, 1px); filter: grayscale(0.7) blur(0.5px); }
}
.app-name { font-size: 0.72rem; color: #fff; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }

/* ─── App 通用 ─── */
.app-view { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.app { flex: 1; background: #1a1a1a; color: #eee; display: flex; flex-direction: column; overflow: hidden; }
.app-head {
  background: #111; padding: 10px 12px; display: flex; align-items: center; gap: 10px;
  border-bottom: 1px solid #222; font-size: 0.95rem;
}
.back { background: none; border: none; color: #ff4b7d; font-size: 1.2rem; cursor: pointer; }

/* ─── 相册 ─── */
.gallery-tip { padding: 8px 12px; color: #888; font-size: 0.8rem; margin: 0; }
.photo-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px;
  padding: 4px; overflow-y: auto;
}
.photo-item {
  aspect-ratio: 1; background: #222; display: flex; align-items: center; justify-content: center;
  position: relative; cursor: pointer; overflow: hidden;
}
.photo-item img { width: 100%; height: 100%; object-fit: cover; }
.photo-broken { color: #ff7878; font-size: 0.8rem; }
.photo-name {
  position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0,0,0,0.6);
  font-size: 0.6rem; padding: 2px 4px; color: #ccc; text-align: center;
}
.photo-modal {
  position: fixed; inset: 0; background: rgba(0,0,0,0.9); z-index: 500;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.photo-modal-inner {
  background: #1a1a1a; border-radius: 12px; padding: 20px;
  max-width: 400px; width: 100%; display: flex; flex-direction: column; gap: 10px;
}
.photo-modal-inner img { width: 100%; max-height: 60vh; object-fit: contain; }
.photo-corrupted {
  filter: grayscale(0.7) contrast(1.4) brightness(0.6) hue-rotate(15deg);
  animation: photo-glitch 2s infinite;
}
@keyframes photo-glitch {
  0%, 100% { filter: grayscale(0.7) contrast(1.4) brightness(0.6) hue-rotate(15deg); transform: translate(0); }
  20% { filter: grayscale(0.7) contrast(1.6) brightness(0.5) hue-rotate(30deg); transform: translate(-2px, 1px); }
  40% { filter: grayscale(0.8) contrast(1.3) brightness(0.7) hue-rotate(-10deg); }
  60% { filter: grayscale(0.6) contrast(1.5) brightness(0.4) hue-rotate(20deg); transform: translate(2px, -1px); }
  80% { filter: grayscale(0.9) contrast(1.2) brightness(0.6) hue-rotate(5deg); }
}
.photo-meta { color: #888; font-size: 0.8rem; margin: 0; text-align: center; }
.photo-note { color: #ff4b7d; font-size: 0.85rem; text-align: center; margin: 0; }
.repair-input-row { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.repair-input { flex: 1; padding: 8px 12px; border: 1px solid #555; border-radius: 8px; background: #1a1a2e; color: #fff; font-size: 0.9rem; outline: none; }
.repair-input::placeholder { color: #888; }
.repair-submit { font-size: 1.3rem; color: #aaa; cursor: pointer; padding: 4px 8px; user-select: none; }
.repair-submit:active { color: #fff; }

/* ─── 备忘录 ─── */
.notes-list { flex: 1; overflow-y: auto; }
.note-row {
  padding: 14px 16px; border-bottom: 1px solid #222;
  display: flex; justify-content: space-between; cursor: pointer;
}
.note-row:hover { background: #222; }
.note-title { color: #eee; }
.note-lock { color: #ff4b7d; }
.note-detail { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.note-detail h3 { margin: 0; color: #fff; }
.note-hint { color: #888; font-size: 0.8rem; }
.note-content {
  background: #111; padding: 12px; border-radius: 8px; white-space: pre-wrap;
  color: #ccc; font-family: ui-monospace, Consolas, monospace; font-size: 0.85rem;
  margin: 0;
}

/* ─── 浏览器 ─── */
.app-browser { background: #fff; color: #222; position: relative; }
.app-browser .app-head { background: #eee; color: #333; border-bottom: 1px solid #ccc; }
.browser-bar {
  display: flex; gap: 6px; padding: 8px; background: #f5f5f5; border-bottom: 1px solid #ddd;
}
.browser-addr {
  flex: 1; padding: 8px 12px; border: 1px solid #ccc; border-radius: 20px;
  font-size: 0.85rem; outline: none; background: #fff;
}
.browser-bar-btn {
  background: none; border: none; font-size: 1.4rem; color: #666; cursor: pointer; padding: 0 6px;
}
.browser-bar-btn:hover { color: #333; }
.browser-home-btn { display: flex; align-items: center; padding: 0 4px; }
.browser-home-btn img { width: 20px; height: 20px; opacity: 0.6; }
.browser-home-btn:hover img { opacity: 1; }
.browser-content { flex: 1; padding: 14px; overflow-y: auto; transition: opacity 0.15s; }
.browser-content.browser-refreshing { opacity: 0.3; }
.browser-page-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #eee;
}
.browser-page-title { font-weight: bold; font-size: 0.95rem; color: #333; }
.browser-home-link { font-size: 0.8rem; color: #999; cursor: pointer; }
.browser-home-link:hover { color: #ff4b7d; }
.browser-lock-hint { color: #666; font-size: 0.9rem; margin: 0 0 8px; }
.browser-pwd-wrap {
  position: relative; display: flex; align-items: center; max-width: 260px;
}
.browser-pwd-input {
  width: 100%; padding: 10px 36px 10px 14px; border: 1px solid #ccc; border-radius: 20px;
  font-size: 0.88rem; outline: none; background: #fff;
}
.browser-pwd-input:focus { border-color: #ff4b7d; }
.browser-pwd-arrow {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  font-size: 1.1rem; color: #999; cursor: pointer; line-height: 1;
  transition: color 0.15s;
}
.browser-pwd-arrow:hover { color: #ff4b7d; }
.browser-body {
  white-space: pre-wrap; color: #333; font-family: ui-monospace, Consolas, monospace;
  font-size: 0.9rem; margin: 0;
}
.browser-home { flex: 1; overflow-y: auto; }
.browser-home-section { padding: 16px; }
.browser-section-title { font-size: 0.8rem; color: #999; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px; }
.browser-history-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 0; border-bottom: 1px solid #f0f0f0; cursor: pointer;
}
.browser-history-item:hover { background: #fafafa; }
.browser-history-info { display: flex; flex-direction: column; gap: 2px; }
.browser-history-title { font-size: 0.9rem; color: #333; }
.browser-history-url { font-size: 0.75rem; color: #aaa; }
.browser-history-time { font-size: 0.75rem; color: #bbb; white-space: nowrap; }
/* 浏览器通关确认弹窗 */
.browser-confirm-overlay {
  position: absolute; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 10;
}
.browser-confirm-box {
  background: #fff; border-radius: 12px; padding: 24px; max-width: 280px;
  text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.2);
}
.browser-confirm-text { font-size: 0.9rem; color: #333; margin: 0 0 18px; }
.browser-confirm-actions { display: flex; gap: 12px; }
.browser-confirm-btn {
  flex: 1; padding: 10px; border: none; border-radius: 8px;
  font-size: 0.85rem; cursor: pointer;
}
.browser-confirm-btn.cancel { background: #eee; color: #666; }
.browser-confirm-btn.confirm { background: #ff4b7d; color: #fff; }
.browser-confirm-btn:active { opacity: 0.8; }

/* ─── 文件 ─── */
.files-list { flex: 1; overflow-y: auto; }
.file-row { padding: 12px 16px; border-bottom: 1px solid #222; cursor: pointer; }
.file-row:hover { background: #222; }
.file-modal {
  position: fixed; inset: 0; background: rgba(0,0,0,0.8); z-index: 500;
  display: flex; align-items: center; justify-content: center; padding: 20px;
}
.file-modal-inner {
  background: #1a1a1a; border-radius: 12px; padding: 20px;
  max-width: 400px; width: 100%; color: #eee;
}
.file-modal-inner pre {
  background: #0a0a0a; padding: 12px; border-radius: 8px; white-space: pre-wrap;
  font-family: ui-monospace, Consolas, monospace; font-size: 0.85rem;
  color: #bfff7a;
}

/* ─── 短信 ─── */
.app-messages { background: #f5f5f7; color: #222; }
.app-messages .app-head { background: #fff; color: #333; }
.sms-body { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.sms-bubble {
  background: #fff; padding: 8px 12px; border-radius: 14px;
  max-width: 75%; align-self: flex-start;
}
.sms-bubble.self { background: #ff4b7d; color: #fff; align-self: flex-end; }
.sms-bubble p { margin: 0; font-size: 0.88rem; }
.sms-time { font-size: 0.65rem; color: #aaa; }
.sms-bubble.self .sms-time { color: rgba(255,255,255,0.75); }
.sms-input {
  display: flex; gap: 8px; padding: 10px; background: #fff; border-top: 1px solid #eee;
}
.sms-input input {
  flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 18px;
  outline: none; font-size: 0.88rem;
}

/* ─── 日历 ─── */
.cal-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; padding: 10px;
}
.cal-cell {
  aspect-ratio: 1; background: #222; color: #ccc;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px; font-size: 0.85rem; cursor: pointer;
}
.cal-cell.marked { background: #ff4b7d; color: #fff; font-weight: bold; }
.cal-detail { padding: 14px; }
.cal-detail h3 { margin: 0; color: #fff; }
.cal-hint { color: #888; font-size: 0.82rem; }

/* ─── 设置 ─── */
.settings-list { list-style: none; padding: 0; margin: 0; }
.settings-list li {
  padding: 12px 14px; border-bottom: 1px solid #222; color: #ddd; font-size: 0.88rem;
}
.settings-list li.sep { background: #111; color: #888; font-size: 0.75rem; padding: 6px 14px; }
.settings-list .muted { color: #888; }
.settings-list .tapable { cursor: pointer; }
.settings-list .tapable:hover { background: #222; }
.settings-list .dev { color: #bfff7a; }

/* 日期选择器 */
/* ─── 日期选择弹窗 ─── */
.datepicker-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 600;
  display: flex; align-items: flex-end; justify-content: center;
}
.datepicker-popup {
  background: #1a1a2e; border-radius: 16px 16px 0 0; padding: 20px;
  width: 100%; max-width: 400px;
}
.datepicker-title { text-align: center; color: #ccc; font-size: 0.85rem; margin-bottom: 16px; }
.datepicker-wheels { display: flex; justify-content: center; gap: 24px; margin-bottom: 20px; }
.datepicker-wheel {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  user-select: none; cursor: grab; touch-action: none; min-width: 70px;
}
.datepicker-wheel:active { cursor: grabbing; }
.wheel-prev, .wheel-next { font-size: 1rem; color: #555; padding: 8px 0; }
.wheel-current {
  font-size: 1.4rem; color: #fff; font-weight: bold;
  background: #2a2a4a; border-radius: 8px; padding: 10px 18px;
}
.datepicker-actions { display: flex; gap: 12px; }
.datepicker-btn {
  flex: 1; padding: 12px; border: none; border-radius: 10px;
  font-size: 0.9rem; cursor: pointer;
}
.datepicker-btn.cancel { background: #333; color: #aaa; }
.datepicker-btn.confirm { background: #ff4b7d; color: #fff; }
.datepicker-btn:active { opacity: 0.8; }

/* ─── 终端 ─── */
.app-terminal { background: #000; color: #bfff7a; font-family: ui-monospace, Consolas, monospace; }
.app-terminal .app-head { background: #0a0a0a; color: #bfff7a; border-bottom: 1px solid #222; }
.term-body {
  flex: 1; overflow-y: auto; padding: 12px; font-size: 0.85rem;
  white-space: pre-wrap; line-height: 1.5;
}
.term-line.user { color: #7aff7a; }
.term-line.sys { color: #bfff7a; }
.term-input-wrap {
  display: flex; gap: 6px; padding: 8px 12px; background: #0a0a0a; border-top: 1px solid #222;
}
.term-prompt { color: #ff4b7d; }
.term-input {
  flex: 1; background: transparent; border: none; color: #bfff7a; outline: none;
  font-family: inherit; font-size: 0.85rem;
}
.term-arrow {
  color: #666; font-size: 0.75rem; cursor: pointer; padding: 4px 6px;
  border: 1px solid #333; border-radius: 4px; line-height: 1; user-select: none;
}
.term-arrow:active { color: #bfff7a; border-color: #bfff7a; }

/* ─── Toast ─── */
.toast {
  position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.85); color: #fff; padding: 10px 20px;
  border-radius: 20px; font-size: 0.85rem; z-index: 999; pointer-events: none;
  max-width: 80%; text-align: center;
}
.toast-enter-active, .toast-leave-active { transition: opacity 0.3s; }
.toast-enter-from, .toast-leave-to { opacity: 0; }

/* ─── 通关：mzk 雨 ─── */
.win-screen {
  position: fixed; inset: 0; z-index: 1000; background: #000;
  display: flex; align-items: center; justify-content: center;
  overflow: hidden;
}
.rain-layer {
  position: absolute; inset: 0; pointer-events: none;
}
.rain-drop {
  position: absolute; top: -100px; object-fit: contain;
  animation: rain-fall linear infinite;
}
@keyframes rain-fall {
  from { transform: translateY(-120px) rotate(0); opacity: 1; }
  to   { transform: translateY(110vh) rotate(360deg); opacity: 0.8; }
}
.win-content {
  position: relative; z-index: 2; text-align: center; color: #fff;
  background: rgba(0,0,0,0.72); padding: 30px; border-radius: 20px;
  max-width: min(420px, 90vw); border: 1px solid #ff4b7d;
  backdrop-filter: blur(6px);
}
.win-title { color: #ff4b7d; margin: 0 0 10px; font-size: 1.5rem; }
.win-sub { color: #fff; font-size: 0.9rem; line-height: 1.5; margin: 0 0 16px; }
.secret-key {
  background: rgba(255,75,125,0.12); padding: 14px; border-radius: 12px; margin: 14px 0;
}
.secret-key p { margin: 4px 0; font-size: 0.85rem; }
.key-box {
  font-family: ui-monospace, Consolas, monospace;
  background: #000; color: #bfff7a; padding: 12px; border-radius: 8px;
  font-size: 1.3rem; letter-spacing: 2px; font-weight: bold; border: 1px dashed #bfff7a;
  user-select: all;
}
.key-hint { color: #aaa; font-size: 0.78rem; font-style: italic; }
.btn-end {
  margin-top: 14px; padding: 12px 30px; border-radius: 22px;
  background: linear-gradient(135deg, #ff4b7d, #b01c4e); color: #fff;
  border: none; font-weight: bold; cursor: pointer; width: 100%;
}
</style>
