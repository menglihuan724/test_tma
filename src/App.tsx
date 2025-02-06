import React, { useEffect, useState } from 'react';
import { Layout, Card, Button, Input, Select, Space, Typography, Badge, message } from 'antd';
import { ReloadOutlined, ApiOutlined, RocketOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import './index.css';
import { OKXClient } from './services/okxClient';
import { useNavigate } from 'react-router-dom';
// import { getSuiBalance, getSuiTokenBalances, getSuiBalanceAtTime, getSuiTokenBalancesAtTime } from './services/suiClient';
import { testNet, fakuOnce, getFakuStatus, fakuGetOld, startAiJob, stopAiJob, getAiStatus } from './services/fakuClient';

const { Header, Content } = Layout;
const { Title } = Typography;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: var(--bg-color);
`;

const StyledHeader = styled(Header)`
  display: flex;
  align-items: center;
  padding: 0 24px;
  background: transparent;
`;

const StyledContent = styled(Content)`
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
`;

const LogoWrapper = styled.div`
  text-align: center;
  margin-bottom: 24px;
  img {
    border-radius: 50%;
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  }
`;

declare global {
  interface Window {
    Telegram: any;
    eruda: any;
  }
}
// 使用 import.meta.env 访问环境变量
const LP_OPTIONS = import.meta.env.VITE_LP_OPTIONS 
  ? JSON.parse(import.meta.env.VITE_LP_OPTIONS)
  : [];
const BASE_URL = import.meta.env.VITE_BASE_URL;
const OK_DEX_API_KEY = import.meta.env.VITE_OK_DEX_API_KEY;
const OK_DEX_SECRET = import.meta.env.VITE_OK_DEX_SECRET;
const OK_DEX_PASS = import.meta.env.VITE_OK_DEX_PASS;
const OK_DEX_ID = import.meta.env.VITE_OK_DEX_ID;
const OK_URL = import.meta.env.VITE_OK_URL;
console.log(import.meta.env.VITE_WALLETS)
const WALLETS = import.meta.env.VITE_WALLETS 
  ? JSON.parse(import.meta.env.VITE_WALLETS)
  : [];

function App() {
  const history = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [fakuStatus, setFakuStatus] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [lpAddress, setLpAddress] = useState<string>(
    LP_OPTIONS[0].value || ''
  );
  const [num, setNum] = useState<string>('1');
  const [isLp, setIsLp] = useState<string>('true');
  const [level, setLevel] = useState<string>('0');
  const [walletBalances, setWalletBalances] = useState<{address: string; chain: string; balance: number}[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [getOldNum, setGetOldNum] = useState<string>('2');
  const [aiStatus, setAiStatus] = useState<number>(0); // 0: stopped, 1: running
  const [suiAddress, setSuiAddress] = useState<string>('');
  const [suiBalance, setSuiBalance] = useState<any>(null);
  const [suiTokenBalances, setSuiTokenBalances] = useState<any[]>([]);
  const [historicalTimestamp, setHistoricalTimestamp] = useState<number>(0);
  const [historicalSuiBalance, setHistoricalSuiBalance] = useState<any>(null);
  const [historicalSuiTokenBalances, setHistoricalSuiTokenBalances] = useState<any[]>([]);

  useEffect(() => {
    const checkLogin = () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (!loggedIn) {
        history('/login');
      } else {
        setIsLoggedIn(true);
      }
    };

    checkLogin();
  }, [history]);

  useEffect(() => {
    // Init TWA
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.setHeaderColor("secondary_bg_color");

    // Theme change handler
    window.Telegram.WebApp.onEvent("themeChanged", () => {
      document.documentElement.className = window.Telegram.WebApp.colorScheme;
      document.body.setAttribute(
        "style",
        "--bg-color:" + window.Telegram.WebApp.backgroundColor
      );
    });

    // Set up main button
    window.Telegram.WebApp.MainButton.setParams({
      text: "Faku",
    });
    window.Telegram.WebApp.MainButton.show();

    // Status polling
    const interval = setInterval(async () => {
      if (fakuStatus === 1) {
        const status = await getFakuStatus();
        setFakuStatus(status);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fakuStatus]);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const client = new OKXClient(
          OK_DEX_API_KEY,
          OK_DEX_SECRET,
          OK_DEX_PASS,
          OK_URL,
          OK_DEX_ID
        );
        
        const balances = await Promise.all(
          WALLETS.map(async (wallet: any) => {
            const balance = await client.queryTotalValue(wallet.address, wallet.chains);
            return {
              address: wallet.address,
              chain: wallet.chains,
              balance: balance
            };
          })
        );
        
        setWalletBalances(balances);

        // 为每个钱包设置定时器
        balances.forEach((wallet) => {
          const interval = setInterval(async () => {
            const balance = await client.queryTotalValue(wallet.address, wallet.chain);
            setWalletBalances((prevBalances) => prevBalances.map((prevWallet) => {
              if (prevWallet.address === wallet.address && prevWallet.chain === wallet.chain) {
                return {
                  ...prevWallet,
                  balance: balance
                };
              }
              return prevWallet;
            }));
          }, 15000); // 20秒

          // 清除定时器
          return () => clearInterval(interval);
        });
      } catch (error) {
        message.error('Failed to fetch balances');
        console.error(error);
      }
    };

    fetchBalances();
  }, []);

  useEffect(() => {
    // 计算总余额
    const total = walletBalances.reduce((acc, wallet) => acc + wallet.balance, 0);
    setTotalBalance(total);
  }, [walletBalances]);

  useEffect(() => {
    let interval;
    setTimeout(() => {
      interval = setInterval(async () => {
        const status:number = await getAiStatus();
        setAiStatus(status);
    }, 24000);
    }, 1000)
    return () => clearInterval(interval);
  }, [aiStatus]);

  const testNet = async () => {
    try {
      setLoading(true);
      const result = await testNet();
      message.success(result);
    } catch (error) {
      message.error('Network test failed');
    } finally {
      setLoading(false);
    }
  };

  const fakuOne = async () => {
    try {
      setLoading(true);
      const statusRes = await getFakuStatus();
      if (statusRes === 0 && fakuStatus === 0) {
        const response = await fakuOnce(num, isLp, level);
        message.success(response === 0 ? "Operation successful" : "Operation failed");
        setFakuStatus(response === 0 ? 1 : 0);
      } else {
        message.warning("Faku is running");
      }
    } catch (error) {
      message.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const getByOld = async () => {
    try {
      const statusRes = await getFakuStatus();
      if (statusRes === 0 && fakuStatus === 0) {
        const response = await fakuGetOld(lpAddress, getOldNum);
        message.success(response === 0 ? "success" : "failed");
        setFakuStatus(response === 0 ? 1 : 0);
      } else {
        message.warning("faku is running");
      }
    } catch (error) {
      message.error('Operation failed');
      console.error(error);
    }
  };

  const toggleAiJob = async () => {
    try {
      setLoading(true);
      const endpoint = aiStatus === 1 ? stopAiJob : startAiJob;
      const response = await endpoint();
      message.success(response === 0 ? "Operation successful" : "Operation failed");
      setAiStatus(response === 0 ? (aiStatus === 1 ? 0 : 1) : aiStatus);
    } catch (error) {
      message.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSuiQuery = async () => {
    try {
      const balance = await getSuiBalance(suiAddress);
      const tokenBalances = await getSuiTokenBalances(suiAddress);
      setSuiBalance(balance);
      setSuiTokenBalances(tokenBalances);
    } catch (error) {
      message.error('Failed to fetch Sui balances');
    }
  };

  const handleHistoricalSuiQuery = async () => {
    try {
      const timestamp = Math.floor(Date.now() / 1000) - historicalTimestamp * 3600; // 转换为秒
      const balance = await getSuiBalanceAtTime(suiAddress, timestamp);
      const tokenBalances = await getSuiTokenBalancesAtTime(suiAddress, timestamp);
      setHistoricalSuiBalance(balance);
      setHistoricalSuiTokenBalances(tokenBalances);
    } catch (error) {
      message.error('Failed to fetch historical Sui balances');
    }
  };

  if (!isLoggedIn) {
    return null; // 或者显示加载状态
  }

  return (
    <StyledLayout>
      <StyledHeader>
        <Title level={4} style={{ margin: 0, color: 'var(--tg-theme-text-color)' }}>
          Faku Web
        </Title>
      </StyledHeader>
      
      <StyledContent>
        <LogoWrapper>
          <img width="64" src="./assets/logo.jpeg" alt="logo of faku" />
        </LogoWrapper>

        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card>
            <Space>
              <Button 
                type="primary" 
                icon={<ApiOutlined />} 
                onClick={testNet} 
                loading={loading}
              >
                Test Network
              </Button>
            </Space>
          </Card>
          <Card title="Ai Job Operations">
            <Space>
              <Button 
                type="primary" 
                onClick={toggleAiJob} 
                loading={loading}
              >
                {aiStatus === 1 ? "Stop Ai Job" : "Start Ai Job"}
              </Button>
              <Badge 
                status={aiStatus === 0 ? "default" : "processing"} 
                text={aiStatus === 0 ? "Stopped" : "Running"} 
              />
            </Space>
          </Card>
          <Card title="Faku Operations">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space wrap>
                <Input
                  value={num}
                  onChange={(e) => setNum(e.target.value)}
                  type="number"
                  min={1}
                  max={4}
                  style={{ width: 100 }}
                  placeholder="Number"
                />
                <Select 
                  value={isLp}
                  onChange={(value: string) => setIsLp(value)}
                  style={{ width: 120 }}
                >
                  <Select.Option value="true">从FAKU</Select.Option>
                  <Select.Option value="false">从LP</Select.Option>
                </Select>
                <Select 
                  value={level}
                  onChange={(value: string) => setLevel(value)}
                  style={{ width: 120 }}
                >
                  <Select.Option value="0">low</Select.Option>
                  <Select.Option value="1">med</Select.Option>
                  <Select.Option value="2">high</Select.Option>
                  <Select.Option value="3">extra</Select.Option>
                </Select>
              </Space>
              <Button 
                type="primary"
                icon={<RocketOutlined />}
                onClick={fakuOne}
                loading={loading}
              >
                Faku Once
              </Button>
              <Badge 
                status={fakuStatus === 0 ? "success" : "processing"} 
                text={fakuStatus === 0 ? "Idle" : "Running"} 
              />
            </Space>
          </Card>

          <Card title="Get Old">
            <Space>
              <Select 
                id="lpAddress"
                style={{ width: 200 }}
                onChange={(value: string) => setLpAddress(value)}
                value={lpAddress}
              >
                {LP_OPTIONS.map(option => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.name}
                  </Select.Option>
                ))}
              </Select>
              <Input
                value={getOldNum}
                onChange={(e) => setGetOldNum(e.target.value)}
                type="number"
                min={1}
                max={4}
                style={{ width: 100 }}
                placeholder="Number"
              />
              <Button 
                type="primary"
                onClick={getByOld}
                loading={loading}
              >
                Get Old
              </Button>
            </Space>
          </Card>

          <Card title="Wallet Balances">
            <Space direction="vertical" style={{ width: '100%' }}>
              {walletBalances.map((wallet, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography.Text ellipsis style={{ maxWidth: '200px' }}>
                    {wallet.address}
                  </Typography.Text>
                  <Typography.Text strong>
                    {wallet.balance.toFixed(4)} (Chain: {wallet.chain})
                  </Typography.Text>
                </div>
              ))}
              <Typography.Text strong>
                Total Balance: {totalBalance.toFixed(4)}
              </Typography.Text>
            </Space>
          </Card>

          {/* <Card title="Sui Balance Query">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                value={suiAddress}
                onChange={(e) => setSuiAddress(e.target.value)}
                placeholder="Enter Sui address"
              />
              <Button type="primary" onClick={handleSuiQuery}>
                Query Sui Balances
              </Button>
              {suiBalance && (
                <Typography.Text strong>
                  Main Balance: {suiBalance.totalBalance} SUI
                </Typography.Text>
              )}
              {suiTokenBalances.length > 0 && (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Typography.Text strong>Token Balances:</Typography.Text>
                  {suiTokenBalances.map((token, index) => (
                    <div key={index}>
                      <Typography.Text>
                        {token.coinType}: {token.totalBalance}
                      </Typography.Text>
                    </div>
                  ))}
                </Space>
              )}
              <Input
                type="number"
                value={historicalTimestamp}
                onChange={(e) => setHistoricalTimestamp(Number(e.target.value))}
                placeholder="Hours ago"
              />
              <Button type="primary" onClick={handleHistoricalSuiQuery}>
                Query Historical Sui Balances
              </Button>
              {historicalSuiBalance && (
                <Typography.Text strong>
                  Historical Main Balance: {historicalSuiBalance.totalBalance} SUI
                </Typography.Text>
              )}
              {historicalSuiTokenBalances.length > 0 && (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Typography.Text strong>Historical Token Balances:</Typography.Text>
                  {historicalSuiTokenBalances.map((token, index) => (
                    <div key={index}>
                      <Typography.Text>
                        {token.coinType}: {token.totalBalance}
                      </Typography.Text>
                    </div>
                  ))}
                </Space>
              )}
            </Space>
          </Card>

          <Card title="Historical Sui Balance Query">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                value={historicalTimestamp}
                onChange={(e) => setHistoricalTimestamp(Number(e.target.value))}
                type="number"
                placeholder="Enter historical timestamp (hours ago)"
              />
              <Button type="primary" onClick={handleHistoricalSuiQuery}>
                Query Historical Sui Balances
              </Button>
              {historicalSuiBalance && (
                <Typography.Text strong>
                  Historical Balance: {historicalSuiBalance.totalBalance} SUI
                </Typography.Text>
              )}
              {historicalSuiTokenBalances.length > 0 && (
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Typography.Text strong>Historical Token Balances:</Typography.Text>
                  {historicalSuiTokenBalances.map((token, index) => (
                    <div key={index}>
                      <Typography.Text>
                        {token.coinType}: {token.totalBalance}
                      </Typography.Text>
                    </div>
                  ))}
                </Space>
              )}
            </Space>
          </Card> */}
        </Space>
      </StyledContent>
    </StyledLayout>
  );
}

export default App; 