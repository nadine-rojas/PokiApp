/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Compass,
  Users,
  UserCircle2,
  Crown,
  CalendarCheck2,
  Gamepad2,
  ShoppingBag,
  Gem,
  Flame,
  Zap,
  LogOut,
  Trophy,
  Sparkles,
  Sun,
  Moon,
} from 'lucide-react';
import {
  WALLPAPER_GALLERY,
  COURSES_DATA,
  CourseSubject,
  getAvatarsForChildAge,
} from './data/curriculumData';
import {
  NavTabId,
  UserProfile,
  ChildMood,
  canCustomizeWallpaper,
  canAccessRoutines,
  completeDailyRoutineReward,
  calculateActivityGemReward,
  createFreshUserAccount,
  ensureShopDefaultsOnProfile,
  getNavigationTabsForAgeGroup,
  checkGroup1ToGroup2Graduation,
  promoteChildFromGroup1ToGroup2,
  updateChildAgeByParent,
} from './utils/educationLogic';
import { playRewardSound } from './utils/soundEffects';
import { RegistrationScreen } from './components/RegistrationModal';
import { LearnView } from './components/LearnView';
import { LibraryView } from './components/LibraryView';
import { ChessSectionView } from './components/ChessSectionView';
import { RoutinesView } from './components/RoutinesView';
import { GamesView } from './components/GamesView';
import { FriendsChatView, FriendshipRecord } from './components/FriendsChatView';
import { ProfileParentalView } from './components/ProfileParentalView';
import { ShopView } from './components/ShopView';
import { MascotCompanion } from './components/ArtworkRenderer';
import { PWAInstallButton } from './components/PWAInstallButton';
import {
  realtimeNetwork,
  GlobalNetworkState,
} from './utils/realtimeNetwork';

interface StoredFriendship {
  id: string;
  requesterId: string;
  receiverId: string;
  ageGroup: UserProfile['ageGroup'];
  status: 'accepted' | 'pending' | 'blocked';
  customPeer?: FriendshipRecord['peerProfile'];
  chatMessages: {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: string;
    attachmentType?: 'gif' | 'drawing';
    attachmentId?: string;
    attachmentTitle?: string;
    attachmentUrl?: string;
  }[];
}

const ACCOUNTS_STORAGE_KEY = 'lumiquest_accounts_v2';
const ACTIVE_USER_STORAGE_KEY = 'lumiquest_active_user_id_v2';
const FRIENDSHIPS_STORAGE_KEY = 'lumiquest_friendships_v2';
const THEME_STORAGE_KEY = 'lumiquest_theme_mode_v2';

export default function App() {
  const [accounts, setAccounts] = useState<UserProfile[]>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('autostart') === '1') {
          const ageParam = Number(params.get('age')) || 10;
          const nameParam = params.get('name') || 'Explorador';
          const fresh = createFreshUserAccount({
            username: nameParam.toLowerCase(),
            name: nameParam,
            age: ageParam,
            parentEmail: 'tutor@familia.es',
            parentPin: '1234',
            parentalApproved: true,
          });
          localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify([fresh]));
          localStorage.setItem(ACTIVE_USER_STORAGE_KEY, fresh.id);
          return [fresh];
        }
      }
      const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((p) => ensureShopDefaultsOnProfile(p));
        }
      }
    } catch {
      // ignore storage errors
    }
    return [];
  });

  const [activeUserId, setActiveUserId] = useState<string | null>(() => {
    try {
      const savedId = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
      if (savedId) return savedId;
    } catch {
      // ignore
    }
    return null;
  });

  useEffect(() => {
    if (activeUserId) {
      try {
        const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
        if (raw) {
          const parsed: UserProfile[] = JSON.parse(raw);
          if (
            Array.isArray(parsed) &&
            parsed.some((a) => a.id === activeUserId) &&
            !accounts.some((a) => a.id === activeUserId)
          ) {
            setAccounts(parsed.map((p) => ensureShopDefaultsOnProfile(p)));
          }
        }
      } catch {
        // ignore
      }
    }
  }, [activeUserId, accounts]);

  const [storedFriendships, setStoredFriendships] = useState<StoredFriendship[]>(() => {
    try {
      const raw = localStorage.getItem(FRIENDSHIPS_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [];
  });

  const [activeTab, setActiveTab] = useState<NavTabId>('learn');
  const [graduationCelebrationOpen, setGraduationCelebrationOpen] = useState(false);
  const [networkState, setNetworkState] = useState<GlobalNetworkState>({
    profiles: {},
    friendships: {},
    rooms: {},
  });

  const rawProfile = accounts.find((a) => a.id === activeUserId) || null;
  const currentProfile = rawProfile ? ensureShopDefaultsOnProfile(rawProfile) : null;

  // Suscripción en tiempo real a la red entre navegadores y dispositivos (WebSocket + MQTT + BroadcastChannel)
  useEffect(() => {
    const unsubscribe = realtimeNetwork.subscribe((state) => {
      setNetworkState({
        profiles: { ...state.profiles },
        friendships: { ...state.friendships },
        rooms: { ...state.rooms },
      });
    });
    return unsubscribe;
  }, []);

  // Sincroniza automáticamente el perfil y Código de Amigo (LUMI-XXXX) en la red global apenas se registra o inicia sesión
  useEffect(() => {
    if (currentProfile) {
      realtimeNetwork.syncUserProfile(currentProfile);
    }
  }, [
    currentProfile?.id,
    currentProfile?.friendCode,
    currentProfile?.name,
    currentProfile?.avatarId,
    currentProfile?.xp,
    currentProfile?.streak,
    currentProfile?.ageGroup,
  ]);

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore
    }
    return 'light';
  });

  const isDarkMode = themeMode === 'dark';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDarkMode);
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // ignore
    }
  }, [isDarkMode, themeMode]);

  const toggleThemeMode = () => {
    playRewardSound('pop');
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    try {
      localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
    } catch {
      // ignore
    }
  }, [accounts]);

  useEffect(() => {
    try {
      if (activeUserId) {
        localStorage.setItem(ACTIVE_USER_STORAGE_KEY, activeUserId);
      } else {
        localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [activeUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        FRIENDSHIPS_STORAGE_KEY,
        JSON.stringify(storedFriendships)
      );
    } catch {
      // ignore
    }
  }, [storedFriendships]);

  const updateCurrentProfile = (updater: (prev: UserProfile) => UserProfile) => {
    if (!currentProfile) return;
    setAccounts((prevList) =>
      prevList.map((acc) =>
        acc.id === currentProfile.id
          ? updater(ensureShopDefaultsOnProfile(acc))
          : acc
      )
    );
  };

  const handleCreateNewAccount = (newAccount: UserProfile) => {
    setAccounts((prev) => {
      const filtered = prev.filter((a) => a.id !== newAccount.id);
      return [...filtered, ensureShopDefaultsOnProfile(newAccount)];
    });
    setActiveUserId(newAccount.id);
    setActiveTab('learn');
  };

  const handleLoginAccount = (account: UserProfile) => {
    setActiveUserId(account.id);
    setActiveTab('learn');
  };

  const handleLogout = () => {
    playRewardSound('pop');
    setActiveUserId(null);
    setActiveTab('learn');
  };

  if (!currentProfile) {
    return (
      <RegistrationScreen
        existingAccounts={accounts}
        onLoginAccount={handleLoginAccount}
        onCreateNewAccount={handleCreateNewAccount}
      />
    );
  }

  // Barra de navegación inferior flotante en forma de píldora según etapa y edad
  const allowedNavTabs = getNavigationTabsForAgeGroup(
    currentProfile.ageGroup,
    currentProfile.age
  );
  const currentSafeTab: NavTabId =
    activeTab === 'shop' || allowedNavTabs.includes(activeTab)
      ? activeTab
      : 'learn';

  const handleCompleteLesson = (
    lessonId: string,
    xpEarned: number,
    subject: CourseSubject
  ) => {
    const readingCourse36 = COURSES_DATA.find(
      (c) => c.ageGroup === '3-6' && c.subject === 'reading'
    );
    const chessCourse36 = COURSES_DATA.find(
      (c) => c.ageGroup === '3-6' && c.subject === 'chess_course'
    );
    const readingIds = readingCourse36?.lessons.map((l) => l.id) || [];
    const chessIds = chessCourse36?.lessons.map((l) => l.id) || [];

    updateCurrentProfile((prev) => {
      const alreadyDone = prev.completedLessonIds.includes(lessonId);
      const nextLessons = alreadyDone
        ? prev.completedLessonIds
        : [...prev.completedLessonIds, lessonId];

      const gemReward = calculateActivityGemReward('lesson', prev.gems);
      const nextMedals = new Set(prev.unlockedMedalIds);
      nextMedals.add('medal-first-lesson');
      if (subject === 'orthography') nextMedals.add('medal-orthography');
      if (subject === 'chess_course') nextMedals.add('medal-chess-tactician');
      if (subject === 'prayer') nextMedals.add('medal-prayer-peace');

      const updatedBase: UserProfile = {
        ...prev,
        xp: prev.xp + xpEarned,
        gems: gemReward.newGemTotal,
        streak: Math.max(1, prev.streak),
        completedLessonIds: nextLessons,
        unlockedMedalIds: Array.from(nextMedals),
      };

      if (
        checkGroup1ToGroup2Graduation(
          prev.ageGroup,
          nextLessons,
          readingIds,
          chessIds
        )
      ) {
        setTimeout(() => {
          playRewardSound('fanfare');
          setGraduationCelebrationOpen(true);
        }, 250);
        return promoteChildFromGroup1ToGroup2(updatedBase);
      }

      return updatedBase;
    });
  };

  const handleCompleteBook = (bookId: string, xpReward: number) => {
    updateCurrentProfile((prev) => {
      const alreadyRead = prev.completedBookIds.includes(bookId);
      const gemReward = calculateActivityGemReward('lesson', prev.gems);
      const nextMedals = new Set(prev.unlockedMedalIds);
      nextMedals.add('medal-reader');
      return {
        ...prev,
        xp: prev.xp + xpReward,
        gems: gemReward.newGemTotal,
        streak: Math.max(1, prev.streak),
        completedBookIds: alreadyRead
          ? prev.completedBookIds
          : [...prev.completedBookIds, bookId],
        unlockedMedalIds: Array.from(nextMedals),
      };
    });
  };

  const handleEarnChessXp = (
    xpAmount: number,
    completedLessonId?: string,
    gemsEarned?: number
  ) => {
    updateCurrentProfile((prev) => {
      const nextChessLessons =
        completedLessonId &&
        !prev.completedChessLessonIds.includes(completedLessonId)
          ? [...prev.completedChessLessonIds, completedLessonId]
          : prev.completedChessLessonIds;
      const nextMedals = new Set(prev.unlockedMedalIds);
      nextMedals.add('medal-chess-tactician');
      const addedGems =
        gemsEarned !== undefined
          ? gemsEarned
          : completedLessonId
          ? 5
          : 8;

      return {
        ...prev,
        xp: prev.xp + xpAmount,
        chessXp: prev.chessXp + xpAmount,
        gems: prev.gems + addedGems,
        streak: Math.max(1, prev.streak),
        completedChessLessonIds: nextChessLessons,
        unlockedMedalIds: Array.from(nextMedals),
      };
    });
  };

  const handleEarnGameXp = (xpAmount: number, gemsEarned: number = 5) => {
    updateCurrentProfile((prev) => ({
      ...prev,
      xp: prev.xp + xpAmount,
      gems: prev.gems + gemsEarned,
      streak: Math.max(1, prev.streak),
    }));
  };

  const handleAddRoutine = (title: string, time: string, category: string) => {
    updateCurrentProfile((prev) => ({
      ...prev,
      routines: [
        ...prev.routines,
        {
          id: `rt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          title,
          time,
          category,
          completedToday: false,
        },
      ],
    }));
  };

  const handleCompleteRoutine = (routineId: string) => {
    updateCurrentProfile((prev) => {
      const target = prev.routines.find((r) => r.id === routineId);
      if (!target || target.completedToday) return prev;
      const reward = completeDailyRoutineReward(false, prev.gems);
      const nextMedals = new Set(prev.unlockedMedalIds);
      nextMedals.add('medal-routines-gems');

      return {
        ...prev,
        gems: reward.newGemTotal,
        streak: Math.max(1, prev.streak),
        unlockedMedalIds: Array.from(nextMedals),
        routines: prev.routines.map((r) =>
          r.id === routineId ? { ...r, completedToday: true } : r
        ),
      };
    });
  };

  const handleDeleteRoutine = (routineId: string) => {
    updateCurrentProfile((prev) => ({
      ...prev,
      routines: prev.routines.filter((r) => r.id !== routineId),
    }));
  };

  const handleUpdateChildAgeByParent = (
    newAge: number,
    enteredPin: string
  ): { success: boolean; graduatedToGroup3: boolean; error?: string } => {
    const result = updateChildAgeByParent(currentProfile, newAge, enteredPin);
    if (!result.success) {
      return {
        success: false,
        graduatedToGroup3: false,
        error: result.error,
      };
    }
    setAccounts((prevList) =>
      prevList.map((acc) =>
        acc.id === currentProfile.id ? result.updatedProfile : acc
      )
    );
    return {
      success: true,
      graduatedToGroup3: result.graduatedToGroup3,
    };
  };

  // Combina los perfiles locales con los perfiles sincronizados en tiempo real desde otros navegadores/dispositivos
  const sameGroupUsersAcrossBrowsers: UserProfile[] = (() => {
    const map = new Map<string, UserProfile>();
    accounts
      .filter((a) => a.ageGroup === currentProfile.ageGroup)
      .forEach((a) => map.set(a.id, ensureShopDefaultsOnProfile(a)));

    Object.values(networkState.profiles)
      .filter((np) => np.ageGroup === currentProfile.ageGroup)
      .forEach((np) => {
        if (!map.has(np.id)) {
          map.set(
            np.id,
            ensureShopDefaultsOnProfile({
              id: np.id,
              friendCode: np.friendCode,
              username: np.username,
              name: np.name,
              age: np.age,
              ageGroup: np.ageGroup,
              avatarId: np.avatarId,
              unlockedAvatarIds: [np.avatarId],
              selectedBoardId: 'board_classic_wood',
              unlockedBoardIds: ['board_classic_wood'],
              selectedPiecesId: 'pieces_classic',
              unlockedPiecesIds: ['pieces_classic'],
              selectedCoachId: 'coach_kind',
              unlockedCoachIds: ['coach_kind'],
              wallpaperId: 'meadow_day',
              xp: np.xp,
              chessXp: 0,
              gems: 0,
              streak: np.streak,
              completedLessonIds: [],
              completedChessLessonIds: [],
              completedBookIds: [],
              unlockedMedalIds: [],
              routines: [],
              allowedSubjects: [],
              parentEmail: '',
              parentPin: '1234',
              parentalChatApproved: true,
              parentalFriendsApproved: true,
            })
          );
        }
      });

    return Array.from(map.values());
  })();

  // Construcción de las amistades reales combinando la red en tiempo real entre navegadores y el respaldo local
  const userFriendships: FriendshipRecord[] = (() => {
    const recordsMap = new Map<string, FriendshipRecord>();

    // 1. Amistades locales de respaldo
    storedFriendships
      .filter(
        (sf) =>
          sf.ageGroup === currentProfile.ageGroup &&
          (sf.requesterId === currentProfile.id ||
            sf.receiverId === currentProfile.id)
      )
      .forEach((sf) => {
        const isRequester = sf.requesterId === currentProfile.id;
        const peerId = isRequester ? sf.receiverId : sf.requesterId;
        const peer = sameGroupUsersAcrossBrowsers.find((a) => a.id === peerId);
        const resolvedPeerProfile: FriendshipRecord['peerProfile'] | null = peer
          ? {
              id: peer.id,
              friendCode: peer.friendCode,
              username: peer.username,
              name: peer.name,
              ageGroup: peer.ageGroup,
              avatarId: peer.avatarId,
              xp: peer.xp,
              streak: peer.streak,
            }
          : sf.customPeer || null;

        if (!resolvedPeerProfile) return;

        const statusForCurrent =
          sf.status === 'accepted'
            ? 'accepted'
            : sf.status === 'blocked'
            ? 'blocked'
            : isRequester
            ? 'pending_sent'
            : 'pending_received';

        recordsMap.set(sf.id, {
          id: sf.id,
          userAId: sf.requesterId,
          userBId: sf.receiverId,
          ageGroup: sf.ageGroup,
          statusForCurrent,
          peerProfile: resolvedPeerProfile,
          chatMessages: sf.chatMessages,
        });
      });

    // 2. Amistades sincronizadas en tiempo real entre navegadores/dispositivos (WebSocket + MQTT)
    Object.values(networkState.friendships).forEach((nf) => {
      const isRequester =
        nf.requesterId === currentProfile.id ||
        nf.requesterCode?.toUpperCase() ===
          currentProfile.friendCode.toUpperCase();
      const isReceiver =
        nf.receiverId === currentProfile.id ||
        nf.receiverCode?.toUpperCase() ===
          currentProfile.friendCode.toUpperCase();

      if (!isRequester && !isReceiver) return;

      const peerPub = isRequester ? nf.receiverProfile : nf.requesterProfile;
      if (!peerPub) return;

      const statusForCurrent =
        nf.status === 'accepted'
          ? 'accepted'
          : nf.status === 'blocked'
          ? 'blocked'
          : isRequester
          ? 'pending_sent'
          : 'pending_received';

      recordsMap.set(nf.id, {
        id: nf.id,
        userAId: nf.requesterId,
        userBId: nf.receiverId,
        ageGroup: currentProfile.ageGroup,
        statusForCurrent,
        peerProfile: {
          id: peerPub.id,
          friendCode: peerPub.friendCode,
          username: peerPub.username,
          name: peerPub.name,
          ageGroup: currentProfile.ageGroup,
          avatarId: peerPub.avatarId,
          xp: peerPub.xp,
          streak: peerPub.streak,
        },
        chatMessages: nf.chatMessages || [],
      });
    });

    return Array.from(recordsMap.values());
  })();

  const handleSendFriendRequestByUserId = (targetUserId: string) => {
    const targetUser = sameGroupUsersAcrossBrowsers.find(
      (a) => a.id === targetUserId
    );
    if (!targetUser) return;

    realtimeNetwork
      .sendFriendRequestOrDirectConnect({
        requester: currentProfile,
        targetUserId,
        targetQuery: targetUser.friendCode || targetUser.username,
        directConnect: false,
      })
      .then(({ friendship, targetProfile }) => {
        setStoredFriendships((prev) => {
          const filtered = prev.filter((sf) => sf.id !== friendship.id);
          return [
            ...filtered,
            {
              id: friendship.id,
              requesterId: currentProfile.id,
              receiverId: targetProfile.id,
              ageGroup: currentProfile.ageGroup,
              status:
                friendship.status === 'accepted' ? 'accepted' : 'pending',
              customPeer: {
                id: targetProfile.id,
                friendCode: targetProfile.friendCode,
                username: targetProfile.username,
                name: targetProfile.name,
                ageGroup: currentProfile.ageGroup,
                avatarId: targetProfile.avatarId,
                xp: targetProfile.xp,
                streak: targetProfile.streak,
              },
              chatMessages: friendship.chatMessages || [],
            },
          ];
        });
      });
  };

  const handleSendFriendRequestByUsername = (usernameOrName: string) => {
    const cleanInput = usernameOrName.trim();
    if (!cleanInput) return;

    const stageAvatars = getAvatarsForChildAge(currentProfile.age);
    const chosenAvatar =
      stageAvatars[(storedFriendships.length + 1) % stageAvatars.length] ||
      stageAvatars[0];
    const optimisticId = `fr_opt_${Date.now()}`;
    const peerId = `peer_${Date.now()}`;

    // Actualización optimista inmediata + sincronización en red real (WebSocket / MQTT)
    setStoredFriendships((prev) => [
      ...prev,
      {
        id: optimisticId,
        requesterId: currentProfile.id,
        receiverId: peerId,
        ageGroup: currentProfile.ageGroup,
        status: 'pending',
        customPeer: {
          id: peerId,
          username: cleanInput.startsWith('@')
            ? cleanInput
            : `@${cleanInput.toLowerCase().replace(/[^a-z0-9_]/g, '') || 'amigo'}`,
          name: cleanInput.replace(/^@+/, ''),
          ageGroup: currentProfile.ageGroup,
          avatarId: chosenAvatar.id,
          xp: 120,
          streak: 2,
        },
        chatMessages: [],
      },
    ]);

    realtimeNetwork
      .sendFriendRequestOrDirectConnect({
        requester: currentProfile,
        targetQuery: cleanInput,
        directConnect: false,
      })
      .then(({ friendship, targetProfile }) => {
        setStoredFriendships((prev) => {
          const withoutOptimistic = prev.filter(
            (sf) => sf.id !== optimisticId && sf.id !== friendship.id
          );
          return [
            ...withoutOptimistic,
            {
              id: friendship.id,
              requesterId: friendship.requesterId,
              receiverId: friendship.receiverId,
              ageGroup: currentProfile.ageGroup,
              status:
                friendship.status === 'accepted' ? 'accepted' : 'pending',
              customPeer: {
                id: targetProfile.id,
                friendCode: targetProfile.friendCode,
                username: targetProfile.username,
                name: targetProfile.name,
                ageGroup: currentProfile.ageGroup,
                avatarId: targetProfile.avatarId,
                xp: targetProfile.xp,
                streak: targetProfile.streak,
              },
              chatMessages: friendship.chatMessages || [],
            },
          ];
        });
      });
  };

  const handleDirectConnectByFriendCode = (codeOrName: string) => {
    const cleanInput = codeOrName.trim();
    if (!cleanInput) return;

    realtimeNetwork
      .sendFriendRequestOrDirectConnect({
        requester: currentProfile,
        targetQuery: cleanInput,
        directConnect: true,
      })
      .then(({ friendship, targetProfile }) => {
        setStoredFriendships((prev) => {
          const withoutExisting = prev.filter((sf) => sf.id !== friendship.id);
          return [
            ...withoutExisting,
            {
              id: friendship.id,
              requesterId: friendship.requesterId,
              receiverId: friendship.receiverId,
              ageGroup: currentProfile.ageGroup,
              status: 'accepted',
              customPeer: {
                id: targetProfile.id,
                friendCode: targetProfile.friendCode,
                username: targetProfile.username,
                name: targetProfile.name,
                ageGroup: currentProfile.ageGroup,
                avatarId: targetProfile.avatarId,
                xp: targetProfile.xp,
                streak: targetProfile.streak,
              },
              chatMessages: friendship.chatMessages || [],
            },
          ];
        });
      });
  };

  const handleAcceptFriend = (friendshipId: string) => {
    setStoredFriendships((prev) =>
      prev.map((sf) =>
        sf.id === friendshipId ? { ...sf, status: 'accepted' } : sf
      )
    );
    realtimeNetwork.updateFriendshipStatus(friendshipId, 'accept');
  };

  const handleRejectFriend = (friendshipId: string) => {
    setStoredFriendships((prev) => prev.filter((sf) => sf.id !== friendshipId));
    realtimeNetwork.updateFriendshipStatus(friendshipId, 'reject');
  };

  const handleBlockOrReportFriend = (
    friendshipId: string,
    action: 'block' | 'report'
  ) => {
    if (action === 'block') {
      setStoredFriendships((prev) =>
        prev.map((sf) =>
          sf.id === friendshipId ? { ...sf, status: 'blocked' } : sf
        )
      );
      realtimeNetwork.updateFriendshipStatus(friendshipId, 'block');
    }
  };

  const handleSendMessage = (
    friendshipId: string,
    text: string,
    attachment?: {
      attachmentType: 'gif' | 'drawing';
      attachmentId?: string;
      attachmentTitle?: string;
      attachmentUrl?: string;
    }
  ) => {
    setStoredFriendships((prev) =>
      prev.map((sf) => {
        if (sf.id !== friendshipId) return sf;
        return {
          ...sf,
          chatMessages: [
            ...sf.chatMessages,
            {
              id: `msg_${Date.now()}`,
              senderId: currentProfile.id,
              senderName: currentProfile.name,
              text,
              timestamp: 'Ahora',
              ...(attachment || {}),
            },
          ],
        };
      })
    );
    realtimeNetwork.sendFriendshipChatMessage(
      friendshipId,
      currentProfile.id,
      currentProfile.name,
      text,
      attachment
    );
  };

  const allNavCatalog: Record<
    NavTabId,
    { id: NavTabId; label: string; icon: React.ReactNode }
  > = {
    learn: {
      id: 'learn',
      label: 'Aprender',
      icon: <Compass className="w-5 h-5" />,
    },
    library: {
      id: 'library',
      label: 'Biblioteca',
      icon: <BookOpen className="w-5 h-5" />,
    },
    chess: {
      id: 'chess',
      label: 'Ajedrez',
      icon: <Crown className="w-5 h-5" />,
    },
    routines: {
      id: 'routines',
      label: 'Rutinas',
      icon: <CalendarCheck2 className="w-5 h-5" />,
    },
    games: {
      id: 'games',
      label: 'Juegos',
      icon: <Gamepad2 className="w-5 h-5" />,
    },
    friends: {
      id: 'friends',
      label: 'Amigos',
      icon: <Users className="w-5 h-5" />,
    },
    profile: {
      id: 'profile',
      label: 'Perfil',
      icon: <UserCircle2 className="w-5 h-5" />,
    },
    shop: {
      id: 'shop',
      label: 'Tienda',
      icon: <ShoppingBag className="w-5 h-5" />,
    },
  };

  const navItemsForGroup = allowedNavTabs.map((id) => allNavCatalog[id]);

  const isYoungKid = currentProfile.ageGroup === '3-6';
  const isTeenDark = currentProfile.ageGroup === '14-18' || isDarkMode;
  const routinesVisible = canAccessRoutines(currentProfile.age);

  const activeWallpaper =
    WALLPAPER_GALLERY.find((w) => w.id === currentProfile.wallpaperId) ||
    WALLPAPER_GALLERY[0];

  const shellBgClass = isDarkMode
    ? 'bg-[#0F0B1A] text-slate-100'
    : isYoungKid
    ? 'bg-[#FFFDF7] text-slate-900'
    : canCustomizeWallpaper(currentProfile.age)
    ? `${activeWallpaper.pageBgClass} text-slate-900`
    : 'bg-[#F8FAFC] text-slate-900';

  const headerThemeClass = isDarkMode
    ? 'bg-[#151024]/95 border-purple-900/50 text-white'
    : isYoungKid
    ? 'bg-[#FFFDF7]/95 border-[#FED7AA] text-slate-900'
    : 'bg-white/95 border-slate-200 text-slate-900';

  const acceptedFriendsForChess = userFriendships
    .filter((f) => f.statusForCurrent === 'accepted')
    .map((f) => ({
      id: f.peerProfile.id,
      username: f.peerProfile.username,
      name: f.peerProfile.name,
      avatarId: f.peerProfile.avatarId,
    }));

  return (
    <div className={`min-h-screen w-full max-w-[100vw] overflow-x-hidden flex flex-col transition-colors duration-200 ${shellBgClass} pb-28`}>
      {/* TOP BAR LIMPIA Y RESPONSIVA (Con botón real Instalar App, racha, XP y contador de gemas junto al perfil) */}
      <header
        className={`sticky top-0 z-30 backdrop-blur-md border-b px-3 sm:px-8 h-14 flex items-center justify-between gap-2 sm:gap-4 ${headerThemeClass}`}
      >
        <a
          href="#aprender"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('learn');
          }}
          className={`text-lg sm:text-xl font-black font-display tracking-tight whitespace-nowrap shrink-0 ${
            isYoungKid && !isDarkMode
              ? 'text-[#FF6B6B]'
              : isDarkMode
              ? 'text-[#BEF264]'
              : 'text-emerald-600'
          }`}
        >
          LumiQuest
        </a>

        {/* Contadores en vivo (Racha y XP) */}
        <div className="hidden md:flex items-center gap-2.5 text-xs font-extrabold tabular-nums">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500">
            {isDarkMode ? (
              <Zap className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Flame className="w-3.5 h-3.5 fill-current" />
            )}
            {currentProfile.streak}d
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500">
            {currentProfile.xp} XP
          </span>
        </div>

        {/* Botón Real "Instalar App" (PWA) + Contador de Gemas + Perfil */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <PWAInstallButton variant="header" isDark={isDarkMode} />

          <button
            type="button"
            data-testid="top-gems-counter"
            onClick={() => {
              playRewardSound('pop');
              setActiveTab('shop');
            }}
            title="Ir a la Tienda de Gemas"
            className={`h-10 px-2.5 sm:px-3 rounded-full font-extrabold text-xs flex items-center gap-1.5 border transition-all tabular-nums ${
              currentSafeTab === 'shop'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-500 hover:bg-cyan-500/25'
            }`}
          >
            <Gem className="w-3.5 h-3.5 shrink-0" />
            <span>{currentProfile.gems}</span>
            <span className="hidden sm:inline">Tienda</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className={`h-10 px-3 sm:px-3.5 text-xs font-extrabold rounded-full transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              isDarkMode
                ? 'bg-[#BEF264] text-slate-950 hover:opacity-90'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span className="max-w-[78px] sm:max-w-[120px] truncate">
              {currentProfile.name}
            </span>
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL (100% Responsive y sin desbordamiento horizontal) */}
      <main className="max-w-6xl w-full mx-auto px-3 sm:px-8 py-6 flex-1 min-w-0">
        {currentSafeTab === 'learn' && (
          <LearnView
            userName={currentProfile.name}
            userAvatarId={currentProfile.avatarId}
            userFriendCode={currentProfile.friendCode}
            ageGroup={currentProfile.ageGroup}
            age={currentProfile.age}
            streak={currentProfile.streak}
            xp={currentProfile.xp}
            mood={currentProfile.mood}
            onChangeMood={(newMood: ChildMood) =>
              updateCurrentProfile((p) => ({ ...p, mood: newMood }))
            }
            allowedSubjects={currentProfile.allowedSubjects}
            completedLessonIds={currentProfile.completedLessonIds}
            completedBookIds={currentProfile.completedBookIds}
            onlinePeers={sameGroupUsersAcrossBrowsers}
            onCompleteLesson={handleCompleteLesson}
            onCompleteBook={handleCompleteBook}
            onOpenLibrary={() => setActiveTab('library')}
            onOpenChess={() => setActiveTab('chess')}
            onOpenRoutines={() => setActiveTab('routines')}
            onOpenFriends={() => setActiveTab('friends')}
            onOpenParentalPanel={() => setActiveTab('profile')}
          />
        )}

        {currentSafeTab === 'library' && (
          <LibraryView
            ageGroup={currentProfile.ageGroup}
            completedBookIds={currentProfile.completedBookIds}
            onCompleteBook={handleCompleteBook}
          />
        )}

        {currentSafeTab === 'chess' && (
          <ChessSectionView
            ageGroup={currentProfile.ageGroup}
            chessXp={currentProfile.chessXp}
            completedChessLessonIds={currentProfile.completedChessLessonIds}
            acceptedFriends={acceptedFriendsForChess}
            selectedBoardId={currentProfile.selectedBoardId}
            selectedPiecesId={currentProfile.selectedPiecesId}
            selectedCoachId={currentProfile.selectedCoachId}
            unlockedCoachIds={currentProfile.unlockedCoachIds}
            onSelectCoach={(coachId) =>
              updateCurrentProfile((p) => ({ ...p, selectedCoachId: coachId }))
            }
            onOpenShop={() => setActiveTab('shop')}
            onEarnChessXp={handleEarnChessXp}
          />
        )}

        {currentSafeTab === 'routines' && routinesVisible && (
          <RoutinesView
            ageGroup={currentProfile.ageGroup}
            gems={currentProfile.gems}
            routines={currentProfile.routines}
            onAddRoutine={handleAddRoutine}
            onCompleteRoutine={handleCompleteRoutine}
            onDeleteRoutine={handleDeleteRoutine}
            onOpenAvatarShop={() => setActiveTab('shop')}
          />
        )}

        {currentSafeTab === 'games' && (
          <GamesView
            userId={currentProfile.id}
            userFriendCode={currentProfile.friendCode}
            userName={currentProfile.name}
            userAvatarId={currentProfile.avatarId}
            userAge={currentProfile.age}
            ageGroup={currentProfile.ageGroup}
            parentalChatApproved={currentProfile.parentalChatApproved}
            acceptedFriendships={userFriendships}
            onEarnGameXp={handleEarnGameXp}
            onBlockOrReportFriend={handleBlockOrReportFriend}
          />
        )}

        {currentSafeTab === 'friends' && (
          <FriendsChatView
            currentUser={currentProfile}
            sameGroupRegisteredUsers={sameGroupUsersAcrossBrowsers}
            friendships={userFriendships}
            onSendFriendRequestByUserId={handleSendFriendRequestByUserId}
            onSendFriendRequestByUsername={handleSendFriendRequestByUsername}
            onDirectConnectByFriendCode={handleDirectConnectByFriendCode}
            onAcceptFriend={handleAcceptFriend}
            onRejectFriend={handleRejectFriend}
            onBlockOrReportFriend={handleBlockOrReportFriend}
            onSendMessage={handleSendMessage}
            onEarnGameXp={handleEarnGameXp}
            onOpenParentalPanel={() => setActiveTab('profile')}
          />
        )}

        {currentSafeTab === 'shop' && (
          <ShopView
            profile={currentProfile}
            initialTab="boards"
            onUpdateShopSelection={updateCurrentProfile}
            onBackToProfile={() => setActiveTab('profile')}
          />
        )}

        {currentSafeTab === 'profile' && (
          <ProfileParentalView
            profile={currentProfile}
            allChildrenProfiles={accounts}
            acceptedFriendsCount={
              userFriendships.filter((f) => f.statusForCurrent === 'accepted')
                .length
            }
            onUpdateShopSelection={updateCurrentProfile}
            onOpenFullShop={() => setActiveTab('shop')}
            onChangeWallpaper={(wallpaperId) =>
              updateCurrentProfile((p) => ({ ...p, wallpaperId }))
            }
            onToggleAllowedSubject={(subject) =>
              updateCurrentProfile((p) => {
                const exists = p.allowedSubjects.includes(subject);
                const next = exists
                  ? p.allowedSubjects.filter((s) => s !== subject)
                  : [...p.allowedSubjects, subject];
                return { ...p, allowedSubjects: next };
              })
            }
            onToggleParentalChat={(approved) =>
              updateCurrentProfile((p) => ({
                ...p,
                parentalChatApproved: approved,
              }))
            }
            onToggleParentalFriends={(approved) =>
              updateCurrentProfile((p) => ({
                ...p,
                parentalFriendsApproved: approved,
              }))
            }
            onUpdateChildAgeByParent={handleUpdateChildAgeByParent}
            onSwitchChildProfile={handleLoginAccount}
            onAddNewChildProfile={handleLogout}
            onLogoutAccount={handleLogout}
          />
        )}
      </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR FLOTANTE CÁPSULA OSCURA (Imagen 4: cápsula #23222A con ícono activo en círculo violeta #7C69EF + Toggle Claro/Oscuro) */}
      <div className="fixed bottom-3 left-0 right-0 z-40 px-2 sm:px-4 pointer-events-none flex justify-center">
        <nav
          aria-label="Menú inferior de navegación"
          data-testid="floating-bottom-nav"
          className="pointer-events-auto rounded-full px-2 sm:px-3.5 py-2 shadow-2xl border border-[#3A3846] bg-[#23222A]/95 text-white flex items-center justify-center gap-1 sm:gap-2 overflow-hidden max-w-[calc(100vw-16px)] backdrop-blur-md"
        >
          {navItemsForGroup.map((item) => {
            const active =
              currentSafeTab === item.id ||
              (currentSafeTab === 'shop' && item.id === 'profile');
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`bottom-nav-${item.id}`}
                onClick={() => {
                  playRewardSound('pop');
                  setActiveTab(item.id);
                }}
                className={`min-h-[42px] px-2.5 sm:px-3.5 rounded-full flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 transition-all shrink-0 ${
                  active
                    ? 'bg-[#7C69EF] text-white font-black shadow-lg shadow-[#7C69EF]/40 scale-105'
                    : 'text-slate-300 hover:text-white hover:bg-white/10 font-bold'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="text-[10px] sm:text-xs tracking-tight whitespace-nowrap leading-none">
                  {item.label}
                </span>
              </button>
            );
          })}

          <div
            aria-hidden="true"
            className="w-px h-6 bg-white/15 mx-0.5 shrink-0"
          />

          {/* Botón de Modo Claro / Modo Oscuro integrado en la barra inferior flotante */}
          <button
            type="button"
            data-testid="bottom-nav-theme-toggle"
            onClick={toggleThemeMode}
            aria-label={
              isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'
            }
            title={
              isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'
            }
            className={`min-h-[42px] px-2.5 sm:px-3.5 rounded-full flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 transition-all shrink-0 font-extrabold ${
              isDarkMode
                ? 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30'
                : 'bg-white/10 text-slate-200 hover:bg-white/20'
            }`}
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="text-[10px] sm:text-xs tracking-tight whitespace-nowrap leading-none">
                  Claro
                </span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
                <span className="text-[10px] sm:text-xs tracking-tight whitespace-nowrap leading-none">
                  Oscuro
                </span>
              </>
            )}
          </button>
        </nav>
      </div>

      {/* PANTALLA DE CELEBRACIÓN AL GRADUARSE DEL GRUPO 1 AL GRUPO 2 */}
      {graduationCelebrationOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white text-slate-900 rounded-[36px] max-w-lg w-full p-8 text-center space-y-6 border-4 border-[#84CC16] shadow-2xl">
            <div className="flex justify-center">
              <MascotCompanion variant="flower" size="xl" mood="excited" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 text-xs font-black">
              <Trophy className="w-4 h-4" />
              ¡Medalla Especial Desbloqueada!
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-display">
              ¡Felicidades, {currentProfile.name}!
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Completaste el curso de <strong>Aprender a Leer</strong> y el curso de <strong>Ajedrez Básico</strong>. Has recibido la medalla <strong>Graduado de Lectura y Ajedrez</strong> y pasas automáticamente a tu nueva etapa de aventura.
            </p>
            <button
              type="button"
              onClick={() => setGraduationCelebrationOpen(false)}
              className="w-full py-4 rounded-2xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-black text-base shadow-md flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              ¡Entrar a mi Nueva Aventura!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
