import React, { useEffect, useState } from 'react';
import {
  Card,
  Button,
  Input,
  Select,
  Space,
  Typography,
  Badge,
  message,
  Spin,
} from 'antd';
import { ReloadOutlined, ApiOutlined, RocketOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import {
  fakuOnce,
  getFakuStatus,
  fakuGetOld,
  startAiJob,
  stopAiJob,
  getAiStatus,
} from '../services/fakuClient';
import env from '../config/env';
import { getFakuClient, getOkxClient } from '../services/clientManager';
import { colors } from '../config/theme';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const StyledCard = styled(Card)`
  background: ${colors.bgTertiary} !important;
  border: 1px solid ${colors.borderLight} !important;
  border-radius: 12px !important;

  .ant-card-head {
    border-bottom: 1px solid ${colors.borderLight};
    color: ${colors.textPrimary};
  }

  .ant-card-head-title {
    color: ${colors.textPrimary};
  }
`;

const BalanceRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 0;
  border-bottom: 1px solid ${colors.borderLight};

  &:last-child {
    border-bottom: none;
  }

  @media (min-width: 768px) {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
  }
`;

const AddressText = styled(Typography.Text)`
  font-size: 13px;
  color: ${colors.textSecondary} !important;
  word-break: break-all;
`;

const BalanceText = styled(Typography.Text)`
  font-size: 15px;
  font-weight: 600 !important;
  color: ${colors.textPrimary} !important;
`;

const HomePage: React.FC = () => {
  const LP_OPTIONS = env.VITE_LP_OPTIONS;
  const WALLETS = env.VITE_WALLETS;

  const [fakuStatus, setFakuStatus] = useState(0);
  const [loading, setLoading] = useState(false);
  const [lpAddress, setLpAddress] = useState<string>(LP_OPTIONS[0]?.value || '');
  const [num, setNum] = useState<string>('1');
  const [isLp, setIsLp] = useState<string>('true');
  const [level, setLevel] = useState<string>('0');
  const [walletBalances, setWalletBalances] = useState<
    { address: string; chain: string; balance: number }[]
  >([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [getOldNum, setGetOldNum] = useState<string>('2');
  const [aiStatus, setAiStatus] = useState<number>(0);
  const [cflBalances, setCflBalances] = useState<
    { address: string; balance: string; value: number }[]
  >([]);
  const [loadingCfl, setLoadingCfl] = useState(false);
  const [cflTotalBalance, setCflTotalBalance] = useState<number>(0);
  const [cflPrice, setCflPrice] = useState<number>(0);
  const [loadingWalletBalances, setLoadingWalletBalances] = useState(false);

  // Status polling
  useEffect(() => {
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
      console.error('Error fetching balances:', error);
      message.error('Failed to fetch wallet balances');
    } finally {
      setLoadingWalletBalances(false);
    }
  };

  useEffect(() => {
    fetchBalances();
    const balanceInterval = setInterval(fetchBalances, 60000 * 5);
    return () => clearInterval(balanceInterval);
  }, []);

  useEffect(() => {
    const fetchAiStatus = async () => {
      const status: number = await getAiStatus();
      setAiStatus(status);
    };

    fetchAiStatus();
    const interval = setInterval(fetchAiStatus, 24000);
    return () => clearInterval(interval);
  }, []);

  const handleTestNet = async () => {
    try {
      setLoading(true);
      const client = getFakuClient();
      const result = await client.get('/startBot');
      message.success(result.data);
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
        message.success(
          response === 0 ? 'Operation successful' : 'Operation failed'
        );
        setFakuStatus(response === 0 ? 1 : 0);
      } else {
        message.warning('Faku is running');
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
        message.success(response === 0 ? 'success' : 'failed');
        setFakuStatus(response === 0 ? 1 : 0);
      } else {
        message.warning('faku is running');
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
      message.success(
        response === 0 ? 'Operation successful' : 'Operation failed'
      );
      setAiStatus(response === 0 ? (aiStatus === 1 ? 0 : 1) : aiStatus);
    } catch (error) {
      message.error('Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchCflBalances = async () => {
    try {
      setLoadingCfl(true);
      const client = getOkxClient();

      const balances = await Promise.all(
        env.VITE_FAKU_LP.map(async (address: string) => {
          const tokenBalance = await client.getSpecificTokenBalance(
            address,
            '1030',
            'CFL'
          );
          return {
            address,
            balance: tokenBalance?.balance || '0',
            value: tokenBalance?.value || 0,
            price: tokenBalance?.price || 0,
          };
        })
      );

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
      console.error('Error fetching CFL balances:', error);
      message.error('Failed to fetch CFL balances');
    } finally {
      setLoadingCfl(false);
    }
  };

  useEffect(() => {
    fetchCflBalances();
    const cflInterval = setInterval(fetchCflBalances, 60000 * 5);
    return () => clearInterval(cflInterval);
  }, []);

  return (
    <PageContainer>
      <StyledCard>
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
      </StyledCard>

      <StyledCard title="AI Job Operations">
        <Space>
          <Button type="primary" onClick={toggleAiJob} loading={loading}>
            {aiStatus === 1 ? 'Stop Ai Job' : 'Start Ai Job'}
          </Button>
          <Badge
            status={aiStatus === 0 ? 'default' : 'processing'}
            text={aiStatus === 0 ? 'Stopped' : 'Running'}
          />
        </Space>
      </StyledCard>

      <StyledCard title="Faku Operations">
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
            status={fakuStatus === 0 ? 'success' : 'processing'}
            text={fakuStatus === 0 ? 'Idle' : 'Running'}
          />
        </Space>
      </StyledCard>

      <StyledCard title="Get Old">
        <Space wrap>
          <Select
            id="lpAddress"
            style={{ width: 200 }}
            onChange={(value: string) => setLpAddress(value)}
            value={lpAddress}
          >
            {LP_OPTIONS.map((option: any) => (
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
      </StyledCard>

      <StyledCard title="Wallet Balances">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchBalances}
            loading={loadingWalletBalances}
            style={{ marginBottom: '10px' }}
          />
          {loadingWalletBalances && <Spin />}
          {walletBalances.map((wallet, index) => (
            <BalanceRow key={index}>
              <AddressText>
                {wallet.address}
              </AddressText>
              <BalanceText>
                ${wallet.balance.toFixed(2)}
              </BalanceText>
            </BalanceRow>
          ))}
          <BalanceText style={{ marginTop: 8, display: 'block' }}>
            Total: ${totalBalance.toFixed(2)}
          </BalanceText>
        </Space>
      </StyledCard>

      <StyledCard title="FAKU LP CFL Balances">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            onClick={fetchCflBalances}
            loading={loadingCfl}
          />
          {loadingCfl && <Spin />}
          {!loadingCfl && cflBalances.length === 0 && (
            <Typography.Text>No CFL tokens found</Typography.Text>
          )}
          {cflPrice > 0 && (
            <Typography.Text strong style={{ color: colors.info }}>
              CFL Price: ${cflPrice.toFixed(6)}
            </Typography.Text>
          )}
          {cflBalances.map((item, index) => (
            <BalanceRow key={index}>
              <AddressText>
                {item.address}
              </AddressText>
              <BalanceText>
                {parseFloat(item.balance).toFixed(4)} CFL (${item.value.toFixed(2)})
              </BalanceText>
            </BalanceRow>
          ))}
          {cflTotalBalance > 0 && (
            <div
              style={{
                marginTop: '10px',
                borderTop: `1px solid ${colors.borderLight}`,
                paddingTop: '10px',
              }}
            >
              <Typography.Text strong style={{ fontSize: '16px' }}>
                Total: {cflTotalBalance.toFixed(4)} CFL ($
                {(cflTotalBalance * cflPrice).toFixed(2)})
              </Typography.Text>
            </div>
          )}
        </Space>
      </StyledCard>
    </PageContainer>
  );
};

export default HomePage;
