import React, { useEffect, useState } from 'react';
import { Card, Space, Typography, Spin, Button, Progress } from 'antd';
import styled from 'styled-components';
import { getMarketOverview, getFearAndGreedIndex, getFearAndGreedLevel, MarketData } from '../services/coinmarketClient';
import { ReloadOutlined } from '@ant-design/icons';
import { colors } from '../config/theme';

const { Title, Text } = Typography;

const StyledCard = styled(Card)`
  width: 100%;
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

  .ant-card-body {
    padding: 16px;
  }
`;

const OverviewContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 16px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const SectionTitle = styled.h3`
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: bold;
  grid-column: 1 / -1;
  color: ${colors.textPrimary};
`;

const MetricCard = styled(Card)`
  text-align: center;
  background: ${colors.bgSecondary} !important;
  border: 1px solid ${colors.borderLight} !important;
  border-radius: 8px !important;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${colors.borderPrimary} !important;
    transform: translateY(-2px);
  }

  .ant-card-body {
    padding: 16px;
  }

  h4.ant-typography {
    color: ${colors.textSecondary} !important;
    font-size: 14px !important;
    margin-bottom: 8px !important;
  }
`;

const FearGreedLabels = styled.div`
  display: none;
  justify-content: space-between;
  font-size: 12px;
  color: ${colors.textSecondary};

  @media (min-width: 768px) {
    display: flex;
  }
`;

const formatTimestamp = (timestamp: number | string) => {
  if (!timestamp) return 'N/A';
  
  // Handle Unix timestamp (seconds)
  const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
  const date = ts > 1e12 ? new Date(ts) : new Date(ts * 1000);
  
  if (isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleString();
};

const formatCurrency = (value: number, decimals = 2) => {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(decimals)} T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(decimals)} B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(decimals)} M`;
  return `$${value.toFixed(decimals)}`;
};

const formatPercentage = (value: number) => {
  const color = value >= 0 ? 'green' : 'red';
  return <Text style={{ color }}>{value >= 0 ? '+' : ''}{value.toFixed(2)}%</Text>;
};

const getFearAndGreedColor = (value: number) => {
  if (value >= 0 && value <= 25) return '#E15241'; // Extreme Fear - Red
  if (value > 25 && value <= 45) return '#E78C3B'; // Fear - Orange
  if (value > 45 && value <= 55) return '#F2C94C'; // Neutral - Yellow
  if (value > 55 && value <= 75) return '#8BC34A'; // Greed - Light Green
  if (value > 75 && value <= 100) return '#4CAF50'; // Extreme Greed - Green
  return '#9E9E9E'; // Unknown - Gray
};

const MarketOverview: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [fearAndGreedData, setFearAndGreedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [marketOverview, fearAndGreed] = await Promise.all([
        getMarketOverview(),
        getFearAndGreedIndex()
      ]);
      
      setMarketData(marketOverview);
      setFearAndGreedData(fearAndGreed);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !marketData) {
    return (
      <StyledCard title="Market Overview">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
        </div>
      </StyledCard>
    );
  }

  return (
    <StyledCard 
      title="Market Overview" 
      extra={
        <Button 
          type="primary" 
          onClick={fetchData} 
          icon={<ReloadOutlined />}
          loading={loading}
        >
        </Button>
      }
    >
      {marketData && (
        <OverviewContainer>
          {/* Fear and Greed Index */}
          {fearAndGreedData && (
            <>
              <SectionTitle>Fear & Greed Index</SectionTitle>
              <MetricCard style={{ gridColumn: '1 / -1' }}>
                <Title level={4}>
                  {fearAndGreedData.value} - {fearAndGreedData.value_classification}
                </Title>
                <Progress 
                  percent={fearAndGreedData.value} 
                  showInfo={false}
                  strokeColor={getFearAndGreedColor(fearAndGreedData.value)}
                  style={{ margin: '20px 0' }}
                />
                <FearGreedLabels>
                  <Text>Extreme Fear</Text>
                  <Text>Fear</Text>
                  <Text>Neutral</Text>
                  <Text>Greed</Text>
                  <Text>Extreme Greed</Text>
                </FearGreedLabels>
                <Text type="secondary" style={{ marginTop: '10px', display: 'block', fontSize: '12px' }}>
                  Last updated: {formatTimestamp(fearAndGreedData.timestamp)}
                </Text>
              </MetricCard>
            </>
          )}
          
          {/* Market Cap Section */}
          <SectionTitle>Market Capitalization</SectionTitle>
          
          <MetricCard>
            <Title level={4}>Total Market Cap</Title>
            <Text strong>
              {formatCurrency(marketData.quote.USD.total_market_cap)}
            </Text>
            <div>
              {formatPercentage(marketData.quote.USD.total_market_cap_yesterday_percentage_change)}
            </div>
          </MetricCard>

          <MetricCard>
            <Title level={4}>Altcoin Market Cap</Title>
            <Text strong>
              {formatCurrency(marketData.quote.USD.altcoin_market_cap)}
            </Text>
          </MetricCard>

          <MetricCard>
            <Title level={4}>DeFi Market Cap</Title>
            <Text strong>
              {formatCurrency(marketData.quote.USD.defi_market_cap)}
            </Text>
          </MetricCard>

          {/* Volume Section */}
          <SectionTitle>Trading Volume (24h)</SectionTitle>
          
          <MetricCard>
            <Title level={4}>Total Volume</Title>
            <Text strong>
              {formatCurrency(marketData.quote.USD.total_volume_24h)}
            </Text>
            <div>
              {formatPercentage(marketData.quote.USD.total_volume_24h_yesterday_percentage_change)}
            </div>
          </MetricCard>

          <MetricCard>
            <Title level={4}>Yesterday Volume</Title>
            <Text strong>
              {formatCurrency(marketData.quote.USD.total_volume_24h_yesterday)}
            </Text>
          </MetricCard>

          <MetricCard>
            <Title level={4}>Altcoin Volume</Title>
            <Text strong>
              {formatCurrency(marketData.quote.USD.altcoin_volume_24h)}
            </Text>
          </MetricCard>

          <MetricCard>
            <Title level={4}>DeFi Volume</Title>
            <Text strong>
              {formatCurrency(marketData.quote.USD.defi_volume_24h)}
            </Text>
          </MetricCard>

          <MetricCard>
            <Title level={4}>Stablecoin Volume</Title>
            <Text strong>
              {formatCurrency(marketData.quote.USD.stablecoin_volume_24h)}
            </Text>
          </MetricCard>

          <MetricCard>
            <Title level={4}>Derivatives Volume</Title>
            <Text strong>
              {formatCurrency(marketData.quote.USD.derivatives_volume_24h)}
            </Text>
          </MetricCard>

          {/* Percentage Changes Section */}
          <SectionTitle>24h Changes</SectionTitle>
          
          <MetricCard>
            <Title level={4}>DeFi Change</Title>
            {formatPercentage(marketData.quote.USD.defi_24h_percentage_change)}
          </MetricCard>

          <MetricCard>
            <Title level={4}>Stablecoin Change</Title>
            {formatPercentage(marketData.quote.USD.stablecoin_24h_percentage_change)}
          </MetricCard>

          <MetricCard>
            <Title level={4}>Derivatives Change</Title>
            {formatPercentage(marketData.quote.USD.derivatives_24h_percentage_change)}
          </MetricCard>

          {/* Dominance Section */}
          <SectionTitle>Market Dominance</SectionTitle>
          
          <MetricCard>
            <Title level={4}>Bitcoin Dominance</Title>
            <Text strong>{marketData.btc_dominance.toFixed(2)}%</Text>
          </MetricCard>

          <MetricCard>
            <Title level={4}>ETH Dominance</Title>
            <Text strong>{marketData.eth_dominance.toFixed(2)}%</Text>
          </MetricCard>
        </OverviewContainer>
      )}
    </StyledCard>
  );
};

export default MarketOverview; 