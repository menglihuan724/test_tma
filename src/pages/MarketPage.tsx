import React from 'react';
import styled from 'styled-components';
import MarketOverview from '../components/marketOverview';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const MarketPage: React.FC = () => {
  return (
    <PageContainer>
      <MarketOverview />
    </PageContainer>
  );
};

export default MarketPage;
