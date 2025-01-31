import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Layout, Card, Button, Input, Select, Space, Typography, Badge, message } from 'antd';
import { ReloadOutlined, ApiOutlined, RocketOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import './index.css';
import { OKXClient } from './services/okxClient';

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
  const [fakuStatus, setFakuStatus] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [lpAddress, setLpAddress] = useState<string>('');
  const [num, setNum] = useState<string>('');
  const [isLp, setIsLp] = useState<string>('true');
  const [level, setLevel] = useState<string>('0');
  const [walletBalances, setWalletBalances] = useState<{address: string; chain: string; balance: number}[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);

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
          }, 10000); // 10秒

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

  const testNet = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BASE_URL}/startBot`);
      message.success(response.data);
    } catch (error) {
      message.error('Network test failed');
    } finally {
      setLoading(false);
    }
  };

  const fakuOne = async () => {
    try {
      setLoading(true);
      const statusRes = await axios.get(`${BASE_URL}/getFakuStatus`);
      if (statusRes.data === 0 && fakuStatus === 0) {
        const response = await axios.post(
          `${BASE_URL}/fakuOnce/${num}/${isLp}/${level}`
        );
        message.success(response.data === 0 ? "Operation successful" : "Operation failed");
        setFakuStatus(response.data === 0 ? 1 : 0);
      } else {
        message.warning("Faku is running");
      }
    } catch (error) {
      message.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const getFakuStatus = async () => {
    const res = await axios.get(`${BASE_URL}/getFakuStatus`);
    return res.data;
  };

  const getByOld = async () => {
    try {
      const statusRes = await axios.get(`${BASE_URL}/getFakuStatus`);
      if (statusRes.data === 0 && fakuStatus === 0) {
        const response = await axios.post(
          `${BASE_URL}/fakuGetOld?lp=${lpAddress}`
        );
        message.success(response.data === 0 ? "success" : "failed");
        setFakuStatus(response.data === 0 ? 1 : 0);
      } else {
        message.warning("faku is running");
      }
    } catch (error) {
      message.error('Operation failed');
      console.error(error);
    }
  };

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
              <Badge 
                status={fakuStatus === 0 ? "success" : "processing"} 
                text={fakuStatus === 0 ? "Idle" : "Running"} 
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
            </Space>
          </Card>

          <Card title="Get Old">
            <Space>
              <Select 
                id="lpAddress"
                style={{ width: 200 }}
                onChange={(value: string) => setLpAddress(value)}
              >
                {LP_OPTIONS.map(option => (
                  <Select.Option key={option.value} value={option.value}>
                    {option.name}
                  </Select.Option>
                ))}
              </Select>
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
        </Space>
      </StyledContent>
    </StyledLayout>
  );
}

export default App; 