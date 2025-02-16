import React, { useState, useEffect } from 'react';
import { Button, Typography, message, Space, Select, Card } from 'antd';
import detectEthereumProvider from '@metamask/detect-provider';
import { createPublicClient, createWalletClient, http, custom, parseAbi, getContract } from 'viem';
import { confluxESpace } from 'viem/chains';
import fakuConfig from '../config/faku_config.json';
import env from '../config/env';

const { Text } = Typography;
const { Option } = Select;

// Conflux eSpace network parameters
const CONFLUX_ESPACE_CHAIN = {
  chainId: '0x406', // 1030 in decimal
  chainName: 'Conflux eSpace',
  nativeCurrency: {
    name: 'CFX',
    symbol: 'CFX',
    decimals: 18
  },
  rpcUrls: ['https://evm.confluxrpc.com'],
  blockExplorerUrls: ['https://evm.confluxscan.io']
};

// Generate time interval options (1 hour to 12 hours, increment by 0.5 hour)
const generateIntervalOptions = () => {
  const options = [];
  for (let i = 1; i <= 24; i++) {
    options.push(i * 1800); // 1800 seconds = 0.5 hour
  }
  return options;
};

const INTERVAL_OPTIONS = generateIntervalOptions();

const ConfluxWallet: React.FC = () => {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [fakuInterval, setFakuInterval] = useState<number>(3600);
  const [fakuLpInterval, setFakuLpInterval] = useState<number>(3600);
  const [currentIntervals, setCurrentIntervals] = useState<{
    fakuInterval: number;
    fakuLpInterval: number;
  } | null>(null);

  const connectWallet = async () => {
    try {
      const provider = await detectEthereumProvider();

      if (!provider) {
        message.error('Please install MetaMask/OneKey wallet');
        return;
      }

      setProvider(provider);

      const accounts = await provider.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);

        try {
          await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: CONFLUX_ESPACE_CHAIN.chainId }],
          });
        } catch (switchError: any) {
          if (switchError.code === 4902) {
            try {
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [CONFLUX_ESPACE_CHAIN],
              });
            } catch (addError) {
              message.error('Failed to add network');
              return;
            }
          } else {
            message.error('Failed to switch network');
            return;
          }
        }

        message.success('Wallet connected successfully');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      message.error('Failed to connect wallet');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    message.info('Wallet disconnected');
  };

  // 创建合约实例
  const getFakuContract = () => {
    const publicClient = createPublicClient({
      chain: confluxESpace,
      transport: http()
    });
    const walletClient = createWalletClient({
        account,
        chain: confluxESpace,
        transport: custom(provider)
      });
  
    return {publicClient,walletClient}
  };

  // 获取当前间隔
  const getCurrentInterval = async () => {
    if (!provider || !account) return;

    try {
      const contract = getFakuContract().publicClient;
      const result = await contract.readContract({
        address: env.VITE_FAKU_CONTRACT_ADDRESS,
        abi: parseAbi([
          "function getInterval() view returns (uint32, uint32)"
        ]),
        functionName: "getInterval"
      })
      console.log('Get interval result:', result)
      const [interval1, interval2] = result as [bigint, bigint];
      
      setCurrentIntervals({
        fakuInterval: Number(interval1),
        fakuLpInterval: Number(interval2),
      });
      
      setFakuInterval(Number(interval1));
      setFakuLpInterval(Number(interval2));
    } catch (error) {
      console.error('Failed to get interval:', error);
      message.error('Failed to get interval');
    }
  };

  // 设置新的间隔
  const handleSetInterval = async () => {
    if (!provider || !account) {
      message.error('Please connect wallet first');
      return;
    }

    try {
      const contract = getFakuContract().walletClient;
      const hash = await contract.writeContract({
        address: env.VITE_FAKU_CONTRACT_ADDRESS,
        abi: parseAbi([
          "function setInterval(uint32 _fakuInterval, uint32 _fakuLpInterval)"
        ]),
        functionName: "setInterval",
        args: [BigInt(fakuInterval), BigInt(fakuLpInterval)]
      })

      message.success(`Set interval success: ${hash}`);
      getCurrentInterval();
    } catch (error) {
      console.error('Failed to set interval:', error);
      message.error('Failed to set interval');
    }
  };

  useEffect(() => {
    if (provider) {
      provider.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          disconnectWallet();
        }
      });

      provider.on('chainChanged', (chainId: string) => {
        if (chainId !== CONFLUX_ESPACE_CHAIN.chainId) {
          message.warning('Please switch to Conflux eSpace network');
        }
      });

      return () => {
        provider.removeListener('accountsChanged', () => {});
        provider.removeListener('chainChanged', () => {});
      };
    }
  }, [provider]);

  // 在连接钱包成功后获取当前间隔
  useEffect(() => {
    if (provider && account) {
      getCurrentInterval();
    }
  }, [provider, account]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {account ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Connected Account:</Text>
          <Text code style={{ wordBreak: 'break-all' }}>{account}</Text>
          <Button type="primary" danger onClick={disconnectWallet}>
            Disconnect
          </Button>
        </Space>
      ) : (
        <Button type="primary" onClick={connectWallet}>
          Connect Wallet
        </Button>
      )}
      
      {account && (
        <Card title="Interval Settings">
          <Space direction="vertical" style={{ width: '100%' }}>
            {currentIntervals && (
              <Space direction="vertical">
                <Text>Current Faku Interval: {currentIntervals.fakuInterval / 3600} hours</Text>
                <Text>Current Faku LP Interval: {currentIntervals.fakuLpInterval / 3600} hours</Text>
              </Space>
            )}
            
            <Space>
              <Select
                value={fakuInterval}
                onChange={setFakuInterval}
                style={{ width: 120 }}
              >
                {INTERVAL_OPTIONS.map(seconds => (
                  <Option key={seconds} value={seconds}>
                    {seconds / 3600} hours
                  </Option>
                ))}
              </Select>
              
              <Select
                value={fakuLpInterval}
                onChange={setFakuLpInterval}
                style={{ width: 120 }}
              >
                {INTERVAL_OPTIONS.map(seconds => (
                  <Option key={seconds} value={seconds}>
                    {seconds / 3600} hours
                  </Option>
                ))}
              </Select>
              
              <Button type="primary" onClick={handleSetInterval}>
                Set Interval
              </Button>
            </Space>
          </Space>
        </Card>
      )}
    </Space>
  );
};

export default ConfluxWallet; 