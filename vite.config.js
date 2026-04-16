import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: '/games/1/',
  server: {
    port: 5174,
    host: true,
    allowedHosts: ['frp.faceround.cn']
  },
  build: {
    rollupOptions: {
      output: {
        // 把 Vue / Vue Router / Pinia 合成单独的 vendor chunk
        // 用户二次访问命中缓存，业务代码更新不影响它
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },
})
