import apiClient from './apiClient';
import { apiurls } from './apiurls';

export interface BalanceResponse {
  status: string;
  data: {
    exchange: string;
    balances: Array<{
      asset: string;
      free: string;
      locked: string;
      total: string;
    }>;
  };
}

export const balanceService = {
  async getBalances(exchange: string, type: string): Promise<BalanceResponse> {
    try {
      const response = await apiClient.post(apiurls.exchangemanagement.getbalance, {
        exchange: exchange.toUpperCase(),
        type: type.toUpperCase(),
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch balances:', error);
      throw new Error(error.response?.data?.message || 'Failed to fetch balances');
    }
  }
};