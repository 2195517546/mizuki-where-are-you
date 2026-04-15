import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/index',
    component: () => import('../pages/index.vue'),
  },
  ...Array.from({ length: 10 }, (_, i) => ({
    path: `/${i + 1}`,
    component: () => import(`../pages/level/mzk${i + 1}.vue`),
  })),
  {
    path: '/',
    redirect: '/index',
  },
]

export default createRouter({
  history: createWebHistory('/games/1/'),
  routes,
})
