import { create } from 'zustand';
import apiClient from '@/api/apiClient';
import { apiurls } from '@/api/apiurls';
import { toast } from 'sonner';

// Types for Copy Trade
export interface PublishedStrategy {
  id: string;
  name: string;
  strategyType: 'GROWTH_DCA' | string;
  assetType: 'CRYPTO';
  exchange: string;
  segment: string;
  symbol: string;
  config?: {
    exit?: {
      bookProfit?: {
        enabled: boolean;
        percentage: number;
      };
    };
    risk?: {
      stopLoss?: {
        enabled: boolean;
        percentage: number;
      };
    };
    entry?: {
      priceTrigger?: {
        enabled: boolean;
      };
    };
    capital?: {
      maxCapital: number;
      perOrderAmount: number;
    };
    schedule?: {
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY';
      weekly?: {
        time: string;
        daysOfWeek: number[];
      };
    };
  };
  status?: 'ACTIVE' | 'PAUSED' | 'STOPPED';
  executionMode: 'PUBLISHED';
  nextRunAt?: string;
  lastExecutedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    copyFollowers: number;
  };
}

// ✅ Fix: Make SubscribedStrategy not extend PublishedStrategy to avoid status conflict
export interface SubscribedStrategy {
  id: string;
  name: string;
  strategyType: 'GROWTH_DCA' | string;
  assetType: 'CRYPTO';
  exchange: string;
  segment: string;
  symbol: string;
  config?: {
    exit?: {
      bookProfit?: {
        enabled: boolean;
        percentage: number;
      };
    };
    risk?: {
      stopLoss?: {
        enabled: boolean;
        percentage: number;
      };
    };
    entry?: {
      priceTrigger?: {
        enabled: boolean;
      };
    };
    capital?: {
      maxCapital: number;
      perOrderAmount: number;
    };
    schedule?: {
      frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'HOURLY';
      weekly?: {
        time: string;
        daysOfWeek: number[];
      };
    };
  };
  status: 'ACTIVE' | 'PAUSED' | 'STOPPED';  // ✅ Changed to uppercase to match API
  executionMode: 'PUBLISHED';
  nextRunAt?: string;
  lastExecutedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    copyFollowers: number;
  };
  // Subscription specific fields
  subscriptionId: string;
  subscribedAt: string;
  allocation?: number; // Allocated funds in USDT
}

export interface SubscriptionResponse {
  id: string;
  strategyId: string;
  userId: string;
  status: 'ACTIVE' | 'PAUSED' | 'STOPPED';  // ✅ Changed to uppercase
  allocation: number;
  subscribedAt: string;
  strategy?: PublishedStrategy;
}

export interface CopyTradeState {
  // Published Strategies
  publishedStrategies: PublishedStrategy[];
  isLoadingPublished: boolean;
  publishedError: string | null;

  // Subscribed Strategies
  subscribedStrategies: SubscribedStrategy[];
  isLoadingSubscribed: boolean;
  subscribedError: string | null;

  // Loading states
  isSubscribing: boolean;
  isUnsubscribing: boolean;

  // Actions
  fetchPublishedStrategies: () => Promise<void>;
  fetchSubscribedStrategies: () => Promise<void>;
  subscribeToStrategy: (strategyId: string, allocation: number) => Promise<SubscriptionResponse>;
  unsubscribeFromStrategy: (subscriptionId: string) => Promise<void>;
  pauseSubscription: (subscriptionId: string) => Promise<void>;
  resumeSubscription: (subscriptionId: string) => Promise<void>;
  
  // Utility functions
  clearPublishedError: () => void;
  clearSubscribedError: () => void;
  getStrategyById: (id: string) => PublishedStrategy | undefined;
  getSubscriptionById: (id: string) => SubscribedStrategy | undefined;
}

export const useCopyTradeStore = create<CopyTradeState>((set, get) => ({
  // Initial State
  publishedStrategies: [],
  isLoadingPublished: false,
  publishedError: null,

  subscribedStrategies: [],
  isLoadingSubscribed: false,
  subscribedError: null,

  isSubscribing: false,
  isUnsubscribing: false,

  // ✅ Fetch all published strategies
  fetchPublishedStrategies: async () => {
    set({ isLoadingPublished: true, publishedError: null });
    
    try {
      console.log("Fetching published strategies from:", apiurls.Copytrade.getallstratgies);
      
      const response = await apiClient.get<{ 
        data: PublishedStrategy[]; 
        message: string;
      }>(apiurls.Copytrade.getallstratgies);

      if (response.data?.data) {
        set({ 
          publishedStrategies: response.data.data,
          isLoadingPublished: false 
        });
        console.log("Published strategies fetched:", response.data.data.length);
      } else {
        throw new Error('No data received from server');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch published strategies';
      console.error("Error fetching published strategies:", error);
      set({ 
        publishedError: errorMessage,
        isLoadingPublished: false,
        publishedStrategies: []
      });
      toast.error("Failed to load strategies", {
        description: errorMessage
      });
    }
  },

  // ✅ Fetch user's subscribed strategies
  fetchSubscribedStrategies: async () => {
    set({ isLoadingSubscribed: true, subscribedError: null });
    
    try {
      console.log("Fetching subscribed strategies from:", apiurls.Copytrade.getsubscribedstrategies);
      
      const response = await apiClient.get<{ 
        data: SubscriptionResponse[]; 
        message: string;
      }>(apiurls.Copytrade.getsubscribedstrategies);

      if (response.data?.data) {
        // Transform subscription responses to subscribed strategies
        const subscribedStrategies: SubscribedStrategy[] = response.data.data.map((sub) => ({
          ...(sub.strategy || {} as PublishedStrategy),
          subscriptionId: sub.id,
          subscribedAt: sub.subscribedAt,
          status: sub.status,  // ✅ Now matches uppercase type
          allocation: sub.allocation,
        } as SubscribedStrategy));

        set({ 
          subscribedStrategies,
          isLoadingSubscribed: false 
        });
        console.log("Subscribed strategies fetched:", subscribedStrategies.length);
      } else {
        throw new Error('No data received from server');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch subscribed strategies';
      console.error("Error fetching subscribed strategies:", error);
      set({ 
        subscribedError: errorMessage,
        isLoadingSubscribed: false,
        subscribedStrategies: []
      });
      toast.error("Failed to load subscribed strategies", {
        description: errorMessage
      });
    }
  },

  // ✅ Subscribe to a strategy
  subscribeToStrategy: async (strategyId: string, allocation: number) => {
    set({ isSubscribing: true });
    
    try {
      if (!strategyId || allocation <= 0) {
        throw new Error('Invalid strategy ID or allocation amount');
      }

      const url = apiurls.Copytrade.subscribestrategy.replace(':id', strategyId);
      console.log("Subscribing to strategy:", url);

      const response = await apiClient.post<{ 
        data: SubscriptionResponse; 
        message: string;
      }>(url, {
        multiplier: Number(allocation),  // ✅ API expects "multiplier" not "allocation"
      });

      if (response.data?.data) {
        // Add to subscribed strategies
        const newSubscription = response.data.data;
        const subscribedStrategy: SubscribedStrategy = {
          ...(newSubscription.strategy || {} as PublishedStrategy),
          subscriptionId: newSubscription.id,
          subscribedAt: newSubscription.subscribedAt,
          status: newSubscription.status,  // ✅ Now matches uppercase type
          allocation: newSubscription.allocation,
        } as SubscribedStrategy;

        set((state) => ({
          subscribedStrategies: [...state.subscribedStrategies, subscribedStrategy],
          isSubscribing: false,
        }));

        toast.success("Successfully subscribed! 🎉", {
          description: `You've subscribed to ${subscribedStrategy.name || 'the strategy'} with multiplier ${allocation}`
        });

        return newSubscription;
      } else {
        throw new Error('No data received from server');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to subscribe to strategy';
      console.error("Error subscribing to strategy:", error);
      set({ isSubscribing: false });
      toast.error("Subscription failed", {
        description: errorMessage
      });
      throw error;
    }
  },

  // ✅ Unsubscribe from a strategy
  unsubscribeFromStrategy: async (subscriptionId: string) => {
    set({ isUnsubscribing: true });
    
    try {
      if (!subscriptionId) {
        throw new Error('Invalid subscription ID');
      }

      const url = apiurls.Copytrade.unsubscribestrategy.replace(':id', subscriptionId);
      console.log("Unsubscribing from strategy:", url);

      await apiClient.delete(url);

      // Remove from subscribed strategies
      set((state) => ({
        subscribedStrategies: state.subscribedStrategies.filter(
          (s) => s.subscriptionId !== subscriptionId
        ),
        isUnsubscribing: false,
      }));

      toast.success("Unsubscribed successfully", {
        description: "You've been unsubscribed from this strategy"
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to unsubscribe';
      console.error("Error unsubscribing from strategy:", error);
      set({ isUnsubscribing: false });
      toast.error("Unsubscription failed", {
        description: errorMessage
      });
      throw error;
    }
  },

  // ✅ Pause subscription
  pauseSubscription: async (subscriptionId: string) => {
    try {
      if (!subscriptionId) {
        throw new Error('Invalid subscription ID');
      }

      const url = apiurls.Copytrade.unsubscribestrategy.replace(':id', subscriptionId);
      
      const response = await apiClient.patch<{ 
        data: SubscriptionResponse; 
        message: string;
      }>(url, { status: 'PAUSED' });  // ✅ Changed to uppercase

      if (response.data?.data) {
        // Update subscribed strategies
        set((state) => ({
          subscribedStrategies: state.subscribedStrategies.map((s) =>
            s.subscriptionId === subscriptionId
              ? { ...s, status: 'PAUSED' }  // ✅ Changed to uppercase
              : s
          ),
        }));

        toast.success("Subscription paused", {
          description: "Your subscription has been paused"
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to pause subscription';
      console.error("Error pausing subscription:", error);
      toast.error("Failed to pause subscription", {
        description: errorMessage
      });
      throw error;
    }
  },

  // ✅ Resume subscription
  resumeSubscription: async (subscriptionId: string) => {
    try {
      if (!subscriptionId) {
        throw new Error('Invalid subscription ID');
      }

      const url = apiurls.Copytrade.unsubscribestrategy.replace(':id', subscriptionId);
      
      const response = await apiClient.patch<{ 
        data: SubscriptionResponse; 
        message: string;
      }>(url, { status: 'ACTIVE' });  // ✅ Changed to uppercase

      if (response.data?.data) {
        // Update subscribed strategies
        set((state) => ({
          subscribedStrategies: state.subscribedStrategies.map((s) =>
            s.subscriptionId === subscriptionId
              ? { ...s, status: 'ACTIVE' }  // ✅ Changed to uppercase
              : s
          ),
        }));

        toast.success("Subscription resumed", {
          description: "Your subscription is now active"
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to resume subscription';
      console.error("Error resuming subscription:", error);
      toast.error("Failed to resume subscription", {
        description: errorMessage
      });
      throw error;
    }
  },

  // ✅ Clear errors
  clearPublishedError: () => set({ publishedError: null }),
  clearSubscribedError: () => set({ subscribedError: null }),

  // ✅ Get strategy by ID
  getStrategyById: (id: string) => {
    const state = get();
    return state.publishedStrategies.find((s) => s.id === id);
  },

  // ✅ Get subscription by ID
  getSubscriptionById: (id: string) => {
    const state = get();
    return state.subscribedStrategies.find((s) => s.subscriptionId === id);
  },
}));