import { createRouter, createWebHistory } from 'vue-router'
import levels from '../data/levels.json'

const routes = [
  {
    path: '/index',
    component: () => import('../pages/index.vue'),
  },
  { path: '/1',  component: () => import('../pages/level/mzk1.vue') },
  { path: '/2',  component: () => import('../pages/level/mzk2.vue') },
  { path: '/3',  component: () => import('../pages/level/mzk3.vue') },
  { path: '/4',  component: () => import('../pages/level/mzk4.vue') },
  { path: '/5',  component: () => import('../pages/level/mzk5.vue') },
  { path: '/6',  component: () => import('../pages/level/mzk6.vue') },
  { path: '/7',  component: () => import('../pages/level/mzk7.vue') },
  { path: '/8',  component: () => import('../pages/level/mzk8.vue') },
  { path: '/9',  component: () => import('../pages/level/mzk9.vue') },
  { path: '/10', component: () => import('../pages/level/mzk10.vue') },
  { path: '/mzk-test', component: () => import('../pages/mzk-test.vue') },
  { path: '/minigame/mine-clearance', component: () => import('../pages/minigame/mine-clearance.vue') },
  {
    path: '/',
    redirect: '/index',
  },
]

const router = createRouter({
  history: createWebHistory('/games/1/'),
  routes,
})

// ─── 关卡跳关保护：未解锁前一关不可直接访问 ───
router.beforeEach((to) => {
  const match = to.path.match(/^\/(\d+)$/)
  if (!match) return true
  const id = Number(match[1])
  if (id <= 1) return true

  // 直接从 localStorage 读取，避免依赖 Pinia 初始化顺序
  let completed = []
  try {
    const raw = localStorage.getItem('mzk-game-progress')
    if (raw) completed = JSON.parse(raw).completedLevels || []
  } catch { /* ignore */ }

  if (completed.includes(id - 1)) return true
  // 未解锁，重定向到首页
  return '/index'
})

const BASE_TITLE = '晓山瑞希，你在哪？'

router.afterEach((to) => {
  const match = to.path.match(/^\/(\d+)$/)
  if (match) {
    const id = Number(match[1])
    const level = levels.find((l) => l.id === id)
    document.title = level ? level.name : BASE_TITLE
  } else {
    document.title = BASE_TITLE
  }
})

export default router
