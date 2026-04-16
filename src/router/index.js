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
  {
    path: '/',
    redirect: '/index',
  },
]

const router = createRouter({
  history: createWebHistory('/games/1/'),
  routes,
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
