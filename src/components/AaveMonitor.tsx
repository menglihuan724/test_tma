import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Table, Select, Button, Space, Tag, Modal, Input, Alert } from 'antd';
import { ReloadOutlined, BellOutlined, WalletOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { ethers } from 'ethers';

const GRAPH_API_KEY = 'e10bb898c69b6817947fa33b514b4e7e';

const TARGET_TOKENS = ['USDT', 'USDT0', 'USDC', 'USDe', 'GHO', 'ETH', 'WETH'];

const CHAIN_CONFIGS = [
  { id: 'ethereum', name: 'ETH Core', color: '#627EEA', url: 'https://gateway.thegraph.com/api/subgraphs/id/Cd2gEDVeqnjBn1hSeqFMitw8Q1iiyV9FYUZkLNRcL87g' },
  { id: 'arbitrum', name: 'Arbitrum', color: '#28A0F0', url: 'https://gateway.thegraph.com/api/subgraphs/id/DLuE98kEb5pQNXAcKFQGQgfSQ57Xdou4jnVbAEqMfy3B' },
  { id: 'polygon', name: 'Polygon', color: '#8247E5', url: 'https://gateway.thegraph.com/api/subgraphs/id/Co2URyXjnxaw8WqxKyVHdirq9Ahhm5vcTs4dMedAq211' },
  { id: 'bnb', name: 'BNB', color: '#F0B90B', url: 'https://gateway.thegraph.com/api/subgraphs/id/7Jk85XgkV1MQ7u56hD8rr65rfASbayJXopugWkUoBMnZ' },
  { id: 'base', name: 'Base', color: '#0052FF', url: 'https://gateway.thegraph.com/api/subgraphs/id/GQFbb95cE6d8mV989mL5figjaGaKCQB3xqYrr1bRyXqF' },
];

const PLASMA_RPC = 'https://plasma.drpc.org';
const PLASMA_POOL = '0x925a2A7214Ed92428B5b1B090F80b25700095e12';
const USDT0_ADDRESS = '0xB8CE59FC3717ada4C02eaDF9682A9e934F625ebb';

const TOKEN_ALIAS: Record<string, string> = {
  'USDT': 'USDT', 'USDT0': 'USDT0', 'USDC': 'USDC', 'USDC.e': 'USDC',
  'USDCe': 'USDC', 'USDbC': 'USDC', 'USDe': 'USDe', 'GHO': 'GHO', 'WETH': 'WETH', 'ETH': 'ETH',
};

const QUERY = `{
  reserves(first: 100) {
    symbol liquidityRate variableBorrowRate totalLiquidity isActive isFrozen
  }
}`;

const GlassCard = styled.div`
  background: rgba(26, 27, 38, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 20px;
`;

const StatusDot = styled.span<{ $status: 'success' | 'error' | 'loading' | 'idle' }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  background: ${props => props.$status === 'success' ? '#10B981' : props.$status === 'error' ? '#EF4444' : props.$status === 'loading' ? '#F59E0B' : '#6B7280'};
  ${props => props.$status === 'loading' ? 'animation: pulse 2s infinite;' : ''}
`;

const AaveTag = styled(Tag)<{ $type: 'supply' | 'borrow' }>`
  color: ${props => props.$type === 'supply' ? '#00d4aa' : '#fb923c'};
  background: ${props => props.$type === 'supply' ? 'rgba(0, 212, 170, 0.1)' : 'rgba(251, 146, 60, 0.1)'};
  border: none;
  font-family: monospace;
`;

const ChainBadge = styled.div<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 12px;
  background: ${props => props.$color}18;
  color: ${props => props.$color};
  border: 1px solid ${props => props.$color}80;
`;

const RiskIndicator = styled.div<{ $level: 'safe' | 'medium' | 'high' | 'critical' }>`
  padding: 4px 12px;
  border-radius: 6px;
  font-weight: 600;
  color: ${props => props.$level === 'safe' ? '#10B981' : props.$level === 'medium' ? '#F59E0B' : props.$level === 'high' ? '#F97316' : '#EF4444'};
  background: ${props => props.$level === 'safe' ? 'rgba(16, 185, 129, 0.2)' : props.$level === 'medium' ? 'rgba(245, 158, 11, 0.2)' : props.$level === 'high' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
`;

const ConfigBox = styled.div<{ $highlight?: boolean; $color: string }>`
  background: ${props => props.$color}30;
  border-radius: 8px;
  padding: 8px;
  ${props => props.$highlight ? `border: 1px solid ${props.$color};` : ''}
`;

const LogItem = styled.div<{ $type: 'deposit' | 'withdraw' | 'info' | 'error' }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: ${props => props.$type === 'deposit' ? '#10B981' : props.$type === 'withdraw' ? '#EF4444' : props.$type === 'error' ? '#EF4444' : '#9CA3AF'};
  background: rgba(255, 255, 255, 0.03);
`;

interface ChainData {
  [token: string]: { supplyAPY: string; borrowAPY: string; tvl: string; raw: { supply: number; borrow: number } };
}

interface PlasmaData {
  availableLiquidity: string;
  supplyRate: string;
  borrowRate: string;
  lastUpdate: string;
  lastUpdateTime: string;
}

interface StrategyLog {
  time: string;
  type: 'deposit' | 'withdraw' | 'info' | 'error';
  msg: string;
}

interface Alert {
  time: string;
  msg: string;
}

const AaveMonitor: React.FC = () => {
  const [allData, setAllData] = useState<Record<string, ChainData>>({});
  const [prevData, setPrevData] = useState<Record<string, ChainData>>({});
  const [chainStatuses, setChainStatuses] = useState<Record<string, 'success' | 'error' | 'loading' | 'idle'>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState('--:--');
  const [nextUpdateIn, setNextUpdateIn] = useState(30);
  const [refreshInterval, setRefreshInterval] = useState(30000);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [notifStatus, setNotifStatus] = useState<NotificationPermission>(Notification.permission);

  const [plasmaData, setPlasmaData] = useState<PlasmaData | null>(null);
  const [plasmaConnected, setPlasmaConnected] = useState(false);
  const [plasmaLoading, setPlasmaLoading] = useState(false);
  const [plasmaError, setPlasmaError] = useState<string | null>(null);
  const [plasmaRateChanges, setPlasmaRateChanges] = useState({ supply: 0, borrow: 0 });
  const [plasmaLiquidityAlert, setPlasmaLiquidityAlert] = useState(false);
  const plasmaPrevRef = useRef<PlasmaData | null>(null);

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState('0');
  const [aaveDeposit, setAaveDeposit] = useState('0');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [walletInputError, setWalletInputError] = useState('');
  const walletSignerRef = useRef<ethers.Signer | null>(null);

  const [strategyEnabled, setStrategyEnabled] = useState(false);
  const [strategyRunning, setStrategyRunning] = useState(false);
  const [currentRiskLevel, setCurrentRiskLevel] = useState<'safe' | 'medium' | 'high' | 'critical'>('safe');
  const [strategyLogs, setStrategyLogs] = useState<StrategyLog[]>([]);
  const [currentMarketBalance, setCurrentMarketBalance] = useState(0);

  const [riskThresholds, setRiskThresholds] = useState({
    safe: 7240000, medium: 2400000, high: 1000000, critical: 0,
  });
  const [withdrawRatios, setWithdrawRatios] = useState({
    safe: 0, medium: 50, high: 90, critical: 100,
  });

  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const plasmaRefreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const strategyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const rayToPercent = (ray: string) => (parseFloat(ray || '0') / 1e27 * 100);
  const fmtTvl = (raw: string) => {
    const v = parseFloat(raw || '0') / 1e18;
    if (isNaN(v) || v === 0) return '';
    if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
    if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
    if (v >= 1e3) return (v / 1e3).toFixed(1) + 'K';
    return v.toFixed(0);
  };

  const plasmaRpcCall = async (method: string, params: any[] = []) => {
    const resp = await fetch(PLASMA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
    const json = await resp.json();
    if (json.error) throw new Error(json.error.message || 'RPC Error');
    return json.result;
  };

  const computeRiskLevel = useCallback((balance: number) => {
    if (balance > riskThresholds.safe) return 'safe';
    if (balance > riskThresholds.medium) return 'medium';
    if (balance > riskThresholds.high) return 'high';
    return 'critical';
  }, [riskThresholds]);

  const computeAction = useCallback(() => {
    const level = currentRiskLevel;
    const ratio = withdrawRatios[level] / 100;
    const userAave = parseFloat(aaveDeposit.replace(/,/g, '')) || 0;
    const userWallet = parseFloat(walletBalance.replace(/,/g, '')) || 0;
    if (level === 'safe') return userWallet > 0 ? '存入全部' : '持有';
    if (ratio > 0 && userAave > 0) return `撤出 ${Math.floor(userAave * ratio)} USDT0`;
    return '持有';
  }, [currentRiskLevel, withdrawRatios, aaveDeposit, walletBalance]);

  const addStrategyLog = useCallback((type: StrategyLog['type'], msg: string) => {
    const time = new Date().toLocaleTimeString('zh-CN');
    setStrategyLogs(prev => [{ time, type, msg }, ...prev].slice(0, 50));
  }, []);

  const fetchChainData = async (chain: typeof CHAIN_CONFIGS[0]) => {
    setChainStatuses(prev => ({ ...prev, [chain.id]: 'loading' }));
    try {
      const resp = await fetch(chain.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + GRAPH_API_KEY },
        body: JSON.stringify({ query: QUERY }),
      });
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const json = await resp.json();
      if (json.errors) throw new Error(json.errors[0]?.message || 'GraphQL error');

      const result: ChainData = {};
      for (const rv of (json.data?.reserves || [])) {
        if (!rv.isActive || rv.isFrozen) continue;
        const sym = rv.symbol?.trim() || '';
        const mapped = TOKEN_ALIAS[sym];
        if (!mapped) continue;

        const supplyAPY = rayToPercent(rv.liquidityRate).toFixed(2);
        const borrowAPY = rayToPercent(rv.variableBorrowRate).toFixed(2);
        if (!result[mapped]) {
          result[mapped] = {
            supplyAPY, borrowAPY, tvl: fmtTvl(rv.totalLiquidity),
            raw: { supply: parseFloat(supplyAPY), borrow: parseFloat(borrowAPY) },
          };
        }
      }
      setChainStatuses(prev => ({ ...prev, [chain.id]: 'success' }));
      return result;
    } catch (e: any) {
      console.error(`[${chain.name}]`, e.message);
      setChainStatuses(prev => ({ ...prev, [chain.id]: 'error' }));
      return null;
    }
  };

  const checkAlerts = useCallback((chainId: string, newTokens: ChainData) => {
    const prev = prevData[chainId] || {};
    const chainName = CHAIN_CONFIGS.find(c => c.id === chainId)?.name || chainId;
    const APY_ALERT_THRESHOLD = 0.5;

    for (const [token, cur] of Object.entries(newTokens)) {
      const old = prev[token];
      if (!old) continue;
      const dSupply = Math.abs(cur.raw.supply - old.raw.supply);
      const dBorrow = Math.abs(cur.raw.borrow - old.raw.borrow);
      const time = new Date().toLocaleTimeString('zh-CN');
      if (dSupply >= APY_ALERT_THRESHOLD) {
        const msg = `[${chainName}] ${token} 存款APY 变动 ${dSupply.toFixed(2)}% (${old.raw.supply.toFixed(2)}% → ${cur.raw.supply.toFixed(2)}%)`;
        setAlerts(prev => [{ time, msg }, ...prev].slice(0, 50));
      }
      if (dBorrow >= APY_ALERT_THRESHOLD) {
        const msg = `[${chainName}] ${token} 借款APY 变动 ${dBorrow.toFixed(2)}% (${old.raw.borrow.toFixed(2)}% → ${cur.raw.borrow.toFixed(2)}%)`;
        setAlerts(prev => [{ time, msg }, ...prev].slice(0, 50));
      }
    }
  }, [prevData]);

  const fetchAllData = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const results = await Promise.allSettled(CHAIN_CONFIGS.map(c => fetchChainData(c)));
      const newData: Record<string, ChainData> = {};
      results.forEach((r, i) => {
        const cid = CHAIN_CONFIGS[i].id;
        if (r.status === 'fulfilled' && r.value) {
          checkAlerts(cid, r.value);
          newData[cid] = r.value;
        } else {
          newData[cid] = allData[cid] || {};
        }
      });
      setPrevData(JSON.parse(JSON.stringify(allData)));
      setAllData(newData);
      setLastUpdateTime(new Date().toLocaleTimeString('zh-CN'));
      resetCountdown();
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPlasmaData = async () => {
    setPlasmaLoading(true);
    setPlasmaError(null);
    try {
      const reserveData = '0x35ea6a75' + USDT0_ADDRESS.slice(2).toLowerCase().padStart(64, '0');
      const reserveResult = await plasmaRpcCall('eth_call', [{ to: PLASMA_POOL, data: reserveData }, 'latest']);
      if (!reserveResult || reserveResult === '0x') throw new Error('Empty response from Pool');

      const hex = reserveResult.slice(2);
      const slots128: string[] = [];
      for (let i = 0; i < hex.length / 32; i++) slots128.push(hex.slice(i * 32, (i + 1) * 32));

      const liquidityRateRay = parseInt(slots128[5], 16) / 1e27;
      const variableBorrowRateRay = parseInt(slots128[9], 16) / 1e27;
      const SECONDS_PER_YEAR = 365 * 24 * 3600;
      const liquidityRate = ((1 + liquidityRateRay / SECONDS_PER_YEAR) ** SECONDS_PER_YEAR - 1) * 100;
      const variableBorrowRate = ((1 + variableBorrowRateRay / SECONDS_PER_YEAR) ** SECONDS_PER_YEAR - 1) * 100;

      const aTokenAddress = '0x' + hex.slice(8 * 64 + 24, 9 * 64);
      const balanceOfData = '0x70a08231' + aTokenAddress.slice(2).toLowerCase().padStart(64, '0');
      let availableLiquidity = BigInt(0);
      try {
        const balanceResult = await plasmaRpcCall('eth_call', [{ to: USDT0_ADDRESS, data: balanceOfData }, 'latest']);
        availableLiquidity = BigInt(balanceResult || '0x0');
      } catch (e) { console.warn('[Plasma] Failed to get USDT0 balance:', e); }

      const availableNum = Number(availableLiquidity / BigInt(1000000));
      const availableFormatted = availableNum.toLocaleString('en-US');

      if (plasmaPrevRef.current) {
        const prev = plasmaPrevRef.current;
        setPlasmaRateChanges({
          supply: liquidityRate - parseFloat(prev.supplyRate),
          borrow: variableBorrowRate - parseFloat(prev.borrowRate),
        });
      }

      const newData: PlasmaData = {
        availableLiquidity: availableFormatted,
        supplyRate: liquidityRate.toFixed(2),
        borrowRate: variableBorrowRate.toFixed(2),
        lastUpdate: new Date().toLocaleDateString('zh-CN'),
        lastUpdateTime: new Date().toLocaleTimeString('zh-CN'),
      };
      plasmaPrevRef.current = newData;
      setPlasmaData(newData);
      setPlasmaConnected(true);
      setCurrentMarketBalance(availableNum);
      setCurrentRiskLevel(computeRiskLevel(availableNum));

      setPlasmaLiquidityAlert(availableNum > 100);
    } catch (e: any) {
      console.error('[Plasma] Error:', e.message);
      setPlasmaError(e.message);
      setPlasmaConnected(false);
    } finally {
      setPlasmaLoading(false);
    }
  };

  const refreshWalletBalance = async () => {
    if (!walletAddress) return;
    try {
      const balanceOfData = '0x70a08231' + walletAddress.slice(2).toLowerCase().padStart(64, '0');
      const balanceResult = await plasmaRpcCall('eth_call', [{ to: USDT0_ADDRESS, data: balanceOfData }, 'latest']);
      const balance = BigInt(balanceResult || '0x0');
      setWalletBalance((Number(balance / BigInt(1000000))).toLocaleString('en-US'));

      const reserveData = '0x35ea6a75' + USDT0_ADDRESS.slice(2).toLowerCase().padStart(64, '0');
      const reserveResult = await plasmaRpcCall('eth_call', [{ to: PLASMA_POOL, data: reserveData }, 'latest']);
      if (reserveResult && reserveResult !== '0x') {
        const hex = reserveResult.slice(2);
        const aTokenAddress = '0x' + hex.slice(8 * 64 + 24, 9 * 64);
        const aTokenBalanceData = '0x70a08231' + walletAddress.slice(2).toLowerCase().padStart(64, '0');
        const aTokenBalanceResult = await plasmaRpcCall('eth_call', [{ to: aTokenAddress, data: aTokenBalanceData }, 'latest']);
        const aBalance = BigInt(aTokenBalanceResult || '0x0');
        setAaveDeposit((Number(aBalance / BigInt(1000000))).toLocaleString('en-US'));
      }
    } catch (e) { console.error('[Wallet] Failed to get balance:', e.message); }
  };

  const connectWallet = async () => {
    setWalletInputError('');
    setWalletConnecting(true);
    try {
      const pk = privateKeyInput;
      if (!pk) { setWalletInputError('请输入私钥'); return; }
      const cleanPk = pk.startsWith('0x') ? pk.slice(2) : pk;
      if (cleanPk.length !== 64) { setWalletInputError('私钥格式错误 (需要64字符)'); return; }
      const provider = new ethers.providers.JsonRpcProvider(PLASMA_RPC);
      const signer = new ethers.Wallet(cleanPk, provider);
      setWalletAddress(signer.address);
      walletSignerRef.current = signer;
      setPrivateKeyInput('');
      setShowWalletModal(false);
      await refreshWalletBalance();
    } catch (e: any) { setWalletInputError('私钥解析失败: ' + e.message); }
    finally { setWalletConnecting(false); }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    walletSignerRef.current = null;
    setWalletBalance('0');
    setAaveDeposit('0');
    setStrategyEnabled(false);
  };

  const executeDeposit = async (amount: bigint) => {
    if (!walletSignerRef.current || !walletAddress) { addStrategyLog('error', '钱包未连接'); return false; }
    try {
      const iface = new ethers.utils.Interface(['function supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)']);
      const data = iface.encodeFunctionData('supply', [USDT0_ADDRESS, amount.toString(), walletAddress, 0]);
      const tx = { to: PLASMA_POOL, data, value: 0 };
      addStrategyLog('deposit', `正在存入 ${(Number(amount) / 1000000).toLocaleString()} USDT0...`);
      const sentTx = await walletSignerRef.current.sendTransaction(tx);
      addStrategyLog('info', `交易已发送: ${sentTx.hash.slice(0, 10)}...`);
      await sentTx.wait();
      addStrategyLog('deposit', '存入成功!');
      await refreshWalletBalance();
      return true;
    } catch (e: any) { addStrategyLog('error', '存入失败: ' + e.message); return false; }
  };

  const executeWithdraw = async (amount: bigint) => {
    if (!walletSignerRef.current || !walletAddress) { addStrategyLog('error', '钱包未连接'); return false; }
    try {
      const iface = new ethers.utils.Interface(['function withdraw(address asset, uint256 amount, address to)']);
      const data = iface.encodeFunctionData('withdraw', [USDT0_ADDRESS, amount.toString(), walletAddress]);
      const tx = { to: PLASMA_POOL, data, value: 0 };
      addStrategyLog('withdraw', `正在撤出 ${(Number(amount) / 1000000).toLocaleString()} USDT0...`);
      const sentTx = await walletSignerRef.current.sendTransaction(tx);
      addStrategyLog('info', `交易已发送: ${sentTx.hash.slice(0, 10)}...`);
      await sentTx.wait();
      addStrategyLog('withdraw', '撤出成功!');
      await refreshWalletBalance();
      return true;
    } catch (e: any) { addStrategyLog('error', '撤出失败: ' + e.message); return false; }
  };

  const checkAndExecuteStrategy = async () => {
    try {
      const reserveData = '0x35ea6a75' + USDT0_ADDRESS.slice(2).toLowerCase().padStart(64, '0');
      const reserveResult = await plasmaRpcCall('eth_call', [{ to: PLASMA_POOL, data: reserveData }, 'latest']);
      if (!reserveResult || reserveResult === '0x') return;
      const hex = reserveResult.slice(2);
      const aTokenAddress = '0x' + hex.slice(8 * 64 + 24, 9 * 64);
      const balanceOfData = '0x70a08231' + aTokenAddress.slice(2).toLowerCase().padStart(64, '0');
      const balanceResult = await plasmaRpcCall('eth_call', [{ to: USDT0_ADDRESS, data: balanceOfData }, 'latest']);
      const marketAvailable = Number(BigInt(balanceResult || '0x0') / BigInt(1000000));
      setCurrentMarketBalance(marketAvailable);
      const riskLevel = computeRiskLevel(marketAvailable);
      setCurrentRiskLevel(riskLevel);

      if (!strategyEnabled || !walletAddress) {
        addStrategyLog('info', `市场余额: ${marketAvailable.toLocaleString()}, 风险等级: ${riskLevel} (策略未启用)`);
        return;
      }

      const aTokenBalanceData = '0x70a08231' + walletAddress.slice(2).toLowerCase().padStart(64, '0');
      const aTokenBalanceResult = await plasmaRpcCall('eth_call', [{ to: aTokenAddress, data: aTokenBalanceData }, 'latest']);
      const userAaveBalance = Number(BigInt(aTokenBalanceResult || '0x0') / BigInt(1000000));

      const walletBalData = '0x70a08231' + walletAddress.slice(2).toLowerCase().padStart(64, '0');
      const walletBalResult = await plasmaRpcCall('eth_call', [{ to: USDT0_ADDRESS, data: walletBalData }, 'latest']);
      const walletBal = Number(BigInt(walletBalResult || '0x0') / BigInt(1000000));

      addStrategyLog('info', `市场余额: ${marketAvailable.toLocaleString()}, 风险: ${riskLevel}, Aave: ${userAaveBalance}, 钱包: ${walletBal}`);

      const ratio = withdrawRatios[riskLevel] / 100;
      if (ratio > 0 && userAaveBalance > 0) {
        const withdrawAmount = BigInt(Math.floor(userAaveBalance * ratio * 1000000));
        if (withdrawAmount > BigInt(0)) {
          addStrategyLog('info', `风险等级 ${riskLevel}，准备撤出 ${(Number(withdrawAmount) / 1000000).toLocaleString()} USDT0 (${Math.floor(ratio * 100)}%)`);
          await executeWithdraw(withdrawAmount);
        }
      } else if (riskLevel === 'safe' && walletBal > 0) {
        addStrategyLog('info', `风险等级 safe，存入全部余额 ${walletBal.toLocaleString()} USDT0`);
        await executeDeposit(BigInt(Math.floor(walletBal * 1000000)));
      }
    } catch (e: any) { addStrategyLog('error', '策略执行失败: ' + e.message); }
  };

  const runStrategyOnce = async () => {
    if (!walletAddress) { addStrategyLog('error', '请先连接钱包'); return; }
    setStrategyRunning(true);
    await checkAndExecuteStrategy();
    await refreshWalletBalance();
    setStrategyRunning(false);
  };

  const resetCountdown = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setNextUpdateIn(Math.floor(refreshInterval / 1000));
    if (refreshInterval > 0) {
      countdownTimerRef.current = setInterval(() => {
        setNextUpdateIn(prev => prev > 0 ? prev - 1 : Math.floor(refreshInterval / 1000));
      }, 1000);
    }
  };

  const updateRefreshInterval = (value: number) => {
    setRefreshInterval(value);
    if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    if (value > 0) refreshTimerRef.current = setInterval(fetchAllData, value);
    resetCountdown();
  };

  const requestNotification = async () => {
    if (notifStatus === 'granted') return;
    const perm = await Notification.requestPermission();
    setNotifStatus(perm);
  };

  useEffect(() => {
    fetchAllData();
    if (refreshInterval > 0) refreshTimerRef.current = setInterval(fetchAllData, refreshInterval);
    resetCountdown();
    fetchPlasmaData();
    plasmaRefreshTimerRef.current = setInterval(fetchPlasmaData, 30000);
    checkAndExecuteStrategy();

    return () => {
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      if (plasmaRefreshTimerRef.current) clearInterval(plasmaRefreshTimerRef.current);
      if (strategyTimerRef.current) clearInterval(strategyTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (strategyEnabled && walletAddress) {
      checkAndExecuteStrategy();
      strategyTimerRef.current = setInterval(async () => {
        setStrategyRunning(true);
        await checkAndExecuteStrategy();
        await refreshWalletBalance();
        setStrategyRunning(false);
      }, 60000);
    } else {
      if (strategyTimerRef.current) { clearInterval(strategyTimerRef.current); strategyTimerRef.current = null; }
    }
    return () => { if (strategyTimerRef.current) clearInterval(strategyTimerRef.current); };
  }, [strategyEnabled, walletAddress]);

  const riskLevelLabel = { safe: '高安全', medium: '中风险', high: '高风险', critical: '极高风险' };

  const columns = [
    { title: '代币', dataIndex: 'token', key: 'token', fixed: 'left' as const, width: 100 },
    ...CHAIN_CONFIGS.map(chain => ({
      title: <div style={{ textAlign: 'center' }}><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', background: chain.color, marginRight: 4 }}></span>{chain.name}</div>,
      key: chain.id,
      width: 150,
      render: (_: any, record: any) => {
        const data = allData[chain.id]?.[record.token];
        if (!data) return <span style={{ color: '#374151' }}>—</span>;
        return <div style={{ textAlign: 'center' }}>
          <div><AaveTag $type="supply">{data.supplyAPY}%</AaveTag> <AaveTag $type="borrow">{data.borrowAPY}%</AaveTag></div>
          <div style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>{data.tvl}</div>
        </div>;
      },
    })),
  ];

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>

      {/* Header */}
      <GlassCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #00d4aa, #00b38a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20 }}>⬡</span>
            </div>
            <div>
              <h2 style={{ margin: 0, color: '#fff', fontSize: 18 }}>Aave V3 市场监控</h2>
              <p style={{ margin: 0, color: '#9CA3AF', fontSize: 12 }}>
                <StatusDot $status={isLoading ? 'loading' : 'success'} />
                最后更新: {lastUpdateTime} · {refreshInterval > 0 ? `${nextUpdateIn}s 后刷新` : '自动刷新已关闭'}
              </p>
            </div>
          </div>
          <Space>
            <Button icon={<BellOutlined />} onClick={requestNotification}
              type={notifStatus === 'granted' ? 'primary' : 'default'}
              style={notifStatus === 'granted' ? { background: '#059669' } : {}}>
              {notifStatus === 'granted' ? '通知已开启' : notifStatus === 'denied' ? '通知被拒' : '开启通知'}
            </Button>
            <Select value={refreshInterval} onChange={updateRefreshInterval} style={{ width: 140 }}>
              <Select.Option value={10000}>10秒刷新</Select.Option>
              <Select.Option value={30000}>30秒刷新</Select.Option>
              <Select.Option value={60000}>1分钟刷新</Select.Option>
              <Select.Option value={0}>关闭自动刷新</Select.Option>
            </Select>
            <Button type="primary" icon={<ReloadOutlined />} onClick={fetchAllData} loading={isLoading}>立即刷新</Button>
          </Space>
        </div>
      </GlassCard>

      {/* Wallet & Strategy */}
      <GlassCard style={{ border: '1px solid rgba(59, 130, 246, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <WalletOutlined style={{ color: '#fff' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 14 }}>钱包与安全策略</h3>
              <p style={{ margin: 0, color: '#6B7280', fontSize: 11 }}>自动化存入/撤出 USDT0 到 Aave Plasma</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StatusDot $status={strategyEnabled ? (strategyRunning ? 'loading' : 'success') : 'idle'} />
            <span style={{ fontSize: 12, color: strategyEnabled ? (strategyRunning ? '#F59E0B' : '#10B981') : '#6B7280' }}>
              {strategyEnabled ? (strategyRunning ? '监控中...' : '已暂停') : '未启用'}
            </span>
          </div>
        </div>

        {/* Wallet Status */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div style={{ background: 'rgba(31, 41, 55, 0.5)', borderRadius: 12, padding: 16 }}>
            <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 8 }}>钱包状态</div>
            {walletAddress ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StatusDot $status="success" />
                <span style={{ color: '#10B981', fontFamily: 'monospace' }}>{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                <Button size="small" type="text" onClick={disconnectWallet} danger>断开</Button>
              </div>
            ) : (
              <Button size="small" type="primary" onClick={() => setShowWalletModal(true)}>连接钱包</Button>
            )}
          </div>
          <div style={{ background: 'rgba(31, 41, 55, 0.5)', borderRadius: 12, padding: 16 }}>
            <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 4 }}>USDT0 余额</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>{walletBalance}</div>
            <div style={{ color: '#6B7280', fontSize: 11 }}>≈ ${walletBalance}</div>
          </div>
          <div style={{ background: 'rgba(31, 41, 55, 0.5)', borderRadius: 12, padding: 16 }}>
            <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 4 }}>Aave 存款</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#10B981' }}>{aaveDeposit}</div>
            <div style={{ color: '#6B7280', fontSize: 11 }}>≈ ${aaveDeposit}</div>
          </div>
        </div>

        {/* Strategy Config */}
        <div style={{ background: 'rgba(31, 41, 55, 0.3)', borderRadius: 12, padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>🔒</span>
              <span style={{ color: '#fff', fontSize: 14 }}>安全策略配置</span>
            </div>
            <Space>
              <Button size="small" onClick={runStrategyOnce} disabled={!walletAddress || strategyRunning} style={{ background: '#D97706' }}>
                {strategyRunning ? '执行中...' : '立即执行策略'}
              </Button>
              <span style={{ fontSize: 12, color: '#6B7280' }}>启用</span>
              <input type="checkbox" checked={strategyEnabled} onChange={e => setStrategyEnabled(e.target.checked)} />
            </Space>
          </div>

          {/* Current Status */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 12 }}>
            <div style={{ background: 'rgba(17, 24, 39, 0.5)', borderRadius: 8, padding: 8, textAlign: 'center' }}>
              <div style={{ color: '#6B7280', fontSize: 11 }}>当前可借贷余额</div>
              <div style={{ fontSize: 16, fontWeight: 'bold', color: '#fff' }}>{currentMarketBalance.toLocaleString()}</div>
              <div style={{ color: '#6B7280', fontSize: 11 }}>USDT0</div>
            </div>
            <div style={{ background: 'rgba(17, 24, 39, 0.5)', borderRadius: 8, padding: 8, textAlign: 'center' }}>
              <div style={{ color: '#6B7280', fontSize: 11 }}>当前风险等级</div>
              <RiskIndicator $level={currentRiskLevel}>{riskLevelLabel[currentRiskLevel]}</RiskIndicator>
            </div>
            <div style={{ background: 'rgba(17, 24, 39, 0.5)', borderRadius: 8, padding: 8, textAlign: 'center' }}>
              <div style={{ color: '#6B7280', fontSize: 11 }}>执行动作</div>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: computeAction().startsWith('撤出') ? '#EF4444' : computeAction() === '存入全部' ? '#10B981' : '#3B82F6' }}>{computeAction()}</div>
            </div>
          </div>

          {/* Threshold Config */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8 }}>
            {(['safe', 'medium', 'high', 'critical'] as const).map(level => (
              <ConfigBox key={level} $highlight={currentRiskLevel === level} $color={level === 'safe' ? '#10B981' : level === 'medium' ? '#F59E0B' : level === 'high' ? '#F97316' : '#EF4444'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: level === 'safe' ? '#10B981' : level === 'medium' ? '#F59E0B' : level === 'high' ? '#F97316' : '#EF4444', fontWeight: 500 }}>
                    {level === 'safe' ? '高安全' : level === 'medium' ? '中风险' : level === 'high' ? '高风险' : '极高风险'}
                  </span>
                  <span style={{ fontSize: 10, color: '#6B7280' }}>{level === 'safe' ? '持有' : '撤出'}</span>
                </div>
                {level !== 'critical' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <span style={{ color: '#6B7280', fontSize: 11, width: 32 }}>阈值:</span>
                    <Input size="small" type="number" value={riskThresholds[level]} onChange={e => setRiskThresholds(prev => ({ ...prev, [level]: Number(e.target.value) }))} style={{ width: 70 }} />
                    <span style={{ color: '#6B7280', fontSize: 11 }}>万</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ color: '#6B7280', fontSize: 11, width: 32 }}>比例:</span>
                  <Input size="small" type="number" value={withdrawRatios[level]} onChange={e => setWithdrawRatios(prev => ({ ...prev, [level]: Number(e.target.value) }))} style={{ width: 60 }} />
                  <span style={{ color: '#6B7280', fontSize: 11 }}>%</span>
                </div>
              </ConfigBox>
            ))}
          </div>
        </div>

        {/* Strategy Logs */}
        {strategyLogs.length > 0 && (
          <div style={{ marginTop: 12, maxHeight: 100, overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, color: '#6B7280' }}>最近操作</span>
              <Button size="small" type="text" onClick={() => setStrategyLogs([])}>清除</Button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {strategyLogs.slice(0, 5).map((log, i) => (
                <LogItem key={i} $type={log.type}><span style={{ color: '#4B5563' }}>{log.time}</span> {log.msg}</LogItem>
              ))}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Plasma USDT0 Liquidity */}
      <GlassCard style={{ border: '1px solid rgba(249, 115, 22, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, #F97316, #F59E0B)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>$</div>
            <div>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 14 }}>Plasma USDT0 可借贷余额</h3>
              <p style={{ margin: 0, color: '#6B7280', fontSize: 11 }}>通过 RPC 直接查询链上数据</p>
            </div>
          </div>
          <Space>
            <StatusDot $status={plasmaConnected ? 'success' : plasmaLoading ? 'loading' : 'idle'} />
            <span style={{ fontSize: 12, color: plasmaConnected ? '#10B981' : '#6B7280' }}>
              {plasmaConnected ? '已连接' : plasmaLoading ? '查询中...' : '未连接'}
            </span>
            <Button size="small" onClick={fetchPlasmaData} loading={plasmaLoading} style={{ background: '#D97706' }}>刷新</Button>
          </Space>
        </div>
        {plasmaError && <Alert message={plasmaError} type="error" showIcon style={{ marginBottom: 12 }} />}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 }}>
          <div style={{ background: plasmaLiquidityAlert ? 'rgba(239, 68, 68, 0.1)' : 'rgba(31, 41, 55, 0.5)', borderRadius: 12, padding: 16, textAlign: 'center', border: plasmaLiquidityAlert ? '2px solid #EF4444' : 'none' }}>
            <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 4 }}>可借贷余额 {plasmaLiquidityAlert && <span style={{ color: '#EF4444' }}>⚠️ 充足</span>}</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: plasmaLiquidityAlert ? '#EF4444' : '#F97316' }}>{plasmaData?.availableLiquidity || '—'}</div>
            <div style={{ color: '#6B7280', fontSize: 11 }}>USDT0</div>
          </div>
          <div style={{ background: 'rgba(31, 41, 55, 0.5)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 4 }}>存款利率</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#10B981' }}>{plasmaData?.supplyRate || '—'}%</div>
            <div style={{ fontSize: 11, color: plasmaRateChanges.supply > 0 ? '#EF4444' : plasmaRateChanges.supply < 0 ? '#10B981' : '#6B7280' }}>
              {plasmaRateChanges.supply > 0 ? '↑' : plasmaRateChanges.supply < 0 ? '↓' : ''}{plasmaRateChanges.supply !== 0 ? Math.abs(plasmaRateChanges.supply).toFixed(2) + '%' : '年化 APY'}
            </div>
          </div>
          <div style={{ background: 'rgba(31, 41, 55, 0.5)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 4 }}>借款利率</div>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#EF4444' }}>{plasmaData?.borrowRate || '—'}%</div>
            <div style={{ fontSize: 11, color: plasmaRateChanges.borrow > 0 ? '#EF4444' : plasmaRateChanges.borrow < 0 ? '#10B981' : '#6B7280' }}>
              {plasmaRateChanges.borrow > 0 ? '↑' : plasmaRateChanges.borrow < 0 ? '↓' : ''}{plasmaRateChanges.borrow !== 0 ? Math.abs(plasmaRateChanges.borrow).toFixed(2) + '%' : '年化 APY'}
            </div>
          </div>
          <div style={{ background: 'rgba(31, 41, 55, 0.5)', borderRadius: 12, padding: 16, textAlign: 'center' }}>
            <div style={{ color: '#6B7280', fontSize: 12, marginBottom: 4 }}>上次更新</div>
            <div style={{ fontSize: 16, fontWeight: 'semibold', color: '#D1D5DB' }}>{plasmaData?.lastUpdate || '—'}</div>
            <div style={{ color: '#6B7280', fontSize: 11 }}>{plasmaData?.lastUpdateTime || ''}</div>
          </div>
        </div>
      </GlassCard>

      {/* Chain Status */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {CHAIN_CONFIGS.map(chain => (
          <ChainBadge key={chain.id} $color={chain.color}>
            <StatusDot $status={chainStatuses[chain.id] || 'idle'} />
            {chain.name}
          </ChainBadge>
        ))}
      </div>

      {/* Main Data Table */}
      <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
        <Table
          dataSource={TARGET_TOKENS.map(token => ({ token, key: token }))}
          columns={columns}
          loading={isLoading && Object.keys(allData).length === 0}
          pagination={false}
          scroll={{ x: 900 }}
          size="small"
          rowClassName={(_, index) => index % 2 === 0 ? '' : 'bg-white/[0.01]'}
        />
      </GlassCard>

      {/* APY Alerts */}
      {alerts.length > 0 && (
        <GlassCard>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={{ color: '#fff', fontSize: 14 }}>APY 异动提醒</span>
            </div>
            <Button size="small" type="text" onClick={() => setAlerts([])}>清除</Button>
          </div>
          <div style={{ maxHeight: 160, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alerts.map((a, i) => (
              <div key={i} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 6, background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                <span style={{ color: '#F59E0B', marginRight: 8 }}>{a.time}</span>
                <span style={{ color: '#D1D5DB' }}>{a.msg}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Footer */}
      <div style={{ textAlign: 'center', marginTop: 20, color: '#6B7280', fontSize: 11 }}>
        数据来源: Aave V3 Subgraph (The Graph) · Plasma USDT0 通过 RPC 直接查询链上数据
      </div>

      {/* Wallet Modal */}
      <Modal open={showWalletModal} title="连接钱包" onCancel={() => setShowWalletModal(false)} footer={null} width={400}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 8, color: '#6B7280' }}>私钥 (仅本地存储，不会上传)</label>
            <Input.Password value={privateKeyInput} onChange={e => setPrivateKeyInput(e.target.value)} placeholder="输入私钥或粘贴 keystore JSON" />
          </div>
          {walletInputError && <div style={{ color: '#EF4444', fontSize: 12 }}>{walletInputError}</div>}
          <Button type="primary" onClick={connectWallet} loading={walletConnecting} disabled={!privateKeyInput} block>
            {walletConnecting ? '连接中...' : '连接'}
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AaveMonitor;
