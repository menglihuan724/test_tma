import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // 允许外部访问
    open: true  // 自动打开浏览器
  },
  base: './' // 设置基础路径
}) 