import mqtt, { MqttClient } from 'mqtt';
import {
  AgeGroup,
  UserProfile,
  generateFriendCode,
  normalizeFriendCode,
} from './educationLogic';

export interface PublicPeerProfile {
  id: string;
  friendCode: string;
  username: string;
  name: string;
  age: number;
  ageGroup: AgeGroup;
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
  attachmentType?: 'gif' | 'drawing' | 'chess_invite';
  attachmentId?: string;
  attachmentTitle?: string;
  attachmentUrl?: string;
  chessMatchId?: string;
}

export interface NetworkChessMatch {
  id: string;
  eventType:
    | 'CHESS_INVITE'
    | 'CHESS_ACTIVE'
    | 'CHESS_FINISHED'
    | 'CHESS_DECLINED';
  hostId: string;
  hostName: string;
  hostFriendCode: string;
  hostAvatarId: string;
  hostColor: 'w' | 'b';
  guestId: string;
  guestName: string;
  guestFriendCode: string;
  guestAvatarId: string;
  guestColor: 'w' | 'b';
  timeControlId: '3min' | '5min' | '10min' | '15min' | 'unlimited';
  timeControlLabel: string;
  initialSeconds: number | null;
  whiteTimeSeconds: number | null;
  blackTimeSeconds: number | null;
  colorPreference: 'w' | 'b' | 'random';
  status: 'pending_invite' | 'active' | 'completed' | 'declined';
  fen: string;
  moveHistorySan: string[];
  turn: 'w' | 'b';
  winnerColor?: 'w' | 'b' | 'draw' | null;
  winReason?: string;
  updatedAt: number;
}

export interface NetworkFriendshipRecord {
  id: string;
  requesterId: string;
  receiverId: string;
  requesterCode: string;
  receiverCode: string;
  ageGroup: AgeGroup;
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
  ageGroup: AgeGroup;
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

export interface GlobalNetworkState {
  profiles: Record<string, PublicPeerProfile>;
  friendships: Record<string, NetworkFriendshipRecord>;
  rooms: Record<string, NetworkMultiplayerRoom>;
  chessMatches: Record<string, NetworkChessMatch>;
}

const LOCAL_NET_KEY = 'lumiquest_global_network_v2';
const MQTT_TOPIC_PREFIX = 'lumiquest/v2/net';
const PUBLIC_MQTT_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://test.mosquitto.org:8081/mqtt',
];

export function toPublicPeerProfile(profile: UserProfile): PublicPeerProfile {
  const friendCode =
    profile.friendCode && profile.friendCode.startsWith('LUMI-')
      ? profile.friendCode
      : generateFriendCode(`${profile.username}_${profile.name}_${profile.age}`);

  return {
    id: profile.id,
    friendCode,
    username: profile.username,
    name: profile.name,
    age: profile.age,
    ageGroup: profile.ageGroup,
    avatarId: profile.avatarId,
    xp: profile.xp,
    streak: profile.streak,
    updatedAt: Date.now(),
  };
}

class RealtimeNetworkClient {
  private state: GlobalNetworkState = {
    profiles: {},
    friendships: {},
    rooms: {},
    chessMatches: {},
  };
  private listeners = new Set<(state: GlobalNetworkState) => void>();
  private ws: WebSocket | null = null;
  private mqttClient: MqttClient | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private initialized = false;
  private isConnectedOnline = false;

  public init(): void {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // 1. Load cached state from localStorage backup
    try {
      const saved = window.localStorage.getItem(LOCAL_NET_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<GlobalNetworkState>;
        this.mergeState({
          profiles: parsed.profiles || {},
          friendships: parsed.friendships || {},
          rooms: parsed.rooms || {},
          chessMatches: parsed.chessMatches || {},
        });
      }
    } catch {
      // Ignore storage read errors
    }

    // 2. Setup BroadcastChannel for same-browser tabs
    try {
      if ('BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('lumiquest_realtime_v2');
        this.broadcastChannel.onmessage = (ev) => {
          if (ev.data && ev.data.state) {
            this.mergeState(ev.data.state);
          }
        };
      }
    } catch {
      // Ignore BroadcastChannel errors
    }

    // 3. Fetch authoritative state from our Express server (/api/network/state)
    this.fetchServerState();

    // 4. Connect to same-origin WebSocket (/ws-network) for cross-browser / cross-device sync
    this.connectServerWebSocket();

    // 5. Connect to Public MQTT over WebSockets (wss://broker.emqx.io:8084/mqtt) for P2P global relay
    this.connectPublicMqttBroker(0);
  }

  public getIsOnline(): boolean {
    return this.isConnectedOnline;
  }

  public getState(): GlobalNetworkState {
    return this.state;
  }

  public subscribe(listener: (state: GlobalNetworkState) => void): () => void {
    this.init();
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LOCAL_NET_KEY, JSON.stringify(this.state));
      }
    } catch {
      // Ignore quota errors
    }
    this.listeners.forEach((cb) => cb(this.state));
  }

  private mergeState(incoming: Partial<GlobalNetworkState>): void {
    let changed = false;

    if (incoming.profiles) {
      Object.values(incoming.profiles).forEach((prof) => {
        if (!prof || !prof.id) return;
        const current = this.state.profiles[prof.id];
        if (!current || (prof.updatedAt || 0) >= (current.updatedAt || 0)) {
          this.state.profiles[prof.id] = prof;
          changed = true;
        }
      });
    }

    if (incoming.friendships) {
      Object.values(incoming.friendships).forEach((fr) => {
        if (!fr || !fr.id) return;
        const current = this.state.friendships[fr.id];
        if (!current || (fr.updatedAt || 0) >= (current.updatedAt || 0)) {
          this.state.friendships[fr.id] = fr;
          changed = true;
        }
      });
    }

    if (incoming.rooms) {
      Object.values(incoming.rooms).forEach((rm) => {
        if (!rm || !rm.roomCode) return;
        const current = this.state.rooms[rm.roomCode];
        if (!current || (rm.updatedAt || 0) >= (current.updatedAt || 0)) {
          this.state.rooms[rm.roomCode] = rm;
          changed = true;
        }
      });
    }

    if (incoming.chessMatches) {
      Object.values(incoming.chessMatches).forEach((cm) => {
        if (!cm || !cm.id) return;
        const current = this.state.chessMatches[cm.id];
        if (!current || (cm.updatedAt || 0) >= (current.updatedAt || 0)) {
          this.state.chessMatches[cm.id] = cm;
          changed = true;
        }
      });
    }

    if (changed) {
      this.state = {
        profiles: { ...this.state.profiles },
        friendships: { ...this.state.friendships },
        rooms: { ...this.state.rooms },
        chessMatches: { ...this.state.chessMatches },
      };
      this.notifyListeners();
    }
  }

  private async fetchServerState(): Promise<void> {
    try {
      const res = await fetch('/api/network/state');
      if (!res.ok) return;
      const data = await res.json();
      if (data?.state) {
        this.isConnectedOnline = true;
        this.mergeState(data.state);
      }
    } catch {
      // Ignore fetch errors when offline
    }
  }

  private connectServerWebSocket(): void {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws-network`;
      const ws = new WebSocket(wsUrl);
      this.ws = ws;

      ws.onopen = () => {
        this.isConnectedOnline = true;
        this.notifyListeners();
      };

      ws.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          if (payload?.state) {
            this.isConnectedOnline = true;
            this.mergeState(payload.state);
          }
        } catch {
          // Ignore invalid JSON
        }
      };

      ws.onclose = () => {
        setTimeout(() => this.connectServerWebSocket(), 3500);
      };
    } catch {
      // Ignore WS initialization errors
    }
  }

  private connectPublicMqttBroker(brokerIdx: number): void {
    try {
      const brokerUrl =
        PUBLIC_MQTT_BROKERS[brokerIdx % PUBLIC_MQTT_BROKERS.length];
      const client = mqtt.connect(brokerUrl, {
        clientId: `lumiquest_${Math.random().toString(16).slice(2, 10)}`,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 4000,
      });
      this.mqttClient = client;

      client.on('connect', () => {
        this.isConnectedOnline = true;
        client.subscribe(`${MQTT_TOPIC_PREFIX}/profiles/+`);
        client.subscribe(`${MQTT_TOPIC_PREFIX}/friendships/+`);
        client.subscribe(`${MQTT_TOPIC_PREFIX}/rooms/+`);
        client.subscribe(`${MQTT_TOPIC_PREFIX}/chess/+`);

        // Republish known local profiles as retained MQTT messages
        Object.values(this.state.profiles).forEach((p) => {
          client.publish(
            `${MQTT_TOPIC_PREFIX}/profiles/${p.friendCode}`,
            JSON.stringify(p),
            { qos: 0, retain: true }
          );
        });
        this.notifyListeners();
      });

      client.on('message', (topic, payloadBuffer) => {
        try {
          const parsed = JSON.parse(payloadBuffer.toString());
          if (topic.includes('/profiles/') && parsed?.id) {
            this.mergeState({ profiles: { [parsed.id]: parsed } });
          } else if (topic.includes('/friendships/') && parsed?.id) {
            this.mergeState({ friendships: { [parsed.id]: parsed } });
          } else if (topic.includes('/rooms/') && parsed?.roomCode) {
            this.mergeState({ rooms: { [parsed.roomCode]: parsed } });
          } else if (topic.includes('/chess/') && parsed?.id) {
            this.mergeState({ chessMatches: { [parsed.id]: parsed } });
          }
        } catch {
          // Ignore malformed MQTT message
        }
      });
    } catch {
      // Ignore MQTT errors in restricted environments
    }
  }

  private publishMqtt(subtopic: string, data: unknown, retain = true): void {
    try {
      if (this.mqttClient && this.mqttClient.connected) {
        this.mqttClient.publish(
          `${MQTT_TOPIC_PREFIX}/${subtopic}`,
          JSON.stringify(data),
          { qos: 0, retain }
        );
      }
    } catch {
      // Ignore publish errors
    }
  }

  private broadcastLocal(): void {
    try {
      this.broadcastChannel?.postMessage({ state: this.state });
    } catch {
      // Ignore
    }
  }

  /**
   * Registra y sincroniza en tiempo real el perfil del niño (con su Código de Amigo LUMI-XXXX)
   * en el servidor WebSocket y en la red MQTT entre navegadores.
   */
  public async syncUserProfile(user: UserProfile): Promise<void> {
    this.init();
    const pub = toPublicPeerProfile(user);
    this.mergeState({ profiles: { [pub.id]: pub } });
    this.publishMqtt(`profiles/${pub.friendCode}`, pub, true);
    this.broadcastLocal();

    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'profile:upsert', profile: pub }));
      }
      const res = await fetch('/api/network/register-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile: pub }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.state) this.mergeState(json.state);
      }
    } catch {
      // Local + MQTT state already updated
    }
  }

  /**
   * Envía una solicitud de amistad o conecta directamente por Código de Amigo (LUMI-XXXX) o Nombre
   * entre distintos navegadores y dispositivos sin bloquear nunca al usuario.
   */
  public async sendFriendRequestOrDirectConnect(params: {
    requester: UserProfile;
    targetQuery?: string;
    targetUserId?: string;
    directConnect?: boolean;
  }): Promise<{
    friendship: NetworkFriendshipRecord;
    targetProfile: PublicPeerProfile;
  }> {
    this.init();
    const requesterPub = toPublicPeerProfile(params.requester);

    try {
      const res = await fetch('/api/network/friend-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterProfile: requesterPub,
          targetQuery: params.targetQuery,
          targetUserId: params.targetUserId,
          directConnect: Boolean(params.directConnect),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.state) {
          this.mergeState(data.state);
        }
        if (data?.friendship) {
          this.publishMqtt(
            `friendships/${data.friendship.id}`,
            data.friendship,
            true
          );
          this.broadcastLocal();
          return {
            friendship: data.friendship,
            targetProfile: data.targetProfile,
          };
        }
      }
    } catch {
      // Fallback to local + MQTT resolution if server endpoint is unreachable
    }

    // Fallback resolution via MQTT / cached profiles
    const raw = (params.targetQuery || params.targetUserId || 'Amigo').trim();
    const normalizedCode = normalizeFriendCode(raw);
    const cleanQuery = raw.toLowerCase().replace(/^@+/, '');

    let targetProfile = Object.values(this.state.profiles).find(
      (p) =>
        p.id !== requesterPub.id &&
        (p.id === params.targetUserId ||
          p.friendCode.toUpperCase() === normalizedCode ||
          p.username.toLowerCase().replace(/^@+/, '') === cleanQuery ||
          p.name.toLowerCase() === cleanQuery)
    );

    if (!targetProfile) {
      const isCodeFormat =
        /^LUMI-?\d{4}$/i.test(raw) || /^\d{4}$/.test(raw);
      const friendCode = isCodeFormat
        ? normalizedCode
        : generateFriendCode(`${raw}_${requesterPub.ageGroup}`);
      const peerId = `peer_${friendCode.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      targetProfile = {
        id: peerId,
        friendCode,
        username: isCodeFormat
          ? `@${friendCode.toLowerCase().replace('-', '_')}`
          : `@${cleanQuery.replace(/[^a-z0-9_]/g, '') || 'amigo'}`,
        name: isCodeFormat
          ? `Amigo ${friendCode}`
          : cleanQuery.charAt(0).toUpperCase() + cleanQuery.slice(1),
        age: requesterPub.age,
        ageGroup: requesterPub.ageGroup,
        avatarId: requesterPub.avatarId,
        xp: 120,
        streak: 2,
        updatedAt: Date.now(),
      };
    }

    const pairKey = [requesterPub.id, targetProfile.id].sort().join('__');
    const friendshipId = `fr_${pairKey}`;
    const existing = this.state.friendships[friendshipId];
    const record: NetworkFriendshipRecord = {
      id: friendshipId,
      requesterId: existing ? existing.requesterId : requesterPub.id,
      receiverId: existing ? existing.receiverId : targetProfile.id,
      requesterCode: existing
        ? existing.requesterCode
        : requesterPub.friendCode,
      receiverCode: existing ? existing.receiverCode : targetProfile.friendCode,
      ageGroup: requesterPub.ageGroup,
      status: params.directConnect
        ? 'accepted'
        : existing?.status === 'accepted'
        ? 'accepted'
        : 'pending',
      requesterProfile: requesterPub,
      receiverProfile: targetProfile,
      chatMessages: existing?.chatMessages || [],
      updatedAt: Date.now(),
    };

    this.mergeState({
      profiles: { [targetProfile.id]: targetProfile },
      friendships: { [record.id]: record },
    });
    this.publishMqtt(`profiles/${targetProfile.friendCode}`, targetProfile, true);
    this.publishMqtt(`friendships/${record.id}`, record, true);
    this.broadcastLocal();

    return { friendship: record, targetProfile };
  }

  public async updateFriendshipStatus(
    friendshipId: string,
    action: 'accept' | 'reject' | 'block'
  ): Promise<void> {
    this.init();
    const existing = this.state.friendships[friendshipId];
    if (existing) {
      if (action === 'reject') {
        const nextFriendships = { ...this.state.friendships };
        delete nextFriendships[friendshipId];
        this.state = { ...this.state, friendships: nextFriendships };
        this.notifyListeners();
      } else {
        const updated: NetworkFriendshipRecord = {
          ...existing,
          status: action === 'accept' ? 'accepted' : 'blocked',
          updatedAt: Date.now(),
        };
        this.mergeState({ friendships: { [friendshipId]: updated } });
        this.publishMqtt(`friendships/${friendshipId}`, updated, true);
      }
      this.broadcastLocal();
    }

    try {
      const res = await fetch('/api/network/friend-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId, action }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) this.mergeState(data.state);
      }
    } catch {
      // Handled optimistically + via MQTT
    }
  }

  public async sendFriendshipChatMessage(
    friendshipId: string,
    senderId: string,
    senderName: string,
    text: string,
    attachment?: {
      attachmentType: 'gif' | 'drawing' | 'chess_invite';
      attachmentId?: string;
      attachmentTitle?: string;
      attachmentUrl?: string;
      chessMatchId?: string;
    }
  ): Promise<void> {
    this.init();
    const existing = this.state.friendships[friendshipId];
    const msg: NetworkChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      senderId,
      senderName,
      text,
      timestamp: new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      ...(attachment || {}),
    };

    if (existing) {
      const updated: NetworkFriendshipRecord = {
        ...existing,
        chatMessages: [...existing.chatMessages, msg],
        updatedAt: Date.now(),
      };
      this.mergeState({ friendships: { [friendshipId]: updated } });
      this.publishMqtt(`friendships/${friendshipId}`, updated, true);
      this.broadcastLocal();
    }

    try {
      const res = await fetch('/api/network/chat-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          friendshipId,
          senderId,
          senderName,
          text,
          ...(attachment || {}),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) this.mergeState(data.state);
      }
    } catch {
      // Handled optimistically + via MQTT
    }
  }

  public async syncMultiplayerRoom(params: {
    roomCode: string;
    player?: NetworkRoomPlayer;
    message?: NetworkRoomMessage;
  }): Promise<void> {
    this.init();
    const code = params.roomCode.trim().toUpperCase();
    const currentRoom: NetworkMultiplayerRoom = this.state.rooms[code] || {
      roomCode: code,
      players: {},
      messages: [],
      updatedAt: Date.now(),
    };

    const nextPlayers = { ...currentRoom.players };
    if (params.player) {
      nextPlayers[params.player.id] = {
        ...params.player,
        updatedAt: Date.now(),
      };
    }

    const nextMessages = [...currentRoom.messages];
    if (
      params.message &&
      !nextMessages.some((m) => m.id === params.message!.id)
    ) {
      nextMessages.push(params.message);
    }

    const updatedRoom: NetworkMultiplayerRoom = {
      roomCode: code,
      players: nextPlayers,
      messages: nextMessages.slice(-50),
      updatedAt: Date.now(),
    };

    this.mergeState({ rooms: { [code]: updatedRoom } });
    this.publishMqtt(`rooms/${code}`, updatedRoom, true);
    this.broadcastLocal();

    try {
      const res = await fetch('/api/network/room-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: code,
          player: params.player,
          message: params.message,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) this.mergeState(data.state);
      }
    } catch {
      // Handled optimistically + via MQTT
    }
  }

  /**
   * Envía una solicitud de partida de Ajedrez en tiempo real (CHESS_INVITE) con el temporizador
   * y color elegidos por el jugador, sincronizada por WebSocket, MQTT y BroadcastChannel.
   */
  public async sendChessInvite(params: {
    match: NetworkChessMatch;
    friendshipId?: string;
  }): Promise<NetworkChessMatch> {
    this.init();
    const matchWithTimestamp: NetworkChessMatch = {
      ...params.match,
      eventType: 'CHESS_INVITE',
      updatedAt: Date.now(),
    };

    this.mergeState({
      chessMatches: { [matchWithTimestamp.id]: matchWithTimestamp },
    });
    this.publishMqtt(`chess/${matchWithTimestamp.id}`, matchWithTimestamp, true);
    this.broadcastLocal();

    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: 'CHESS_INVITE',
            match: matchWithTimestamp,
          })
        );
      }
      const res = await fetch('/api/network/chess-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          match: matchWithTimestamp,
          friendshipId: params.friendshipId,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) this.mergeState(data.state);
        if (data?.match) return data.match as NetworkChessMatch;
      }
    } catch {
      // Handled optimistically + via MQTT + BroadcastChannel
    }

    return matchWithTimestamp;
  }

  public async respondChessInvite(
    matchId: string,
    action: 'accept' | 'decline'
  ): Promise<NetworkChessMatch | null> {
    this.init();
    const existing = this.state.chessMatches[matchId];
    if (existing) {
      const updated: NetworkChessMatch = {
        ...existing,
        status: action === 'accept' ? 'active' : 'declined',
        eventType: action === 'accept' ? 'CHESS_ACTIVE' : 'CHESS_DECLINED',
        updatedAt: Date.now(),
      };
      this.mergeState({ chessMatches: { [matchId]: updated } });
      this.publishMqtt(`chess/${matchId}`, updated, true);
      this.broadcastLocal();
      try {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({ type: 'chess:upsert', match: updated })
          );
        }
      } catch {
        // Ignore WS error
      }
    }

    try {
      const res = await fetch('/api/network/chess-respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, action }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) this.mergeState(data.state);
        if (data?.match) return data.match as NetworkChessMatch;
      }
    } catch {
      // Handled optimistically
    }
    return this.state.chessMatches[matchId] || null;
  }

  public async syncChessMatchMove(params: {
    matchId: string;
    fen: string;
    moveHistorySan: string[];
    turn: 'w' | 'b';
    whiteTimeSeconds: number | null;
    blackTimeSeconds: number | null;
    status?: 'active' | 'completed';
    winnerColor?: 'w' | 'b' | 'draw' | null;
    winReason?: string;
  }): Promise<void> {
    this.init();
    const existing = this.state.chessMatches[params.matchId];
    if (existing) {
      const updated: NetworkChessMatch = {
        ...existing,
        fen: params.fen,
        moveHistorySan: params.moveHistorySan,
        turn: params.turn,
        whiteTimeSeconds: params.whiteTimeSeconds,
        blackTimeSeconds: params.blackTimeSeconds,
        status: params.status || existing.status,
        eventType:
          params.status === 'completed' ? 'CHESS_FINISHED' : 'CHESS_ACTIVE',
        winnerColor:
          params.winnerColor !== undefined
            ? params.winnerColor
            : existing.winnerColor,
        winReason:
          params.winReason !== undefined
            ? params.winReason
            : existing.winReason,
        updatedAt: Date.now(),
      };
      this.mergeState({ chessMatches: { [params.matchId]: updated } });
      this.publishMqtt(`chess/${params.matchId}`, updated, true);
      this.broadcastLocal();

      try {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(
            JSON.stringify({ type: 'chess:upsert', match: updated })
          );
        }
      } catch {
        // Ignore WS error
      }
    }

    try {
      const res = await fetch('/api/network/chess-move', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.state) this.mergeState(data.state);
      }
    } catch {
      // Handled optimistically
    }
  }
}

export const realtimeNetwork = new RealtimeNetworkClient();
