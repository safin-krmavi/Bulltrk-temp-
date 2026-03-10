import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { marketplaceApi, PurchaseStrategyPayload } from '@/api/marketplace';

const QUERY_KEYS = {
  published: ['marketplace', 'published'] as const,
  myPurchases: ['marketplace', 'my-purchases'] as const,
};

/** Fetches all published strategies available in the marketplace */
export function usePublishedStrategies() {
  return useQuery({
    queryKey: QUERY_KEYS.published,
    queryFn: async () => {
      const res = await marketplaceApi.browsePublished();
      return res.data?.data ?? [];
    },
  });
}

/** Fetches strategies purchased by the current user */
export function useMyPurchases() {
  return useQuery({
    queryKey: QUERY_KEYS.myPurchases,
    queryFn: async () => {
      const res = await marketplaceApi.myPurchases();
      return res.data?.data ?? [];
    },
  });
}

/** Mutation to purchase a strategy */
export function usePurchaseStrategy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: PurchaseStrategyPayload) =>
      marketplaceApi.purchase(payload),
    onSuccess: (res) => {
      const name = res.data?.data?.customName || res.data?.data?.strategyId || 'Strategy';
      toast.success(`"${name}" purchased successfully!`);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.myPurchases });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message || err?.message || 'Purchase failed';
      toast.error(message);
    },
  });
}
