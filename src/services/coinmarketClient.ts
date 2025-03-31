import axios from "axios";
import env from "../config/env";
import { getCoinmarketClient } from './clientManager';

export interface MarketData {
  active_cryptocurrencies: number;
  total_cryptocurrencies: number;
  active_market_pairs: number;
  active_exchanges: number;
  total_exchanges: number;
  eth_dominance: number;
  btc_dominance: number;
  eth_dominance_yesterday: number;
  btc_dominance_yesterday: number;
  eth_dominance_24h_percentage_change: number;
  btc_dominance_24h_percentage_change: number;
  defi_volume_24h: number;
  defi_volume_24h_reported: number;
  defi_market_cap: number;
  defi_24h_percentage_change: number;
  stablecoin_volume_24h: number;
  stablecoin_volume_24h_reported: number;
  stablecoin_market_cap: number;
  stablecoin_24h_percentage_change: number;
  derivatives_volume_24h: number;
  derivatives_volume_24h_reported: number;
  derivatives_24h_percentage_change: number;
  total_crypto_dex_currencies: number;
  quote: {
    USD: {
      total_market_cap: number;
      total_volume_24h: number;
      total_volume_24h_reported: number;
      altcoin_volume_24h: number;
      altcoin_volume_24h_reported: number;
      altcoin_market_cap: number;
      defi_volume_24h: number;
      defi_volume_24h_reported: number;
      defi_24h_percentage_change: number;
      defi_market_cap: number;
      stablecoin_volume_24h: number;
      stablecoin_volume_24h_reported: number;
      stablecoin_24h_percentage_change: number;
      stablecoin_market_cap: number;
      derivatives_volume_24h: number;
      derivatives_volume_24h_reported: number;
      derivatives_24h_percentage_change: number;
      total_market_cap_yesterday: number;
      total_volume_24h_yesterday: number;
      total_market_cap_yesterday_percentage_change: number;
      total_volume_24h_yesterday_percentage_change: number;
      last_updated: string;
    };
  };
  last_updated: string;
  fear_and_greed_index?: {
    value: number;
    classification: string;
    timestamp: string;
  };
}

interface CoinMarketCapResponse {
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
    notice: string | null;
  };
  data: MarketData;
}

// 添加 Fear and Greed 接口
export interface FearAndGreedData {
  data: {
    value: number;
    value_classification: string;
    timestamp: string;
    time_until_update: string;
  };
  status: {
    timestamp: string;
    error_code: number;
    error_message: string | null;
    elapsed: number;
    credit_count: number;
  };
}



export const getMarketOverview = async (): Promise<MarketData> => {
  try {
    const coinClient = getCoinmarketClient();
    const response = await coinClient.get<CoinMarketCapResponse>(
      `/v1/global-metrics/quotes/latest`
    );

    if (response.data.status.error_code !== 0) {
      throw new Error(response.data.status.error_message || "Unknown error");
    }

    return response.data.data;
  } catch (error) {
    console.error("Error fetching market data:", error);
    throw error;
  }
};

export const getFearAndGreedLevel = (value: number): string => {
  if (value >= 0 && value <= 25) return "Extreme Fear";
  if (value > 25 && value <= 45) return "Fear";
  if (value > 45 && value <= 55) return "Neutral";
  if (value > 55 && value <= 75) return "Greed";
  if (value > 75 && value <= 100) return "Extreme Greed";
  return "Unknown";
};

export const getFearAndGreedIndex = async (): Promise<FearAndGreedData['data']> => {
  try {
    const coinClient = getCoinmarketClient();
    const response = await coinClient.get<FearAndGreedData>(
      `/v3/fear-and-greed/latest`
    );
    if (response.data.status.error_code !=0) {
      throw new Error(response.data.status.error_message || "Unknown error");
    }

    return response.data.data;
  } catch (error) {
    console.error("Error fetching fear and greed index:", error);
    throw error;
  }
};
