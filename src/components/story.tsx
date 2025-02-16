import React, { useState } from "react";
import { Card, Space, Input, Button, Typography, message } from "antd";
import { client, client as ipClient } from "../services/ipClient";
import env from "../config/env";
import { Address } from 'viem';
import { zeroAddress } from "viem";

const { Text } = Typography;

interface StoryBalance {
  address: string;
  balance: string;
  tokens?: {
    symbol: string;
    balance: string;
  }[];
}

const IpOperations: React.FC = () => {
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [balance, setBalance] = useState<StoryBalance | null>(null);
  const [ipName, setIpName] = useState<string>("哪吒传奇");
  const [ipDescription, setIpDescription] =
    useState<string>("中国传统神话人物哪吒的故事");

  const getStoryBalance = async () => {
    if (!address) {
      message.warning("Please enter an address");
      return;
    }
    const balance = await client.getBalance(address.toString());
    setBalance({
      address: address.toString(),
      balance: balance.toString(),
    });
  };

  const registerIpAsset = async () => {
    try {
      setLoading(true);

      // 生成IP元数据
      const ipMetadata = {
        title: ipName,
        description: ipDescription,
        watermarkImg: "https://picsum.photos/200",
        attributes: [
          {
            key: "Category",
            value: "Mythology",
          },
          {
            key: "Origin",
            value: "China",
          },
        ],
      };

      // 注册IP资产
      //   const iip={
      //     title: ipName,
      //     description: ipDescription,
      //     metadata: ipMetadata,
      //     licenseTerms: {
      //       commercialUse: true,
      //       derivativeWorks: true,
      //       attributionRequired: true
      //     }
      //   }
      const meta = await ipClient.ipAsset.generateIpMetadata(ipMetadata);

      const nft = await ipClient.nftClient.createNFTCollection({
        name: 'Test NFTs',
        symbol: 'TEST',
        isPublicMinting: true,
        mintOpen: true,
        mintFeeRecipient: zeroAddress,
        contractURI: '',
        txOptions: { waitForTransaction: true },
      })

      const response = await ipClient.ipAsset.mintAndRegisterIp({
        // TODO: insert your SPG_NFT_CONTRACT_ADDRESS here
        spgNftContract: nft.spgNftContract as Address,
        allowDuplicates: true,
        // ipMetadata: {
        //   ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
        //   ipMetadataHash: `0x${ipHash}`,
        //   nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
        //   nftMetadataHash: `0x${nftHash}`,
        // },
        txOptions: { waitForTransaction: true },
      });

      console.log(
        `Root IPA created at transaction hash ${response.txHash}, IPA ID: ${response.ipId}`
      );
      console.log(
        `View on the explorer: https://explorer.story.foundation/ipa/${response.ipId}`
      );

      if (response.success) {
        message.success("IP资产注册成功");
        console.log("Registered IP Asset:", response.data);
      } else {
        message.error("IP资产注册失败");
      }
    } catch (error) {
      console.error("Error registering IP asset:", error);
      message.error("IP资产注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card title="Story Layer1 Balance">
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input
            placeholder="Enter Story Layer1 address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ width: "100%" }}
          />
          <Button type="primary" onClick={getStoryBalance} loading={loading}>
            Query Balance
          </Button>

          {balance && (
            <Space direction="vertical">
              <Text strong>Address: {balance.address}</Text>
              <Text>Balance: {balance.balance} STORY</Text>
            </Space>
          )}
        </Space>
      </Card>

      <Card title="注册IP资产">
        <Space direction="vertical" style={{ width: "100%" }}>
          <Input
            placeholder="IP名称"
            value={ipName}
            onChange={(e) => setIpName(e.target.value)}
            style={{ width: "100%" }}
          />
          <Input.TextArea
            placeholder="IP描述"
            value={ipDescription}
            onChange={(e) => setIpDescription(e.target.value)}
            style={{ width: "100%" }}
            rows={4}
          />
          <Button type="primary" onClick={registerIpAsset} loading={loading}>
            注册IP资产
          </Button>
        </Space>
      </Card>

      <Card title="Story Layer1 Network Info">
        <Space direction="vertical">
          <Text>Chain ID: 1234</Text>
          {/* <Text>RPC URL: {env.VITE_STORY_RPC_URL}</Text> */}
          <Text>Currency Symbol: STORY</Text>
          <Text>Explorer: Coming soon...</Text>
        </Space>
      </Card>
    </Space>
  );
};

export default IpOperations;
