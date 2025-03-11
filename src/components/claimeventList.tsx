import React, { useState, useEffect } from "react";
import { Card, Space, Typography, Table, Button, message, Tag } from "antd";
import {
  createPublicClient,
  http,
  webSocket,
  parseAbi,
  formatEther,
} from "viem";
import { confluxESpace } from "viem/chains";
import styled from "styled-components";
import env from "../config/env";
import { ReloadOutlined } from "@ant-design/icons";

const { Text } = Typography;

const WATCH_ADDRESSES = env.VITE_WATCH_ADDRESS.map((addr) => addr.toLowerCase());

interface EventLog {
  blockNumber: bigint;
  transactionHash: `0x${string}`;
  account: string;
  amount: string;
  timestamp?: number;
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

const EventListener: React.FC = () => {
  const [events, setEvents] = useState<EventLog[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const publicClient = createPublicClient({
    chain: confluxESpace,
    transport: webSocket(),
  });

  const eventAbi = parseAbi([
    "event RewardPaid(address indexed account,uint256 amount,uint256 burnAmount,bool isContribution,bool isNode)",
    "event ClaimAirDrop(address account, uint256 amount, uint256 expireNum)"
  ]);

  const getRecentDayBlockRange = async () => {
    const currentBlock = await publicClient.getBlockNumber();
    const blocksPerDay = 24 * 60 * 60;
    const fromBlock = currentBlock - BigInt(blocksPerDay);
    return { fromBlock, toBlock: currentBlock };
  };

  const fetchRecentDayEvents = async () => {
    const { fromBlock, toBlock } = await getRecentDayBlockRange();
    const logs = await publicClient.getContractEvents({
      address: import.meta.env.VITE_LP_ADDRESSES,
      abi: eventAbi,
      fromBlock,
      toBlock,
    });

    const newEvents = await Promise.all(
      logs.map(async (log) => {
        const block = await publicClient.getBlock({
          blockNumber: log.blockNumber,
        });
        const account = (log.args.account as string).toLowerCase();

        return {
          blockNumber: log.blockNumber,
          transactionHash: log.transactionHash,
          account,
          amount: formatEther(log.args.amount as bigint),
          timestamp: Number(block.timestamp),
        };
      })
    );

    setEvents(newEvents.reverse());
  };

  // 监控新事件
  const startListening = async () => {
    try {
      setIsListening(true);
      const unwatch = publicClient.watchContractEvent({
        address: import.meta.env.VITE_LP_ADDRESSES,
        abi: eventAbi,
        pollingInterval: 5000,
        onLogs: async (logs) => {
          const newEvents = await Promise.all(
            logs.map(async (log) => {
              const block = await publicClient.getBlock({
                blockNumber: log.blockNumber,
              });

              const account = (log.args.account as string).toLowerCase();
              const amount = formatEther(log.args.amount as bigint);

              if (WATCH_ADDRESSES.includes(account)) {
                sendNotification(account, amount);

                return {
                  blockNumber: log.blockNumber,
                  transactionHash: log.transactionHash,
                  account,
                  amount,
                  timestamp: Number(block.timestamp),
                };
              }
              return null;
            })
          );

          const filteredEvents = newEvents.filter(
            (event): event is EventLog => event !== null
          );

          if (filteredEvents.length > 0) {
            setEvents((prev) => [...filteredEvents, ...prev]);
            message.info("New reward detected");
          }
        },
      });

      return () => {
        unwatch();
        setIsListening(false);
      };
    } catch (error) {
      console.error("Error starting event listener:", error);
      message.error("Failed to start event listener");
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const sendNotification = (account: string, amount: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("New Reward Paid", {
        body: `Account: ${account}\nAmount: ${amount} CFX`,
        icon: "/assets/logo.jpeg",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
  };

  const columns = [
    {
      title: "Block Number",
      dataIndex: "blockNumber",
      key: "blockNumber",
      render: (blockNumber: bigint) => blockNumber.toString(),
    },
    {
      title: "Transaction Hash",
      dataIndex: "transactionHash",
      key: "transactionHash",
      render: (hash: string) => (
        <HashCell 
          onClick={() => copyToClipboard(hash)}
          title={`Click to copy: ${hash}`}
        >
          {formatHash(hash)}
        </HashCell>
      ),
      width: 120,
    },
    {
      title: "Account",
      dataIndex: "account",
      key: "account",
      render: (account: string) => {
        const isWatchAddress = WATCH_ADDRESSES.includes(account.toLowerCase());
        return (
          <HashCell 
            onClick={() => copyToClipboard(account)}
            title={`Click to copy: ${account}`}
          >
            {isWatchAddress ? (
              <Tag color="red">{formatHash(account)}</Tag>
            ) : (
              formatHash(account)
            )}
          </HashCell>
        );
      },
      width: 120,
    },
    {
      title: "Amount(CFL)",
      dataIndex: "amount",
      key: "amount",
      render: (amount: string) => Number(amount).toFixed(3),
    },
    {
      title: "Time",
      dataIndex: "timestamp",
      key: "timestamp",
      render: (timestamp: number) =>
        new Date(timestamp * 1000).toLocaleString(),
    },
  ];

  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission();
    }
    fetchRecentDayEvents();
  }, []);

  return (
    <StyledCard 
      title="Reward Events"
      extra={
        <Button 
          type="primary" 
          onClick={fetchRecentDayEvents}
          icon={<ReloadOutlined />}
        >
          Refresh
        </Button>
      }
    >
      <StyledSpace direction="vertical" style={{ width: "100%" }}>
        <Space>
          <Button
            type="primary"
            onClick={startListening}
            disabled={isListening}
          >
            Start Listening
          </Button>
          <Button danger onClick={stopListening} disabled={!isListening}>
            Stop Listening
          </Button>
        </Space>

        <Table
          dataSource={events.slice((page - 1) * pageSize, page * pageSize)}
          columns={columns}
          rowKey={(record) => record.transactionHash}
          pagination={{
            pageSize,
            current: page,
            total: events.length,
            onChange: (page) => setPage(page),
          }}
        />
      </StyledSpace>
    </StyledCard>
  );
};

export default EventListener;
