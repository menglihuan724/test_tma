import React, { useEffect, useState } from 'react';
import { 
  Table, 
  Select, 
  Input, 
  Space, 
  Card,
  Button,
  message
} from 'antd';
import { confluxESpace } from 'viem/chains';
import { createPublicClient, http } from 'viem';
import { formatEther } from 'viem';
import type { Address } from 'viem';
import styled from 'styled-components';

interface UserInfo {
  address: string;
  level: number;
  totalRewards: string;
  inviteNum: number;
  contribution: string;
  stakedAmount: string;
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

const UserList: React.FC = () => {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [addressFilter, setAddressFilter] = useState<string>('');
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
  const [minReward, setMinReward] = useState<string>('');
  
  const publicClient = createPublicClient({
    chain: confluxESpace,
    account: import.meta.env.VITE_CFL_OWNER,
    transport: http()
  });

  const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS as Address;
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
    }
  ] as const;

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // 获取所有用户地址
      const userAddresses = await publicClient.readContract({
        address: CONTRACT_ADDRESS,
        abi: ABI,
        functionName: 'getUserInviteNum',
      }) as Address[];

      // 使用multicall批量查询用户信息
      const multicallResults = await publicClient.multicall({
        contracts: userAddresses.map((address) => ({
          address: CONTRACT_ADDRESS,
          abi: ABI,
          functionName: 'userInfoOf',
          args: [address]
        }))
      });

      // 整理数据
      const userData: UserInfo[] = multicallResults.map((result, index) => {
        if (!result.result) return null;
        const data = result.result;
        return {
          address: userAddresses[index],
          inviteNum: Number(data[1]),
          contribution: Number(formatEther(data[2])).toFixed(2),
          stakedAmount: Number(formatEther(data[3])).toFixed(2),
          level: Number(data[11]),
          totalRewards: Number(formatEther(data[10])).toFixed(2) // userTotalReward
        };
      }).filter((user): user is UserInfo => user !== null);

      setUsers(userData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const addressMatch = !addressFilter || 
      user.address.toLowerCase().includes(addressFilter.toLowerCase());
    const levelMatch = selectedLevels.length === 0 || selectedLevels.includes(user.level);
    const rewardMatch = !minReward || 
      parseFloat(user.totalRewards) >= parseFloat(minReward);
    return addressMatch && levelMatch && rewardMatch;
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
  };

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
      filterIcon: filtered => (
        <svg 
          viewBox="64 64 896 896" 
          focusable="false" 
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
      render: (address: string) => (
        <HashCell 
          onClick={() => copyToClipboard(address)}
          title={`Click to copy: ${address}`}
        >
          {formatHash(address)}
        </HashCell>
      ),
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
      title: 'Total Rewards (CFX)',
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
    <StyledCard title="User List">
      <StyledSpace direction="vertical" size="middle">
        <Space>
          <Button 
            type="primary"
            onClick={handlePrintAddresses}
            icon={<span role="img" aria-label="print">🖨️</span>}
          >
            Print Filtered Addresses
          </Button>
        </Space>
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