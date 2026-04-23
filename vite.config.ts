import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// 加载环境变量
const env = loadEnv('development', process.cwd(), '');

// 开发模式选择
// 1. wrangler pages dev (推荐) - 与生产环境完全一致
// 2. vite direct - Vite 直接代理 (快速开发)
const USE_WRANGLER = env.VITE_USE_WRANGLER !== 'false';  // 默认使用 wrangler
const WRANGLER_PORT = parseInt(env.VITE_WRANGLER_PORT || '8788');
export default defineConfig({
  plugins: [react()],
  server: {
    port: USE_WRANGLER ? 3000 : 3000,
    host: true,
    open: false,  // wrangler 模式下不自动打开
    proxy: USE_WRANGLER ? {
      // ============================================
      // 模式: wrangler pages dev
      // 所有请求代理到 wrangler (Functions + 静态文件)
      // ============================================
      '/': {
        target: `http://localhost:${WRANGLER_PORT}`,
        changeOrigin: true,
        // 不 rewrite，保持路径一致
        rewrite: (path) => path,
        secure: false,
        // 代理 WebSocket (HMR)
        ws: true,
      },
    } : {
      // ============================================
      // 模式: Vite 直接代理 (备用)
      // ============================================
      '/okx': {
        target: 'https://www.okx.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/okx/, '/api/v5/wallet'),
        secure: true,
      },
      '/coingecko': {
        target: 'https://api.coingecko.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/coingecko/, '/api/v3'),
        secure: true,
      },
      '/coin': {
        target: 'https://pro-api.coinmarketcap.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/coin/, ''),
        secure: true,
        headers: {
          'X-CMC_PRO_API_KEY': process.env.VITE_COINMARKETCAP_API_KEY || '',
        },
      },
    },
  },
  base: './',
  optimizeDeps: {
    exclude: ['../pkg/conflux_wasm.js']
  },
  assetsInclude: ['**/*.wasm'],
  resolve: {
    alias: {
      '@wasm': require('path').resolve(__dirname, 'src/pkg'),
    }
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  }
})
