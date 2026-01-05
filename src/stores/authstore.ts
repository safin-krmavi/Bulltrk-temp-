import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '../api/apiClient';
import { apiurls } from '@/api/apiurls';
import { LoginResponse } from '@/api/auth';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  [key: string]: any;
}

export interface BrokerageConnection {
  id: string;
  userId: string;
  exchange: string; 
  apiKey: string;
  apiSecret: string;
  apiPassphrase?: string;
  apiKeyVersion?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  // State
  token: string | null;
  user: User | null;
  apiConnections: BrokerageConnection[];
  isAuthenticated: boolean; 
  isLoading: boolean;
  error: string | null;
  hasSelectedPlan: boolean; // New field to track if user has selected a plan

  // Actions
  setToken: (token: string) => void;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  setApiConnections: (connections: BrokerageConnection[]) => void;
  addApiConnection: (connection: BrokerageConnection) => void;
  removeApiConnection: (id: string) => void;
  setHasSelectedPlan: (hasSelected: boolean) => void; // New action
  
  // Auth Methods
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    roleId: string;
  }) => Promise<LoginResponse>;
  logout: () => void;
  fetchUser: () => Promise<void>;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial State
      token: null,
      user: null,
      apiConnections: [],
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasSelectedPlan: false,

      // State Setters
      setToken: (token: string) => {
        set({ token, isAuthenticated: !!token });
        localStorage.setItem('AUTH_TOKEN', token);
      },

      setUser: (user: User | null) => {
        set({ user });
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        } else {
          localStorage.removeItem('user');
        }
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates };
          set({ user: updatedUser });
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),

      clearError: () => set({ error: null }),

      setApiConnections: (connections: BrokerageConnection[]) => set({ apiConnections: connections }),

      addApiConnection: (connection: BrokerageConnection) => set((state) => ({ 
        apiConnections: [...state.apiConnections, connection] 
      })),

      removeApiConnection: (id: string) => set((state) => ({ 
        apiConnections: state.apiConnections.filter(conn => conn.id !== id) 
      })),

      setHasSelectedPlan: (hasSelected: boolean) => {
        set({ hasSelectedPlan: hasSelected });
        localStorage.setItem('hasSelectedPlan', JSON.stringify(hasSelected));
      },

      // Login Action
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post<LoginResponse>(
            apiurls.userAuth.login,
            { email, password }
          );

          const { token, user } = response.data.data;
          
          get().setToken(token);
          get().setUser(user as User);
          set({ isLoading: false });
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || 'Login failed';
          set({ 
            error: errorMessage, 
            isLoading: false,
            isAuthenticated: false 
          });
          throw new Error(errorMessage);
        }
      },

      // Register Action
      register: async (data: {
        name: string;
        email: string;
        phone: string;
        password: string;
        roleId: string;
      }) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post<LoginResponse>(
            apiurls.userAuth.signup,
            data
          );

          set({ isLoading: false });
          return response.data;
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.message || 'Registration failed';
          set({ error: errorMessage, isLoading: false });
          throw new Error(errorMessage);
        }
      },

      // Fetch User Profile
      fetchUser: async () => {
        const token = get().token;
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get(apiurls.userAuth.me);
          const userData = response.data.data as User;
          get().setUser(userData);
          set({ isLoading: false, isAuthenticated: true, error: null });
        } catch (error: any) {
          console.error('Failed to fetch user:', error);
          const errorMessage = error.response?.data?.message || 'Failed to fetch user profile';
          set({ 
            isLoading: false, 
            isAuthenticated: false,
            user: null,
            token: null,
            error: errorMessage
          });
          localStorage.removeItem('AUTH_TOKEN');
        }
      },

      // Logout Action
      logout: () => {
        set({
          token: null,
          user: null,
          apiConnections: [],
          isAuthenticated: false,
          hasSelectedPlan: false,
          error: null,
        });
        localStorage.removeItem('AUTH_TOKEN');
        localStorage.removeItem('user');
        localStorage.removeItem('hasSelectedPlan');
      },

      // Hydrate from localStorage on app start
      hydrate: () => {
        const token = localStorage.getItem('AUTH_TOKEN');
        const userStr = localStorage.getItem('user');
        const hasSelectedPlanStr = localStorage.getItem('hasSelectedPlan');
        
        if (token) {
          set({ token, isAuthenticated: true });
          if (userStr) {
            try {
              const user = JSON.parse(userStr) as User;
              set({ user });
            } catch (e) {
              console.error('Failed to parse user from storage:', e);
            }
          }
          if (hasSelectedPlanStr) {
            try {
              const hasSelectedPlan = JSON.parse(hasSelectedPlanStr);
              set({ hasSelectedPlan });
            } catch (e) {
              console.error('Failed to parse hasSelectedPlan from storage:', e);
            }
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        hasSelectedPlan: state.hasSelectedPlan,
      }),
    }
  )
);