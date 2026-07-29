/*
 * Domain types mirroring the web app's Prisma models and /api/v1 response
 * shapes (gear-pack repo). Keeping these 1:1 means the mock layer and the real
 * backend are interchangeable behind apiFetch.
 */

export type Condition = 'NEW' | 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'RETIRED';
export type TripType = 'DAY_HIKE' | 'OVERNIGHT' | 'MULTI_DAY' | 'THRU_HIKE' | 'OTHER';
export type Difficulty = 'EASY' | 'MODERATE' | 'HARD' | 'EXTREME';
export type ParticipantRole = 'ORGANIZER' | 'LEADER' | 'MEMBER' | 'GUEST';
export type ParticipantStatus = 'INVITED' | 'ACCEPTED' | 'DECLINED';
export type NotificationType = 'FRIEND_REQUEST' | 'TRIP_INVITE' | 'SYSTEM';

export interface PublicUser {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  location?: string | null;
}

export interface Me extends PublicUser {
  email: string;
  bio: string | null;
  location: string | null;
  isPaid: boolean;
}

export interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children?: Category[];
}

export interface GearItem {
  id: string;
  name: string;
  brand: string | null;
  weightGrams: number;
  imageUrl: string | null;
  condition: Condition;
  categoryId: string;
  category: { id: string; name: string } | null;
  notes?: string | null;
}

export interface Participant {
  id: string;
  role: ParticipantRole;
  status: ParticipantStatus;
  user: PublicUser;
}

export interface Trip {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: string;
  endDate: string | null;
  type: TripType;
  difficulty: Difficulty;
  distance: number | null;
  elevationGain: number | null;
  organizerId: string;
  organizer: PublicUser;
  imageUrl: string | null;
  participants: Participant[];
  _count: { gearList: number };
}

export interface TripGearItem {
  id: string;
  tripId: string;
  isPacked: boolean;
  isGroupGear: boolean;
  quantity: number;
  gearItem: GearItem;
  owner: PublicUser;
}

export interface TripWeatherDay {
  date: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  precipProb: number;
}

export interface TripInvite {
  id: string;
  trip: Pick<Trip, 'id' | 'name' | 'location' | 'startDate' | 'endDate' | 'type' | 'difficulty'>;
  invitedBy: PublicUser;
  createdAt: string;
}

export interface FriendRequest {
  id: string;
  user: PublicUser; // the other party (sender for received, recipient for sent)
  createdAt: string;
}

export interface Reaction {
  emoji: string;
  userId: string;
}

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  sender: PublicUser;
  reactions: Reaction[];
}

export interface Conversation {
  id: string;
  isGroup: boolean;
  name: string | null; // group name (trip chats); null for DMs
  tripId: string | null;
  participants: PublicUser[]; // excluding me
  lastMessage: Message | null;
  unreadCount: number;
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

// --- Moderation (App Store guideline 1.2: UGC needs report + block) ---

export type ReportTargetType = 'USER' | 'MESSAGE';

export type ReportReason =
  | 'SPAM'
  | 'HARASSMENT'
  | 'INAPPROPRIATE'
  | 'IMPERSONATION'
  | 'OTHER';

export interface ReportInput {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}

export interface SearchResults {
  trips: Pick<Trip, 'id' | 'name' | 'location'>[];
  gear: Pick<GearItem, 'id' | 'name' | 'brand'>[];
  users: PublicUser[];
}

// --- PackBot structured responses (mirrors web src/components/ai) ---

export interface TrailOption {
  id: string;
  name: string;
  location: string;
  driveTime: string;
  distance: number;
  elevationGain: number;
  difficulty: Difficulty;
  description: string;
}

export interface GearItemAnalysis {
  name: string;
  note?: string;
}

export interface GearCategoryAnalysis {
  category: string;
  items: GearItemAnalysis[];
  status: 'READY' | 'WARNING' | 'MISSING';
  suggestion?: string;
}

export interface GearAnalysisData {
  summary: string;
  categories: GearCategoryAnalysis[];
}

export type ChatStructured =
  | { type: 'trail_options'; trails: TrailOption[] }
  | { type: 'gear_analysis'; data: GearAnalysisData };

export interface QuickAction {
  label: string;
  value: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  structured?: ChatStructured | null;
  quickActions?: QuickAction[];
  createdAt: string;
}
