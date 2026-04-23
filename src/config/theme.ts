import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

// Check if running in Telegram WebApp
export const isTelegram = typeof window !== 'undefined' && !!(window as any).Telegram?.WebApp;

// Primary Colors (Gold)
export const colors = {
  primary: '#F59E0B',
  primaryDark: '#D97706',
  primaryLight: '#FBBF24',
  primaryHover: '#EAB308',

  // Background Colors (Dark Theme)
  bgPrimary: '#0F172A',
  bgSecondary: '#1E293B',
  bgTertiary: '#334155',
  bgElevated: '#475569',

  // Text Colors
  textPrimary: '#F1F5F9',
  textSecondary: '#CBD5E1',
  textDisabled: '#64748B',
  textPlaceholder: '#94A3B8',

  // Functional Colors
  success: '#10B981',
  successBg: 'rgba(16, 185, 129, 0.1)',
  warning: '#F59E0B',
  warningBg: 'rgba(245, 158, 11, 0.1)',
  error: '#EF4444',
  errorBg: 'rgba(239, 68, 68, 0.1)',
  info: '#3B82F6',
  infoBg: 'rgba(59, 130, 246, 0.1)',

  // Border Colors
  borderLight: 'rgba(255, 255, 255, 0.1)',
  borderMedium: 'rgba(255, 255, 255, 0.2)',
  borderPrimary: 'rgba(245, 158, 11, 0.3)',

  // Shadow
  shadowLight: '0 2px 8px rgba(0, 0, 0, 0.15)',
  shadowMedium: '0 4px 16px rgba(0, 0, 0, 0.2)',
  shadowHeavy: '0 8px 32px rgba(0, 0, 0, 0.3)',
};

// Responsive Breakpoints
export const breakpoints = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
};

// Layout Dimensions
export const layout = {
  sidebarWidth: 240,
  sidebarCollapsedWidth: 80,
  topBarHeight: 64,
  contentMaxWidth: 1400,
  contentPadding: {
    xs: 16,
    sm: 16,
    md: 24,
    lg: 24,
    xl: 32,
  },
};

// Ant Design Theme Configuration
export const antdThemeConfig: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    // Primary Colors
    colorPrimary: colors.primary,
    colorPrimaryHover: colors.primaryHover,
    colorPrimaryActive: colors.primaryDark,

    // Background Colors
    colorBgContainer: colors.bgSecondary,
    colorBgElevated: colors.bgTertiary,
    colorBgLayout: colors.bgPrimary,
    colorBgSpotlight: colors.bgElevated,

    // Text Colors
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textSecondary,
    colorTextDisabled: colors.textDisabled,
    colorTextPlaceholder: colors.textPlaceholder,

    // Border
    colorBorder: colors.borderMedium,
    colorBorderSecondary: colors.borderLight,

    // Functional Colors
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorInfo: colors.info,

    // Typography
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSize: 14,

    // Border Radius
    borderRadius: 8,
    borderRadiusLG: 12,
    borderRadiusSM: 6,

    // Motion
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
  },
  components: {
    Layout: {
      headerBg: colors.bgSecondary,
      bodyBg: colors.bgPrimary,
      siderBg: colors.bgSecondary,
    },
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemSelectedBg: 'rgba(245, 158, 11, 0.15)',
      darkItemHoverBg: 'rgba(245, 158, 11, 0.1)',
      darkItemSelectedColor: colors.primary,
      itemHeight: 48,
      iconSize: 18,
    },
    Card: {
      colorBgContainer: colors.bgTertiary,
      colorBorderSecondary: colors.borderLight,
    },
    Table: {
      headerBg: colors.bgTertiary,
      rowHoverBg: 'rgba(245, 158, 11, 0.05)',
      headerColor: colors.textPrimary,
    },
    Button: {
      primaryShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
    },
    Input: {
      colorBgContainer: colors.bgTertiary,
      activeBorderColor: colors.primary,
      hoverBorderColor: colors.primaryLight,
    },
    Select: {
      colorBgContainer: colors.bgTertiary,
      optionSelectedBg: 'rgba(245, 158, 11, 0.15)',
    },
    Modal: {
      contentBg: colors.bgSecondary,
      headerBg: colors.bgSecondary,
    },
    Drawer: {
      colorBgElevated: colors.bgSecondary,
    },
  },
};

// CSS Variables for global styles
export const cssVariables = `
  :root {
    --color-primary: ${colors.primary};
    --color-primary-dark: ${colors.primaryDark};
    --color-primary-light: ${colors.primaryLight};
    
    --color-bg-primary: ${colors.bgPrimary};
    --color-bg-secondary: ${colors.bgSecondary};
    --color-bg-tertiary: ${colors.bgTertiary};
    
    --color-text-primary: ${colors.textPrimary};
    --color-text-secondary: ${colors.textSecondary};
    
    --color-success: ${colors.success};
    --color-warning: ${colors.warning};
    --color-error: ${colors.error};
    --color-info: ${colors.info};
    
    --color-border-light: ${colors.borderLight};
    --color-border-medium: ${colors.borderMedium};
    
    --sidebar-width: ${layout.sidebarWidth}px;
    --sidebar-collapsed-width: ${layout.sidebarCollapsedWidth}px;
    --topbar-height: ${layout.topBarHeight}px;
    --content-max-width: ${layout.contentMaxWidth}px;
  }
`;

export default {
  colors,
  breakpoints,
  layout,
  antdThemeConfig,
  cssVariables,
  isTelegram,
};
