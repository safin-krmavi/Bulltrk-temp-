import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/api/apiClient';
import { apiurls } from '@/api/apiurls';

// Strategy interface that matches API response
export interface Strategy {
  id: string;
  name: string;
  strategyType: 'GROWTH_DCA' | 'GRID' | 'CUSTOM';
  assetType: 'CRYPTO' | 'STOCK';
  exchange: string;
  segment: string;
  symbol: string;
  investmentPerRun: number;
  investmentCap: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY';
  time?: string;
  daysOfWeek?: number[];
  datesOfMonth?: number[];
  hourInterval?: number;
  takeProfitPct: number;
  stopLossPct: number;
  priceStart?: number;
  priceStop?: number;
  status: 'ACTIVE' | 'PAUSED' | 'STOPPED';
  createdAt: string;
  updatedAt: string;
}

// Internal interface for frontend state management
export interface GrowthDCAStrategy {
  id?: string;
  name: string;
  strategyType: 'GROWTH_DCA';
  assetType: 'CRYPTO';
  exchange: string;
  segment: string;
  symbol: string;
  investmentPerRun: number;
  investmentCap: number;
  frequency: {
    type: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY';
    time?: string;
    days?: string[];
    dates?: number[];
    intervalHours?: number;
  };
  takeProfitPct: number;
  stopLossPct?: number;  // ✅ Optional
  priceStart?: number;   // ✅ Optional
  priceStop?: number;    // ✅ Optional
  executionMode: 'LIVE' | 'PAPER' | 'PUBLISHED'; 
  status?: 'active' | 'paused' | 'stopped';
  createdAt?: string;
  updatedAt?: string;
}

// API payload interface - matches the CURL structure
interface GrowthDCAApiPayload {
  name: string;
  strategyType: 'GROWTH_DCA';
  assetType: 'CRYPTO';
  exchange: string;
  segment: string;
  symbol: string;
  investmentPerRun: number;
  investmentCap: number;
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY';
  takeProfitPct: number;
  stopLossPct?: number;  // ✅ Optional
  priceStart?: number;   // ✅ Optional
  priceStop?: number;    // ✅ Optional
  executionMode: 'LIVE' | 'PAPER' | 'PUBLISHED'; 
  time?: string;
  hourInterval?: number;
  daysOfWeek?: number[];
  datesOfMonth?: number[];
}


export interface Symbol {
  symbol: string;
  base: string;
  quote: string;
}

export interface ExchangeData {
  exchange: string;
  data: Symbol[];
}

export interface SymbolTypeData {
  type: string;
  data: ExchangeData[];
}

export interface BalanceData {
  asset: string;
  free: string;
  locked: string;
  total: string;
}

export interface StrategyState {
  // Strategy State
  strategies: Strategy[];
  growthDCAStrategies: GrowthDCAStrategy[];
  currentStrategy: GrowthDCAStrategy | null;
  isLoading: boolean;
  error: string | null;

  // Symbols State
  symbolsData: SymbolTypeData[];
  isLoadingSymbols: boolean;
  symbolsError: string | null;
  lastFetched: number | null;

  // Balance State
  balances: BalanceData[];
  isLoadingBalances: boolean;
  balancesError: string | null;

  // Strategy Actions
  setStrategies: (strategies: Strategy[]) => void;
  setCurrentStrategy: (strategy: GrowthDCAStrategy | null) => void;
  addStrategy: (strategy: GrowthDCAStrategy) => void;
  updateStrategy: (id: string, updates: Partial<Strategy>) => void;
  removeStrategy: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Symbols Actions
  setSymbolsData: (data: SymbolTypeData[]) => void;
  setLoadingSymbols: (loading: boolean) => void;
  setSymbolsError: (error: string | null) => void;
  clearSymbolsError: () => void;

  // Balance Actions
  setBalances: (balances: BalanceData[]) => void;
  setLoadingBalances: (loading: boolean) => void;
  setBalancesError: (error: string | null) => void;
  clearBalancesError: () => void;

  // Strategy API Methods
  fetchStrategies: () => Promise<void>;
  fetchStrategyById: (id: string) => Promise<Strategy>;
  createGrowthDCA: (strategy: Omit<GrowthDCAStrategy, 'strategyType' | 'assetType'>) => Promise<GrowthDCAStrategy>;
  updateStrategyById: (id: string, updates: Partial<Strategy>) => Promise<Strategy>;
  deleteStrategyById: (id: string) => Promise<void>;

  // Symbols API Methods
  fetchSymbols: () => Promise<void>;
  getSymbolsByExchange: (exchange: string, segment: string) => Symbol[];

  // Balance API Methods
  fetchBalances: (exchange: string, type: string) => Promise<void>;
  getBalanceByAsset: (asset: string) => BalanceData | null;
}

// Helper function to convert day short names to numbers
const dayToNumber = (day: string): number => {
  const dayMap: { [key: string]: number } = {
    'Sun': 0,
    'Mon': 1,
    'Tue': 2,
    'Wed': 3,
    'Thu': 4,
    'Fri': 5,
    'Sat': 6
  };
  return dayMap[day] ?? 0;
};

// Helper function to convert frontend strategy to API payload
const convertToApiPayload = (strategy: GrowthDCAStrategy): GrowthDCAApiPayload => {
  const payload: GrowthDCAApiPayload = {
    name: strategy.name,
    strategyType: 'GROWTH_DCA',
    assetType: 'CRYPTO',
    exchange: strategy.exchange.toUpperCase(),
    segment: strategy.segment.toUpperCase(),
    symbol: strategy.symbol.toUpperCase(),
    investmentPerRun: strategy.investmentPerRun,
    investmentCap: strategy.investmentCap,
    frequency: strategy.frequency.type.toUpperCase() as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY',
    takeProfitPct: strategy.takeProfitPct,
    executionMode: strategy.executionMode || 'LIVE',
  };

if (strategy.stopLossPct != null) {
  payload.stopLossPct = strategy.stopLossPct;
}

if (strategy.priceStart != null) {
  payload.priceStart = strategy.priceStart;
}

if (strategy.priceStop != null) {
  payload.priceStop = strategy.priceStop;
}


  // Add frequency-specific fields based on type
  switch (strategy.frequency.type) {
    case 'DAILY':
    case 'WEEKLY':
    case 'MONTHLY':
      if (strategy.frequency.time) {
        payload.time = strategy.frequency.time;
      }
      break;
    case 'HOURLY':
      if (strategy.frequency.intervalHours) {
        payload.hourInterval = strategy.frequency.intervalHours;
      }
      break;
  }

  // Add days for weekly
  if (strategy.frequency.type === 'WEEKLY' && strategy.frequency.days) {
    payload.daysOfWeek = strategy.frequency.days.map(dayToNumber);
  }

  // Add dates for monthly
  if (strategy.frequency.type === 'MONTHLY' && strategy.frequency.dates) {
    payload.datesOfMonth = strategy.frequency.dates;
  }

  return payload;
};

export const useStrategyStore = create<StrategyState>()(
  persist(
    (set, get) => ({
      // Initial State
      strategies: [],
      growthDCAStrategies: [],
      currentStrategy: null,
      isLoading: false,
      error: null,

      // Initial Symbols State
      symbolsData: [],
      isLoadingSymbols: false,
      symbolsError: null,
      lastFetched: null,

      // Initial Balance State
      balances: [],
      isLoadingBalances: false,
      balancesError: null,

      // Strategy State Setters
      setStrategies: (strategies: Strategy[]) => set({ strategies }),
      setCurrentStrategy: (strategy: GrowthDCAStrategy | null) => set({ currentStrategy: strategy }),
      addStrategy: (strategy: GrowthDCAStrategy) => set((state) => ({ 
        growthDCAStrategies: [...state.growthDCAStrategies, strategy] 
      })),
      updateStrategy: (id: string, updates: Partial<Strategy>) => set((state) => ({
        strategies: state.strategies.map((s) => s.id === id ? { ...s, ...updates } : s),
      })),
      removeStrategy: (id: string) => set((state) => ({ 
        strategies: state.strategies.filter((s) => s.id !== id) 
      })),
      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),

      // Symbols State Setters
      setSymbolsData: (data: SymbolTypeData[]) => set({ symbolsData: data, lastFetched: Date.now() }),
      setLoadingSymbols: (loading: boolean) => set({ isLoadingSymbols: loading }),
      setSymbolsError: (error: string | null) => set({ symbolsError: error }),
      clearSymbolsError: () => set({ symbolsError: null }),

      // Balance State Setters
      setBalances: (balances: BalanceData[]) => set({ balances }),
      setLoadingBalances: (loading: boolean) => set({ isLoadingBalances: loading }),
      setBalancesError: (error: string | null) => set({ balancesError: error }),
      clearBalancesError: () => set({ balancesError: null }),

      // Fetch All Strategies
      fetchStrategies: async () => {
        set({ isLoading: true, error: null });
        try {
          console.log("Fetching all strategies...");
          const response = await apiClient.get(apiurls.strategies.getAll);
          
          console.log("Strategies API response:", response.data);
          
          if (response.data?.data) {
            const strategiesData = Array.isArray(response.data.data) 
              ? response.data.data 
              : [response.data.data];
            
            set({ strategies: strategiesData, isLoading: false });
            console.log("Strategies loaded:", strategiesData.length);
          } else {
            set({ strategies: [], isLoading: false });
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch strategies';
          console.error("Failed to fetch strategies:", error);
          set({ error: errorMessage, isLoading: false, strategies: [] });
          throw new Error(errorMessage);
        }
      },

      // Fetch Strategy by ID
      fetchStrategyById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const url = apiurls.strategies.getById.replace(':id', id);
          console.log("Fetching strategy:", url);
          
          const response = await apiClient.get(url);
          
          if (response.data?.data) {
            const strategy = response.data.data as Strategy;
            set({ isLoading: false });
            return strategy;
          }
          
          throw new Error('Invalid response from server');
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch strategy';
          console.error("Failed to fetch strategy:", error);
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      // Create Growth DCA Strategy
      createGrowthDCA: async (strategyInput: Omit<GrowthDCAStrategy, 'strategyType' | 'assetType'>) => {
        console.log("=== Creating Growth DCA Strategy ===");
        set({ isLoading: true, error: null });
        
        try {
          const strategy: GrowthDCAStrategy = {
            ...strategyInput,
            strategyType: 'GROWTH_DCA',
            assetType: 'CRYPTO',
          };

          const apiPayload = convertToApiPayload(strategy);
          console.log("API Payload:", apiPayload);

          const response = await apiClient.post(apiurls.strategies.growthDCA, apiPayload);

          if (response.data?.data) {
            const newStrategy = response.data.data as GrowthDCAStrategy;
            get().addStrategy(newStrategy);
            set({ isLoading: false });
            
            // Refresh strategies list
            await get().fetchStrategies();
            
            return newStrategy;
          }

          throw new Error('Invalid response from server');
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to create strategy';
          console.error("Failed to create strategy:", error);
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      // Update Strategy by ID
      updateStrategyById: async (id: string, updates: Partial<Strategy>) => {
        set({ isLoading: true, error: null });
        try {
          const url = apiurls.strategies.update.replace(':id', id);
          console.log("Updating strategy:", url);
          console.log("Update payload:", updates);

          const response = await apiClient.put(url, updates);

          if (response.data?.data) {
            const updatedStrategy = response.data.data as Strategy;
            get().updateStrategy(id, updatedStrategy);
            set({ isLoading: false });
            
            // Refresh strategies list
            await get().fetchStrategies();
            
            console.log("Strategy updated successfully:", updatedStrategy);
            return updatedStrategy;
          }

          throw new Error('Invalid response from server');
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to update strategy';
          console.error("Failed to update strategy:", error);
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      // Delete Strategy by ID
      deleteStrategyById: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const url = apiurls.strategies.delete.replace(':id', id);
          console.log("Deleting strategy:", url);

          await apiClient.delete(url);
          
          get().removeStrategy(id);
          set({ isLoading: false });
          
          // Refresh strategies list
          await get().fetchStrategies();
          
          console.log("Strategy deleted successfully");
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to delete strategy';
          console.error("Failed to delete strategy:", error);
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      // Fetch Symbols (with caching)
      fetchSymbols: async () => {
        const { lastFetched } = get();
        
        // Cache for 5 minutes
        if (lastFetched && Date.now() - lastFetched < 5 * 60 * 1000) {
          console.log("Using cached symbols data");
          return;
        }

        set({ isLoadingSymbols: true, symbolsError: null });
        try {
          const response = await apiClient.get(apiurls.exchangemanagement.getSymbol);
          
          if (response.data?.data) {
            const symbolsData = Array.isArray(response.data.data) 
              ? response.data.data 
              : [response.data.data];
            
            set({ symbolsData, isLoadingSymbols: false, lastFetched: Date.now() });
          } else {
            set({ symbolsData: [], isLoadingSymbols: false });
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch symbols';
          set({ symbolsError: errorMessage, isLoadingSymbols: false, symbolsData: [] });
          throw new Error(errorMessage);
        }
      },

      // Get Symbols by Exchange and Segment
      getSymbolsByExchange: (exchange: string, segment: string) => {
        const { symbolsData } = get();
        
        const segmentTypeMap: { [key: string]: string } = {
          'SPOT': 'CRYPTO_SPOT',
          'FUTURES': 'CRYPTO_FUTURES',
          'MARGIN': 'CRYPTO_MARGIN',
        };
        
        const typeToFind = segmentTypeMap[segment.toUpperCase()] || `CRYPTO_${segment.toUpperCase()}`;
        const typeData = symbolsData.find(td => td.type === typeToFind);
        
        if (!typeData) return [];
        
        const exchangeData = typeData.data.find(
          ed => ed.exchange.toUpperCase() === exchange.toUpperCase()
        );
        
        if (!exchangeData) return [];
        
        return exchangeData.data;
      },

      // Fetch Balances
      fetchBalances: async (exchange: string, type: string) => {
        set({ isLoadingBalances: true, balancesError: null });
        try {
          const response = await apiClient.post(apiurls.exchangemanagement.getbalance, {
            exchange: exchange.toUpperCase(),
            type: type.toUpperCase(),
          });

          if (response.data?.data?.balances) {
            set({ balances: response.data.data.balances, isLoadingBalances: false });
          } else {
            set({ balances: [], isLoadingBalances: false });
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch balances';
          set({ balancesError: errorMessage, isLoadingBalances: false, balances: [] });
        }
      },

      // Get Balance by Asset
      getBalanceByAsset: (asset: string) => {
        const { balances } = get();
        return balances.find(b => b.asset.toUpperCase() === asset.toUpperCase()) || null;
      },
    }),
    {
      name: 'strategy-storage',
      partialize: (state) => ({
        strategies: state.strategies,
        growthDCAStrategies: state.growthDCAStrategies,
        currentStrategy: state.currentStrategy,
        symbolsData: state.symbolsData,
        lastFetched: state.lastFetched,
      }),
    }
  )
);