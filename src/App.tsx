import React, { useEffect, useState } from "react";
import {
  Layout,
  Card,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Badge,
  message,
  Tabs,
  Spin,
} from "antd";
import { ReloadOutlined, ApiOutlined, RocketOutlined } from "@ant-design/icons";
import styled from "styled-components";
import "./index.css";
import { OKXClient } from "./services/okxClient";
import { useNavigate } from "react-router-dom";
// import { getSuiBalance, getSuiTokenBalances, getSuiBalanceAtTime, getSuiTokenBalancesAtTime } from './services/suiClient';
import {
  testNet,
  fakuOnce,
  getFakuStatus,
  fakuGetOld,
  startAiJob,
  stopAiJob,
  getAiStatus,
} from "./services/fakuClient";
import env from "./config/env";
// import IpOperations from './components/story';
import ConfluxWallet from "./components/conflux";
import EventListener from "./components/claimeventList";
import UserList from "./components/userList";
import CreateAccount from "./components/createAccount";
import MarketOverview from "./components/marketOverview";
import UniLogTable from "./components/uniLog";
import PolymarketArbitrage from "./components/PolymarketArbitrage";
import AaveMonitor from "./components/AaveMonitor";
import { getFakuClient, getOkxClient } from "./services/clientManager";

const { Header, Content } = Layout;
const { Title } = Typography;
const { TabPane } = Tabs;

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
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

declare global {
  interface Window {
    Telegram: any;
    eruda: any;
  }
}

function App() {
  const LP_OPTIONS = env.VITE_LP_OPTIONS;
  const WALLETS = env.VITE_WALLETS;
  const history = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [fakuStatus, setFakuStatus] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [lpAddress, setLpAddress] = useState<string>(LP_OPTIONS[0].value || "");
  const [num, setNum] = useState<string>("1");
  const [isLp, setIsLp] = useState<string>("true");
  const [level, setLevel] = useState<string>("0");
  const [walletBalances, setWalletBalances] = useState<
    { address: string; chain: string; balance: number }[]
  >([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [getOldNum, setGetOldNum] = useState<string>("2");
  const [aiStatus, setAiStatus] = useState<number>(0); // 0: stopped, 1: running
  const [suiAddress, setSuiAddress] = useState<string>("");
  const [suiBalance, setSuiBalance] = useState<any>(null);
  const [suiTokenBalances, setSuiTokenBalances] = useState<any[]>([]);
  const [historicalTimestamp, setHistoricalTimestamp] = useState<number>(0);
  const [historicalSuiBalance, setHistoricalSuiBalance] = useState<any>(null);
  const [historicalSuiTokenBalances, setHistoricalSuiTokenBalances] = useState<
    any[]
  >([]);
  const [cflBalances, setCflBalances] = useState<
    { address: string; balance: string; value: number }[]
  >([]);
  const [loadingCfl, setLoadingCfl] = useState(false);
  const [cflTotalBalance, setCflTotalBalance] = useState<number>(0);
  const [cflPrice, setCflPrice] = useState<number>(0);
  const [loadingWalletBalances, setLoadingWalletBalances] = useState(false);

  useEffect(() => {
    const checkLogin = () => {
      const loggedIn = localStorage.getItem("isLoggedIn") === "true";
      if (!loggedIn) {
        history("/login");
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

  const fetchBalances = async () => {
    try {
      setLoadingWalletBalances(true);
      const client = getOkxClient();
      const balances = await Promise.all(
        WALLETS.map(async (wallet: any) => {
          const balance = await client.queryTotalValue(
            wallet.address,
            wallet.chains
          );
          return {
            address: wallet.address,
            chain: wallet.chains,
            balance,
          };
        })
      );
      setWalletBalances(balances);
      const total = balances.reduce((sum, item) => sum + item.balance, 0);
      setTotalBalance(total);
    } catch (error) {
      console.error("Error fetching balances:", error);
      message.error("Failed to fetch wallet balances");
    } finally {
      setLoadingWalletBalances(false);
    }
  };

  useEffect(() => {
    fetchBalances();

    // 将刷新间隔改为 5 分钟
    const balanceInterval = setInterval(fetchBalances, 60000 * 5);

    return () => {
      clearInterval(balanceInterval);
    };
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    // 立即执行一次
    const fetchAiStatus = async () => {
      const status: number = await getAiStatus();
      setAiStatus(status);
    };

    fetchAiStatus();

    // 设置定时器，每24秒执行一次
    interval = setInterval(fetchAiStatus, 24000);

    // 清除定时器
    return () => clearInterval(interval);
  }, []);

  const handleTestNet = async () => {
    try {
      setLoading(true);
      const client = getFakuClient();
      const result = await client.get("/startBot");
      message.success(result.data);
    } catch (error) {
      message.error("Network test failed");
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
        message.success(
          response === 0 ? "Operation successful" : "Operation failed"
        );
        setFakuStatus(response === 0 ? 1 : 0);
      } else {
        message.warning("Faku is running");
      }
    } catch (error) {
      message.error("Operation failed");
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
      message.error("Operation failed");
      console.error(error);
    }
  };

  const toggleAiJob = async () => {
    try {
      setLoading(true);
      const endpoint = aiStatus === 1 ? stopAiJob : startAiJob;
      const response = await endpoint();
      message.success(
        response === 0 ? "Operation successful" : "Operation failed"
      );
      setAiStatus(response === 0 ? (aiStatus === 1 ? 0 : 1) : aiStatus);
    } catch (error) {
      message.error("Operation failed");
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
      message.error("Failed to fetch Sui balances");
    }
  };

  const handleHistoricalSuiQuery = async () => {
    try {
      const timestamp =
        Math.floor(Date.now() / 1000) - historicalTimestamp * 3600; // 转换为秒
      const balance = await getSuiBalanceAtTime(suiAddress, timestamp);
      const tokenBalances = await getSuiTokenBalancesAtTime(
        suiAddress,
        timestamp
      );
      setHistoricalSuiBalance(balance);
      setHistoricalSuiTokenBalances(tokenBalances);
    } catch (error) {
      message.error("Failed to fetch historical Sui balances");
    }
  };
  const fetchCflBalances = async () => {
    try {
      setLoadingCfl(true);
      const client = getOkxClient();

      // 获取 VITE_FAKU_LP 中所有地址的 CFL 代币余额
      const balances = await Promise.all(
        env.VITE_FAKU_LP.map(async (address) => {
          // 假设 CFL 代币在 Conflux 链上，链 ID 为 1030
          const tokenBalance = await client.getSpecificTokenBalance(
            address,
            "1030",
            "CFL"
          );
          return {
            address,
            balance: tokenBalance?.balance || "0",
            value: tokenBalance?.value || 0,
            price: tokenBalance?.price || 0,
          };
        })
      );

      // 计算总余额和获取价格
      let totalBalance = 0;
      let price = 0;

      balances.forEach((item) => {
        totalBalance += parseFloat(item.balance);
        if (item.price > 0 && price === 0) {
          price = item.price;
        }
      });

      setCflBalances(balances);
      setCflTotalBalance(totalBalance);
      setCflPrice(price);
    } catch (error) {
      console.error("Error fetching CFL balances:", error);
      message.error("Failed to fetch CFL balances");
    } finally {
      setLoadingCfl(false);
    }
  };

  useEffect(() => {
    fetchCflBalances();

    const cflInterval = setInterval(fetchCflBalances, 60000 * 5); // 每分钟刷新一次

    return () => {
      clearInterval(cflInterval);
    };
  }, []);

  if (!isLoggedIn) {
    return null; // 或者显示加载状态
  }

  return (
    <StyledLayout>
      <StyledHeader>
        <Title
          level={4}
          style={{ margin: 0, color: "var(--tg-theme-text-color)" }}
        >
          Faku Web
        </Title>
      </StyledHeader>

      <StyledContent>
        <LogoWrapper>
          <img width="64" src="./assets/logo.jpeg" alt="logo of faku" />
        </LogoWrapper>

        <Tabs defaultActiveKey="home">
          <TabPane tab="Home" key="home">
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Card>
                <Space>
                  <Button
                    type="primary"
                    icon={<ApiOutlined />}
                    onClick={handleTestNet}
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
                <Space direction="vertical" style={{ width: "100%" }}>
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
                    {LP_OPTIONS.map((option) => (
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
                  <Button type="primary" onClick={getByOld} loading={loading}>
                    Get Old
                  </Button>
                </Space>
              </Card>

              <Card title="Wallet Balances">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={fetchBalances}
                    loading={loadingWalletBalances}
                    style={{ marginBottom: "10px" }}
                  ></Button>
                  {loadingWalletBalances && <Spin />}
                  {walletBalances.map((wallet, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography.Text ellipsis style={{ maxWidth: "200px" }}>
                        {wallet.address}
                      </Typography.Text>
                      <Typography.Text strong>
                        {wallet.balance.toFixed(2)} (Chain: {wallet.chain})
                      </Typography.Text>
                    </div>
                  ))}
                  <Typography.Text strong>
                    Total Balance: {totalBalance.toFixed(2)}
                  </Typography.Text>
                </Space>
              </Card>

              <Card title="FAKU LP CFL Balances">
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={fetchCflBalances}
                    loading={loadingCfl}
                  ></Button>
                  {loadingCfl && <Spin />}
                  {!loadingCfl && cflBalances.length === 0 && (
                    <Typography.Text>No CFL tokens found</Typography.Text>
                  )}
                  {cflPrice > 0 && (
                    <Typography.Text strong style={{ color: "#1890ff" }}>
                      CFL Price: ${cflPrice.toFixed(6)}
                    </Typography.Text>
                  )}
                  {cflBalances.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography.Text ellipsis style={{ maxWidth: "200px" }}>
                        {item.address}
                      </Typography.Text>
                      <Typography.Text strong>
                        {parseFloat(item.balance).toFixed(4)} CFL ($
                        {item.value.toFixed(2)})
                      </Typography.Text>
                    </div>
                  ))}
                  {cflTotalBalance > 0 && (
                    <div
                      style={{
                        marginTop: "10px",
                        borderTop: "1px solid #f0f0f0",
                        paddingTop: "10px",
                      }}
                    >
                      <Typography.Text strong style={{ fontSize: "16px" }}>
                        Total: {cflTotalBalance.toFixed(4)} CFL ($
                        {(cflTotalBalance * cflPrice).toFixed(2)})
                      </Typography.Text>
                    </div>
                  )}
                </Space>
              </Card>
            </Space>
          </TabPane>

          <TabPane tab="CFX" key="cfx">
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Card title="CONNECT">
                <ConfluxWallet />
              </Card>
              <Card title="Account Management">
                <CreateAccount />
              </Card>
              <EventListener />
              <UserList />
            </Space>
          </TabPane>

          <TabPane tab="UNI" key="uni_log">
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Card title="uni_log">
                <UniLogTable />
              </Card>
            </Space>
          </TabPane>

          <TabPane tab="SUI" key="sui">
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <Card title="SUI Operations">
                <Typography.Text>SUI content coming soon...</Typography.Text>
              </Card>
            </Space>
          </TabPane>

          <TabPane tab="Market" key="market">
            <Space direction="vertical" size="large" style={{ width: "100%" }}>
              <MarketOverview />
            </Space>
          </TabPane>

          <TabPane tab="Arbitrage" key="arbitrage">
            <PolymarketArbitrage />
          </TabPane>

          <TabPane tab="AAVE" key="aave">
            <AaveMonitor />
          </TabPane>

          {/* <TabPane tab="IP" key="ip">
            <IpOperations />
          </TabPane> */}
        </Tabs>
      </StyledContent>
    </StyledLayout>
  );
}

export default App;
