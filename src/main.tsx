import React from 'react'
import ReactDOM from 'react-dom'
import AppRouter from './AppRouter'
import './index.css'
import { initializeSecureEnv } from './config/env'
import { initializeClients } from './services/clientManager'
import { ensureInitialized } from './decrypt_rs'

// 初始化安全环境
const initApp = async () => {
  const initialized = await initializeSecureEnv()
  await ensureInitialized()
  if (!initialized) {
    // 如果在生产环境中无法初始化，可以显示错误消息或登录页面
    ReactDOM.render(
      <React.StrictMode>
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>Authentication Required</h1>
        <p>Please refresh the page to try again.</p>
      </div>
    </React.StrictMode>,
      document.getElementById('root')
    ) 
    return
  }
  
  // 初始化客户端
  initializeClients()
  
  // 正常渲染应用
  ReactDOM.render(
    <React.StrictMode>
      <AppRouter />
    </React.StrictMode>,
    document.getElementById('root')
  ) 
}

initApp() 