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

  const [selectedFriendshipId, setSelectedFriendshipId] = useState<string>(
    acceptedFriends[0]?.id || friendships[0]?.id || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
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
            : 'bg-white border-slate-200 text-slate-900 shadow-sm'
        }`}
      >
        <div className="flex items-center gap-4">
          <MascotCompanion
            variant={isYoungKid ? 'heart' : isTeenDark ? 'orb' : 'droplet'}
            size="sm"
            mood="happy"
          />
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold font-display">
              {isYoungKid
                ? 'Mis Amigos para Jugar'
                : 'Amigos, Chat Moderado y Juegos'}
            </h1>
            <p className="text-xs sm:text-sm opacity-75 mt-0.5">
              {isYoungKid
                ? 'Agrega a tus amigos y juega partidas educativas con ellos.'
                : 'Solo los amigos aceptados de tu misma etapa pueden jugar juntos y chatear con aprobación de tus padres.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {chatEnabledInStage && (
            <div className="inline-flex p-1 rounded-full bg-black/5 border border-slate-300/30">
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
          {/* Solicitudes recibidas pendientes */}
          <div
            className={`rounded-[32px] border p-6 space-y-4 ${
              isTeenDark
                ? 'bg-[#181326] border-purple-900/50 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-base">
                Solicitudes Recibidas ({pendingReceived.length})
              </h2>
              <span className="text-xs opacity-65">Aceptación mutua</span>
            </div>

            {pendingReceived.length === 0 ? (
              <p className="text-xs opacity-65 py-1">
                No tienes solicitudes de amistad pendientes en este momento.
              </p>
            ) : (
              <div className="space-y-3">
                {pendingReceived.map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AvatarBadge avatarId={req.peerProfile.avatarId} size="sm" />
                      <div className="min-w-0">
                        <div className="font-bold text-sm truncate">
                          {req.peerProfile.name}
                        </div>
                        <div className="text-xs opacity-75 truncate">
                          {req.peerProfile.username}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
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
                        Aceptar
                      </button>
                      <button
                        type="button"
                        onClick={() => onRejectFriend(req.id)}
                        aria-label="Rechazar solicitud"
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

          {/* Mis Amigos Aceptados */}
          <div
            className={`rounded-[32px] border p-6 space-y-4 ${
              isTeenDark
                ? 'bg-[#181326] border-purple-900/50 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <h2 className="font-extrabold text-base">
              Mis Amigos ({acceptedFriends.length})
            </h2>

            {acceptedFriends.length === 0 ? (
              <p className="text-xs opacity-65 py-2 leading-relaxed">
                Aún no tienes amigos agregados. Envía una solicitud a un compañero de tu misma etapa abajo.
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

          {/* Buscar Compañeros de la Misma Etapa */}
          <div
            className={`rounded-[32px] border p-6 space-y-4 ${
              isTeenDark
                ? 'bg-[#181326] border-purple-900/50 text-white'
                : 'bg-white border-slate-200 text-slate-900 shadow-sm'
            }`}
          >
            <div>
              <h2 className="font-extrabold text-base">Buscar Compañeros</h2>
              <p className="text-xs opacity-70 mt-0.5">
                Solo aparecen niños registrados en tu misma etapa.
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
                    : 'bg-slate-50 border-slate-200 text-slate-900'
                }`}
              />
            </div>

            <div className="space-y-2.5">
              {availableSameGroupUsers.length === 0 && pendingSent.length === 0 ? (
                <p className="text-xs opacity-65 py-2 leading-relaxed">
                  No hay otros niños registrados todavía en tu misma etapa. Cuando el padre registre otro perfil de la misma edad, aparecerá aquí.
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

              {pendingSent.map((sent) => (
                <div
                  key={sent.id}
                  className="p-3 rounded-2xl border border-slate-200/40 flex items-center justify-between gap-3 opacity-85"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <AvatarBadge avatarId={sent.peerProfile.avatarId} size="sm" />
                    <div className="min-w-0">
                      <div className="font-bold text-sm truncate">
                        {sent.peerProfile.name}
                      </div>
                      <div className="text-xs opacity-70">
                        Solicitud enviada · Pendiente de aceptación
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
