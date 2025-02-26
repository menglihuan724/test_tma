import axios, { AxiosInstance } from "axios";
import CryptoJS from "crypto-js";
import env from '../config/env';

const totalPath = "/api/v5/wallet/asset/total-value-by-address";
const tradePath = "/api/v5/wallet/post-transaction/transactions-by-address";
const creatAccount="/api/v5/wallet/account/create-wallet-account"
const accountTotalPath="/api/v5/wallet/asset/total-value"

interface BalanceParams {
  address: string;
  chains: string;
  assetType?: string;
  excludeRiskToken?: boolean;
}

interface CreateAccountParams {
  addresses: string[];
  chainIndex: string;
  address: string;
}

interface AccountTotalValueParams {
  accountId: string;
  chains?: string;
  assetType?: string;
  excludeRiskToken?: boolean;
}

// 基础响应类型
interface OkxBaseRes<T> {
  code: string;
  msg: string;
  data: T;
}

// 总资产响应数据类型
interface TotalValueData {
  totalValue: string;
}

// 创建账户响应数据类型
interface CreateAccountData {
  accountId: string;
}

// 修改之前的接口定义
interface TotalValueResponse extends OkxBaseRes<TotalValueData[]> {}

export class OKXClient {
  private apiKey: string;
  private secret: string;
  private passphrase: string;
  private baseUrl:string;
  private projectId:string;
  private httpClient: AxiosInstance;

  constructor(
    apiKey: string,
    secret: string,
    passphrase: string,
    baseUrl: string,
    projectId:string
  ) {
    this.apiKey = apiKey;
    this.secret = secret;
    this.passphrase = passphrase;
    this.baseUrl = baseUrl;
    this.projectId=projectId
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
    });
  }

  private preHash(timestamp, method, request_path, params) {
    let query_string = "";
    if (method === "GET" && params) {
      query_string = "?" + new URLSearchParams(params).toString();
    }
    if (method === "POST" && params) {
      query_string = JSON.stringify(params);
    }
    return timestamp + method + request_path + query_string;
  }

  private sign(message) {
    return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(message, this.secret))
    // return CryptoJS.HmacSHA256(message, this.secretKey).toString(
    //   CryptoJS.enc.Base64
    // );
    // const hmac = crypto.createHmac("sha256", secret_key);
    // hmac.update(message);
    // return hmac.digest("base64");
  }

  private createSignature(method, request_path, params) {
    const timestamp = new Date().toISOString().slice(0, -5) + "Z";
    const message = this.preHash(timestamp, method, request_path, params);
    const signature = this.sign(message);
    return { signature, timestamp };
  }

  private sendGetRequest(request_path, params) {
    return new Promise((resolve, reject) => {
      const { signature, timestamp } = this.createSignature(
        "GET",
        request_path,
        params
      );
      const headers = {
        "OK-ACCESS-KEY": this.apiKey,
        "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-TIMESTAMP": timestamp,
        "OK-ACCESS-PASSPHRASE": this.passphrase,
        "OK-ACCESS-PROJECT": this.projectId,
        "Authorization": `Basic ${btoa(`${env.VITE_AUTH_USER}:${env.VITE_AUTH_TOKEN}`)}`
      };

      this.httpClient
        .get(
          request_path +
            (params ? `?${new URLSearchParams(params).toString()}` : ""),
          { headers: headers }
        )
        .then(function (response) {
          // console.log(response.data)
          resolve(response.data);
        })
        .catch(function (error) {
          console.log(error);
          reject(error);
        });
    });
  }

  private sendPostRequest(request_path: string, params: any) {
    return new Promise((resolve, reject) => {
      const { signature, timestamp } = this.createSignature(
        "POST",
        request_path,
        params
      );
      console.log(params);
      const headers = {
        "OK-ACCESS-KEY": this.apiKey,
        "OK-ACCESS-SIGN": signature,
        "OK-ACCESS-TIMESTAMP": timestamp,
        "OK-ACCESS-PASSPHRASE": this.passphrase,
        "OK-ACCESS-PROJECT": this.projectId,
        "Content-Type": "application/json",
        "Authorization": `Basic ${btoa(`${env.VITE_AUTH_USER}:${env.VITE_AUTH_TOKEN}`)}`
      };

      this.httpClient
        .post(request_path, params, { headers })
        .then(function (response) {
          resolve(response.data);
        })
        .catch(function (error) {
          console.error(error);
          reject(error);
        });
    });
  }

  async queryTotalValue(address: string, chains: string): Promise<number> {
    const getParams = {
      address,
      chains,
      assetType: '0', 
      excludeRiskToken: true 
    };
    
    const res = await this.sendGetRequest(totalPath, getParams) as OkxBaseRes<TotalValueData[]>;
    if (res.code === '0') {
      return Number(res.data[0]?.totalValue || 0);
    } else {
      console.error('API Error:', res);
      return 0;
    }
  }

  async createAccount(params: CreateAccountParams): Promise<CreateAccountData> {
    try {
      const response = await this.sendPostRequest(creatAccount, params) as OkxBaseRes<CreateAccountData>;
      if (response.code === '0') {
        return response.data;
      } else {
        throw new Error(response.msg || 'Failed to create account');
      }
    } catch (error) {
      console.error('Error creating account:', error);
      throw error;
    }
  }

  async queryAccountTotalValue({
    accountId,
    chains,
    assetType = '0',
    excludeRiskToken = true
  }: AccountTotalValueParams): Promise<number> {
    try {
      const params = {
        accountId,
        chains,
        assetType,
        excludeRiskToken
      };

      const response = await this.sendGetRequest(accountTotalPath, params) as OkxBaseRes<TotalValueData[]>;

      if (response.code === '0') {
        return Number(response.data[0]?.totalValue || 0);
      } else {
        console.error('API Error:', response);
        throw new Error(response.msg || 'Failed to query account total value');
      }
    } catch (error) {
      console.error('Error querying account total value:', error);
      throw error;
    }
  }
}
