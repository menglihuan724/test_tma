import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Layout } from 'antd';
import styled from 'styled-components';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import MobileDrawer from './MobileDrawer';
import { useResponsive } from '../hooks/useResponsive';
import { colors, layout } from '../config/theme';

const { Content } = Layout;

const StyledLayout = styled(Layout)`
  min-height: 100vh;
  background: ${colors.bgPrimary};
`;

const MainContent = styled(Content)<{ $isMobile: boolean; $collapsed: boolean }>`
  margin-left: ${props => props.$isMobile ? 0 : (props.$collapsed ? layout.sidebarCollapsedWidth : layout.sidebarWidth)}px;
  margin-top: ${layout.topBarHeight}px;
  padding: ${props => props.$isMobile ? '16px' : '24px'};
  min-height: calc(100vh - ${layout.topBarHeight}px);
  background: ${colors.bgPrimary};
  transition: margin-left 0.2s ease;
`;

const ContentWrapper = styled.div<{ $isMobile: boolean }>`
  max-width: ${props => props.$isMobile ? '100%' : `${layout.contentMaxWidth}px`};
  margin: 0 auto;
  width: 100%;
`;

interface AppLayoutProps {
  children?: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = () => {
  const { isMobile, isDesktop } = useResponsive();
  const navigate = useNavigate();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status
  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (!loggedIn) {
      navigate('/login');
    } else {
      setIsLoggedIn(true);
    }
  }, [navigate]);

  // Initialize Telegram WebApp
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) {
      const tg = (window as any).Telegram.WebApp;
      tg.ready();
      tg.setHeaderColor('secondary_bg_color');

      // Theme change handler
      tg.onEvent('themeChanged', () => {
        document.documentElement.className = tg.colorScheme;
      });

      // Main button setup
      tg.MainButton.setParams({
        text: 'Faku',
      });
      tg.MainButton.show();
    }
  }, []);

  const handleOpenDrawer = () => {
    setDrawerVisible(true);
  };

  const handleCloseDrawer = () => {
    setDrawerVisible(false);
  };

  const handleCollapseToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (!isLoggedIn) {
    return null;
  }

  return (
    <StyledLayout>
      <TopBar
        onMenuClick={handleOpenDrawer}
        collapsed={sidebarCollapsed}
        onCollapseToggle={handleCollapseToggle}
        showCollapseButton={!isMobile}
      />

      {!isMobile && <Sidebar collapsed={sidebarCollapsed} />}

      {isMobile && (
        <MobileDrawer visible={drawerVisible} onClose={handleCloseDrawer} />
      )}

      <MainContent $isMobile={isMobile} $collapsed={sidebarCollapsed}>
        <ContentWrapper $isMobile={isMobile}>
          <Outlet />
        </ContentWrapper>
      </MainContent>
    </StyledLayout>
  );
};

export default AppLayout;
