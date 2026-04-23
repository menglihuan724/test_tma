import React from 'react';
import { Button, Typography } from 'antd';
import { MenuOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import { colors, layout } from '../config/theme';
import { useResponsive } from '../hooks/useResponsive';

const { Title } = Typography;

const TopBarContainer = styled.header`
  height: ${layout.topBarHeight}px;
  background: ${colors.bgSecondary};
  border-bottom: 1px solid ${colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  backdrop-filter: blur(8px);
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const MenuButton = styled(Button)`
  color: ${colors.textPrimary} !important;
  border: none !important;
  background: transparent !important;
  
  &:hover {
    background: rgba(245, 158, 11, 0.1) !important;
    color: ${colors.primary} !important;
  }
`;

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const LogoImage = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
`;

const StyledTitle = styled(Title)`
  margin: 0 !important;
  color: ${colors.textPrimary} !important;
  font-size: 18px !important;
  font-weight: 600 !important;

  @media (max-width: 576px) {
    font-size: 16px !important;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

interface TopBarProps {
  onMenuClick?: () => void;
  collapsed?: boolean;
  onCollapseToggle?: () => void;
  showCollapseButton?: boolean;
}

const TopBar: React.FC<TopBarProps> = ({
  onMenuClick,
  collapsed,
  onCollapseToggle,
  showCollapseButton = false,
}) => {
  const { isMobile } = useResponsive();

  return (
    <TopBarContainer>
      <LeftSection>
        {isMobile ? (
          <MenuButton
            type="text"
            icon={<MenuOutlined style={{ fontSize: 20 }} />}
            onClick={onMenuClick}
          />
        ) : showCollapseButton ? (
          <MenuButton
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined style={{ fontSize: 20 }} /> : <MenuFoldOutlined style={{ fontSize: 20 }} />}
            onClick={onCollapseToggle}
          />
        ) : null}
        
        {isMobile && (
          <LogoSection>
            <LogoImage src="/assets/logo.jpeg" alt="Faku Logo" />
            <StyledTitle level={4}>Faku</StyledTitle>
          </LogoSection>
        )}
      </LeftSection>

      <RightSection>
        {/* Future: User avatar, theme toggle, notifications, etc. */}
      </RightSection>
    </TopBarContainer>
  );
};

export default TopBar;
