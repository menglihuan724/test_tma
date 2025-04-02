import init, { decrypt } from '../pkg/conflux_wasm.js';

let initialized = false;
let initPromise = null;

export async function ensureInitialized() {
  if (initialized) return;
  
  if (!initPromise) {
    // 针对 Vite 的 WASM 导入方式
    const wasmUrl = new URL('../pkg/conflux_wasm_bg.wasm', import.meta.url);
    initPromise = init(wasmUrl);
  }
  
  await initPromise;
  initialized = true;
}

export async function decryptAsync(encryptedValue, key, originalType) {
  await ensureInitialized();
  return decrypt(encryptedValue, key, originalType);
} 

export function decryptSync(encryptedValue, key, originalType) {
  if (initialized) {
    return decrypt(encryptedValue, key, originalType);
  }
  return null;
} 