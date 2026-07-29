import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiFetch } from '@/lib/api';
import type {
  Category,
  ChatMessage,
  Conversation,
  FriendRequest,
  GearItem,
  Me,
  Message,
  Notification,
  PublicUser,
  ReportInput,
  SearchResults,
  Trip,
  TripGearItem,
  TripInvite,
  TripWeatherDay,
} from '@/types';

/*
 * TanStack Query hooks for the whole /api/v1 surface the app uses. Badge
 * counts poll every 10s — exact parity with the web dashboard's polling.
 */

const POLL_MS = 10_000;

// --- me ---
export const useMe = () => useQuery({ queryKey: ['me'], queryFn: () => apiFetch<Me>('/api/v1/me') });

export function useUpdateMe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Pick<Me, 'fullName' | 'bio' | 'location'>>) =>
      apiFetch<Me>('/api/v1/me', { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });
}

// --- gear ---
export const useGear = () =>
  useQuery({ queryKey: ['gear'], queryFn: () => apiFetch<GearItem[]>('/api/v1/gear') });

export const useCategories = () =>
  useQuery({
    queryKey: ['categories'],
    queryFn: () => apiFetch<Category[]>('/api/v1/categories'),
    staleTime: Infinity,
  });

export interface GearInput {
  name: string;
  brand: string | null;
  weightGrams: number;
  categoryId: string;
  condition: string;
}

export function useSaveGear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: GearInput & { id?: string }) =>
      id
        ? apiFetch<GearItem>(`/api/v1/gear/${id}`, { method: 'PATCH', body: JSON.stringify(input) })
        : apiFetch<GearItem>('/api/v1/gear', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gear'] }),
  });
}

export function useDeleteGear() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/gear/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['gear'] }),
  });
}

// --- trips ---
export const useTrips = () =>
  useQuery({ queryKey: ['trips'], queryFn: () => apiFetch<Trip[]>('/api/v1/trips') });

export const useTrip = (id: string) =>
  useQuery({ queryKey: ['trips', id], queryFn: () => apiFetch<Trip>(`/api/v1/trips/${id}`) });

export const useFriendTrips = () =>
  useQuery({ queryKey: ['trips', 'friends'], queryFn: () => apiFetch<Trip[]>('/api/v1/trips/friends') });

export const useTripInvites = () =>
  useQuery({ queryKey: ['trips', 'invites'], queryFn: () => apiFetch<TripInvite[]>('/api/v1/trips/invites') });

export const useTripWeather = (id: string, enabled = true) =>
  useQuery({
    queryKey: ['trips', id, 'weather'],
    queryFn: () => apiFetch<TripWeatherDay[]>(`/api/v1/trips/${id}/weather`),
    staleTime: 5 * 60_000,
    enabled,
  });

export interface TripInput {
  name: string;
  description?: string;
  location: string;
  startDate: string;
  endDate?: string | null;
  type: string;
  difficulty: string;
  distance?: number | null;
  elevationGain?: number | null;
}

export function useCreateTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TripInput) =>
      apiFetch<Trip>('/api/v1/trips', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });
}

export function useDeleteTrip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/trips/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });
}

export function useRespondTripInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      apiFetch(`/api/v1/trips/invites/${id}/respond`, {
        method: 'POST',
        body: JSON.stringify({ accept }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trips'] }),
  });
}

// --- trip gear ---
export const useTripGear = (tripId: string) =>
  useQuery({
    queryKey: ['trips', tripId, 'gear'],
    queryFn: () => apiFetch<TripGearItem[]>(`/api/v1/trips/${tripId}/gear`),
  });

export function useAddTripGear(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { gearItemIds: string[]; isGroupGear?: boolean }) =>
      apiFetch(`/api/v1/trips/${tripId}/gear`, { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'gear'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

export function useTogglePacked(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPacked }: { id: string; isPacked: boolean }) =>
      apiFetch(`/api/v1/trip-gear/${id}/packed`, {
        method: 'PATCH',
        body: JSON.stringify({ isPacked }),
      }),
    // Optimistic toggle — parity with the web's instant checkbox.
    onMutate: async ({ id, isPacked }) => {
      const key = ['trips', tripId, 'gear'];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<TripGearItem[]>(key);
      queryClient.setQueryData<TripGearItem[]>(key, (old) =>
        old?.map((g) => (g.id === id ? { ...g, isPacked } : g)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['trips', tripId, 'gear'], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'gear'] }),
  });
}

export function useRemoveTripGear(tripId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/trip-gear/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trips', tripId, 'gear'] });
      queryClient.invalidateQueries({ queryKey: ['trips'] });
    },
  });
}

// --- social ---
export const useFriends = () =>
  useQuery({ queryKey: ['friends'], queryFn: () => apiFetch<PublicUser[]>('/api/v1/friends') });

export const useFriendRequests = () =>
  useQuery({
    queryKey: ['friends', 'requests'],
    queryFn: () => apiFetch<FriendRequest[]>('/api/v1/friends/requests'),
  });

export const useSentRequests = () =>
  useQuery({
    queryKey: ['friends', 'requests', 'sent'],
    queryFn: () => apiFetch<FriendRequest[]>('/api/v1/friends/requests/sent'),
  });

export const useUserSearch = (q: string) =>
  useQuery({
    queryKey: ['users', 'search', q],
    queryFn: () => apiFetch<PublicUser[]>(`/api/v1/users/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length > 0,
  });

export const useFriendGear = (userId: string) =>
  useQuery({
    queryKey: ['users', userId, 'gear'],
    queryFn: () => apiFetch<GearItem[]>(`/api/v1/users/${userId}/gear`),
  });

export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      apiFetch('/api/v1/friends/requests', { method: 'POST', body: JSON.stringify({ userId }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  });
}

export function useRespondFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, accept }: { id: string; accept: boolean }) =>
      apiFetch(`/api/v1/friends/requests/${id}/respond`, {
        method: 'POST',
        body: JSON.stringify({ accept }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  });
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/api/v1/friends/requests/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['friends'] }),
  });
}

// --- moderation ---

/*
 * Report + block (App Store guideline 1.2). Blocking removes the friendship and
 * any conversations with that user, so it invalidates broadly.
 */
export function useReportContent() {
  return useMutation({
    mutationFn: (input: ReportInput) =>
      apiFetch('/api/v1/reports', { method: 'POST', body: JSON.stringify(input) }),
  });
}

export const useBlockedUsers = () =>
  useQuery({
    queryKey: ['users', 'blocked'],
    queryFn: () => apiFetch<PublicUser[]>('/api/v1/users/blocked'),
  });

function useBlockMutation(method: 'POST' | 'DELETE') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => apiFetch(`/api/v1/users/${userId}/block`, { method }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['search'] });
    },
  });
}

export const useBlockUser = () => useBlockMutation('POST');
export const useUnblockUser = () => useBlockMutation('DELETE');

// --- messages ---
export const useConversations = () =>
  useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiFetch<Conversation[]>('/api/v1/conversations'),
    refetchInterval: POLL_MS,
  });

export const useMessages = (conversationId: string) =>
  useQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: () => apiFetch<Message[]>(`/api/v1/conversations/${conversationId}/messages`),
    refetchInterval: 3_000, // in-chat polling, like the web ChatInterface
  });

export const useUnreadMessages = () =>
  useQuery({
    queryKey: ['messages', 'unread-count'],
    queryFn: () => apiFetch<{ count: number }>('/api/v1/messages/unread-count'),
    refetchInterval: POLL_MS,
  });

export function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) =>
      apiFetch<Message>(`/api/v1/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useMarkConversationRead(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch(`/api/v1/conversations/${conversationId}/read`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'unread-count'] });
    },
  });
}

export function useToggleReaction(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      apiFetch(`/api/v1/messages/${messageId}/reactions`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['conversations', conversationId, 'messages'] }),
  });
}

// --- notifications ---
export const useNotifications = () =>
  useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<Notification[]>('/api/v1/notifications'),
    refetchInterval: POLL_MS,
  });

export const useUnreadNotifications = () =>
  useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => apiFetch<{ count: number }>('/api/v1/notifications/unread-count'),
    refetchInterval: POLL_MS,
  });

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch('/api/v1/notifications/read-all', { method: 'POST' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// --- search ---
export const useGlobalSearch = (q: string) =>
  useQuery({
    queryKey: ['search', q],
    queryFn: () => apiFetch<SearchResults>(`/api/v1/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length > 0,
  });

// --- PackBot ---
export const useAiHistory = () =>
  useQuery({ queryKey: ['ai', 'history'], queryFn: () => apiFetch<ChatMessage[]>('/api/v1/ai/history') });

export function useSendAiMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) =>
      apiFetch<ChatMessage>('/api/v1/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai', 'history'] }),
  });
}
