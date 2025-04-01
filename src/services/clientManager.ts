import axios, { AxiosInstance } from 'axios';
import env from '../config/env';
import { isSecureEnvInitialized } from '../config/env';
import { OKXClient } from './okxClient';
// 客户端实例
let fakuClientInstance: AxiosInstance | null = null;
let okxClientInstance: OKXClient | null = null;
let coinmarketClientInstance: AxiosInstance | null = null;

/**
 * 初始化所有API客户端
 * 在解密密钥可用后调用
 */
export const initializeClients = () => {
  if (!isSecureEnvInitialized()) {
    console.warn('Cannot initialize clients: secure environment not initialized');
    return false;
  }

  fakuClientInstance = axios.create({
    baseURL: env.VITE_API_URL,
    headers: {
      Authorization: `Basic ${btoa(`${env.VITE_AUTH_USER}:${env.VITE_AUTH_TOKEN}`)}`,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // 初始化 OKX 客户端
  console.log("初始化欧意库护短")
  okxClientInstance = new OKXClient(
    env.VITE_OK_DEX_API_KEY,
    env.VITE_OK_DEX_SECRET,
    env.VITE_OK_DEX_PASS,
    env.VITE_OK_URL,
    env.VITE_OK_DEX_ID
  );

  // 初始化 CoinMarket 客户端
  coinmarketClientInstance = axios.create({
    baseURL: env.VITE_COIN_URL,
    headers: {
      "X-CMC_PRO_API_KEY": env.VITE_COINMARKETCAP_API_KEY || "",
      Authorization: `Basic ${btoa(`${env.VITE_AUTH_USER}:${env.VITE_AUTH_TOKEN}`)}`,
    },
    timeout: 50000,
  });

  return true;
};

/**
 * 获取 Faku 客户端实例
 * 如果客户端尚未初始化，尝试初始化
 */
export const getFakuClient = (): AxiosInstance => {
  if (!fakuClientInstance) {
    if (!initializeClients()) {
      throw new Error('Failed to initialize Faku client: secure environment not initialized');
    }
  }
  return fakuClientInstance!;
};

/**
 * 获取 OKX 客户端实例
 */
export const getOkxClient = (): OKXClient => {
  if (!okxClientInstance) {
    if (!initializeClients()) {
      throw new Error('Failed to initialize OKX client: secure environment not initialized');
    }
  }
  return okxClientInstance!;
};

/**
 * 获取 CoinMarket 客户端实例
 */
export const getCoinmarketClient = (): AxiosInstance => {
  if (!coinmarketClientInstance) {
    if (!initializeClients()) {
      throw new Error('Failed to initialize CoinMarket client: secure environment not initialized');
    }
  }
  return coinmarketClientInstance!;
}; 