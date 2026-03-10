import apiClient from '@/api/apiClient';
import { apiurls } from '@/api/apiurls';
import type { AxiosResponse } from 'axios';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MarketplaceStrategy {
  id: string;
  userId: string;
  name: string;
  strategyType: string;
  assetType: string;
  exchange: string;
  segment: string;
  symbol: string;
  status?: string;
  executionMode?: string;
  nextRunAt?: string | null;
  lastExecutedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  config?: {
    exit?: {
      bookProfit?: { enabled: boolean; percentage: number };
    };
    risk?: {
      stopLoss?: { enabled: boolean; percentage: number };
    };
    capital?: {
      maxCapital: number;
      perOrderAmount: number;
    };
    schedule?: {
      frequency: string;
      weekly?: { time: string; daysOfWeek: number[] };
    };
  };
  _count?: {
    copyFollowers?: number;
    purchases?: number;
  };
  performance?: {
    roi?: number;
    totalPnl?: number;
    winRate?: number;
    totalTrades?: number;
  };
  pricing?: {
    price?: number;
    currency?: string;
    isFree?: boolean;
  };
}

export type ExecutionMode = 'PAPER' | 'LIVE';

export interface PurchaseStrategyPayload {
  strategyId: string;
  executionMode: ExecutionMode;
  customName?: string;
}

export interface PurchasedStrategy {
  id: string;
  strategyId: string;
  userId: string;
  executionMode: ExecutionMode;
  customName?: string;
  purchasedAt: string;
  status?: string;
  strategy?: MarketplaceStrategy;
}

export interface BrowsePublishedResponse {
  data: MarketplaceStrategy[];
  message?: string;
  total?: number;
}

export interface PurchaseResponse {
  data: PurchasedStrategy;
  message?: string;
}

export interface MyPurchasesResponse {
  data: PurchasedStrategy[];
  message?: string;
  total?: number;
}

// ── API functions ──────────────────────────────────────────────────────────

export const marketplaceApi = {
  /** GET /strategy/strategies/published */
  browsePublished: (): Promise<AxiosResponse<BrowsePublishedResponse>> =>
    apiClient.get(apiurls.marketplace.browsePublished),

  /** POST /strategy/strategies/purchase */
  purchase: (payload: PurchaseStrategyPayload): Promise<AxiosResponse<PurchaseResponse>> =>
    apiClient.post(apiurls.marketplace.purchase, payload),

  /** GET /strategy/strategies/purchases/me */
  myPurchases: (): Promise<AxiosResponse<MyPurchasesResponse>> =>
    apiClient.get(apiurls.marketplace.myPurchases),
};
