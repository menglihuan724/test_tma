import axios from "axios";
import env from "../config/env";

// 创建 Cloudflare API 客户端
const cloudfareClient = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

cloudfareClient.interceptors.request.use(
  (config) => {
    // console.log(`Request to ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

cloudfareClient.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    return response;
  },
  (error) => {
    console.error("Cloudflare API error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const verifyAuth = async (): Promise<any> => {
  try {
    const response = await cloudfareClient.get("/auth");
    // console.log("response:"+response.data);
    return response.data;
  } catch (error) {
    console.error("Auth verification failed:", error);
    return false;
  }
};

export default {
  client: cloudfareClient,
  verifyAuth,
}; 