import React from 'react';
import { Card } from 'antd';
import styled from 'styled-components';
import UniLogTable from '../components/uniLog';
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

const UniPage: React.FC = () => {
  return (
    <PageContainer>
      <StyledCard title="Uniswap Log">
        <UniLogTable />
      </StyledCard>
    </PageContainer>
  );
};

export default UniPage;
