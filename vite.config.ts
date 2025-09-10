import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import envConfig from './src/config/env'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true, // 允许外部访问
    open: true,  // 自动打开浏览器
    proxy: {
      '/okx-proxy': {
        target: `https://faku.cflpool.io/okx`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/okx-proxy/, ''),
        secure: false,
      },
      '/api-proxy': {
        target: `https://api.faku.info`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-proxy/, ''),
        secure: false,
        headers:{
         "Access-Control-Allow-Origin":"*"
        }
      },
      '/coin-proxy': {
        target: `https://faku.cflpool.io/coin`,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/coin-proxy/, ''),
        secure: false,
        headers: {
          "X-CMC_PRO_API_KEY": "e3ae2fc1-1f63-4a71-8cad-954483653903" ,
        },
      }
    }
  },
  base: './',
  // 添加对 WASM 的支持
  optimizeDeps: {
    exclude: ['../pkg/conflux_wasm.js']
  },
  
  // 确保 WASM 文件被正确处理
  assetsInclude: ['**/*.wasm'],
  
  // 如果需要，添加解析别名
  resolve: {
    alias: {
      // 现有别名...
      '@wasm': require('path').resolve(__dirname, 'src/pkg')
    }
  }
})