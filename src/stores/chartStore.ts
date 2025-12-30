import { create } from 'zustand';
import { candleService, CandleData } from '@/api/candle';

export interface ChartState {
  candles: CandleData[];
  isLoading: boolean;
  error: string | null;
  
  // Current chart settings
  exchange: string;
  symbol: string;
  interval: string;
  
  // Actions
  setExchange: (exchange: string) => void;
  setSymbol: (symbol: string) => void;
  setInterval: (interval: string) => void;
  fetchCandles: (exchange: string, symbol: string, interval: string) => Promise<void>;
  clearError: () => void;
}

export const useChartStore = create<ChartState>((set) => ({
  candles: [],
  isLoading: false,
  error: null,
  exchange: 'BINANCE',
  symbol: 'BTCUSDT',
  interval: '1h',
  
  setExchange: (exchange: string) => set({ exchange }),
  setSymbol: (symbol: string) => set({ symbol }),
  setInterval: (interval: string) => set({ interval }),
  
  fetchCandles: async (exchange: string, symbol: string, interval: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await candleService.getCandles(exchange, symbol, interval);
      set({ 
        candles: response.data, 
        isLoading: false,
        exchange,
        symbol,
        interval
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to fetch candle data';
      set({ 
        error: errorMessage, 
        isLoading: false,
        candles: []
      });
    }
  },
  
  clearError: () => set({ error: null }),
}));