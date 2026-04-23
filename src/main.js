import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import './styles/variables.css'
import './styles/common.css'
import App from './App.vue'
import router from './router/index.js'

createApp(App).use(createPinia()).use(router).mount('#app')
