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
  Trip,
  TripGearItem,
  TripInvite,
} from '@/types';

/*
 * In-memory demo database. Fixtures are seeded once per app launch and mutated
 * by src/mocks/router.ts so every flow (add gear, pack items, accept requests,
 * send messages…) visibly works. Dates are generated relative to "today" so
 * the demo never goes stale.
 */

const daysFromNow = (days: number, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

let idCounter = 0;
export const nextId = (prefix: string) => `${prefix}-${++idCounter}`;

// --- Users ---

export const me: Me = {
  id: 'u-me',
  username: 'alexrivers',
  fullName: 'Alex Rivers',
  email: 'alex@gearpack.app',
  avatarUrl: null,
  bio: 'Weekend peak-bagger. Slowly going ultralight, one gram at a time.',
  location: 'Boulder, CO',
  isPaid: true,
};

const maya: PublicUser = { id: 'u-maya', username: 'mayahikes', fullName: 'Maya Chen', avatarUrl: null, location: 'Denver, CO' };
const jordan: PublicUser = { id: 'u-jordan', username: 'jordantrails', fullName: 'Jordan Lee', avatarUrl: null, location: 'Salt Lake City, UT' };
const sam: PublicUser = { id: 'u-sam', username: 'sampacks', fullName: 'Sam Patel', avatarUrl: null, location: 'Seattle, WA' };
const riley: PublicUser = { id: 'u-riley', username: 'rileyoutside', fullName: 'Riley Kim', avatarUrl: null, location: 'Portland, OR' };
const nina: PublicUser = { id: 'u-nina', username: 'ninabrooks', fullName: 'Nina Brooks', avatarUrl: null, location: 'Fort Collins, CO' };
const chris: PublicUser = { id: 'u-chris', username: 'chrisdoyle', fullName: 'Chris Doyle', avatarUrl: null, location: 'Bozeman, MT' };
const erin: PublicUser = { id: 'u-erin', username: 'erinwalsh', fullName: 'Erin Walsh', avatarUrl: null, location: 'Asheville, NC' };

export const allUsers: PublicUser[] = [maya, jordan, sam, riley, nina, chris, erin];

export const db = {
  friends: [maya, jordan, sam, riley] as PublicUser[],
  receivedRequests: [
    { id: 'fr-1', user: nina, createdAt: minutesAgo(60 * 5) },
  ] as FriendRequest[],
  sentRequests: [
    { id: 'fr-2', user: chris, createdAt: minutesAgo(60 * 26) },
  ] as FriendRequest[],

  categories: [] as Category[],
  gear: [] as GearItem[],
  friendGear: new Map<string, GearItem[]>(),
  trips: [] as Trip[],
  tripGear: [] as TripGearItem[],
  tripInvites: [] as TripInvite[],
  conversations: [] as Conversation[],
  messages: new Map<string, Message[]>(),
  notifications: [] as Notification[],
  aiHistory: [] as ChatMessage[],
  blockedUserIds: [] as string[],
  reports: [] as ReportInput[],
};

/*
 * Blocking (App Store guideline 1.2) has to visibly take effect: the user
 * disappears from friends, requests, search, and DMs, and their messages are
 * dropped from group chats.
 */
export function blockUser(userId: string) {
  if (!db.blockedUserIds.includes(userId)) db.blockedUserIds.push(userId);
  db.friends = db.friends.filter((f) => f.id !== userId);
  db.receivedRequests = db.receivedRequests.filter((r) => r.user.id !== userId);
  db.sentRequests = db.sentRequests.filter((r) => r.user.id !== userId);
  db.friendGear.delete(userId);

  for (const convo of [...db.conversations]) {
    const isDirect = !convo.isGroup && convo.participants.some((p) => p.id === userId);
    if (isDirect) {
      db.conversations = db.conversations.filter((c) => c.id !== convo.id);
      db.messages.delete(convo.id);
      continue;
    }
    convo.participants = convo.participants.filter((p) => p.id !== userId);
    const remaining = (db.messages.get(convo.id) ?? []).filter((m) => m.sender.id !== userId);
    db.messages.set(convo.id, remaining);
    convo.lastMessage = remaining[remaining.length - 1] ?? null;
  }
}

// --- Categories (subset of the web hierarchy) ---

const catGroups: Record<string, string[]> = {
  'Shelter & Sleep': ['Tent', 'Hammock', 'Sleeping Bag', 'Sleeping Pad'],
  Packs: ['Backpack', 'Daypack'],
  'Kitchen & Water': ['Stove', 'Fuel', 'Pot', 'Mug', 'Water Filter', 'Water Bottle'],
  Clothing: ['Rain Jacket', 'Down Jacket', 'Fleece', 'Base Layer', 'Pants', 'Shorts', 'Hat', 'Gloves', 'Boots'],
  Electronics: ['Headlamp', 'Power Bank', 'GPS'],
  'Tools & Safety': ['Trekking Poles', 'Multitool', 'Bear Canister', 'First Aid Kit'],
};

const catByName = new Map<string, Category>();
for (const [group, children] of Object.entries(catGroups)) {
  const parent: Category = { id: nextId('cat'), name: group, parentId: null, children: [] };
  db.categories.push(parent);
  for (const name of children) {
    const child: Category = { id: nextId('cat'), name, parentId: parent.id };
    parent.children!.push(child);
    catByName.set(name, child);
  }
}

export const categoryByName = (name: string) => {
  const cat = catByName.get(name);
  if (!cat) throw new Error(`Unknown mock category: ${name}`);
  return { id: cat.id, name: cat.name };
};

// --- Gear closet ---

type GearSeed = [name: string, brand: string, grams: number, category: string, condition: GearItem['condition']];

const myGearSeeds: GearSeed[] = [
  ['Copper Spur HV UL2', 'Big Agnes', 1400, 'Tent', 'EXCELLENT'],
  ['Magma 15 Sleeping Bag', 'REI Co-op', 794, 'Sleeping Bag', 'GOOD'],
  ['Talon 22', 'Osprey', 850, 'Daypack', 'GOOD'],
  ['Exos 58', 'Osprey', 1220, 'Backpack', 'EXCELLENT'],
  ['PocketRocket 2', 'MSR', 73, 'Stove', 'NEW'],
  ['Titanium 750ml Pot', 'TOAKS', 103, 'Pot', 'GOOD'],
  ['Squeeze Water Filter', 'Sawyer', 85, 'Water Filter', 'GOOD'],
  ['Wide-Mouth 1L', 'Nalgene', 178, 'Water Bottle', 'FAIR'],
  ['Torrentshell 3L', 'Patagonia', 400, 'Rain Jacket', 'GOOD'],
  ['Ghost Whisperer 2', 'Mountain Hardwear', 249, 'Down Jacket', 'EXCELLENT'],
  ['R1 Air Hoody', 'Patagonia', 385, 'Fleece', 'GOOD'],
  ['Merino 150 Crew', 'Smartwool', 190, 'Base Layer', 'FAIR'],
  ['Stretch Zion Pants', 'prAna', 380, 'Pants', 'GOOD'],
  ['Actik Core Headlamp', 'Petzl', 88, 'Headlamp', 'NEW'],
  ['Distance Carbon Z Poles', 'Black Diamond', 340, 'Trekking Poles', 'GOOD'],
  ['Skeletool CX', 'Leatherman', 142, 'Multitool', 'EXCELLENT'],
  ['BV500 Bear Canister', 'BearVault', 1160, 'Bear Canister', 'GOOD'],
  ['Ultralight .7 Med Kit', 'Adventure Medical', 230, 'First Aid Kit', 'POOR'],
];

const makeGear = (seed: GearSeed): GearItem => {
  const cat = categoryByName(seed[3]);
  return {
    id: nextId('gear'),
    name: seed[0],
    brand: seed[1],
    weightGrams: seed[2],
    imageUrl: null,
    condition: seed[4],
    categoryId: cat.id,
    category: cat,
  };
};

db.gear = myGearSeeds.map(makeGear);

const gearByName = (name: string) => {
  const item = db.gear.find((g) => g.name === name);
  if (!item) throw new Error(`Unknown mock gear: ${name}`);
  return item;
};

db.friendGear.set(
  maya.id,
  (
    [
      ['Hubba Hubba NX2', 'MSR', 1720, 'Tent', 'GOOD'],
      ['Kelty Cosmic 20', 'Kelty', 1130, 'Sleeping Bag', 'FAIR'],
      ['Jetboil Flash', 'Jetboil', 371, 'Stove', 'EXCELLENT'],
      ['Spot Gen4', 'SPOT', 142, 'GPS', 'GOOD'],
    ] as GearSeed[]
  ).map(makeGear),
);
db.friendGear.set(
  jordan.id,
  (
    [
      ['Lone Peak Tent', 'Durston', 795, 'Tent', 'NEW'],
      ['Flash 22', 'REI Co-op', 397, 'Daypack', 'GOOD'],
      ['BeFree Filter', 'Katadyn', 63, 'Water Filter', 'GOOD'],
    ] as GearSeed[]
  ).map(makeGear),
);

// --- Trips ---

export const trips: Trip[] = [
  {
    id: 't-1',
    name: 'Franconia Ridge Loop',
    description:
      'The classic White Mountains ridge walk over Little Haystack, Lincoln, and Lafayette. Early start to beat afternoon storms — meet at Lafayette Place lot at 6am.',
    location: 'Lincoln, NH',
    startDate: daysFromNow(12),
    endDate: daysFromNow(12, 18),
    type: 'DAY_HIKE',
    difficulty: 'HARD',
    distance: 14.3,
    elevationGain: 1160,
    organizerId: me.id,
    organizer: me,
    imageUrl: null,
    participants: [
      { id: 'p-1', role: 'ORGANIZER', status: 'ACCEPTED', user: me },
      { id: 'p-2', role: 'MEMBER', status: 'ACCEPTED', user: maya },
      { id: 'p-3', role: 'MEMBER', status: 'ACCEPTED', user: jordan },
    ],
    _count: { gearList: 0 }, // recomputed below
  },
  {
    id: 't-2',
    name: 'Emerald Lake Basecamp',
    description:
      'Three relaxed days car-camping near Emerald Lake with day hikes into the basin. Beginner friendly — Riley is bringing the group kitchen.',
    location: 'Rocky Mountain NP, CO',
    startDate: daysFromNow(40),
    endDate: daysFromNow(42),
    type: 'MULTI_DAY',
    difficulty: 'MODERATE',
    distance: 26,
    elevationGain: 800,
    organizerId: me.id,
    organizer: me,
    imageUrl: null,
    participants: [
      { id: 'p-4', role: 'ORGANIZER', status: 'ACCEPTED', user: me },
      { id: 'p-5', role: 'MEMBER', status: 'ACCEPTED', user: riley },
      { id: 'p-6', role: 'MEMBER', status: 'INVITED', user: sam },
    ],
    _count: { gearList: 0 },
  },
  {
    id: 't-3',
    name: 'Tuckerman Ravine Ascent',
    description: 'Mount Washington via Tuckerman Ravine. Steep, rocky, unforgettable.',
    location: 'Pinkham Notch, NH',
    startDate: daysFromNow(-20),
    endDate: daysFromNow(-20, 17),
    type: 'DAY_HIKE',
    difficulty: 'HARD',
    distance: 11.9,
    elevationGain: 1280,
    organizerId: me.id,
    organizer: me,
    imageUrl: null,
    participants: [
      { id: 'p-7', role: 'ORGANIZER', status: 'ACCEPTED', user: me },
      { id: 'p-8', role: 'MEMBER', status: 'ACCEPTED', user: maya },
    ],
    _count: { gearList: 0 },
  },
];

db.trips = trips;

// Friends' trips power the Home activity feed (organized by friends, not me).
export const friendTrips: Trip[] = [
  {
    id: 't-f1',
    name: 'Presidential Traverse',
    description: 'One big day across the Presidentials. Type 2 fun guaranteed.',
    location: 'White Mountains, NH',
    startDate: daysFromNow(26),
    endDate: daysFromNow(27),
    type: 'OVERNIGHT',
    difficulty: 'EXTREME',
    distance: 37,
    elevationGain: 2600,
    organizerId: maya.id,
    organizer: maya,
    imageUrl: null,
    participants: [
      { id: 'p-9', role: 'ORGANIZER', status: 'ACCEPTED', user: maya },
      { id: 'p-10', role: 'MEMBER', status: 'ACCEPTED', user: jordan },
    ],
    _count: { gearList: 5 },
  },
  {
    id: 't-f2',
    name: 'The Narrows Top-Down',
    description: 'Permit came through! 16 miles of river walking.',
    location: 'Zion NP, UT',
    startDate: daysFromNow(33),
    endDate: daysFromNow(34),
    type: 'OVERNIGHT',
    difficulty: 'HARD',
    distance: 25.7,
    elevationGain: 400,
    organizerId: jordan.id,
    organizer: jordan,
    imageUrl: null,
    participants: [{ id: 'p-11', role: 'ORGANIZER', status: 'ACCEPTED', user: jordan }],
    _count: { gearList: 3 },
  },
];

// --- Trip gear (packing list for t-1 and t-2) ---

const tg = (
  tripId: string,
  gear: GearItem,
  owner: PublicUser,
  isPacked: boolean,
  isGroupGear = false,
): TripGearItem => ({
  id: nextId('tg'),
  tripId,
  isPacked,
  isGroupGear,
  quantity: 1,
  gearItem: gear,
  owner,
});

db.tripGear = [
  tg('t-1', gearByName('Talon 22'), me, true),
  tg('t-1', gearByName('Squeeze Water Filter'), me, true),
  tg('t-1', gearByName('Torrentshell 3L'), me, false),
  tg('t-1', gearByName('Actik Core Headlamp'), me, false),
  tg('t-1', gearByName('Ultralight .7 Med Kit'), me, false, true),
  tg('t-1', gearByName('Distance Carbon Z Poles'), me, true),
  tg('t-1', gearByName('Merino 150 Crew'), me, false),
  tg('t-1', gearByName('Wide-Mouth 1L'), me, true),
  tg('t-2', gearByName('Copper Spur HV UL2'), me, false, true),
  tg('t-2', gearByName('Magma 15 Sleeping Bag'), me, false),
  tg('t-2', gearByName('PocketRocket 2'), me, true, true),
  tg('t-2', gearByName('Titanium 750ml Pot'), me, true, true),
  tg('t-2', gearByName('BV500 Bear Canister'), me, false, true),
  tg('t-2', gearByName('Ghost Whisperer 2'), me, false),
];

export const recountTripGear = () => {
  for (const trip of [...db.trips, ...friendTrips]) {
    trip._count.gearList = db.tripGear.filter((g) => g.tripId === trip.id).length;
  }
};
recountTripGear();

// --- Trip invites ---

db.tripInvites = [
  {
    id: 'ti-1',
    trip: {
      id: friendTrips[0].id,
      name: friendTrips[0].name,
      location: friendTrips[0].location,
      startDate: friendTrips[0].startDate,
      endDate: friendTrips[0].endDate,
      type: friendTrips[0].type,
      difficulty: friendTrips[0].difficulty,
    },
    invitedBy: maya,
    createdAt: minutesAgo(60 * 3),
  },
];

// --- Conversations & messages ---

const msg = (
  conversationId: string,
  sender: PublicUser,
  content: string,
  minsAgo: number,
  reactions: Message['reactions'] = [],
): Message => ({
  id: nextId('msg'),
  conversationId,
  content,
  createdAt: minutesAgo(minsAgo),
  editedAt: null,
  sender,
  reactions,
});

db.messages.set('c-1', [
  msg('c-1', me, 'Hey! Are you still in for Franconia on the ridge day?', 60 * 26),
  msg('c-1', maya, 'Absolutely. Watching the forecast like a hawk 🦅', 60 * 25),
  msg('c-1', me, 'Same. I added the med kit to group gear, can you grab extra water?', 60 * 24),
  msg('c-1', maya, 'On it. Also bringing my Jetboil for summit coffee ☕', 42, [{ emoji: '🔥', userId: 'u-me' }]),
  msg('c-1', maya, 'Trailhead lot fills by 6:30, let’s not repeat last time…', 40),
]);

db.messages.set('c-2', [
  msg('c-2', jordan, 'Narrows permit came through!! 🎉', 60 * 50),
  msg('c-2', me, 'YES. Renting canyoneering boots or bringing your own?', 60 * 49),
  msg('c-2', jordan, 'Renting in Springdale. You should come next time', 60 * 48),
]);

db.messages.set('c-3', [
  msg('c-3', me, 'Welcome to the trip chat! Carpool plan: meet at my place 5:15am.', 60 * 30),
  msg('c-3', jordan, 'Works for me 👍', 60 * 29),
  msg('c-3', maya, 'I call shotgun. Weather is looking clear so far!', 60 * 28, [{ emoji: '😂', userId: 'u-jordan' }]),
]);

const lastOf = (id: string) => {
  const list = db.messages.get(id)!;
  return list[list.length - 1];
};

db.conversations = [
  { id: 'c-1', isGroup: false, name: null, tripId: null, participants: [maya], lastMessage: lastOf('c-1'), unreadCount: 2 },
  { id: 'c-3', isGroup: true, name: 'Franconia Ridge Loop', tripId: 't-1', participants: [maya, jordan], lastMessage: lastOf('c-3'), unreadCount: 1 },
  { id: 'c-2', isGroup: false, name: null, tripId: null, participants: [jordan], lastMessage: lastOf('c-2'), unreadCount: 0 },
];

// --- Notifications ---

db.notifications = [
  {
    id: nextId('n'),
    type: 'FRIEND_REQUEST',
    title: 'New friend request',
    body: 'Nina Brooks (@ninabrooks) wants to be friends.',
    read: false,
    createdAt: minutesAgo(60 * 5),
  },
  {
    id: nextId('n'),
    type: 'TRIP_INVITE',
    title: 'Trip invite',
    body: 'Maya Chen invited you to Presidential Traverse.',
    read: false,
    createdAt: minutesAgo(60 * 3),
  },
  {
    id: nextId('n'),
    type: 'SYSTEM',
    title: 'Trail conditions update',
    body: 'Franconia Ridge: alpine zone clear of snow as of this week.',
    read: true,
    createdAt: minutesAgo(60 * 30),
  },
  {
    id: nextId('n'),
    type: 'SYSTEM',
    title: 'Welcome to GearPack',
    body: 'Build your closet, plan trips, and pack smarter with PackBot.',
    read: true,
    createdAt: minutesAgo(60 * 24 * 6),
  },
];

// --- PackBot history ---

db.aiHistory = [
  {
    id: nextId('ai'),
    role: 'assistant',
    content:
      "Hey Alex! I'm PackBot 🏕️ — your gear and trip assistant. I can recommend trails, check your packing list against conditions, or help you shave grams. What are we planning?",
    quickActions: [
      { label: 'Find me a trail', value: 'Recommend a trail near me for this weekend' },
      { label: 'Am I ready for Franconia?', value: 'Analyze my gear for the Franconia Ridge Loop' },
      { label: 'Lighten my pack', value: 'How can I lighten my pack?' },
    ],
    createdAt: minutesAgo(60),
  },
];
