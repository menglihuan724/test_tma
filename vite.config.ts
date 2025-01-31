import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // 允许外部访问
    open: true,  // 自动打开浏览器
    proxy: {
      '/okx-proxy': {
        target: 'https://okx.cflpool.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/okx-proxy/, ''),
        secure: false,
        headers: {
          Referer: 'https://okx.cflpool.io',
          Origin: 'https://okx.cflpool.io'
        }
      }
    }
  },
  base: './' // 设置基础路径
}) 