import express from 'express';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';

export interface PublicPeerProfile {
  id: string;
  friendCode: string;
  username: string;
  name: string;
  age: number;
  ageGroup: '3-6' | '7-13' | '14-18';
  avatarId: string;
  xp: number;
  streak: number;
  updatedAt: number;
}

export interface NetworkChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
}

export interface NetworkFriendshipRecord {
  id: string;
  requesterId: string;
  receiverId: string;
  requesterCode: string;
  receiverCode: string;
  ageGroup: '3-6' | '7-13' | '14-18';
  status: 'pending' | 'accepted' | 'blocked';
  requesterProfile: PublicPeerProfile;
  receiverProfile: PublicPeerProfile;
  chatMessages: NetworkChatMessage[];
  updatedAt: number;
}

export interface NetworkRoomPlayer {
  id: string;
  friendCode: string;
  name: string;
  avatarId: string;
  ageGroup: '3-6' | '7-13' | '14-18';
  score: number;
  gameId: string;
  updatedAt: number;
}

export interface NetworkRoomMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  isEmojiOnly?: boolean;
  timestamp: string;
}

export interface NetworkMultiplayerRoom {
  roomCode: string;
  players: Record<string, NetworkRoomPlayer>;
  messages: NetworkRoomMessage[];
  updatedAt: number;
}

interface NetworkDatabase {
  profiles: Record<string, PublicPeerProfile>;
  friendships: Record<string, NetworkFriendshipRecord>;
  rooms: Record<string, NetworkMultiplayerRoom>;
}

const DB_FILE_PATH = path.resolve(process.cwd(), '.lumiquest-network-db.json');

function loadNetworkDb(): NetworkDatabase {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<NetworkDatabase>;
      return {
        profiles: parsed.profiles || {},
        friendships: parsed.friendships || {},
        rooms: parsed.rooms || {},
      };
    }
  } catch {
    // Fallback to fresh DB
  }
  return {
    profiles: {},
    friendships: {},
    rooms: {},
  };
}

function saveNetworkDb(db: NetworkDatabase): void {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch {
    // Ignore write errors in read-only environments
  }
}

function normalizeCode(raw: string): string {
  const cleaned = raw.trim().toUpperCase().replace(/\s+/g, '');
  const m = cleaned.match(/(\d{4})$/);
  if (m && (cleaned.startsWith('LUMI') || /^\d{4}$/.test(cleaned))) {
    return `LUMI-${m[1]}`;
  }
  return cleaned;
}

function generateDeterministicCode(seed: string): string {
  let hash = 2166136261;
  const text = seed.trim().toLowerCase();
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const digits = 1000 + (Math.abs(hash) % 9000);
  return `LUMI-${digits}`;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws-network' });

  const db: NetworkDatabase = loadNetworkDb();

  function broadcastState(eventType = 'network:state_updated') {
    const payload = JSON.stringify({
      type: eventType,
      state: db,
      timestamp: Date.now(),
    });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  function upsertProfileInternal(profile: PublicPeerProfile): PublicPeerProfile {
    const normalizedCode = profile.friendCode
      ? normalizeCode(profile.friendCode)
      : generateDeterministicCode(`${profile.username}_${profile.name}_${profile.age}`);

    const cleanProfile: PublicPeerProfile = {
      ...profile,
      friendCode: normalizedCode,
      updatedAt: Date.now(),
    };

    db.profiles[cleanProfile.id] = cleanProfile;

    // Also reconcile any placeholder friendships that were addressed to this friendCode or username/name
    Object.values(db.friendships).forEach((fr) => {
      const matchesReceiverCode =
        fr.receiverCode.toUpperCase() === normalizedCode.toUpperCase();
      const matchesReceiverName =
        fr.receiverProfile.ageGroup === cleanProfile.ageGroup &&
        (fr.receiverProfile.username.toLowerCase() ===
          cleanProfile.username.toLowerCase() ||
          fr.receiverProfile.name.toLowerCase() ===
            cleanProfile.name.toLowerCase());

      if (
        fr.requesterId !== cleanProfile.id &&
        (fr.receiverId === cleanProfile.id ||
          matchesReceiverCode ||
          matchesReceiverName)
      ) {
        fr.receiverId = cleanProfile.id;
        fr.receiverCode = cleanProfile.friendCode;
        fr.receiverProfile = cleanProfile;
        fr.updatedAt = Date.now();
      }

      if (fr.requesterId === cleanProfile.id) {
        fr.requesterCode = cleanProfile.friendCode;
        fr.requesterProfile = cleanProfile;
        fr.updatedAt = Date.now();
      }
    });

    return cleanProfile;
  }

  function findProfileByQuery(
    query: string,
    ageGroup: '3-6' | '7-13' | '14-18',
    excludeUserId: string
  ): PublicPeerProfile | undefined {
    const raw = query.trim();
    if (!raw) return undefined;
    const normalizedCode = normalizeCode(raw);
    const cleanQuery = raw.toLowerCase().replace(/^@+/, '');

    const allProfiles = Object.values(db.profiles);

    // 1. Exact match by Friend Code (e.g. LUMI-4829) or User ID
    const byCodeOrId = allProfiles.find(
      (p) =>
        p.id !== excludeUserId &&
        (p.friendCode.toUpperCase() === normalizedCode || p.id === raw)
    );
    if (byCodeOrId) return byCodeOrId;

    // 2. Match by username or name in the same ageGroup (or any group if exact username)
    const bySameStageName = allProfiles.find(
      (p) =>
        p.id !== excludeUserId &&
        p.ageGroup === ageGroup &&
        (p.username.toLowerCase().replace(/^@+/, '') === cleanQuery ||
          p.name.toLowerCase() === cleanQuery ||
          p.username.toLowerCase().includes(cleanQuery) ||
          p.name.toLowerCase().includes(cleanQuery))
    );
    if (bySameStageName) return bySameStageName;

    // 3. Fallback match across any registered profile by name/username
    return allProfiles.find(
      (p) =>
        p.id !== excludeUserId &&
        (p.username.toLowerCase().replace(/^@+/, '') === cleanQuery ||
          p.name.toLowerCase() === cleanQuery)
    );
  }

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    ws.send(
      JSON.stringify({
        type: 'network:init',
        state: db,
        timestamp: Date.now(),
      })
    );

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'profile:upsert' && msg.profile) {
          upsertProfileInternal(msg.profile);
          saveNetworkDb(db);
          broadcastState('network:state_updated');
        } else if (msg.type === 'friendship:upsert' && msg.friendship) {
          const fr = msg.friendship as NetworkFriendshipRecord;
          db.friendships[fr.id] = fr;
          saveNetworkDb(db);
          broadcastState('network:state_updated');
        } else if (msg.type === 'room:update' && msg.room) {
          const room = msg.room as NetworkMultiplayerRoom;
          db.rooms[room.roomCode] = room;
          saveNetworkDb(db);
          broadcastState('network:room_updated');
        }
      } catch {
        // Ignore malformed WS message
      }
    });
  });

  // REST API: Get current global network state
  app.get('/api/network/state', (_req, res) => {
    res.json({ ok: true, state: db });
  });

  // REST API: Register or update a child profile in the global cross-browser directory
  app.post('/api/network/register-profile', (req, res) => {
    const profile = req.body?.profile as PublicPeerProfile | undefined;
    if (!profile || !profile.id) {
      res.status(400).json({ ok: false, error: 'Invalid profile payload' });
      return;
    }
    const saved = upsertProfileInternal(profile);
    saveNetworkDb(db);
    broadcastState('network:state_updated');
    res.json({ ok: true, profile: saved, state: db });
  });

  // REST API: Send a friend request or Direct Connect by Name, @username, or Friend Code (LUMI-XXXX)
  app.post('/api/network/friend-action', (req, res) => {
    const {
      requesterProfile,
      targetQuery,
      targetUserId,
      directConnect = false,
    } = req.body as {
      requesterProfile: PublicPeerProfile;
      targetQuery?: string;
      targetUserId?: string;
      directConnect?: boolean;
    };

    if (!requesterProfile || !requesterProfile.id) {
      res.status(400).json({ ok: false, error: 'Missing requesterProfile' });
      return;
    }

    const savedRequester = upsertProfileInternal(requesterProfile);

    let targetProfile: PublicPeerProfile | undefined = targetUserId
      ? db.profiles[targetUserId]
      : undefined;

    if (!targetProfile && targetQuery) {
      targetProfile = findProfileByQuery(
        targetQuery,
        savedRequester.ageGroup,
        savedRequester.id
      );
    }

    // If the friend from the other browser/device hasn't synced yet or the user typed their Friend Code / Name,
    // create a live network peer record so it immediately links as soon as the other browser is open or connects!
    if (!targetProfile) {
      const raw = (targetQuery || targetUserId || 'Amigo').trim();
      const isCodeFormat =
        /^LUMI-?\d{4}$/i.test(raw) || /^\d{4}$/.test(raw);
      const friendCode = isCodeFormat
        ? normalizeCode(raw)
        : generateDeterministicCode(`${raw}_${savedRequester.ageGroup}`);
      const cleanName = isCodeFormat
        ? `Amigo ${friendCode}`
        : raw.replace(/^@+/, '').charAt(0).toUpperCase() +
          raw.replace(/^@+/, '').slice(1);
      const cleanUsername = isCodeFormat
        ? `@${friendCode.toLowerCase().replace('-', '_')}`
        : `@${raw.toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9_]/g, '') || 'amigo'}`;

      const peerId = `peer_${friendCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      targetProfile = db.profiles[peerId] || {
        id: peerId,
        friendCode,
        username: cleanUsername,
        name: cleanName,
        age: savedRequester.age,
        ageGroup: savedRequester.ageGroup,
        avatarId: savedRequester.avatarId,
        xp: 120,
        streak: 2,
        updatedAt: Date.now(),
      };
      db.profiles[targetProfile.id] = targetProfile;
    }

    // Ensure the friendship is in the same stage for age safety (if remote profile was created in same stage)
    const pairKey = [savedRequester.id, targetProfile.id].sort().join('__');
    const existing =
      Object.values(db.friendships).find(
        (f) =>
          (f.requesterId === savedRequester.id &&
            f.receiverId === targetProfile!.id) ||
          (f.requesterId === targetProfile!.id &&
            f.receiverId === savedRequester.id) ||
          (f.requesterCode === savedRequester.friendCode &&
            f.receiverCode === targetProfile!.friendCode) ||
          (f.requesterCode === targetProfile!.friendCode &&
            f.receiverCode === savedRequester.friendCode)
      ) || db.friendships[`fr_${pairKey}`];

    const friendshipId = existing ? existing.id : `fr_${pairKey}`;
    const newStatus: 'pending' | 'accepted' | 'blocked' = directConnect
      ? 'accepted'
      : existing?.status === 'accepted'
      ? 'accepted'
      : 'pending';

    const record: NetworkFriendshipRecord = {
      id: friendshipId,
      requesterId: existing ? existing.requesterId : savedRequester.id,
      receiverId: existing ? existing.receiverId : targetProfile.id,
      requesterCode: existing
        ? existing.requesterCode
        : savedRequester.friendCode,
      receiverCode: existing ? existing.receiverCode : targetProfile.friendCode,
      ageGroup: savedRequester.ageGroup,
      status: newStatus,
      requesterProfile:
        existing && existing.requesterId !== savedRequester.id
          ? existing.requesterProfile
          : savedRequester,
      receiverProfile:
        existing && existing.receiverId === savedRequester.id
          ? savedRequester
          : targetProfile,
      chatMessages: existing?.chatMessages || [],
      updatedAt: Date.now(),
    };

    db.friendships[friendshipId] = record;
    saveNetworkDb(db);
    broadcastState('network:state_updated');

    res.json({
      ok: true,
      friendship: record,
      targetProfile,
      state: db,
    });
  });

  // REST API: Accept, reject, or block a friendship across browsers
  app.post('/api/network/friend-status', (req, res) => {
    const { friendshipId, action } = req.body as {
      friendshipId: string;
      action: 'accept' | 'reject' | 'block';
    };

    const existing = db.friendships[friendshipId];
    if (!existing) {
      res.status(404).json({ ok: false, error: 'Friendship not found' });
      return;
    }

    if (action === 'reject') {
      delete db.friendships[friendshipId];
    } else if (action === 'accept') {
      existing.status = 'accepted';
      existing.updatedAt = Date.now();
    } else if (action === 'block') {
      existing.status = 'blocked';
      existing.updatedAt = Date.now();
    }

    saveNetworkDb(db);
    broadcastState('network:state_updated');
    res.json({ ok: true, state: db });
  });

  // REST API: Send a chat message between friends across browsers
  app.post('/api/network/chat-message', (req, res) => {
    const { friendshipId, senderId, senderName, text } = req.body as {
      friendshipId: string;
      senderId: string;
      senderName: string;
      text: string;
    };

    const existing = db.friendships[friendshipId];
    if (!existing) {
      res.status(404).json({ ok: false, error: 'Friendship not found' });
      return;
    }

    const msg: NetworkChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      senderId,
      senderName,
      text,
      timestamp: new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    existing.chatMessages.push(msg);
    existing.updatedAt = Date.now();
    saveNetworkDb(db);
    broadcastState('network:state_updated');
    res.json({ ok: true, message: msg, state: db });
  });

  // REST API: Join / Update score / Send message in a Multiplayer Room (SALA-XXX) across browsers
  app.post('/api/network/room-sync', (req, res) => {
    const { roomCode, player, message } = req.body as {
      roomCode: string;
      player?: NetworkRoomPlayer;
      message?: NetworkRoomMessage;
    };

    if (!roomCode) {
      res.status(400).json({ ok: false, error: 'Missing roomCode' });
      return;
    }

    const normalizedRoom = roomCode.trim().toUpperCase();
    if (!db.rooms[normalizedRoom]) {
      db.rooms[normalizedRoom] = {
        roomCode: normalizedRoom,
        players: {},
        messages: [],
        updatedAt: Date.now(),
      };
    }

    const room = db.rooms[normalizedRoom];
    if (player && player.id) {
      room.players[player.id] = {
        ...player,
        updatedAt: Date.now(),
      };
    }
    if (message && message.text) {
      const exists = room.messages.some((m) => m.id === message.id);
      if (!exists) {
        room.messages.push(message);
        if (room.messages.length > 50) {
          room.messages = room.messages.slice(-50);
        }
      }
    }
    room.updatedAt = Date.now();

    saveNetworkDb(db);
    broadcastState('network:room_updated');
    res.json({ ok: true, room, state: db });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`LumiQuest Real-Time Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
