import React from 'react';
import { Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { navigationItems, getNavKeyByPath } from '../config/navigation';
import { colors, layout } from '../config/theme';

const SidebarContainer = styled.div<{ $collapsed: boolean }>`
  width: ${props => props.$collapsed ? layout.sidebarCollapsedWidth : layout.sidebarWidth}px;
  min-width: ${props => props.$collapsed ? layout.sidebarCollapsedWidth : layout.sidebarWidth}px;
  height: calc(100vh - ${layout.topBarHeight}px);
  background: ${colors.bgSecondary};
  border-right: 1px solid ${colors.borderLight};
  position: fixed;
  left: 0;
  top: ${layout.topBarHeight}px;
  overflow-y: auto;
  overflow-x: hidden;
  transition: all 0.2s ease;
  z-index: 100;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${colors.borderMedium};
    border-radius: 2px;
  }
`;

const LogoSection = styled.div<{ $collapsed: boolean }>`
  padding: ${props => props.$collapsed ? '16px 8px' : '16px 24px'};
  border-bottom: 1px solid ${colors.borderLight};
  display: flex;
  align-items: center;
  justify-content: ${props => props.$collapsed ? 'center' : 'flex-start'};
  gap: 12px;
`;

const LogoImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
`;

const LogoText = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.textPrimary};
  white-space: nowrap;
`;

const StyledMenu = styled(Menu)`
  background: transparent !important;
  border-right: none !important;
  padding: 8px 0;

  .ant-menu-item {
    margin: 4px 8px !important;
    border-radius: 8px !important;
    height: 48px !important;
    line-height: 48px !important;
    
    &:hover {
      background: rgba(245, 158, 11, 0.1) !important;
    }

    &.ant-menu-item-selected {
      background: rgba(245, 158, 11, 0.15) !important;
      
      &::after {
        display: none;
      }
    }
  }

  .ant-menu-item-icon {
    font-size: 18px !important;
  }

  .ant-menu-title-content {
    font-size: 14px;
    font-weight: 500;
  }
`;

interface SidebarProps {
  collapsed?: boolean;
  onMenuClick?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed = false, onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = getNavKeyByPath(location.pathname);

  const handleMenuClick = (key: string) => {
    const item = navigationItems.find(nav => nav.key === key);
    if (item) {
      navigate(item.path);
      onMenuClick?.();
    }
  };

  const menuItems = navigationItems.map(item => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
  }));

  return (
    <SidebarContainer $collapsed={collapsed}>
      <LogoSection $collapsed={collapsed}>
        <LogoImage src="/assets/logo.jpeg" alt="Faku Logo" />
        {!collapsed && <LogoText>Faku</LogoText>}
      </LogoSection>
      <StyledMenu
        mode="inline"
        theme="dark"
        selectedKeys={[selectedKey]}
        inlineCollapsed={collapsed}
        items={menuItems}
        onClick={({ key }) => handleMenuClick(key)}
      />
    </SidebarContainer>
  );
};

export default Sidebar;
