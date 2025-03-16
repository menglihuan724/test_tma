import React, { useEffect, useState } from 'react';
import { Card, Space, Typography, Spin, Button, Progress } from 'antd';
import styled from 'styled-components';
import { getMarketOverview, getFearAndGreedIndex, getFearAndGreedLevel, MarketData } from '../services/coinmarketClient';
import { ReloadOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const StyledCard = styled(Card)`
  width: 100%;
  .ant-card-body {
    padding: 12px;
  }
`;

const OverviewContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
  
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
`;

const MetricCard = styled(Card)`
  text-align: center;
  .ant-card-body {
    padding: 12px;
  }
`;

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
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text>Extreme Fear</Text>
                  <Text>Fear</Text>
                  <Text>Neutral</Text>
                  <Text>Greed</Text>
                  <Text>Extreme Greed</Text>
                </div>
                <Text type="secondary" style={{ marginTop: '10px', display: 'block' }}>
                  Last updated: {new Date(fearAndGreedData.timestamp).toLocaleString()}
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