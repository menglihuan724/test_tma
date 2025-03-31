import { verifyAuth } from "../services/cloudfareClient";
import CryptoJS from "crypto-js";

// 标记敏感字段的装饰器类型
type Sensitive = {
  encrypted: boolean;
  value: string;
};

interface EnvConfig {
  VITE_ENV: string;
  VITE_BASE_URL: string;
  VITE_API_URL: string;
  VITE_LP_OPTIONS: { name: string; value: string }[];
  VITE_OK_DEX_API_KEY: string | Sensitive;
  VITE_OK_DEX_SECRET: string | Sensitive;
  VITE_OK_DEX_PASS: string | Sensitive;
  VITE_OK_DEX_ID: string;
  VITE_OK_URL: string;
  VITE_WALLETS: { chains: string; address: string }[];
  VITE_PASSWORD: string | Sensitive;
  VITE_SUI_RPC_URL: string;
  VITE_AUTH_TOKEN: string | Sensitive;
  VITE_AUTH_USER: string;
  VITE_FAKU_CONTRACT_ADDRESS: string;
  VITE_WATCH_ADDRESS: string[];
  VITE_CFL_OWNER: string;
  VITE_LP_ADDRESSES: string;
  VITE_COINMARKETCAP_API_KEY: string | Sensitive;
  VITE_COIN_URL: string;
  VITE_LPAIR_ADDRESS: string;
}

const sensitive = (value: string): Sensitive => ({
  encrypted: true,
  value
});

// 解密函数（使用从密钥派生的 IV）
const decrypt = (encryptedValue: string, key: string): string => {
  try {
    // 从密钥派生 IV（使用 SHA-256 哈希）
    const keyHash = CryptoJS.SHA256(key).toString();
    const iv = CryptoJS.enc.Hex.parse(keyHash.substring(0, 32)); // 取前16字节作为IV
    const decrypted = CryptoJS.AES.decrypt(encryptedValue, key, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error("Failed to decrypt value:", error);
    return "";
  }
};

// 环境变量初始化
let decryptionKey: string | null = null;
let envConfig: EnvConfig;

// 初始化环境配置
const initEnv =  ():EnvConfig => {
  // 确定环境类型
  const environment = import.meta.env.VITE_ENV || "dev";
  
  // 创建基础配置
  const config: EnvConfig = {
    VITE_ENV: environment,
    VITE_BASE_URL: import.meta.env.VITE_BASE_URL,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_LP_OPTIONS: import.meta.env.VITE_LP_OPTIONS
      ? JSON.parse(import.meta.env.VITE_LP_OPTIONS)
      : [],
    VITE_OK_DEX_API_KEY: environment === "prod" 
      ? sensitive(import.meta.env.VITE_OK_DEX_API_KEY) 
      : import.meta.env.VITE_OK_DEX_API_KEY,
    VITE_OK_DEX_SECRET: environment === "prod" 
      ? sensitive(import.meta.env.VITE_OK_DEX_SECRET) 
      : import.meta.env.VITE_OK_DEX_SECRET,
    VITE_OK_DEX_PASS: environment === "prod" 
      ? sensitive(import.meta.env.VITE_OK_DEX_PASS) 
      : import.meta.env.VITE_OK_DEX_PASS,
    VITE_OK_DEX_ID: import.meta.env.VITE_OK_DEX_ID,
    VITE_OK_URL: import.meta.env.VITE_OK_URL,
    VITE_WALLETS: import.meta.env.VITE_WALLETS
      ? JSON.parse(import.meta.env.VITE_WALLETS)
      : [],
    VITE_PASSWORD: environment === "prod" 
      ? sensitive(import.meta.env.VITE_PASSWORD) 
      : import.meta.env.VITE_PASSWORD,
    VITE_SUI_RPC_URL: import.meta.env.VITE_SUI_RPC_URL,
    VITE_AUTH_TOKEN: environment === "prod" 
      ? sensitive(import.meta.env.VITE_AUTH_TOKEN) 
      : import.meta.env.VITE_AUTH_TOKEN,
    VITE_AUTH_USER: import.meta.env.VITE_AUTH_USER,
    VITE_FAKU_CONTRACT_ADDRESS: import.meta.env.VITE_FAKU_CONTRACT_ADDRESS,
    VITE_WATCH_ADDRESS: import.meta.env.VITE_WATCH_ADDRESS
      ? JSON.parse(import.meta.env.VITE_WATCH_ADDRESS)
      : [],
    VITE_CFL_OWNER: import.meta.env.VITE_CFL_OWNER,
    VITE_LP_ADDRESSES: import.meta.env.VITE_LP_ADDRESSES,
    VITE_COINMARKETCAP_API_KEY: environment === "prod" 
      ? sensitive(import.meta.env.VITE_COINMARKETCAP_API_KEY) 
      : import.meta.env.VITE_COINMARKETCAP_API_KEY,
    VITE_COIN_URL: import.meta.env.VITE_COIN_URL,
    VITE_LPAIR_ADDRESS: import.meta.env.VITE_LPAIR_ADDRESS
  };

  return config;
};

const envHandler = {
  get: function(target: EnvConfig, prop: keyof EnvConfig) {
    const value = target[prop];
    if (value && typeof value === 'object' && 'encrypted' in value && value.encrypted) {
      if (!decryptionKey) {
        console.error(`Cannot access encrypted value for ${String(prop)} without decryption key`);
        return "";
      }
      const res=decrypt(value.value, decryptionKey);
      return res
    }
    
    return value;
  }
};

const rawEnv =  initEnv();
envConfig = new Proxy(rawEnv, envHandler);

// 设置解密密钥
export const setDecryptionKey = (key: string) => {
  decryptionKey = key;
  console.log("Decryption key set successfully");
};

// 检查是否需要获取解密密钥
export const initializeSecureEnv = async (): Promise<boolean> => {
  if (envConfig.VITE_ENV === "prod" && !decryptionKey) {
    try {
      const authResult = await verifyAuth();
      if (authResult) {
        setDecryptionKey(authResult.toString());
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to initialize secure environment:", error);
      return false;
    }
  }
  return true; // 在开发环境中不需要解密
};

// 检查安全环境是否已初始化
export const isSecureEnvInitialized = (): boolean => {
  return envConfig.VITE_ENV !== "prod" || !!decryptionKey;
};

export default envConfig; 