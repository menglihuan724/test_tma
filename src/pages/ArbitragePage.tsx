import React from 'react';
import styled from 'styled-components';
import PolymarketArbitrage from '../components/PolymarketArbitrage';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const ArbitragePage: React.FC = () => {
  return (
    <PageContainer>
      <PolymarketArbitrage />
    </PageContainer>
  );
};

export default ArbitragePage;
