import { QueryClient } from '@tanstack/react-query';

/*
 * Shared TanStack Query client. Defaults tuned for a mobile app talking to the
 * /api/v1 REST layer: retry transient failures a couple of times, treat data as
 * fresh briefly to avoid refetch storms on navigation. Per-query overrides
 * handle the 10s polling badges (refetchInterval) and optimistic updates.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 30_000,
    },
  },
});
