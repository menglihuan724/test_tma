interface EnvConfig {
  VITE_BASE_URL: string;
  VITE_LP_OPTIONS: { name: string; value: string }[];
  VITE_OK_DEX_API_KEY: string;
  VITE_OK_DEX_SECRET: string;
  VITE_OK_DEX_PASS: string;
  VITE_OK_DEX_ID: string;
  VITE_OK_URL: string;
  VITE_WALLETS: { chains: string; address: string }[];
  VITE_PASSWORD: string;
  VITE_SUI_RPC_URL: string;
  VITE_AUTH_TOKEN: string;
  VITE_AUTH_USER: string;
  VITE_FAKU_CONTRACT_ADDRESS: string;
  VITE_WATCH_ADDRESS: string[];
  VITE_CFL_OWNER: string;
  VITE_LP_ADDRESSES:string
}

const env: EnvConfig = {
  VITE_BASE_URL: import.meta.env.VITE_BASE_URL,
  VITE_LP_OPTIONS: import.meta.env.VITE_LP_OPTIONS
    ? JSON.parse(import.meta.env.VITE_LP_OPTIONS)
    : [],
  VITE_OK_DEX_API_KEY: import.meta.env.VITE_OK_DEX_API_KEY,
  VITE_OK_DEX_SECRET: import.meta.env.VITE_OK_DEX_SECRET,
  VITE_OK_DEX_PASS: import.meta.env.VITE_OK_DEX_PASS,
  VITE_OK_DEX_ID: import.meta.env.VITE_OK_DEX_ID,
  VITE_OK_URL: import.meta.env.VITE_OK_URL,
  VITE_WALLETS: import.meta.env.VITE_WALLETS
    ? JSON.parse(import.meta.env.VITE_WALLETS)
    : [],
  VITE_PASSWORD: import.meta.env.VITE_PASSWORD,
  VITE_SUI_RPC_URL: import.meta.env.VITE_SUI_RPC_URL,
  VITE_AUTH_TOKEN: import.meta.env.VITE_AUTH_TOKEN,
  VITE_AUTH_USER: import.meta.env.VITE_AUTH_USER,
  VITE_FAKU_CONTRACT_ADDRESS: import.meta.env.VITE_FAKU_CONTRACT_ADDRESS,
  VITE_WATCH_ADDRESS: import.meta.env.VITE_WATCH_ADDRESS
    ? JSON.parse(import.meta.env.VITE_WATCH_ADDRESS)
    : [],
  VITE_CFL_OWNER: import.meta.env.VITE_CFL_OWNER,
  VITE_LP_ADDRESSES: import.meta.env.VITE_LP_ADDRESSES,
};

export default env; 