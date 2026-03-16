// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // 设置为相对路径，这样你把 dist 扔到服务器任何目录下都能运行
  base: './' 
})