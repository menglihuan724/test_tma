import React, { useEffect, useState, useMemo } from 'react';
import { 
  Table, 
  Select, 
  Input, 
  Space, 
  Card,
  Button,
  message,
  Tag,
  Progress,
  Statistic,
  Row,
  Col
} from 'antd';
import { confluxESpace } from 'viem/chains';
import { createPublicClient, http, readContract } from 'viem';
import { formatEther } from 'viem';
import type { Address } from 'viem';
import styled from 'styled-components';
import env from '../config/env';
import { ReloadOutlined } from '@ant-design/icons';

interface UserInfo {
  address: string;
  level: number;
  totalRewards: string;
  inviteNum: number;
  contribution: string;
  stakedAmount: string;
  currentEarnings: string;
  airBalance: string;
  unlockedAirBalance: string;
}

const StyledSpace = styled(Space)`
  width: 100%;
  .ant-table-wrapper {
    width: 100%;
    overflow-x: auto;
  }
`;

const StyledCard = styled(Card)`
  width: 100%;
  .ant-card-body {
    padding: 12px;
    @media (max-width: 768px) {
      padding: 8px;
    }
  }
`;

const SummaryCard = styled(Card)`
  margin-bottom: 16px;
  .ant-card-body {
    padding: 12px;
  }
`;

const AddressCell = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
  @media (min-width: 768px) {
    max-width: 300px;
  }
`;

const HashCell = styled.div`
  cursor: pointer;
  &:hover {
    color: #1890ff;
  }
`;

const formatHash = (hash: string) => {
  if (!hash) return '';
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

// 辅助函数：将数组分成指定大小的批次
const chunkArray = <T,>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

const UserList: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [addressFilter, setAddressFilter] = useState<string>('');
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [minReward, setMinReward] = useState<string>('');
  const [progress, setProgress] = useState(0);
  
  const publicClient = createPublicClient({
    chain: confluxESpace,
    transport: http()
  });

  const CONTRACT_ADDRESS = env.VITE_LP_ADDRESSES as Address;
  const LPAIR_ADDRESS = env.VITE_LPAIR_ADDRESS as Address;
  
  const ABI = [
    {
      "inputs": [],
      "name": "getUserInviteNum",
      "outputs": [{"type": "address[]", "name": "res"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "address","name": "","type": "address"}],
      "name": "userInfoOf",
      "outputs": [
        {"internalType": "address","name": "refAddress","type": "address"},
        {"internalType": "uint256","name": "inviteNum","type": "uint256"},
        {"internalType": "uint256","name": "contribution","type": "uint256"},
        {"internalType": "uint256","name": "stakedAmount","type": "uint256"},
        {"internalType": "uint256","name": "rewardPerTokenPaid","type": "uint256"},
        {"internalType": "uint256","name": "rewardPerContributionPaid","type": "uint256"},
        {"internalType": "uint256","name": "rewardPerNodePaid","type": "uint256"},
        {"internalType": "uint256","name": "userReward","type": "uint256"},
        {"internalType": "uint256","name": "contributionReward","type": "uint256"},
        {"internalType": "uint256","name": "nodeReward","type": "uint256"},
        {"internalType": "uint256","name": "userTotalReward","type": "uint256"},
        {"internalType": "uint8","name": "level","type": "uint8"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "_account",
          "type": "address"
        }
      ],
      "name": "earned",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "stakedReward",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "contributionReward",
          "type": "uint256"
        },
        {
          "internalType": "uint256",
          "name": "nodeReward",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const;
  
  const LPAIR_ABI = [
    {
      "inputs": [],
      "name": "balance",
      "outputs": [{"type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "unlockedBalance",
      "outputs": [{"type": "uint256"}],
      "stateMutability": "view",
      "type": "function"
    }
  ] as const;

  // 获取单个用户的LP余额
  const fetchUserBalance = async (address: Address) => {
    try {
      // 使用 readContract 而不是 multicall
      const balance = await publicClient.readContract({
        address: LPAIR_ADDRESS,
        abi: LPAIR_ABI,
        functionName: 'balance',
        account: address
      });
      
      const unlockedBalance = await publicClient.readContract({
        address: LPAIR_ADDRESS,
        abi: LPAIR_ABI,
        functionName: 'unlockedBalance',
        account: address
      });
      
      return {
        address,
        airBalance: Number(formatEther(balance)).toFixed(2),
        unlockedAirBalance: Number(formatEther(unlockedBalance)).toFixed(2)
      };
    } catch (error) {
      console.error(`Error fetching balance for ${address}:`, error);
      return {
        address,
        airBalance: '0.00',
        unlockedAirBalance: '0.00'
      };
    }
  };

  // 批量获取用户余额
  const fetchUserBalances = async (addresses: Address[]) => {
    // 将地址分成每批20个
    const batches = chunkArray(addresses, 20);
    const results = [];
    
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchResults = await Promise.all(batch.map(address => fetchUserBalance(address)));
      results.push(...batchResults);
      
      // 更新进度
      setProgress(Math.floor(((i + 1) / batches.length) * 100));
    }
    
    return results;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setProgress(0);
      
      // 获取所有用户地址
      const userAddresses = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'getUserInviteNum',
        account: env.VITE_CFL_OWNER as Address
      }) as Address[];

      // 使用multicall获取用户基本信息
      const contracts = userAddresses.flatMap((address) => {
        return [
          {
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'userInfoOf',
            args: [address]
          },
          {
            address: CONTRACT_ADDRESS,
            abi: ABI,
            functionName: 'earned',
            args: [address]
          }
        ];
      });

      const results = await publicClient.multicall({ contracts });

      // 处理用户基本信息
      const userData: UserInfo[] = userAddresses.map((address, index) => {
        const baseIndex = index * 2;
        const userInfoResult = results[baseIndex];
        const earningsResult = results[baseIndex + 1];
        
        if (!userInfoResult.result || !earningsResult.result) return null;

        const userInfo = userInfoResult.result;
        const earnings = earningsResult.result;

        // 计算总收益
        const totalEarnings = (
          Number(formatEther(earnings[0])) + // stakedReward
          Number(formatEther(earnings[1])) + // contributionReward
          Number(formatEther(earnings[2]))   // nodeReward
        ).toFixed(2);

        return {
          address,
          inviteNum: Number(userInfo[1]),
          contribution: Number(formatEther(userInfo[2])).toFixed(2),
          stakedAmount: Number(formatEther(userInfo[3])).toFixed(2),
          level: Number(userInfo[11]),
          totalRewards: Number(formatEther(userInfo[10])).toFixed(2),
          currentEarnings: totalEarnings,
          airBalance: '0.00', // 初始值，稍后更新
          unlockedAirBalance: '0.00' // 初始值，稍后更新
        };
      }).filter((user): user is UserInfo => user !== null);

      // 单独获取每个用户的余额
      const balanceResults = await fetchUserBalances(userAddresses);
      
      // 将余额信息合并到用户数据中
      userData.forEach(user => {
        const balanceInfo = balanceResults.find(b => b.address.toLowerCase() === user.address.toLowerCase());
        if (balanceInfo) {
          user.airBalance = balanceInfo.airBalance;
          user.unlockedAirBalance = balanceInfo.unlockedAirBalance;
        }
      });

      setUsers(userData);
      setProgress(100);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      message.error('Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        message.success('Address copied to clipboard');
      })
      .catch(() => {
        message.error('Failed to copy address');
      });
  };

  const filteredUsers = users.filter(user => {
    const matchesAddress = !addressFilter || user.address.toLowerCase().includes(addressFilter.toLowerCase());
    const matchesLevel = selectedLevels.length === 0 || selectedLevels.includes(user.level);
    const matchesReward = !minReward || parseFloat(user.currentEarnings) >= parseFloat(minReward);
    return matchesAddress && matchesLevel && matchesReward;
  });

  // 计算汇总数据
  const summaryData = useMemo(() => {
    const totalAir = filteredUsers.reduce((sum, user) => sum + parseFloat(user.airBalance), 0).toFixed(2);
    const totalUnlockedAir = filteredUsers.reduce((sum, user) => sum + parseFloat(user.unlockedAirBalance), 0).toFixed(2);
    const totalEarnings = filteredUsers.reduce((sum, user) => sum + parseFloat(user.currentEarnings), 0).toFixed(2);
    const totalRewards = filteredUsers.reduce((sum, user) => sum + parseFloat(user.totalRewards), 0).toFixed(2);
    
    return {
      totalAir,
      totalUnlockedAir,
      totalEarnings,
      totalRewards
    };
  }, [filteredUsers]);

  const columns = [
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      filterDropdown: () => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder="Search address"
            value={addressFilter}
            onChange={e => setAddressFilter(e.target.value)}
            style={{ width: 188, marginBottom: 8, display: 'block' }}
          />
        </div>
      ),
      filterIcon: (filtered: boolean) => (
        <svg 
          viewBox="64 64 896 896" 
          data-icon="search" 
          width="1em" 
          height="1em" 
          fill="currentColor" 
          aria-hidden="true"
          style={{ color: filtered ? '#1890ff' : undefined }}
        >
          <path d="M909.6 854.5L649.9 594.8C690.2 542.7 712 479 712 412c0-80.2-31.3-155.4-87.9-212.1-56.6-56.7-132-87.9-212.1-87.9s-155.5 31.3-212.1 87.9C143.2 256.5 112 331.8 112 412c0 80.1 31.3 155.5 87.9 212.1C256.5 680.8 331.8 712 412 712c67 0 130.6-21.8 182.7-62l259.7 259.6a8.2 8.2 0 0011.6 0l43.6-43.5a8.2 8.2 0 000-11.6zM570.4 570.4C528 612.7 471.8 636 412 636s-116-23.3-158.4-65.6C211.3 528 188 471.8 188 412s23.3-116.1 65.6-158.4C296 211.3 352.2 188 412 188s116.1 23.2 158.4 65.6S636 352.2 636 412s-23.3 116.1-65.6 158.4z"></path>
        </svg>
      ),
      render: (address: string) => {
        const isWatchAddress = env.VITE_WATCH_ADDRESS.map(addr => addr.toLowerCase()).includes(address.toLowerCase());
        return (
          <HashCell 
            onClick={() => copyToClipboard(address)}
            title={`Click to copy: ${address}`}
          >
            {isWatchAddress ? (
              <Tag color="red">{formatHash(address)}</Tag>
            ) : (
              formatHash(address)
            )}
          </HashCell>
        );
      },
      width: 120,
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      filters: [
        { text: 'Level 1', value: 1 },
        { text: 'Level 2', value: 2 },
        { text: 'Level 3', value: 3 },
        { text: 'Level 4', value: 4 },
        { text: 'Level 5', value: 5 },
        { text: 'Level 6', value: 6 },
      ],
      filteredValue: selectedLevels,
      onFilter: (value: number, record: UserInfo) => record.level === value,
      sorter: (a: UserInfo, b: UserInfo) => a.level - b.level,
      width: 100,
    },
    {
      title: 'air',
      dataIndex: 'airBalance',
      key: 'airBalance',
      sorter: (a: UserInfo, b: UserInfo) => 
        parseFloat(a.airBalance) - parseFloat(b.airBalance),
      render: (value: string) => value,
      width: 120,
    },
    {
      title: 'unlockAir',
      dataIndex: 'unlockedAirBalance',
      key: 'unlockedAirBalance',
      sorter: (a: UserInfo, b: UserInfo) => 
        parseFloat(a.unlockedAirBalance) - parseFloat(b.unlockedAirBalance),
      render: (value: string) => value,
      width: 120,
    },
    {
      title: 'Earnings(CFL)',
      dataIndex: 'currentEarnings',
      key: 'currentEarnings',
      sorter: (a: UserInfo, b: UserInfo) => 
        parseFloat(a.currentEarnings) - parseFloat(b.currentEarnings),
      render: (value: string) => `${value}`,
      width: 150,
    },
    {
      title: 'Total (USDT)',
      dataIndex: 'totalRewards',
      key: 'totalRewards',
      sorter: (a: UserInfo, b: UserInfo) => 
        parseFloat(a.totalRewards) - parseFloat(b.totalRewards),
      render: (value: string) => value,
      width: 150,
    },
    {
      title: 'Invites',
      dataIndex: 'inviteNum',
      key: 'inviteNum',
      sorter: (a: UserInfo, b: UserInfo) => a.inviteNum - b.inviteNum,
      width: 100,
    },
    {
      title: 'Contribution',
      dataIndex: 'contribution',
      key: 'contribution',
      sorter: (a: UserInfo, b: UserInfo) => 
        parseFloat(a.contribution) - parseFloat(b.contribution),
      render: (value: string) => value,
      width: 120,
    },
  ];

  const handlePrintAddresses = () => {
    console.log('Filtered Address List:');
    console.log('-------------------');
    if (selectedLevels.length > 0) {
      console.log(`Levels: ${selectedLevels.join(', ')}`);
    }
    if (minReward) {
      console.log(`Min Reward: ${minReward} CFX`);
    }
    if (addressFilter) {
      console.log(`Address contains: ${addressFilter}`);
    }
    console.log('-------------------');
    console.log(` ${JSON.stringify(filteredUsers.map(user => user.address))}`);
    console.log('-------------------');
    console.log(`Total: ${filteredUsers.length} addresses`);
  };

  return (
    <StyledCard 
      title="User List"
      extra={
        <Button 
          type="primary" 
          onClick={fetchUsers}
          icon={<ReloadOutlined />}
          loading={loading}
        >
        </Button>
      }
    >
      <StyledSpace direction="vertical" size="middle">
        {/* 汇总信息卡片 */}
        <SummaryCard>
          <Row gutter={[16, 16]}>
            <Col xs={12} sm={6}>
              <Statistic 
                title="Total Air" 
                value={summaryData.totalAir} 
                precision={2}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic 
                title="Total Unlocked Air" 
                value={summaryData.totalUnlockedAir} 
                precision={2}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic 
                title="Total Earnings (CFL)" 
                value={summaryData.totalEarnings} 
                precision={2}
              />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic 
                title="Total Rewards (USDT)" 
                value={summaryData.totalRewards} 
                precision={2}
              />
            </Col>
          </Row>
        </SummaryCard>
        
        <Space>
          <Button 
            type="primary"
            onClick={handlePrintAddresses}
            icon={<span role="img" aria-label="print">🖨️</span>}
          >
            Print Filtered Addresses
          </Button>
          <Input
            placeholder="Min Reward"
            value={minReward}
            onChange={e => setMinReward(e.target.value)}
            style={{ width: 120 }}
            suffix="CFL"
          />
        </Space>
        
        {loading && progress > 0 && progress < 100 && (
          <Progress percent={progress} status="active" />
        )}
        
        <Table
          dataSource={filteredUsers}
          columns={columns}
          loading={loading}
          rowKey="address"
          onChange={(pagination, filters, sorter) => {
            setSelectedLevels((filters.level as number[]) || []);
          }}
          scroll={{ x: 'max-content' }}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
          }}
        />
      </StyledSpace>
    </StyledCard>
  );
};

export default UserList; 