import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/api/apiClient';
import { apiurls } from '@/api/apiurls';

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
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY';
  takeProfitPct: number;
  stopLossPct: number;
  priceStart: number;
  priceStop: number;
  status?: 'active' | 'paused' | 'stopped';
  createdAt?: string;
  updatedAt?: string;
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
  strategies: GrowthDCAStrategy[];
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
  setStrategies: (strategies: GrowthDCAStrategy[]) => void;
  setCurrentStrategy: (strategy: GrowthDCAStrategy | null) => void;
  addStrategy: (strategy: GrowthDCAStrategy) => void;
  updateStrategy: (id: string, updates: Partial<GrowthDCAStrategy>) => void;
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
  createGrowthDCA: (strategy: Omit<GrowthDCAStrategy, 'strategyType' | 'assetType'>) => Promise<GrowthDCAStrategy>;
  updateGrowthDCA: (id: string, updates: Partial<GrowthDCAStrategy>) => Promise<void>;
  deleteStrategy: (id: string) => Promise<void>;

  // Symbols API Methods
  fetchSymbols: () => Promise<void>;
  getSymbolsByExchange: (exchange: string, segment: string) => Symbol[];

  // Balance API Methods
  fetchBalances: (exchange: string, type: string) => Promise<void>;
  getBalanceByAsset: (asset: string) => BalanceData | null;
}

export const useStrategyStore = create<StrategyState>()(
  persist(
    (set, get) => ({
      // Initial Strategy State
      strategies: [],
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
      setStrategies: (strategies: GrowthDCAStrategy[]) => set({ strategies }),
      setCurrentStrategy: (strategy: GrowthDCAStrategy | null) => set({ currentStrategy: strategy }),
      addStrategy: (strategy: GrowthDCAStrategy) => set((state) => ({ strategies: [...state.strategies, strategy] })),
      updateStrategy: (id: string, updates: Partial<GrowthDCAStrategy>) => set((state) => ({
        strategies: state.strategies.map((s) => s.id === id ? { ...s, ...updates } : s),
      })),
      removeStrategy: (id: string) => set((state) => ({ strategies: state.strategies.filter((s) => s.id !== id) })),
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
          const response = await apiClient.get(apiurls.strategies.growthDCA);
          const strategiesData = Array.isArray(response.data?.data) ? response.data.data : [];
          set({ strategies: strategiesData, isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch strategies';
          set({ error: errorMessage, isLoading: false, strategies: [] });
          throw new Error(errorMessage);
        }
      },

      // Create Growth DCA Strategy
      createGrowthDCA: async (strategyInput: Omit<GrowthDCAStrategy, 'strategyType' | 'assetType'>) => {
        console.log("=== STRATEGY STORE: createGrowthDCA called ===");
        console.log("Input:", strategyInput);
        
        set({ isLoading: true, error: null });
        
        try {
          const strategy: GrowthDCAStrategy = {
            ...strategyInput,
            strategyType: 'GROWTH_DCA',
            assetType: 'CRYPTO',
          };

          console.log("Complete strategy object:", strategy);
          console.log("API URL:", apiurls.strategies.growthDCA);
          console.log("Making POST request...");

          const response = await apiClient.post(apiurls.strategies.growthDCA, strategy);

          console.log("API Response:", response.data);

          if (response.data?.data) {
            const newStrategy = response.data.data as GrowthDCAStrategy;
            get().addStrategy(newStrategy);
            set({ isLoading: false });
            console.log("Strategy created successfully:", newStrategy);
            return newStrategy;
          }

          throw new Error('Invalid response from server');
        } catch (error: any) {
          console.error("=== STRATEGY STORE: ERROR ===");
          console.error("Error:", error);
          console.error("Response data:", error.response?.data);
          console.error("Response status:", error.response?.status);
          
          const errorMessage = error.response?.data?.message || 'Failed to create strategy';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      // Update Growth DCA Strategy
      updateGrowthDCA: async (id: string, updates: Partial<GrowthDCAStrategy>) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.put(`${apiurls.strategies.growthDCA}/${id}`, updates);
          if (response.data?.data) {
            const updatedStrategy = response.data.data as GrowthDCAStrategy;
            get().updateStrategy(id, updatedStrategy);
            set({ isLoading: false });
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to update strategy';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      // Delete Strategy
      deleteStrategy: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.delete(`${apiurls.strategies.growthDCA}/${id}`);
          get().removeStrategy(id);
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to delete strategy';
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
          console.log("Fetching symbols from:", apiurls.exchangemanagement.getSymbol);
          const response = await apiClient.get(apiurls.exchangemanagement.getSymbol);
          
          console.log("Symbols API response:", response.data);
          
          if (response.data?.data) {
            const symbolsData = Array.isArray(response.data.data) 
              ? response.data.data 
              : [response.data.data];
            
            set({ 
              symbolsData, 
              isLoadingSymbols: false, 
              lastFetched: Date.now() 
            });
            
            console.log("Symbols loaded successfully:", symbolsData.length, "types");
          } else {
            set({ symbolsData: [], isLoadingSymbols: false });
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch symbols';
          console.error("Failed to fetch symbols:", error);
          set({ 
            symbolsError: errorMessage, 
            isLoadingSymbols: false, 
            symbolsData: [] 
          });
          throw new Error(errorMessage);
        }
      },

      // Get Symbols by Exchange and Segment
      getSymbolsByExchange: (exchange: string, segment: string) => {
        const { symbolsData } = get();
        
        // Map segment to type format (e.g., "SPOT" -> "CRYPTO_SPOT")
        const segmentTypeMap: { [key: string]: string } = {
          'SPOT': 'CRYPTO_SPOT',
          'FUTURES': 'CRYPTO_FUTURES',
          'MARGIN': 'CRYPTO_MARGIN',
        };
        
        const typeToFind = segmentTypeMap[segment.toUpperCase()] || `CRYPTO_${segment.toUpperCase()}`;
        
        console.log("Looking for symbols:", { exchange, segment, typeToFind });
        
        // Find the type data (e.g., CRYPTO_SPOT)
        const typeData = symbolsData.find(td => td.type === typeToFind);
        
        if (!typeData) {
          console.log("Type not found:", typeToFind);
          return [];
        }
        
        // Find the exchange data within that type
        const exchangeData = typeData.data.find(
          ed => ed.exchange.toUpperCase() === exchange.toUpperCase()
        );
        
        if (!exchangeData) {
          console.log("Exchange not found:", exchange);
          return [];
        }
        
        console.log(`Found ${exchangeData.data.length} symbols for ${exchange} ${segment}`);
        return exchangeData.data;
      },

      // Fetch Balances
      fetchBalances: async (exchange: string, type: string) => {
        set({ isLoadingBalances: true, balancesError: null });
        try {
          console.log('Fetching balances for:', exchange, type);
          const response = await apiClient.post(apiurls.exchangemanagement.getbalance, {
            exchange: exchange.toUpperCase(),
            type: type.toUpperCase(),
          });

          console.log('Balances API response:', response.data);

          if (response.data?.data?.balances) {
            set({ 
              balances: response.data.data.balances, 
              isLoadingBalances: false 
            });
          } else {
            set({ balances: [], isLoadingBalances: false });
          }
        } catch (error: any) {
          const errorMessage = error.response?.data?.message || 'Failed to fetch balances';
          console.error('Failed to fetch balances:', error);
          set({ 
            balancesError: errorMessage, 
            isLoadingBalances: false, 
            balances: [] 
          });
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
        currentStrategy: state.currentStrategy,
        symbolsData: state.symbolsData,
        lastFetched: state.lastFetched,
      }),
    }
  )
);