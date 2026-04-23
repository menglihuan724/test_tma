import React from 'react';
import { Card, Space } from 'antd';
import styled from 'styled-components';
import ConfluxWallet from '../components/conflux';
import EventListener from '../components/claimeventList';
import UserList from '../components/userList';
import CreateAccount from '../components/createAccount';
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

const CfxPage: React.FC = () => {
  return (
    <PageContainer>
      <StyledCard title="CONNECT">
        <ConfluxWallet />
      </StyledCard>
      <StyledCard title="Account Management">
        <CreateAccount />
      </StyledCard>
      <EventListener />
      <UserList />
    </PageContainer>
  );
};

export default CfxPage;
