import axios, { AxiosInstance } from "axios";
import CryptoJS from "crypto-js";

const totalPath = "/api/v5/wallet/asset/total-value-by-address";
const tradePath = "/api/v5/wallet/post-transaction/transactions-by-address";

interface BalanceParams {
  address: string;
  chains: string;
  assetType?: string;
  excludeRiskToken?: boolean;
}

export class OKXClient {
  private apiKey: string;
  private secretKey: string;
  private passphrase: string;
  private baseUrl:string;
  private projectId:string;
  private httpClient: AxiosInstance;

  constructor(
    apiKey: string,
    secretKey: string,
    passphrase: string,
    baseUrl: string,
    projectId:string
  ) {
    this.apiKey = apiKey;
    this.secretKey = secretKey;
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
    return CryptoJS.enc.Base64.stringify(CryptoJS.HmacSHA256(message, this.secretKey))
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
        "Authorization": `Basic ${btoa(`${import.meta.env.VITE_AUTH_USER}:${import.meta.env.VITE_AUTH_TOKEN}`)}`
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

  private sendPostRequest(request_path, params) {
    const { signature, timestamp } = this.createSignature(
      "POST",
      request_path,
      params
    );

    const headers = {
      "OK-ACCESS-KEY": this.apiKey,
      "OK-ACCESS-SIGN": signature,
      "OK-ACCESS-TIMESTAMP": timestamp,
      "OK-ACCESS-PASSPHRASE": this.passphrase,
      "Content-Type": "application/json",
    };
  }

  async queryTotalValue(address: string, chains: string) {
    const getParams = {
      address,
      chains,
      assetType: '0', 
      excludeRiskToken: true 
    };
    
    const res = await this.sendGetRequest(totalPath, getParams);
    if (res.code === '0') {
      return Number(res.data[0]?.totalValue || 0);
    } else {
      console.error('API Error:', res);
      return 0;
    }
  }
}
