import React, { useState, useRef } from 'react';
import {
  UserPlus,
  Check,
  X,
  Send,
  ShieldAlert,
  ShieldCheck,
  Ban,
  Flag,
  MessageSquare,
  Gamepad2,
  Lock,
  Search,
  Copy,
  Wifi,
  Zap,
  Image as ImageIcon,
  SmilePlus,
  Sparkles,
  Upload,
} from 'lucide-react';
import {
  AgeGroup,
  FriendshipStatus,
  UserProfile,
  SAFE_KIDS_GIFS,
  SafeKidsGifItem,
  ANTI_CHILD_PHOTO_LEGAL_MESSAGE,
  canUsersChat,
  detectGroomingOrPersonalDataInChat,
  evaluateChatImageSafety,
  isChatEnabledForGroup,
  moderateChatMessage,
  requiresParentalConsent,
} from '../utils/educationLogic';
import { AvatarBadge, MascotCompanion } from './ArtworkRenderer';
import { GamesView } from './GamesView';
import { playRewardSound } from '../utils/soundEffects';

export interface ChatMessageItem {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  attachmentType?: 'gif' | 'drawing';
  attachmentId?: string;
  attachmentUrl?: string;
  attachmentTitle?: string;
}

export interface FriendshipRecord {
  id: string;
  userAId: string;
  userBId: string;
  ageGroup: AgeGroup;
  statusForCurrent: FriendshipStatus;
  peerProfile: {
    id: string;
    friendCode?: string;
    username: string;
    name: string;
    ageGroup: AgeGroup;
    avatarId: string;
    xp: number;
    streak: number;
  };
  chatMessages: ChatMessageItem[];
}

interface FriendsChatViewProps {
  currentUser: UserProfile;
  sameGroupRegisteredUsers: UserProfile[];
  friendships: FriendshipRecord[];
  onSendFriendRequestByUserId: (targetUserId: string) => void;
  onSendFriendRequestByUsername?: (usernameOrName: string) => void;
  onDirectConnectByFriendCode?: (codeOrName: string) => void;
  onAcceptFriend: (friendshipId: string) => void;
  onRejectFriend: (friendshipId: string) => void;
  onBlockOrReportFriend: (
    friendshipId: string,
    action: 'block' | 'report'
  ) => void;
  onSendMessage: (
    friendshipId: string,
    text: string,
    attachment?: {
      attachmentType: 'gif' | 'drawing';
      attachmentId?: string;
      attachmentTitle?: string;
      attachmentUrl?: string;
    }
  ) => void;
  onEarnGameXp: (xpAmount: number, gemsEarned?: number) => void;
  onOpenParentalPanel: () => void;
}

export function FriendsChatView({
  currentUser,
  sameGroupRegisteredUsers,
  friendships,
  onSendFriendRequestByUserId,
  onSendFriendRequestByUsername,
  onDirectConnectByFriendCode,
  onAcceptFriend,
  onRejectFriend,
  onBlockOrReportFriend,
  onSendMessage,
  onEarnGameXp,
  onOpenParentalPanel,
}: FriendsChatViewProps) {
  const chatEnabledInStage = isChatEnabledForGroup(currentUser.ageGroup);
  const isYoungKid = currentUser.ageGroup === '3-6';
  const isTeenDark = currentUser.ageGroup === '14-18';

  const [rightPanelMode, setRightPanelMode] = useState<'chat' | 'games'>(
    chatEnabledInStage ? 'chat' : 'games'
  );

  const acceptedFriends = friendships.filter(
    (f) => f.statusForCurrent === 'accepted'
  );
  const blockedFriends = friendships.filter(
    (f) => f.statusForCurrent === 'blocked'
  );
  const pendingReceived = friendships.filter(
    (f) => f.statusForCurrent === 'pending_received'
  );
  const pendingSent = friendships.filter(
    (f) => f.statusForCurrent === 'pending_sent'
  );
  const allPendingRequests = [...pendingReceived, ...pendingSent];

  const [selectedFriendshipId, setSelectedFriendshipId] = useState<string>(
    acceptedFriends[0]?.id || friendships[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [newFriendInput, setNewFriendInput] = useState('');
  const [directCodeInput, setDirectCodeInput] = useState('');
  const [copiedFriendCode, setCopiedFriendCode] = useState(false);
  const [friendRequestFeedback, setFriendRequestFeedback] = useState<
    string | null
  >(null);
  const [messageInput, setMessageInput] = useState('');
  const [moderationAlert, setModerationAlert] = useState<string | null>(null);
  const [groomingExpulsionAlert, setGroomingExpulsionAlert] = useState<{
    expelledPeerName: string;
    reason: string;
  } | null>(null);
  const [reportNotice, setReportNotice] = useState<string | null>(null);

  // Estados para el selector de GIFs seguros y el Escáner de Imágenes Anti-Fotos de Niños
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [imageScannerOpen, setImageScannerOpen] = useState(false);
  const [isScanningImage, setIsScanningImage] = useState(false);
  const [imageLegalBlockAlert, setImageLegalBlockAlert] = useState<string | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeFriendship =
    friendships.find((f) => f.id === selectedFriendshipId) ||
    acceptedFriends[0] ||
    friendships[0];

  const chatEligibility = activeFriendship
    ? canUsersChat(
        activeFriendship.statusForCurrent,
        currentUser.age,
        currentUser.parentalChatApproved,
        activeFriendship.peerProfile.ageGroup === currentUser.ageGroup,
        currentUser.ageGroup
      )
    : {
        canChat: false,
        reason: 'Aún no tienes un amigo seleccionado para chatear.',
      };

  const handleCopyMyFriendCode = () => {
    playRewardSound('pop');
    try {
      navigator.clipboard?.writeText(currentUser.friendCode);
    } catch {
      // Ignore clipboard permission errors
    }
    setCopiedFriendCode(true);
    setTimeout(() => setCopiedFriendCode(false), 2000);
  };

  /**
   * 1C) Ejecuta el bloqueo instantáneo del mensaje y la expulsión automática del usuario
   * cuando el detector de Grooming y Datos Personales identifica una infracción crítica.
   */
  const executeAutomaticGroomingBlockAndExpulsion = (
    friendship: FriendshipRecord,
    reason: string
  ) => {
    playRewardSound('wrong');
    onBlockOrReportFriend(friendship.id, 'block');
    setModerationAlert(reason);
    setGroomingExpulsionAlert({
      expelledPeerName: friendship.peerProfile.name,
      reason,
    });
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeFriendship || !chatEnabledInStage) return;

    if (!chatEligibility.canChat) {
      setModerationAlert(
        chatEligibility.reason || 'No puedes chatear con este usuario aún.'
      );
      playRewardSound('wrong');
      return;
    }

    const modResult = moderateChatMessage(messageInput);
    if (!modResult.allowed) {
      if (modResult.autoBlockAndExpelSender) {
        // 1C) Bloquea el mensaje inmediatamente Y bloquea/expulsa automáticamente a la persona de la lista de amigos
        executeAutomaticGroomingBlockAndExpulsion(
          activeFriendship,
          modResult.reason ||
            'ALERTA DE PROTECCIÓN INFANTIL: Mensaje bloqueado y usuario expulsado automáticamente por pedir o enviar fotos o datos personales.'
        );
        setMessageInput('');
        return;
      }

      playRewardSound('wrong');
      setModerationAlert(
        modResult.reason || 'Mensaje bloqueado por el filtro de seguridad.'
      );
      return;
    }

    playRewardSound('pop');
    setModerationAlert(null);
    setImageLegalBlockAlert(null);
    onSendMessage(activeFriendship.id, modResult.sanitizedText);
    setMessageInput('');
  };

  const handleSimulateIncomingGroomingAttempt = () => {
    if (!activeFriendship) return;
    const simulatedIncomingText = 'Hola, mandame una foto tuya y decime dónde vivís';
    const check = detectGroomingOrPersonalDataInChat(simulatedIncomingText);
    if (!check.allowed && check.autoBlockAndExpelSender) {
      executeAutomaticGroomingBlockAndExpulsion(
        activeFriendship,
        `ALERTA DE PROTECCIÓN INFANTIL: El usuario "${activeFriendship.peerProfile.name}" intentó pedir una foto personal o dirección ("${simulatedIncomingText}"). El mensaje fue bloqueado antes de entregarse y "${activeFriendship.peerProfile.name}" fue bloqueado y expulsado automáticamente de tu lista de amigos.`
      );
    }
  };

  const handleSendSafeGif = (gif: SafeKidsGifItem) => {
    if (!activeFriendship || !chatEligibility.canChat) return;
    playRewardSound('pop');
    setModerationAlert(null);
    setImageLegalBlockAlert(null);
    onSendMessage(activeFriendship.id, `[GIF Animado: ${gif.title}] ${gif.caption}`, {
      attachmentType: 'gif',
      attachmentId: gif.id,
      attachmentTitle: gif.title,
    });
    setGifPickerOpen(false);
  };

  /**
   * 1B) Escáner de Privacidad antes de enviar cualquier imagen en el chat:
   * Si identifica un rostro real o foto de niño/persona, bloquea la subida inmediatamente con el aviso legal exacto.
   */
  const runImagePrivacyScanAndSend = async (params: {
    fileName: string;
    imageKind: 'drawing' | 'homework' | 'photo';
    imageBase64?: string;
  }) => {
    if (!activeFriendship) return;
    setIsScanningImage(true);
    setImageLegalBlockAlert(null);
    setModerationAlert(null);

    try {
      const localEval = evaluateChatImageSafety({
        containsPersonOrFace: params.imageKind === 'photo',
        fileName: params.fileName,
        imageKind: params.imageKind,
      });

      let allowed = localEval.allowed;
      let reason = localEval.reason;

      try {
        const res = await fetch('/api/safety/scan-chat-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: params.fileName,
            containsFaceClientCheck: !localEval.allowed,
            imageKind: params.imageKind,
            imageBase64: params.imageBase64,
          }),
        });
        const data = await res.json();
        if (data && data.allowed === false) {
          allowed = false;
          reason = data.reason || ANTI_CHILD_PHOTO_LEGAL_MESSAGE;
        }
      } catch {
        // Use localEval result
      }

      if (!allowed) {
        playRewardSound('wrong');
        setImageLegalBlockAlert(ANTI_CHILD_PHOTO_LEGAL_MESSAGE);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      playRewardSound('correct');
      setImageLegalBlockAlert(null);
      setImageScannerOpen(false);
      onSendMessage(
        activeFriendship.id,
        `🎨 Compartió un dibujo de curso verificado: "${params.fileName}"`,
        {
          attachmentType: 'drawing',
          attachmentTitle: params.fileName,
        }
      );
    } finally {
      setIsScanningImage(false);
    }
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = typeof reader.result === 'string' ? reader.result : undefined;
      const lower = file.name.toLowerCase();
      const isSafeDrawingOrHomework =
        /\b(dibujo|tarea|curso|arte|boceto|drawing|homework|sketch|math)\b/i.test(
          lower
        );
      runImagePrivacyScanAndSend({
        fileName: file.name,
        imageKind: isSafeDrawingOrHomework ? 'drawing' : 'photo',
        imageBase64: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleAddFriendByUsername = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newFriendInput.trim();
    if (!cleaned) return;
    playRewardSound('pop');
    onSendFriendRequestByUsername?.(cleaned);
    setNewFriendInput('');
    setFriendRequestFeedback(
      `Solicitud enviada en vivo a "${cleaned}". Está sincronizada entre navegadores y dispositivos.`
    );
  };

  const handleDirectConnectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = directCodeInput.trim();
    if (!cleaned) return;
    playRewardSound('fanfare');
    if (onDirectConnectByFriendCode) {
      onDirectConnectByFriendCode(cleaned);
    } else {
      onSendFriendRequestByUsername?.(cleaned);
    }
    setDirectCodeInput('');
    setFriendRequestFeedback(
      `¡Conectado en directo con "${cleaned}" vía red en tiempo real! Ya pueden chatear y jugar en la misma sala desde distintos navegadores.`
    );
  };

  const availableSameGroupUsers = sameGroupRegisteredUsers.filter(
    (u) =>
      u.id !== currentUser.id &&
      !friendships.some(
        (f) =>
          f.peerProfile.id === u.id ||
          (u.friendCode &&
            f.peerProfile.friendCode?.toUpperCase() ===
              u.friendCode.toUpperCase())
      ) &&
      (searchQuery.trim() === '' ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.friendCode &&
          u.friendCode.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  const filteredGifs = SAFE_KIDS_GIFS.filter(
    (g) =>
      gifSearchQuery.trim() === '' ||
      g.title.toLowerCase().includes(gifSearchQuery.toLowerCase()) ||
      g.tag.toLowerCase().includes(gifSearchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Cabecera de Amigos + Código de Amigo Único Sincronizado en Red Real (WebSocket + MQTT) */}
      <section
        className={`rounded-[32px] border p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
          isYoungKid
            ? 'bg-gradient-to-r from-[#FFF5F5] to-[#ECFCCB] border-2 border-[#FF6B6B]/40 text-slate-900 shadow-sm'
            : isTeenDark
            ? 'bg-[#181326] border-purple-900/50 text-white'
            : 'bg-white dark:bg-[#181326] border-slate-200 dark:border-purple-900/50 text-slate-900 dark:text-slate-100 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <MascotCompanion variant="heart" size="sm" mood="happy" />
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 text-[11px] font-black text-emerald-600 dark:text-[#BEF264]">
              <Wifi className="w-3.5 h-3.5" />
              <span>Red en Vivo Activa + Guardián IA Anti-Grooming y Anti-Fotos</span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold font-display">
              {isYoungKid
                ? 'Mis Amigos para Jugar en Vivo'
                : 'Amigos en Red, Chat Pastel Seguro y Salas Multijugador'}
            </h1>
            <p className="text-xs sm:text-sm opacity-75 mt-0.5">
              Comparte tu <strong>Código de Amigo</strong> o busca por nombre desde cualquier navegador o celular para conectarse al instante.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Insignia con el Código de Amigo Único (ej. LUMI-4829) */}
          <div
            data-testid="my-friend-code-badge"
            className="px-3.5 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center gap-2"
          >
            <div className="text-left">
              <div className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                Tu Código de Amigo
              </div>
              <div className="font-mono font-black text-xs sm:text-sm text-emerald-700 dark:text-[#BEF264]">
                {currentUser.friendCode}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCopyMyFriendCode}
              title="Copiar mi Código de Amigo"
              className="px-2.5 py-1.5 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-extrabold text-xs flex items-center gap-1"
            >
              {copiedFriendCode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar
                </>
              )}
            </button>
          </div>

          {chatEnabledInStage && (
            <div className="inline-flex p-1 rounded-full bg-black/5 dark:bg-white/10 border border-slate-300/30">
              <button
                type="button"
                onClick={() => setRightPanelMode('chat')}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  rightPanelMode === 'chat'
                    ? 'bg-[#A594F9] text-white shadow-2xs'
                    : 'opacity-75 hover:opacity-100'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat Seguro IA
              </button>
              <button
                type="button"
                onClick={() => setRightPanelMode('games')}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  rightPanelMode === 'games'
                    ? 'bg-[#A594F9] text-white shadow-2xs'
                    : 'opacity-75 hover:opacity-100'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                Juegos Multijugador
              </button>
            </div>
          )}

          {requiresParentalConsent(currentUser.age) && (
            <button
              type="button"
              onClick={onOpenParentalPanel}
              className="px-4 py-2 rounded-full bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            >
              <Lock className="w-3.5 h-3.5" />
              PIN de Padres
            </button>
          )}
        </div>
      </section>

      {/* ALERTA PROMINENTE CUANDO UN USUARIO FUE EXPULSADO Y BLOQUEADO AUTOMÁTICAMENTE POR GROOMING / DATOS PERSONALES */}
      {groomingExpulsionAlert && (
        <div
          role="alert"
          data-testid="grooming-expulsion-alert"
          className="p-5 rounded-[28px] bg-red-600 text-white border-4 border-red-300 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-3.5">
            <ShieldAlert className="w-8 h-8 text-amber-300 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-black uppercase tracking-wider text-amber-200">
                Escudo Anti-Grooming Activado · Bloqueo y Expulsión Instantánea
              </div>
              <h3 className="text-base sm:text-lg font-black font-display">
                Usuario &ldquo;{groomingExpulsionAlert.expelledPeerName}&rdquo; bloqueado y expulsado de tus amigos por seguridad
              </h3>
              <p className="text-xs text-white/95 font-medium leading-relaxed">
                {groomingExpulsionAlert.reason}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setGroomingExpulsionAlert(null)}
            className="px-4 py-2 rounded-full bg-white text-red-700 font-black text-xs shrink-0"
          >
            Entendido
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Conectar por Código, Solicitudes, Lista de Amigos y Buscador en Vivo */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Conectar Directo por Código de Amigo */}
          <div
            data-testid="direct-connect-friend-code-section"
            className={`rounded-[32px] border-2 p-6 space-y-4 ${
              isTeenDark
                ? 'bg-[#181326] border-emerald-500/40 text-white'
                : 'bg-white dark:bg-[#181326] border-emerald-500/40 text-slate-900 dark:text-slate-100 shadow-sm'
            }`}
          >
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-[#BEF264] flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                Sincronización Instantánea (WebSocket / MQTT)
              </span>
              <h2 className="font-extrabold text-base mt-0.5">
                Conectar directo por Código de Amigo
              </h2>
              <p className="text-xs opacity-75 mt-0.5">
                Ingresa el código de tu amigo (ej. <strong>LUMI-4829</strong>) o su nombre desde otro navegador o celular para vincularse al instante.
              </p>
            </div>

            <form
              onSubmit={handleDirectConnectSubmit}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
            >
              <input
                type="text"
                data-testid="direct-connect-friend-code-input"
                value={directCodeInput}
                onChange={(e) => setDirectCodeInput(e.target.value)}
                placeholder="Código (ej. LUMI-4829) o nombre..."
                aria-label="Código de Amigo para conectar directo"
                className={`flex-1 h-11 px-3.5 rounded-2xl border text-xs font-mono font-bold ${
                  isTeenDark
                    ? 'bg-[#120E20] border-purple-800/50 text-white'
                    : 'bg-slate-50 dark:bg-[#120E20] border-slate-200 dark:border-purple-800/50 text-slate-900 dark:text-white'
                }`}
              />
              <button
                type="submit"
                data-testid="direct-connect-friend-code-btn"
                className="h-11 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                Conectar directo por Código de Amigo
              </button>
            </form>
          </div>

          {/* 2. Enviar Solicitud de Amistad */}
          <div
            className={`rounded-[32px] border p-6 space-y-4 ${
              isTeenDark
                ? 'bg-[#181326] border-purple-900/50 text-white'
                : 'bg-white dark:bg-[#181326] border-slate-200 dark:border-purple-900/50 text-slate-900 dark:text-slate-100 shadow-sm'
            }`}
          >
            <div>
              <h2 className="font-extrabold text-base">
                Enviar Solicitud de Amistad
              </h2>
              <p className="text-xs opacity-70 mt-0.5">
                Escribe el nombre, @usuario o Código de Amigo de tu compañero en cualquier navegador para enviarle solicitud.
              </p>
            </div>

            <form
              onSubmit={handleAddFriendByUsername}
              data-testid="add-friend-by-username-form"
              className="flex items-center gap-2"
            >
              <input
                type="text"
                data-testid="friend-username-input"
                value={newFriendInput}
                onChange={(e) => setNewFriendInput(e.target.value)}
                placeholder="Ej. Mateo, @mateo o LUMI-4829..."
                aria-label="Nombre, usuario o código del amigo"
                className={`flex-1 h-11 px-3.5 rounded-2xl border text-xs ${
                  isTeenDark
                    ? 'bg-[#120E20] border-purple-800/50 text-white'
                    : 'bg-slate-50 dark:bg-[#120E20] border-slate-200 dark:border-purple-800/50 text-slate-900 dark:text-white'
                }`}
              />
              <button
                type="submit"
                data-testid="send-friend-request-btn"
                className="h-11 px-4 rounded-2xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Enviar Solicitud
              </button>
            </form>

            {friendRequestFeedback && (
              <div
                data-testid="friend-request-feedback"
                className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold"
              >
                {friendRequestFeedback}
              </div>
            )}
          </div>

          {/* 3. Gestión de Solicitudes Pendientes */}
          <div
            data-testid="pending-requests-section"
            className={`rounded-[32px] border p-6 space-y-4 ${
              isTeenDark
                ? 'bg-[#181326] border-purple-900/50 text-white'
                : 'bg-white dark:bg-[#181326] border-slate-200 dark:border-purple-900/50 text-slate-900 dark:text-slate-100 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-extrabold text-base">
                Solicitudes Pendientes ({allPendingRequests.length})
              </h2>
              <span className="text-xs opacity-65">Sincronizadas en vivo</span>
            </div>

            {allPendingRequests.length === 0 ? (
              <p className="text-xs opacity-65 py-1">
                No tienes solicitudes de amistad pendientes en este momento.
              </p>
            ) : (
              <div className="space-y-3">
                {allPendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarBadge avatarId={req.peerProfile.avatarId} size="sm" />
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">
                          {req.peerProfile.name}
                        </div>
                        <div className="text-xs opacity-75 truncate">
                          {req.peerProfile.friendCode || req.peerProfile.username} · Pendiente de aceptar
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        data-testid="accept-pending-request-button"
                        onClick={() => {
                          playRewardSound('correct');
                          onAcceptFriend(req.id);
                          setSelectedFriendshipId(req.id);
                        }}
                        disabled={
                          requiresParentalConsent(currentUser.age) &&
                          !currentUser.parentalFriendsApproved
                        }
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aceptar Solicitud
                      </button>
                      <button
                        type="button"
                        onClick={() => onRejectFriend(req.id)}
                        aria-label="Cancelar o rechazar solicitud"
                        className="p-2 rounded-xl border border-slate-300/40"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Mis Amigos Aceptados + Usuarios Bloqueados/Expulsados por Seguridad */}
          <div
            data-testid="accepted-friends-section"
            className={`rounded-[32px] border p-6 space-y-4 ${
              isTeenDark
                ? 'bg-[#181326] border-purple-900/50 text-white'
                : 'bg-white dark:bg-[#181326] border-slate-200 dark:border-purple-900/50 text-slate-900 dark:text-slate-100 shadow-sm'
            }`}
          >
            <h2 className="font-extrabold text-base">
              Mis Amigos Aceptados ({acceptedFriends.length})
            </h2>

            {acceptedFriends.length === 0 ? (
              <p className="text-xs opacity-65 py-2 leading-relaxed">
                Aún no tienes amigos aceptados. Usa "Conectar directo por Código de Amigo" o envía una solicitud arriba.
              </p>
            ) : (
              <div className="space-y-2.5">
                {acceptedFriends.map((fr) => {
                  const isSelected = activeFriendship?.id === fr.id;
                  return (
                    <button
                      key={fr.id}
                      type="button"
                      onClick={() => {
                        setSelectedFriendshipId(fr.id);
                        setModerationAlert(null);
                        setReportNotice(null);
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[#7C69EF] bg-[#F5EFFF] dark:bg-purple-950/50 text-slate-900 dark:text-white'
                          : 'border-slate-200/40 hover:border-[#A594F9]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AvatarBadge avatarId={fr.peerProfile.avatarId} size="md" />
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">
                            {fr.peerProfile.name}
                          </div>
                          <div className="text-xs opacity-70 truncate">
                            {fr.peerProfile.friendCode || fr.peerProfile.username} · {fr.peerProfile.xp} XP · Racha {fr.peerProfile.streak}d
                          </div>
                        </div>
                      </div>
                      <MessageSquare className="w-4 h-4 text-[#7C69EF] shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}

            {blockedFriends.length > 0 && (
              <div
                data-testid="blocked-expelled-users-section"
                className="pt-3 border-t border-red-200 dark:border-red-900/40 space-y-2"
              >
                <div className="text-xs font-black text-red-600 dark:text-red-400 flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5" />
                  <span>
                    Usuarios Bloqueados y Expulsados por Seguridad ({blockedFriends.length})
                  </span>
                </div>
                {blockedFriends.map((bf) => (
                  <div
                    key={bf.id}
                    className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-red-700 dark:text-red-300 truncate">
                      {bf.peerProfile.name} ({bf.peerProfile.friendCode || bf.peerProfile.username})
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black shrink-0">
                      usuario bloqueado por seguridad
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 5. Buscador Global en Tiempo Real por Nombre o Código de Amigo */}
          <div
            data-testid="live-network-search-section"
            className={`rounded-[32px] border p-6 space-y-4 ${
              isTeenDark
                ? 'bg-[#181326] border-purple-900/50 text-white'
                : 'bg-white dark:bg-[#181326] border-slate-200 dark:border-purple-900/50 text-slate-900 dark:text-slate-100 shadow-sm'
            }`}
          >
            <div>
              <h2 className="font-extrabold text-base">
                Buscador en Vivo (Nombre o Código de Amigo)
              </h2>
              <p className="text-xs opacity-70 mt-0.5">
                Encuentra al instante compañeros conectados en otros navegadores o dispositivos.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                data-testid="live-friend-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre, @usuario o LUMI-XXXX..."
                className={`w-full h-11 pl-10 pr-4 rounded-2xl border text-xs ${
                  isTeenDark
                    ? 'bg-[#120E20] border-purple-800/50 text-white'
                    : 'bg-slate-50 dark:bg-[#120E20] border-slate-200 dark:border-purple-800/50 text-slate-900 dark:text-white'
                }`}
              />
            </div>

            <div className="space-y-2.5">
              {availableSameGroupUsers.map((user) => (
                <div
                  key={user.id}
                  data-testid={`network-user-card-${user.name.toLowerCase()}`}
                  className="p-3 rounded-2xl border border-slate-200/40 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AvatarBadge avatarId={user.avatarId} size="sm" />
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">
                        {user.name}
                      </div>
                      <div className="text-xs opacity-70 truncate font-mono">
                        {user.friendCode} · {user.username}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        playRewardSound('pop');
                        onSendFriendRequestByUserId(user.id);
                        setFriendRequestFeedback(
                          `Solicitud enviada a ${user.name} (${user.friendCode}).`
                        );
                      }}
                      className="px-3 py-2 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 text-xs font-extrabold flex items-center gap-1 whitespace-nowrap cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Solicitud
                    </button>
                    {onDirectConnectByFriendCode && (
                      <button
                        type="button"
                        onClick={() => {
                          playRewardSound('fanfare');
                          onDirectConnectByFriendCode(
                            user.friendCode || user.name
                          );
                          setFriendRequestFeedback(
                            `¡Conectado en directo con ${user.name} (${user.friendCode})!`
                          );
                        }}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold flex items-center gap-1 whitespace-nowrap cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Conectar
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {searchQuery.trim() !== '' &&
                availableSameGroupUsers.length === 0 && (
                  <div
                    data-testid="search-instant-network-action"
                    className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3"
                  >
                    <div className="text-xs font-bold">
                      Conectar con <strong>"{searchQuery.trim()}"</strong> en la red entre navegadores:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          playRewardSound('pop');
                          onSendFriendRequestByUsername?.(searchQuery.trim());
                          setFriendRequestFeedback(
                            `Solicitud enviada en red a "${searchQuery.trim()}".`
                          );
                          setSearchQuery('');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-[#84CC16] text-slate-950 font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        Enviar Solicitud a "{searchQuery.trim()}"
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          playRewardSound('fanfare');
                          if (onDirectConnectByFriendCode) {
                            onDirectConnectByFriendCode(searchQuery.trim());
                          } else {
                            onSendFriendRequestByUsername?.(searchQuery.trim());
                          }
                          setFriendRequestFeedback(
                            `¡Conectado directo con "${searchQuery.trim()}" en tiempo real!`
                          );
                          setSearchQuery('');
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        Conectar Directo por Código / Nombre
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>

        {/* =====================================================================
            3. PANTALLA DE CHAT EN TONOS VIOLETA / ROSA PASTEL (IMAGEN 3)
               - Fondo degradado suave en lila, lavanda y rosa pastel (#A594F9, #F5EFFF, #FF9EBB)
               - Personaje de corazón amigable con ojos grandes en el encabezado
               - Burbujas súper redondeadas (blancas para el amigo con su avatar al lado, rosa pastel para el usuario)
               - Barra inferior en cápsula violeta/azul (#4B44D6) con:
                 a) Botón de GIFs Seguros
                 b) Botón Subir Imagen con Detector Legal Anti-Fotos de Niños
                 c) Guardián Automático Anti-Grooming (bloqueo y expulsión instantánea)
           ===================================================================== */}
        <div className="lg:col-span-7">
          {!chatEnabledInStage || rightPanelMode === 'games' ? (
            <GamesView
              userId={currentUser.id}
              userFriendCode={currentUser.friendCode}
              userName={currentUser.name}
              userAvatarId={currentUser.avatarId}
              userAge={currentUser.age}
              ageGroup={currentUser.ageGroup}
              parentalChatApproved={currentUser.parentalChatApproved}
              acceptedFriendships={friendships}
              onEarnGameXp={onEarnGameXp}
              onBlockOrReportFriend={onBlockOrReportFriend}
            />
          ) : (
            <div
              data-testid="pastel-lilac-pink-chat-panel"
              className="rounded-[40px] border-4 border-[#F9A8D4]/60 bg-gradient-to-b from-[#F5EFFF] via-[#C8B8FF] to-[#A594F9] text-slate-900 p-5 sm:p-7 flex flex-col justify-between min-h-[600px] shadow-xl relative overflow-hidden"
            >
              {activeFriendship ? (
                <>
                  {/* Encabezado Pastel con el Personaje de Corazón Amigable con Ojos Grandes (Imagen 3) */}
                  <div className="bg-white/90 backdrop-blur-md rounded-[30px] p-4 sm:p-5 shadow-sm border border-white space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="p-1.5 rounded-full bg-[#FFE4EE] border-2 border-[#FF9EBB]">
                          <MascotCompanion variant="heart" size="sm" mood="excited" />
                        </div>
                        <div>
                          <div className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#6D28D9]">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Chat Infantil Protegido por IA</span>
                          </div>
                          <h3 className="font-black text-base sm:text-lg text-slate-900 flex items-center gap-2">
                            <span>{activeFriendship.peerProfile.name}</span>
                            <span className="text-xs font-mono font-bold text-[#5B58EB] bg-[#F5EFFF] px-2.5 py-0.5 rounded-full">
                              {activeFriendship.peerProfile.friendCode ||
                                activeFriendship.peerProfile.username}
                            </span>
                          </h3>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setRightPanelMode('games')}
                          className="px-3 py-1.5 rounded-full bg-[#4B44D6] text-white font-extrabold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Gamepad2 className="w-3.5 h-3.5" />
                          <span>Jugar en Sala</span>
                        </button>
                        <button
                          type="button"
                          data-testid="simulate-incoming-grooming-btn"
                          onClick={handleSimulateIncomingGroomingAttempt}
                          title="Simula que este contacto envía un mensaje pidiendo foto o dirección para verificar el bloqueo y expulsión instantánea"
                          className="px-3 py-1.5 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                          <span>Probar Anti-Grooming</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onBlockOrReportFriend(activeFriendship.id, 'report');
                            setReportNotice(
                              `Se registró un reporte de seguridad sobre ${activeFriendship.peerProfile.name}.`
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Flag className="w-3 h-3" />
                          <span>Reportar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onBlockOrReportFriend(activeFriendship.id, 'block');
                            setReportNotice(
                              `Bloqueaste a ${activeFriendship.peerProfile.name}.`
                            );
                          }}
                          className="px-2.5 py-1.5 rounded-full bg-red-100 text-red-700 font-bold text-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3 h-3" />
                          <span>Bloquear</span>
                        </button>
                      </div>
                    </div>

                    {/* Píldoras suaves estilo Imagen 3 (Amistad / Retos y Tareas Compartidas) */}
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-full bg-[#F5EFFF]">
                      <div className="py-1.5 px-3 rounded-full bg-white text-center text-xs font-extrabold text-[#4B44D6] shadow-2xs">
                        Conversación Segura
                      </div>
                      <div className="py-1.5 px-3 rounded-full text-center text-xs font-bold text-slate-600">
                        Solo Dibujos de Cursos y GIFs
                      </div>
                    </div>
                  </div>

                  {reportNotice && (
                    <div className="mt-3 p-3 rounded-2xl bg-white/90 border border-amber-300 text-amber-900 text-xs font-bold">
                      {reportNotice}
                    </div>
                  )}

                  {/* Área de Mensajes con Burbujas Súper Redondeadas (Blancas para amigo con avatar al lado, Rosa Pastel #FF9EBB para usuario) */}
                  <div className="flex-1 py-5 space-y-4 overflow-y-auto max-h-[360px] pr-1">
                    {/* Mensaje inicial del Guardián Corazón con tarjeta interactiva (Imagen 3) */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-xs shrink-0">
                        <MascotCompanion variant="heart" size="sm" mood="happy" />
                      </div>
                      <div className="max-w-[82%] rounded-[24px] rounded-tl-md bg-white text-slate-900 px-4 py-3 text-xs font-bold shadow-sm space-y-2">
                        <div>
                          ¡Hola {currentUser.name}! Aquí puedes chatear con{' '}
                          <strong>{activeFriendship.peerProfile.name}</strong>, enviar GIFs animados y compartir dibujos de tus cursos.
                        </div>
                        <div className="p-3 rounded-2xl bg-[#F5EFFF] border border-[#DDD6FE] flex items-center justify-between gap-3">
                          <div>
                            <div className="font-black text-[#4B44D6] text-xs">
                              ¿Jugamos una partida o compartimos un dibujo?
                            </div>
                            <div className="text-[11px] text-slate-600">
                              Recuerda: Nunca compartas fotos reales ni tu dirección.
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setGifPickerOpen(true)}
                            className="px-3 py-1.5 rounded-full bg-[#4B44D6] text-white font-extrabold text-[11px] shrink-0 cursor-pointer"
                          >
                            Enviar GIF
                          </button>
                        </div>
                      </div>
                    </div>

                    {!chatEligibility.canChat ? (
                      <div className="p-5 rounded-[28px] bg-white/95 border-2 border-red-300 text-center space-y-2 my-4 shadow-md">
                        <Lock className="w-7 h-7 text-red-500 mx-auto" />
                        <div className="font-black text-sm text-slate-900">
                          Chat Bloqueado por Seguridad Infantil
                        </div>
                        <p className="text-xs text-slate-600 max-w-md mx-auto font-semibold">
                          {chatEligibility.reason}
                        </p>
                      </div>
                    ) : (
                      activeFriendship.chatMessages.map((msg) => {
                        const isMine = msg.senderId === currentUser.id;
                        const matchedGif =
                          msg.attachmentType === 'gif'
                            ? SAFE_KIDS_GIFS.find(
                                (g) =>
                                  g.id === msg.attachmentId ||
                                  msg.text.includes(g.title)
                              ) || SAFE_KIDS_GIFS[0]
                            : null;

                        return (
                          <div
                            key={msg.id}
                            className={`flex items-end gap-2.5 ${
                              isMine ? 'justify-end' : 'justify-start'
                            }`}
                          >
                            {!isMine && (
                              <AvatarBadge
                                avatarId={activeFriendship.peerProfile.avatarId}
                                size="sm"
                              />
                            )}
                            <div
                              className={`max-w-[78%] rounded-[26px] px-4 py-3 text-xs sm:text-sm font-bold shadow-sm space-y-2 ${
                                isMine
                                  ? 'bg-[#FF9EBB] text-slate-950 rounded-br-md'
                                  : 'bg-white text-slate-900 rounded-bl-md'
                              }`}
                            >
                              {matchedGif && (
                                <div
                                  className={`p-3 rounded-2xl bg-gradient-to-r ${matchedGif.bgGradient} text-white text-center space-y-1 shadow-xs`}
                                >
                                  <div className="text-base font-black animate-bounce">
                                    {matchedGif.caption}
                                  </div>
                                  <div className="text-[10px] font-extrabold uppercase tracking-wider opacity-90">
                                    GIF Animado · {matchedGif.title}
                                  </div>
                                </div>
                              )}

                              {msg.attachmentType === 'drawing' && (
                                <div className="p-3 rounded-2xl bg-white/90 text-slate-900 border border-emerald-300 flex items-center gap-2.5">
                                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                                  <div className="text-xs">
                                    <div className="font-black text-emerald-800">
                                      Dibujo / Tarea Verificada por IA
                                    </div>
                                    <div className="text-[11px] text-slate-600">
                                      {msg.attachmentTitle || 'Boceto del curso'}
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div>{msg.text}</div>
                              <div className="text-[10px] opacity-65 text-right">
                                {msg.senderName} · {msg.timestamp}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* ALERTA LEGAL OBLIGATORIA CUANDO SE BLOQUEA LA SUBIDA DE UNA FOTO REAL DE NIÑO / PERSONA */}
                  {imageLegalBlockAlert && (
                    <div
                      role="alert"
                      data-testid="anti-child-photo-legal-alert"
                      className="mb-3 p-4 rounded-[24px] bg-red-600 text-white border-2 border-white shadow-lg flex items-start gap-3"
                    >
                      <ShieldAlert className="w-6 h-6 text-amber-300 shrink-0 mt-0.5" />
                      <div className="space-y-1 flex-1">
                        <div className="text-[11px] font-black uppercase tracking-wider text-amber-200">
                          Escáner de Privacidad Infantil IA
                        </div>
                        <p className="text-xs sm:text-sm font-extrabold leading-relaxed">
                          {imageLegalBlockAlert}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImageLegalBlockAlert(null)}
                        className="p-1 rounded-full bg-white/20 text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Alerta de Moderación / Grooming */}
                  {moderationAlert && (
                    <div
                      role="alert"
                      data-testid="chat-moderation-alert"
                      className="mb-3 p-3.5 rounded-[22px] bg-red-600 text-white border-2 border-red-200 text-xs font-extrabold flex items-center gap-2.5 shadow-md"
                    >
                      <ShieldAlert className="w-5 h-5 text-amber-300 shrink-0" />
                      <span>{moderationAlert}</span>
                    </div>
                  )}

                  {/* SELECTOR DE GIFS ANIMADOS SEGUROS PARA NIÑOS */}
                  {gifPickerOpen && (
                    <div
                      data-testid="safe-kids-gif-picker"
                      className="mb-3 p-4 rounded-[28px] bg-white/95 backdrop-blur-md border-2 border-[#A594F9] shadow-lg space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-[#4B44D6] flex items-center gap-1.5">
                          <SmilePlus className="w-4 h-4" />
                          Selector de GIFs Animados Seguros para Niños
                        </span>
                        <button
                          type="button"
                          onClick={() => setGifPickerOpen(false)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800"
                        >
                          Cerrar ✕
                        </button>
                      </div>

                      <input
                        type="text"
                        value={gifSearchQuery}
                        onChange={(e) => setGifSearchQuery(e.target.value)}
                        placeholder="Buscar GIF seguro (ej. estrella, ajedrez, dibujo, cohete)..."
                        className="w-full h-9 px-3 rounded-xl bg-[#F5EFFF] border border-[#C8B8FF] text-xs font-bold text-slate-800"
                      />

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {filteredGifs.map((gif) => (
                          <button
                            key={gif.id}
                            type="button"
                            data-testid={`send-safe-gif-${gif.id}`}
                            onClick={() => handleSendSafeGif(gif)}
                            className={`p-2.5 rounded-2xl bg-gradient-to-br ${gif.bgGradient} text-white text-left shadow-xs hover:scale-[1.02] transition-transform cursor-pointer`}
                          >
                            <div className="text-xs font-black truncate">
                              {gif.caption}
                            </div>
                            <div className="text-[10px] font-bold opacity-90 truncate mt-0.5">
                              {gif.title}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PANEL DE SUBIDA DE IMÁGENES CON ESCÁNER ANTI-FOTOS DE NIÑOS (PROTECCIÓN LEGAL) */}
                  {imageScannerOpen && (
                    <div
                      data-testid="chat-image-scanner-panel"
                      className="mb-3 p-4 rounded-[28px] bg-white/95 backdrop-blur-md border-2 border-[#4B44D6] shadow-lg space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-[#4B44D6] flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4" />
                          Subir Imagen con Escáner Legal Anti-Fotos de Niños
                        </span>
                        <button
                          type="button"
                          onClick={() => setImageScannerOpen(false)}
                          className="text-xs font-bold text-slate-500 hover:text-slate-800"
                        >
                          Cerrar ✕
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-600 font-semibold leading-relaxed">
                        Toda imagen pasa por nuestro detector facial y de personas con IA antes de enviarse. Solo se permiten dibujos de tus cursos o capturas de tareas.
                      </p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        data-testid="chat-image-file-input"
                        onChange={handleFileUploadChange}
                        className="hidden"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isScanningImage}
                          className="p-2.5 rounded-2xl bg-[#F5EFFF] hover:bg-[#EDE4FF] border border-[#A594F9] text-[#4B44D6] font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Elegir Archivo</span>
                        </button>

                        <button
                          type="button"
                          data-testid="upload-safe-drawing-btn"
                          disabled={isScanningImage}
                          onClick={() =>
                            runImagePrivacyScanAndSend({
                              fileName: 'dibujo_curso_perspectiva.png',
                              imageKind: 'drawing',
                            })
                          }
                          className="p-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4" />
                          <span>Subir Dibujo Curso (OK)</span>
                        </button>

                        <button
                          type="button"
                          data-testid="upload-real-child-photo-block-btn"
                          disabled={isScanningImage}
                          onClick={() =>
                            runImagePrivacyScanAndSend({
                              fileName: 'foto_real_nino_selfie.jpg',
                              imageKind: 'photo',
                            })
                          }
                          className="p-2.5 rounded-2xl bg-red-100 hover:bg-red-200 border border-red-300 text-red-800 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShieldAlert className="w-4 h-4 text-red-600" />
                          <span>Probar Foto Niño (Bloqueo)</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* BARRA INFERIOR EN CÁPSULA VIOLETA / AZUL (#4B44D6 - IMAGEN 3) CON BOTÓN GIF, SUBIR IMAGEN Y ENVIAR */}
                  <form
                    onSubmit={handleSend}
                    className="p-2 rounded-full bg-[#4B44D6] text-white shadow-lg flex items-center gap-2"
                  >
                    <button
                      type="button"
                      data-testid="chat-gif-picker-btn"
                      disabled={!chatEligibility.canChat}
                      onClick={() => {
                        playRewardSound('pop');
                        setGifPickerOpen((prev) => !prev);
                        setImageScannerOpen(false);
                      }}
                      title="Enviar GIF animado seguro"
                      className="h-10 px-3 rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-40 text-white font-black text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <SmilePlus className="w-4 h-4" />
                      <span>GIF</span>
                    </button>

                    <button
                      type="button"
                      data-testid="chat-image-upload-btn"
                      disabled={!chatEligibility.canChat}
                      onClick={() => {
                        playRewardSound('pop');
                        setImageScannerOpen((prev) => !prev);
                        setGifPickerOpen(false);
                      }}
                      title="Subir dibujo o captura de tarea (con filtro anti-fotos de niños)"
                      className="h-10 px-3 rounded-full bg-white/15 hover:bg-white/25 disabled:opacity-40 text-white font-black text-xs flex items-center gap-1 shrink-0 cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Imagen</span>
                    </button>

                    <input
                      type="text"
                      data-testid="chat-message-input"
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value);
                        if (moderationAlert) setModerationAlert(null);
                      }}
                      disabled={!chatEligibility.canChat}
                      placeholder={
                        chatEligibility.canChat
                          ? `Escribe a ${activeFriendship.peerProfile.name}...`
                          : 'Chat bloqueado por seguridad'
                      }
                      aria-label="Escribir mensaje de chat"
                      className="flex-1 h-10 px-4 rounded-full bg-white text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm font-bold focus:outline-none disabled:bg-white/60"
                    />

                    <button
                      type="submit"
                      data-testid="chat-send-message-btn"
                      disabled={!chatEligibility.canChat}
                      className="h-10 px-4 rounded-full bg-[#FF9EBB] hover:bg-[#FB85A8] disabled:bg-slate-400 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Enviar</span>
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-16 space-y-4 my-auto bg-white/85 rounded-[32px] p-8">
                  <div className="flex justify-center">
                    <MascotCompanion variant="heart" size="lg" mood="happy" />
                  </div>
                  <div className="font-black text-lg text-slate-900">
                    ¿Con quién quieres conversar hoy?
                  </div>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed font-semibold">
                    Usa el botón <strong>&ldquo;Conectar directo por Código de Amigo&rdquo;</strong> en la columna izquierda para abrir el chat pastel protegido por IA.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
