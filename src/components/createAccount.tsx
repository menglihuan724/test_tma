import React, { useState } from "react";
import { Button, Input, Space, message, Modal, Form } from "antd";
import { OKXClient } from "../services/okxClient";
import styled from "styled-components";
import env from "../config/env";

const StyledSpace = styled(Space)`
  width: 100%;
  margin-bottom: 16px;
`;

interface AddressInfo {
  chainIndex: string;
  address: string;
}



const CreateAccount: React.FC = () => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // 当模态框打开时，设置默认值
  const handleModalOpen = () => {
    // 创建示例格式
    const defaultAddresses = {
      addresses: env.VITE_WALLETS.map((wallet) => ({
        chainIndex: wallet.chains,
        address: wallet.address,
      })),
    };

    form.setFieldsValue({
      addresses: JSON.stringify(defaultAddresses, null, 2),
    });
    setIsModalVisible(true);
  };

  const handleCreateAccount = async (values) => {
    try {
      setLoading(true);
      const client = new OKXClient(
        env.VITE_OK_DEX_API_KEY,
        env.VITE_OK_DEX_SECRET,
        env.VITE_OK_DEX_PASS,
        env.VITE_OK_URL,
        env.VITE_OK_DEX_ID
      );

      let addressList: AddressInfo[];
      try {
        const parsedData = JSON.parse(values.addresses);
        // console.log(parsedData);
        addressList = parsedData.addresses;
        // console.log(addressList);
        if (!Array.isArray(addressList)) {
          throw new Error("Addresses must be an array");
        }

        // 验证每个地址对象的格式
        const isValidFormat = addressList.every(
          (item) => item.chainIndex && item.address
          //   /^0x[a-fA-F0-9]{40}$/.test(item.address)
        );

        if (!isValidFormat) {
          throw new Error("Invalid address format");
        }
      } catch (e) {
        message.error("Invalid JSON format or address structure");
        return;
      }

      if (addressList.length === 0) {
        message.error("Please input at least one address");
        return;
      }

      if (addressList.length > 50) {
        message.error("Maximum 50 addresses allowed at once");
        return;
      }

      const response = await client.createAccount({"addresses":addressList});

      message.success(
        `Accounts created successfully. Account ID: ${response.accountId}`
      );
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error creating accounts:", error);
      message.error("Failed to create accounts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledSpace direction="vertical">
      <Button
        type="primary"
        onClick={handleModalOpen}
        icon={
          <span role="img" aria-label="plus">
            ➕
          </span>
        }
      >
        Create Accounts
      </Button>

      <Modal
        title="Create New Accounts"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={800}
      >
        <Form form={form} onFinish={handleCreateAccount} layout="vertical">
          <Form.Item
            name="addresses"
            label="Addresses JSON"
            tooltip='Format: {"addresses":[{"chainIndex":"1","address":"0x..."}]}'
            rules={[
              { required: true, message: "Please input addresses" },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  try {
                    const data = JSON.parse(value);
                    if (!Array.isArray(data.addresses)) {
                      return Promise.reject(
                        "Invalid format: addresses must be an array"
                      );
                    }
                    const isValid = data.addresses.every(
                      (item: any) => item.chainIndex && item.address
                      //   &&
                      //   /^0x[a-fA-F0-9]{40}$/.test(item.address)
                    );
                    if (!isValid) {
                      return Promise.reject("Invalid address format");
                    }
                    return Promise.resolve();
                  } catch (e) {
                    return Promise.reject("Invalid JSON format");
                  }
                },
              },
            ]}
          >
            <Input.TextArea
              rows={10}
              placeholder={`{
  "addresses": [
    {
      "chainIndex": "1",
      "address": "0x123...abc"
    }
  ]
}`}
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Create
              </Button>
              <Button
                onClick={() => {
                  setIsModalVisible(false);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </StyledSpace>
  );
};

export default CreateAccount;
