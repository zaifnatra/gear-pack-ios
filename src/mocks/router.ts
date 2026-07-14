import { ApiError } from '@/lib/api-error';
import {
  allUsers,
  categoryByName,
  db,
  friendTrips,
  me,
  nextId,
  recountTripGear,
} from '@/mocks/db';
import type {
  ChatMessage,
  Condition,
  GearItem,
  Message,
  Trip,
  TripGearItem,
  TripWeatherDay,
  TrailOption,
} from '@/types';

/*
 * Demo-mode request router. Matches the /api/v1 surface the app uses and
 * mutates the in-memory db so the UI behaves like a live product. apiFetch
 * calls this instead of fetch when DEMO_MODE is on; return values are the
 * unwrapped `data` payloads of the real API's { success, data } contract.
 */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Body = Record<string, unknown>;

export async function handleMockRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  await delay(200 + Math.random() * 250); // feel like a network, stay snappy

  const method = (options.method ?? 'GET').toUpperCase();
  const body: Body = typeof options.body === 'string' ? JSON.parse(options.body) : {};
  const [pathname, queryString] = path.replace('/api/v1', '').split('?');
  const query = new URLSearchParams(queryString ?? '');
  const segments = pathname.split('/').filter(Boolean);

  const result = route(segments, method, body, query);
  if (result === undefined) {
    throw new ApiError(404, `No mock handler for ${method} ${pathname}`);
  }
  // Deep-clone so every response has fresh references — the db mutates objects
  // in place, and identical references would defeat React Query's change
  // detection (stale lists/badges). All mock data is JSON-safe.
  return (result === null ? null : JSON.parse(JSON.stringify(result))) as T;
}

function route(seg: string[], method: string, body: Body, query: URLSearchParams): unknown {
  const key = `${method} /${seg.join('/')}`;

  // --- auth & me ---
  if (key === 'POST /auth/sync') return { synced: true };
  if (key === 'GET /me') return me;
  if (key === 'PATCH /me') {
    Object.assign(me, {
      fullName: (body.fullName as string) ?? me.fullName,
      bio: (body.bio as string | null) ?? me.bio,
      location: (body.location as string | null) ?? me.location,
    });
    return me;
  }

  // --- categories & gear ---
  if (key === 'GET /categories') return db.categories;
  if (seg[0] === 'gear') {
    if (method === 'GET' && seg.length === 1) return db.gear;
    if (method === 'POST') {
      const cat = db.categories.flatMap((c) => c.children ?? []).find((c) => c.id === body.categoryId);
      const item: GearItem = {
        id: nextId('gear'),
        name: String(body.name),
        brand: (body.brand as string) || null,
        weightGrams: Number(body.weightGrams) || 0,
        imageUrl: null,
        condition: (body.condition as Condition) ?? 'GOOD',
        categoryId: String(body.categoryId),
        category: cat ? { id: cat.id, name: cat.name } : null,
      };
      db.gear.unshift(item);
      return item;
    }
    const item = db.gear.find((g) => g.id === seg[1]);
    if (!item) throw new ApiError(404, 'Gear item not found');
    if (method === 'PATCH') {
      const cat = body.categoryId
        ? db.categories.flatMap((c) => c.children ?? []).find((c) => c.id === body.categoryId)
        : null;
      Object.assign(item, {
        name: (body.name as string) ?? item.name,
        brand: body.brand !== undefined ? ((body.brand as string) || null) : item.brand,
        weightGrams: body.weightGrams !== undefined ? Number(body.weightGrams) : item.weightGrams,
        condition: (body.condition as Condition) ?? item.condition,
        ...(cat ? { categoryId: cat.id, category: { id: cat.id, name: cat.name } } : {}),
      });
      return item;
    }
    if (method === 'DELETE') {
      db.gear = db.gear.filter((g) => g.id !== seg[1]);
      db.tripGear = db.tripGear.filter((g) => g.gearItem.id !== seg[1]);
      recountTripGear();
      return { deleted: true };
    }
  }

  // --- trips ---
  if (seg[0] === 'trips') {
    if (key === 'GET /trips') return db.trips;
    if (key === 'GET /trips/friends') return friendTrips;
    if (key === 'GET /trips/invites') return db.tripInvites;
    if (method === 'POST' && seg.length === 1) {
      const trip: Trip = {
        id: nextId('t'),
        name: String(body.name),
        description: (body.description as string) || null,
        location: (body.location as string) || null,
        startDate: String(body.startDate),
        endDate: (body.endDate as string) || null,
        type: (body.type as Trip['type']) ?? 'DAY_HIKE',
        difficulty: (body.difficulty as Trip['difficulty']) ?? 'MODERATE',
        distance: body.distance ? Number(body.distance) : null,
        elevationGain: body.elevationGain ? Number(body.elevationGain) : null,
        organizerId: me.id,
        organizer: me,
        imageUrl: null,
        participants: [{ id: nextId('p'), role: 'ORGANIZER', status: 'ACCEPTED', user: me }],
        _count: { gearList: 0 },
      };
      db.trips.unshift(trip);
      return trip;
    }
    if (seg[1] === 'invites' && seg[3] === 'respond') {
      const invite = db.tripInvites.find((i) => i.id === seg[2]);
      if (!invite) throw new ApiError(404, 'Invite not found');
      db.tripInvites = db.tripInvites.filter((i) => i.id !== seg[2]);
      if (body.accept) {
        const trip = friendTrips.find((t) => t.id === invite.trip.id);
        if (trip) {
          trip.participants.push({ id: nextId('p'), role: 'MEMBER', status: 'ACCEPTED', user: me });
          db.trips.push(trip);
          db.trips.sort((a, b) => a.startDate.localeCompare(b.startDate));
        }
      }
      return { responded: true };
    }

    const trip = [...db.trips, ...friendTrips].find((t) => t.id === seg[1]);
    if (!trip) throw new ApiError(404, 'Trip not found');
    if (seg.length === 2 && method === 'GET') return trip;
    if (seg.length === 2 && method === 'DELETE') {
      db.trips = db.trips.filter((t) => t.id !== trip.id);
      db.tripGear = db.tripGear.filter((g) => g.tripId !== trip.id);
      return { deleted: true };
    }
    if (seg[2] === 'weather') return mockWeather(trip);
    if (seg[2] === 'conversation') {
      const convo = db.conversations.find((c) => c.tripId === trip.id);
      return convo ?? null;
    }
    if (seg[2] === 'gear') {
      if (method === 'GET') return db.tripGear.filter((g) => g.tripId === trip.id);
      if (method === 'POST') {
        const items = (body.gearItemIds as string[]) ?? [body.gearItemId as string];
        const added: TripGearItem[] = [];
        for (const gearId of items.filter(Boolean)) {
          if (db.tripGear.some((g) => g.tripId === trip.id && g.gearItem.id === gearId)) continue;
          const gearItem = db.gear.find((g) => g.id === gearId);
          if (!gearItem) continue;
          added.push({
            id: nextId('tg'),
            tripId: trip.id,
            isPacked: false,
            isGroupGear: Boolean(body.isGroupGear),
            quantity: 1,
            gearItem,
            owner: me,
          });
        }
        db.tripGear.push(...added);
        recountTripGear();
        return added;
      }
    }
    if (seg[2] === 'invite' && method === 'POST') return { invited: true };
  }

  if (seg[0] === 'trip-gear') {
    const entry = db.tripGear.find((g) => g.id === seg[1]);
    if (!entry) throw new ApiError(404, 'Trip gear not found');
    if (seg[2] === 'packed' && method === 'PATCH') {
      entry.isPacked = Boolean(body.isPacked);
      return entry;
    }
    if (method === 'DELETE') {
      db.tripGear = db.tripGear.filter((g) => g.id !== seg[1]);
      recountTripGear();
      return { deleted: true };
    }
  }

  // --- social ---
  if (key === 'GET /friends') return db.friends;
  if (key === 'GET /friends/requests') return db.receivedRequests;
  if (key === 'GET /friends/requests/sent') return db.sentRequests;
  if (key === 'POST /friends/requests') {
    const user = allUsers.find((u) => u.id === body.userId);
    if (!user) throw new ApiError(404, 'User not found');
    db.sentRequests.push({ id: nextId('fr'), user, createdAt: new Date().toISOString() });
    return { requested: true };
  }
  if (seg[0] === 'friends' && seg[1] === 'requests' && seg[3] === 'respond') {
    const request = db.receivedRequests.find((r) => r.id === seg[2]);
    if (!request) throw new ApiError(404, 'Request not found');
    db.receivedRequests = db.receivedRequests.filter((r) => r.id !== seg[2]);
    if (body.accept) db.friends.push(request.user);
    return { responded: true };
  }
  if (seg[0] === 'friends' && seg[1] === 'requests' && method === 'DELETE') {
    db.sentRequests = db.sentRequests.filter((r) => r.id !== seg[2]);
    return { deleted: true };
  }
  if (key === 'GET /users/search') {
    const q = (query.get('q') ?? '').toLowerCase().trim();
    if (!q) return [];
    return allUsers.filter(
      (u) => u.username.toLowerCase().includes(q) || (u.fullName ?? '').toLowerCase().includes(q),
    );
  }
  if (seg[0] === 'users' && seg[2] === 'gear') return db.friendGear.get(seg[1]) ?? [];
  if (seg[0] === 'users' && seg[2] === 'block') return { blocked: true };
  if (key === 'POST /reports') return { reported: true };

  // --- messages ---
  if (key === 'GET /conversations') return db.conversations;
  if (key === 'GET /messages/unread-count') {
    return { count: db.conversations.reduce((sum, c) => sum + c.unreadCount, 0) };
  }
  if (seg[0] === 'conversations' && seg[2] === 'messages') {
    const convo = db.conversations.find((c) => c.id === seg[1]);
    if (!convo) throw new ApiError(404, 'Conversation not found');
    if (method === 'GET') return db.messages.get(convo.id) ?? [];
    if (method === 'POST') {
      const message: Message = {
        id: nextId('msg'),
        conversationId: convo.id,
        content: String(body.content),
        createdAt: new Date().toISOString(),
        editedAt: null,
        sender: me,
        reactions: [],
      };
      db.messages.get(convo.id)!.push(message);
      convo.lastMessage = message;
      scheduleDemoReply(convo.id);
      return message;
    }
  }
  if (seg[0] === 'conversations' && seg[2] === 'read') {
    const convo = db.conversations.find((c) => c.id === seg[1]);
    if (convo) convo.unreadCount = 0;
    return { read: true };
  }
  if (seg[0] === 'messages' && seg[2] === 'reactions' && method === 'POST') {
    for (const list of db.messages.values()) {
      const message = list.find((m) => m.id === seg[1]);
      if (message) {
        const emoji = String(body.emoji);
        const existing = message.reactions.findIndex((r) => r.userId === me.id && r.emoji === emoji);
        if (existing >= 0) message.reactions.splice(existing, 1);
        else message.reactions.push({ emoji, userId: me.id });
        return message;
      }
    }
    throw new ApiError(404, 'Message not found');
  }

  // --- notifications ---
  if (key === 'GET /notifications') return db.notifications;
  if (key === 'GET /notifications/unread-count') {
    return { count: db.notifications.filter((n) => !n.read).length };
  }
  if (seg[0] === 'notifications' && seg[2] === 'read') {
    const n = db.notifications.find((x) => x.id === seg[1]);
    if (n) n.read = true;
    return { read: true };
  }
  if (key === 'POST /notifications/read-all') {
    db.notifications.forEach((n) => (n.read = true));
    return { read: true };
  }

  // --- global search ---
  if (key === 'GET /search') {
    const q = (query.get('q') ?? '').toLowerCase().trim();
    if (!q) return { trips: [], gear: [], users: [] };
    return {
      trips: db.trips
        .filter((t) => t.name.toLowerCase().includes(q) || (t.location ?? '').toLowerCase().includes(q))
        .map((t) => ({ id: t.id, name: t.name, location: t.location })),
      gear: db.gear
        .filter((g) => g.name.toLowerCase().includes(q) || (g.brand ?? '').toLowerCase().includes(q))
        .map((g) => ({ id: g.id, name: g.name, brand: g.brand })),
      users: [...db.friends, ...allUsers.filter((u) => !db.friends.includes(u))].filter(
        (u) => u.username.toLowerCase().includes(q) || (u.fullName ?? '').toLowerCase().includes(q),
      ),
    };
  }

  // --- PackBot ---
  if (key === 'GET /ai/history') return db.aiHistory;
  if (key === 'POST /ai/chat') {
    const userMessage: ChatMessage = {
      id: nextId('ai'),
      role: 'user',
      content: String(body.message),
      createdAt: new Date().toISOString(),
    };
    const reply = packBotReply(String(body.message));
    db.aiHistory.push(userMessage, reply);
    return reply;
  }

  // --- account ---
  if (key === 'DELETE /account') return { deleted: true };

  return undefined;
}

// After I send a DM, the friend "types" a short reply so the chat feels alive.
const demoReplies = [
  'Sounds good! 🙌',
  'Perfect, see you then.',
  'Haha yes. Adding it to the list now.',
  'Good call — forecast still looks clear.',
  'Can’t wait for this one 🏔️',
];
let replyIndex = 0;

function scheduleDemoReply(conversationId: string) {
  const convo = db.conversations.find((c) => c.id === conversationId);
  if (!convo || convo.isGroup) return;
  const friend = convo.participants[0];
  setTimeout(() => {
    const message: Message = {
      id: nextId('msg'),
      conversationId,
      content: demoReplies[replyIndex++ % demoReplies.length],
      createdAt: new Date().toISOString(),
      editedAt: null,
      sender: friend,
      reactions: [],
    };
    db.messages.get(conversationId)!.push(message);
    convo.lastMessage = message;
  }, 1500);
}

function mockWeather(trip: Trip): TripWeatherDay[] {
  const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rain Showers', 'Sunny'];
  const start = new Date(trip.startDate);
  const days: TripWeatherDay[] = [];
  for (let i = 0; i < 5; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    // Deterministic per trip+day so refetching doesn't jitter the UI.
    const seed = (trip.id.charCodeAt(trip.id.length - 1) + i * 7) % 10;
    days.push({
      date: date.toISOString(),
      tempMin: 6 + seed,
      tempMax: 16 + seed,
      condition: conditions[(seed + i) % conditions.length],
      precipProb: conditions[(seed + i) % conditions.length].includes('Rain') ? 55 : seed * 4,
    });
  }
  return days;
}

// --- Canned PackBot brain: keyword-routed, mirrors the web's structured cards ---

const trailOptions: TrailOption[] = [
  {
    id: 'trail-1',
    name: 'Sky Pond via Glacier Gorge',
    location: 'Rocky Mountain NP, CO',
    driveTime: '45 min',
    distance: 15.1,
    elevationGain: 550,
    difficulty: 'MODERATE',
    description: 'Waterfall scramble to a dramatic alpine lake below Taylor Peak. Go early for parking.',
  },
  {
    id: 'trail-2',
    name: 'Mount Sanitas Loop',
    location: 'Boulder, CO',
    driveTime: '10 min',
    distance: 5.3,
    elevationGain: 420,
    difficulty: 'MODERATE',
    description: 'The classic Boulder lunch-break burner. Steep, rocky, great town views.',
  },
  {
    id: 'trail-3',
    name: 'Grays and Torreys',
    location: 'Arapahoe NF, CO',
    driveTime: '1 hr 20 min',
    distance: 13.2,
    elevationGain: 930,
    difficulty: 'HARD',
    description: 'Two 14ers in one hit via the standard ridge. Start pre-dawn to dodge storms.',
  },
];

function packBotReply(input: string): ChatMessage {
  const text = input.toLowerCase();
  const base = { id: nextId('ai'), role: 'assistant' as const, createdAt: new Date().toISOString() };

  if (/(trail|hike|recommend|weekend|where)/.test(text)) {
    return {
      ...base,
      content: 'Here are three trails near Boulder that fit a summer weekend window:',
      structured: { type: 'trail_options', trails: trailOptions },
      quickActions: [
        { label: 'Something easier', value: 'Show me easier trails' },
        { label: 'Check my gear for Sky Pond', value: 'Analyze my gear for Sky Pond' },
      ],
    };
  }

  if (/(analy|ready|packing|pack list|franconia|sky pond|check my gear)/.test(text)) {
    return {
      ...base,
      content: 'I checked your closet against a high-alpine day hike. You’re close — two gaps to fix:',
      structured: {
        type: 'gear_analysis',
        data: {
          summary: 'Strong on shelter, layers, and navigation. Water capacity and first aid need attention before an exposed ridge day.',
          categories: [
            {
              category: 'Layers',
              status: 'READY',
              items: [
                { name: 'Torrentshell 3L', note: 'Solid wind/rain shell for the ridge' },
                { name: 'Ghost Whisperer 2' },
                { name: 'Merino 150 Crew' },
              ],
            },
            {
              category: 'Water',
              status: 'WARNING',
              suggestion: 'One 1L bottle is light for an exposed 14km day — add a 2L reservoir or a second bottle.',
              items: [{ name: 'Wide-Mouth 1L' }, { name: 'Squeeze Water Filter' }],
            },
            {
              category: 'Safety',
              status: 'MISSING',
              suggestion: 'Your med kit is marked POOR — restock it, and add an emergency bivy for the alpine zone.',
              items: [{ name: 'Ultralight .7 Med Kit', note: 'Condition: POOR' }],
            },
          ],
        },
      },
      quickActions: [
        { label: 'Add these to a trip', value: 'Add the missing items to my Franconia packing list' },
        { label: 'Find me a trail', value: 'Recommend a trail near me' },
      ],
    };
  }

  if (/(lighten|weight|gram|ultralight|lighter)/.test(text)) {
    return {
      ...base,
      content:
        'Your base weight is roughly 7.4 kg. Three easy wins:\n\n1. Your BV500 (1160g) is only needed where canisters are required — leave it for NH trips.\n2. Swap the Nalgene (178g) for a 1L Smartwater bottle (~38g).\n3. Your Exos 58 is overkill for day hikes — the Talon 22 saves 370g.\n\nWant me to run this against a specific trip?',
      quickActions: [
        { label: 'Check Franconia list', value: 'Analyze my gear for the Franconia Ridge Loop' },
      ],
    };
  }

  if (/(weather|forecast|rain|storm)/.test(text)) {
    return {
      ...base,
      content:
        'For Franconia Ridge in 12 days the pattern looks typical for summer in the Whites: clear mornings, thunderstorm risk building after 1pm. Plan to be off the exposed ridge by early afternoon — check the trip’s weather widget as the date gets closer.',
      quickActions: [{ label: 'Am I packed for rain?', value: 'Analyze my rain gear' }],
    };
  }

  return {
    ...base,
    content:
      "I can help with trail recommendations, packing analysis, and gear questions for your trips. Try one of these:",
    quickActions: [
      { label: 'Find me a trail', value: 'Recommend a trail near me for this weekend' },
      { label: 'Analyze my gear', value: 'Analyze my gear for my next trip' },
      { label: 'Lighten my pack', value: 'How can I lighten my pack?' },
    ],
  };
}
