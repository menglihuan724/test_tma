import React from 'react';
import { Drawer, Menu } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { navigationItems, getNavKeyByPath } from '../config/navigation';
import { colors } from '../config/theme';

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid ${colors.borderLight};
`;

const LogoImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
`;

const LogoText = styled.span`
  font-size: 20px;
  font-weight: 600;
  color: ${colors.textPrimary};
`;

const StyledMenu = styled(Menu)`
  background: transparent !important;
  border-right: none !important;
  padding: 8px 0;

  .ant-menu-item {
    margin: 4px 8px !important;
    border-radius: 8px !important;
    height: 52px !important;
    line-height: 52px !important;
    
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
    font-size: 20px !important;
  }

  .ant-menu-title-content {
    font-size: 16px;
    font-weight: 500;
  }
`;

interface MobileDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const MobileDrawer: React.FC<MobileDrawerProps> = ({ visible, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const selectedKey = getNavKeyByPath(location.pathname);

  const handleMenuClick = (key: string) => {
    const item = navigationItems.find(nav => nav.key === key);
    if (item) {
      navigate(item.path);
      onClose();
    }
  };

  const menuItems = navigationItems.map(item => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
  }));

  return (
    <Drawer
      placement="left"
      open={visible}
      onClose={onClose}
      width={280}
      closable={false}
      styles={{
        body: {
          padding: 0,
          background: colors.bgSecondary,
        },
        header: {
          display: 'none',
        },
      }}
    >
      <DrawerHeader>
        <LogoImage src="/assets/logo.jpeg" alt="Faku Logo" />
        <LogoText>Faku</LogoText>
      </DrawerHeader>
      <StyledMenu
        mode="inline"
        theme="dark"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => handleMenuClick(key)}
      />
    </Drawer>
  );
};

export default MobileDrawer;
