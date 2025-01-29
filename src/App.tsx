import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Layout, Card, Button, Input, Select, Space, Typography, Badge, message } from 'antd';
import { ReloadOutlined, ApiOutlined, RocketOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import './index.css';

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

const BASE_URL = "https://faku.cflpool.io";

function App() {
  const [fakuStatus, setFakuStatus] = useState(0);
  const [loading, setLoading] = useState(false);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [isExpanded, setIsExpanded] = useState(false);
  const [lpAddress, setLpAddress] = useState<string>('');
  const [num, setNum] = useState<string>('');
  const [isLp, setIsLp] = useState<string>('true');
  const [level, setLevel] = useState<string>('0');

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
                <Select.Option value="0x943b9b4718826ea7023f79c66e0d40bebbcde22f">
                  LP Old
                </Select.Option>
                <Select.Option value="0x41279398385c7543eaC6d3471650D5a404c904A9">
                  LP New
                </Select.Option>
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
        </Space>
      </StyledContent>
    </StyledLayout>
  );
}

export default App; 