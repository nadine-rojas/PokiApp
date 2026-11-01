import React, { useState } from 'react';
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
} from 'lucide-react';
import {
  AgeGroup,
  FriendshipStatus,
  UserProfile,
  canUsersChat,
  isChatEnabledForGroup,
  moderateChatMessage,
  requiresParentalConsent,
} from '../utils/educationLogic';
import { AvatarBadge, MascotCompanion } from './ArtworkRenderer';
import { GamesView } from './GamesView';
import { playRewardSound } from '../utils/soundEffects';

export interface FriendshipRecord {
  id: string;
  userAId: string;
  userBId: string;
  ageGroup: AgeGroup;
  statusForCurrent: FriendshipStatus;
  peerProfile: {
    id: string;
    username: string;
    name: string;
    ageGroup: AgeGroup;
    avatarId: string;
    xp: number;
    streak: number;
  };
  chatMessages: {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: string;
  }[];
}

interface FriendsChatViewProps {
  currentUser: UserProfile;
  sameGroupRegisteredUsers: UserProfile[];
  friendships: FriendshipRecord[];
  onSendFriendRequestByUserId: (targetUserId: string) => void;
  onSendFriendRequestByUsername?: (usernameOrName: string) => void;
  onAcceptFriend: (friendshipId: string) => void;
  onRejectFriend: (friendshipId: string) => void;
  onBlockOrReportFriend: (friendshipId: string, action: 'block' | 'report') => void;
  onSendMessage: (friendshipId: string, text: string) => void;
  onEarnGameXp: (xpAmount: number, gemsEarned?: number) => void;
  onOpenParentalPanel: () => void;
}

export function FriendsChatView({
  currentUser,
  sameGroupRegisteredUsers,
  friendships,
  onSendFriendRequestByUserId,
  onSendFriendRequestByUsername,
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

  // Para 7-18 años, pueden alternar entre "Chat y Amigos" o "Sala de Juegos con Amigos".
  // Para 3-6 años, el chat no existe, solo aparecen Amigos y Juegos.
  const [rightPanelMode, setRightPanelMode] = useState<'chat' | 'games'>(
    chatEnabledInStage ? 'chat' : 'games'
  );

  const acceptedFriends = friendships.filter(
    (f) => f.statusForCurrent === 'accepted'
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
  const [friendRequestFeedback, setFriendRequestFeedback] = useState<
    string | null
  >(null);
  const [messageInput, setMessageInput] = useState('');
  const [moderationAlert, setModerationAlert] = useState<string | null>(null);
  const [reportNotice, setReportNotice] = useState<string | null>(null);

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
      playRewardSound('wrong');
      setModerationAlert(
        modResult.reason || 'Mensaje bloqueado por el filtro de seguridad.'
      );
      return;
    }

    playRewardSound('pop');
    setModerationAlert(null);
    onSendMessage(activeFriendship.id, modResult.sanitizedText);
    setMessageInput('');
  };

  const handleAddFriendByUsername = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newFriendInput.trim();
    if (!cleaned) return;
    playRewardSound('pop');
    onSendFriendRequestByUsername?.(cleaned);
    setNewFriendInput('');
    setFriendRequestFeedback(
      `Solicitud de amistad enviada a "${cleaned}". El chat y las partidas se activarán cuando acepte la solicitud.`
    );
  };

  // Usuarios reales registrados en la misma etapa
  const availableSameGroupUsers = sameGroupRegisteredUsers.filter(
    (u) =>
      u.id !== currentUser.id &&
      u.ageGroup === currentUser.ageGroup &&
      !friendships.some((f) => f.peerProfile.id === u.id) &&
      (searchQuery.trim() === '' ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Cabecera de Amigos (Sin Chat para los pequeños de 3-6, con Chat + Juegos para mayores) */}
      <section
        className={`rounded-[32px] border p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isYoungKid
            ? 'bg-gradient-to-r from-[#FFF5F5] to-[#ECFCCB] border-2 border-[#FF6B6B]/40 text-slate-900 shadow-sm'
            : isTeenDark
            ? 'bg-[#181326] border-purple-900/50 text-white'
            : 'bg-white dark:bg-[#181326] border-slate-200 dark:border-purple-900/50 text-slate-900 dark:text-slate-100 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <MascotCompanion
            variant={isYoungKid ? 'heart' : isTeenDark ? 'orb' : 'droplet'}
            size="sm"
            mood="happy"
          />
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold font-display">
              {isYoungKid
                ? 'Mis Amigos para Jugar'
                : 'Amigos, Chat Moderado y Juegos Multijugador'}
            </h1>
            <p className="text-xs sm:text-sm opacity-75 mt-0.5">
              {isYoungKid
                ? 'Agrega a tus amigos y juega partidas educativas con emojis cuando acepten tu solicitud.'
                : 'El chat y las invitaciones a partidas solo se habilitan cuando el amigo acepta la solicitud de amistad.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {chatEnabledInStage && (
            <div className="inline-flex p-1 rounded-full bg-black/5 dark:bg-white/10 border border-slate-300/30">
              <button
                type="button"
                onClick={() => setRightPanelMode('chat')}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  rightPanelMode === 'chat'
                    ? 'bg-[#84CC16] text-slate-950 shadow-2xs'
                    : 'opacity-75 hover:opacity-100'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat Seguro
              </button>
              <button
                type="button"
                onClick={() => setRightPanelMode('games')}
                className={`px-4 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all ${
                  rightPanelMode === 'games'
                    ? 'bg-[#84CC16] text-slate-950 shadow-2xs'
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Columna Izquierda: Solicitudes, Lista de Amigos y Buscador */}
        <div className="lg:col-span-5 space-y-6">
          {/* 1. Enviar Solicitud de Amistad por Nombre o @usuario */}
          <div
            className={`rounded-[32px] border p-6 space-y-4 ${
              isTeenDark
                ? 'bg-[#181326] border-purple-900/50 text-white'
                : 'bg-white dark:bg-[#181326] border-slate-200 dark:border-purple-900/50 text-slate-900 dark:text-slate-100 shadow-sm'
            }`}
          >
            <div>
              <h2 className="font-extrabold text-base">
                Agregar Amigo (Enviar Solicitud)
              </h2>
              <p className="text-xs opacity-70 mt-0.5">
                Escribe el nombre o @usuario de tu amigo para enviarle una solicitud de amistad.
              </p>
            </div>

            <form
              onSubmit={handleAddFriendByUsername}
              data-testid="add-friend-by-username-form"
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={newFriendInput}
                onChange={(e) => setNewFriendInput(e.target.value)}
                placeholder="Ej. Mateo o @mateo..."
                aria-label="Nombre o usuario del amigo"
                className={`flex-1 h-11 px-3.5 rounded-2xl border text-xs ${
                  isTeenDark
                    ? 'bg-[#120E20] border-purple-800/50 text-white'
                    : 'bg-slate-50 dark:bg-[#120E20] border-slate-200 dark:border-purple-800/50 text-slate-900 dark:text-white'
                }`}
              />
              <button
                type="submit"
                data-testid="send-friend-request-btn"
                className="h-11 px-4 rounded-2xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shrink-0 whitespace-nowrap"
              >
                <UserPlus className="w-4 h-4" />
                Enviar Solicitud
              </button>
            </form>

            {friendRequestFeedback && (
              <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold">
                {friendRequestFeedback}
              </div>
            )}
          </div>

          {/* 2. Gestión de Solicitudes Pendientes (Aceptación Obligatoria) */}
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
              <span className="text-xs opacity-65">Aceptación obligatoria</span>
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
                          {req.peerProfile.username} · Chat y partidas bloqueados hasta aceptar
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
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-xs font-bold flex items-center gap-1"
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

          {/* 3. Mis Amigos Aceptados */}
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
                Aún no tienes amigos aceptados. Envía una solicitud arriba y acéptala para habilitar el chat y los juegos multijugador.
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
                          ? 'border-emerald-500 bg-emerald-500/15'
                          : 'border-slate-200/40 hover:border-emerald-400'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AvatarBadge avatarId={fr.peerProfile.avatarId} size="md" />
                        <div className="min-w-0">
                          <div className="font-bold text-sm truncate">
                            {fr.peerProfile.name}
                          </div>
                          <div className="text-xs opacity-70 truncate">
                            {fr.peerProfile.username} · {fr.peerProfile.xp} XP · Racha {fr.peerProfile.streak}d
                          </div>
                        </div>
                      </div>
                      {chatEnabledInStage ? (
                        <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <Gamepad2 className="w-4 h-4 text-[#FF6B6B] shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Buscar Otros Compañeros Registrados en el Dispositivo */}
          <div
            className={`rounded-[32px] border p-6 space-y-4 ${
              isTeenDark
                ? 'bg-[#181326] border-purple-900/50 text-white'
                : 'bg-white dark:bg-[#181326] border-slate-200 dark:border-purple-900/50 text-slate-900 dark:text-slate-100 shadow-sm'
            }`}
          >
            <div>
              <h2 className="font-extrabold text-base">Buscar Compañeros de Etapa</h2>
              <p className="text-xs opacity-70 mt-0.5">
                Perfiles registrados en tu misma etapa de edad.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o @usuario..."
                className={`w-full h-11 pl-10 pr-4 rounded-2xl border text-xs ${
                  isTeenDark
                    ? 'bg-[#120E20] border-purple-800/50 text-white'
                    : 'bg-slate-50 dark:bg-[#120E20] border-slate-200 dark:border-purple-800/50 text-slate-900 dark:text-white'
                }`}
              />
            </div>

            <div className="space-y-2.5">
              {availableSameGroupUsers.length === 0 ? (
                <p className="text-xs opacity-65 py-2 leading-relaxed">
                  Puedes usar el recuadro de arriba para enviar una solicitud por nombre o @usuario, o registrar otro perfil de la misma edad.
                </p>
              ) : (
                availableSameGroupUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 rounded-2xl border border-slate-200/40 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarBadge avatarId={user.avatarId} size="sm" />
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">{user.name}</div>
                        <div className="text-xs opacity-70 truncate">
                          {user.username} · {user.xp} XP
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        playRewardSound('pop');
                        onSendFriendRequestByUserId(user.id);
                      }}
                      className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Agregar
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha: Para 3-6 años o cuando se elige 'games', muestra Juegos Multijugador. Para 7-18 en modo 'chat', muestra Chat Moderado */}
        <div className="lg:col-span-7">
          {!chatEnabledInStage || rightPanelMode === 'games' ? (
            <GamesView
              userId={currentUser.id}
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
              className={`rounded-[32px] border p-6 sm:p-8 flex flex-col justify-between min-h-[500px] ${
                isTeenDark
                  ? 'bg-[#181326] border-purple-900/50 text-white'
                  : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}
            >
              {activeFriendship ? (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/30">
                    <div className="flex items-center gap-3.5">
                      <AvatarBadge
                        avatarId={activeFriendship.peerProfile.avatarId}
                        size="md"
                      />
                      <div>
                        <h3 className="font-bold text-lg">
                          {activeFriendship.peerProfile.name}
                        </h3>
                        <p className="text-xs opacity-70">
                          {activeFriendship.peerProfile.username} · Datos privados ocultos
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setRightPanelMode('games')}
                        className="px-3.5 py-2 rounded-xl bg-emerald-500/15 text-emerald-500 font-bold text-xs flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Gamepad2 className="w-4 h-4" />
                        Jugar Juntos
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onBlockOrReportFriend(activeFriendship.id, 'report');
                          setReportNotice(
                            `Se registró un reporte de seguridad sobre ${activeFriendship.peerProfile.name}.`
                          );
                        }}
                        className="px-3 py-2 rounded-xl bg-amber-500/15 text-amber-500 font-semibold text-xs flex items-center gap-1 whitespace-nowrap"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        Reportar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onBlockOrReportFriend(activeFriendship.id, 'block');
                          setReportNotice(
                            `Bloqueaste a ${activeFriendship.peerProfile.name}.`
                          );
                        }}
                        className="px-3 py-2 rounded-xl bg-red-500/15 text-red-500 font-semibold text-xs flex items-center gap-1 whitespace-nowrap"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        Bloquear
                      </button>
                    </div>
                  </div>

                  {reportNotice && (
                    <div className="mt-4 p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-xs font-medium">
                      {reportNotice}
                    </div>
                  )}

                  <div className="flex-1 py-6 space-y-3 overflow-y-auto max-h-[340px]">
                    {!chatEligibility.canChat ? (
                      <div className="p-6 rounded-2xl bg-black/5 border border-slate-200/30 text-center space-y-3 my-8">
                        <Lock className="w-8 h-8 text-amber-500 mx-auto" />
                        <div className="font-bold text-sm">
                          Chat Restringido hasta Aceptación y Permiso Parental
                        </div>
                        <p className="text-xs opacity-75 max-w-md mx-auto">
                          {chatEligibility.reason}
                        </p>
                      </div>
                    ) : activeFriendship.chatMessages.length === 0 ? (
                      <p className="text-xs opacity-65 text-center py-8">
                        ¡La solicitud de amistad fue aceptada! Escribe el primer mensaje amable.
                      </p>
                    ) : (
                      activeFriendship.chatMessages.map((msg) => {
                        const isMine = msg.senderId === currentUser.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              isMine ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                                isMine
                                  ? 'bg-emerald-600 text-white'
                                  : isTeenDark
                                  ? 'bg-[#251E3E] text-slate-100'
                                  : 'bg-slate-100 text-slate-900'
                              }`}
                            >
                              {msg.text}
                            </div>
                            <span className="text-[11px] opacity-60 mt-1 px-1">
                              {msg.senderName} · {msg.timestamp}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {moderationAlert && (
                    <div
                      className="mb-3 p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-500 text-xs font-medium flex items-center gap-2"
                      role="alert"
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>{moderationAlert}</span>
                    </div>
                  )}

                  <form
                    onSubmit={handleSend}
                    className="pt-4 border-t border-slate-200/30 flex items-center gap-2.5"
                  >
                    <input
                      type="text"
                      value={messageInput}
                      onChange={(e) => {
                        setMessageInput(e.target.value);
                        if (moderationAlert) setModerationAlert(null);
                      }}
                      disabled={!chatEligibility.canChat}
                      placeholder={
                        chatEligibility.canChat
                          ? `Escribe un mensaje amable a ${activeFriendship.peerProfile.name}...`
                          : 'Solo amigos aceptados pueden chatear'
                      }
                      aria-label="Escribir mensaje de chat"
                      className={`flex-1 h-12 px-4 rounded-2xl border text-sm ${
                        isTeenDark
                          ? 'bg-[#120E20] border-purple-800/50 text-white disabled:opacity-50'
                          : 'bg-white border-slate-300 text-slate-900 disabled:bg-slate-100'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={!chatEligibility.canChat}
                      className="h-12 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold text-sm flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      Enviar
                    </button>
                  </form>
                </>
              ) : (
                <div className="text-center py-16 space-y-3 opacity-80 my-auto">
                  <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto" />
                  <div className="font-bold text-base">
                    Sin conversaciones ni amigos iniciales
                  </div>
                  <p className="text-xs max-w-md mx-auto leading-relaxed">
                    Cuando agregues a otro compañero de tu misma etapa y acepte tu solicitud, podrán conversar aquí o jugar juntos en la pestaña Juegos Multijugador.
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
