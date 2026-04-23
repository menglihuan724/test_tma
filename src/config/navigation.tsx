import React from 'react';
import {
  HomeOutlined,
  WalletOutlined,
  SwapOutlined,
  DollarOutlined,
  LineChartOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';

export interface NavItem {
  key: string;
  path: string;
  label: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

export const navigationItems: NavItem[] = [
  {
    key: 'home',
    path: '/app/home',
    label: 'Home',
    icon: <HomeOutlined />,
  },
  {
    key: 'cfx',
    path: '/app/cfx',
    label: 'Conflux',
    icon: <WalletOutlined />,
  },
  {
    key: 'uni',
    path: '/app/uni',
    label: 'Uniswap',
    icon: <SwapOutlined />,
  },
  {
    key: 'sui',
    path: '/app/sui',
    label: 'Sui',
    icon: <DollarOutlined />,
  },
  {
    key: 'market',
    path: '/app/market',
    label: 'Market',
    icon: <LineChartOutlined />,
  },
  {
    key: 'arbitrage',
    path: '/app/arbitrage',
    label: 'Arbitrage',
    icon: <ThunderboltOutlined />,
  },
];

// Helper function to get navigation item by path
export const getNavItemByPath = (path: string): NavItem | undefined => {
  return navigationItems.find(item => path.startsWith(item.path));
};

// Helper function to get navigation key by path
export const getNavKeyByPath = (path: string): string => {
  const item = getNavItemByPath(path);
  return item?.key || 'home';
};

export default navigationItems;
