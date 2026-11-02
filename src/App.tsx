/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Home,
  Heart,
  User,
  Gem,
  Flame,
  Zap,
  LogOut,
  Trophy,
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
  calculateActivityGemReward,
  createFreshUserAccount,
  ensureShopDefaultsOnProfile,
  filterPrivateRoomMessages,
  getPrivateChatRoomId,
  getNavigationTabsForAgeGroup,
  checkGroup1ToGroup2Graduation,
  promoteChildFromGroup1ToGroup2,
  updateChildAgeByParent,
} from './utils/educationLogic';
import { playRewardSound } from './utils/soundEffects';
import { RegistrationScreen } from './components/RegistrationModal';
import { LearnView } from './components/LearnView';
import { LibraryView } from './components/LibraryView';
import {
  ChessSectionView,
  AcceptedFriendSummary,
} from './components/ChessSectionView';
import { GamesView } from './components/GamesView';
import { FriendsChatView, FriendshipRecord } from './components/FriendsChatView';
import { ProfileParentalView } from './components/ProfileParentalView';
import { ShopView } from './components/ShopView';
import { MascotCompanion } from './components/ArtworkRenderer';
import { PWAInstallButton } from './components/PWAInstallButton';
import { Chess } from 'chess.js';
import {
  ChessTimeControlId,
  ChessColorPreference,
  getChessTimeControlById,
  resolveChessInviteColors,
} from './utils/chessEngine';
import {
  realtimeNetwork,
  GlobalNetworkState,
  NetworkChessMatch,
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
    receiverId?: string;
    privateRoomId?: string;
    senderName: string;
    text: string;
    timestamp: string;
    attachmentType?: 'gif' | 'drawing' | 'chess_invite';
    attachmentId?: string;
    attachmentTitle?: string;
    attachmentUrl?: string;
    chessMatchId?: string;
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
          const coursesParam = params.get('courses');
          const fresh = createFreshUserAccount({
            username: nameParam.toLowerCase(),
            name: nameParam,
            age: ageParam,
            parentEmail: 'tutor@familia.es',
            parentPin: '1234',
            parentalApproved: true,
          });
          if (coursesParam) {
            fresh.enrolledSubjects = coursesParam
              .split(',')
              .filter(Boolean) as CourseSubject[];
          }
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
  const [activeChessMatchId, setActiveChessMatchId] = useState<string | null>(
    null
  );
  const [networkState, setNetworkState] = useState<GlobalNetworkState>({
    profiles: {},
    friendships: {},
    rooms: {},
    chessMatches: {},
  });

  const rawProfile = accounts.find((a) => a.id === activeUserId) || null;
  const currentProfile = rawProfile ? ensureShopDefaultsOnProfile(rawProfile) : null;

  useEffect(() => {
    const unsubscribe = realtimeNetwork.subscribe((state) => {
      setNetworkState({
        profiles: { ...state.profiles },
        friendships: { ...state.friendships },
        rooms: { ...state.rooms },
        chessMatches: { ...state.chessMatches },
      });
    });
    return unsubscribe;
  }, []);

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

  // Barra inferior minimalista con máximo 5 íconos (4 secciones + Toggle Claro/Oscuro)
  const bottomBarTabIds = getNavigationTabsForAgeGroup(
    currentProfile.ageGroup,
    currentProfile.age
  );
  const validViewTabs: NavTabId[] = [
    'learn',
    'library',
    'friends',
    'profile',
    'chess',
    'games',
    'shop',
  ];
  const currentSafeTab: NavTabId = validViewTabs.includes(activeTab)
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

  const handleToggleEnrolledSubject = (subject: CourseSubject) => {
    updateCurrentProfile((prev) => {
      const currentList = Array.isArray(prev.enrolledSubjects)
        ? prev.enrolledSubjects
        : [];
      const exists = currentList.includes(subject);
      const nextList = exists
        ? currentList.filter((s) => s !== subject)
        : [...currentList, subject];
      return {
        ...prev,
        enrolledSubjects: nextList,
      };
    });
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
              enrolledSubjects: [],
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

  const userFriendships: FriendshipRecord[] = (() => {
    const recordsMap = new Map<string, FriendshipRecord>();

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
          chatMessages: filterPrivateRoomMessages(
            sf.chatMessages || [],
            currentProfile.id,
            resolvedPeerProfile.id
          ),
        });
      });

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
      if (!peerPub || peerPub.id === currentProfile.id) return;

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
        chatMessages: filterPrivateRoomMessages(
          nf.chatMessages || [],
          currentProfile.id,
          peerPub.id
        ),
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
      attachmentType: 'gif' | 'drawing' | 'chess_invite';
      attachmentId?: string;
      attachmentTitle?: string;
      attachmentUrl?: string;
      chessMatchId?: string;
    }
  ) => {
    const activeRecord = userFriendships.find((f) => f.id === friendshipId);
    const receiverId = activeRecord?.peerProfile.id || '';
    const privateRoomId = receiverId
      ? getPrivateChatRoomId(currentProfile.id, receiverId)
      : undefined;

    setStoredFriendships((prev) =>
      prev.map((sf) => {
        if (sf.id !== friendshipId) return sf;
        const peerId =
          sf.requesterId === currentProfile.id ? sf.receiverId : sf.requesterId;
        const roomKey = getPrivateChatRoomId(currentProfile.id, peerId);
        return {
          ...sf,
          chatMessages: [
            ...sf.chatMessages,
            {
              id: `msg_${Date.now()}`,
              senderId: currentProfile.id,
              receiverId: peerId,
              privateRoomId: roomKey,
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
      attachment,
      receiverId || undefined
    );
  };

  const handleSendChessChallengeFromChat = (params: {
    friend: AcceptedFriendSummary;
    timeControlId: ChessTimeControlId;
    colorPreference: ChessColorPreference;
  }) => {
    const tcOption = getChessTimeControlById(params.timeControlId);
    const colors = resolveChessInviteColors(params.colorPreference);
    const freshChess = new Chess();
    const matchId = `chess_match_${Date.now()}`;

    const newMatch: NetworkChessMatch = {
      id: matchId,
      eventType: 'CHESS_INVITE',
      hostId: currentProfile.id,
      hostName: currentProfile.name,
      hostFriendCode: currentProfile.friendCode,
      hostAvatarId: currentProfile.avatarId,
      hostColor: colors.hostColor,
      guestId: params.friend.id,
      guestName: params.friend.name,
      guestFriendCode: params.friend.friendCode || params.friend.username,
      guestAvatarId: params.friend.avatarId,
      guestColor: colors.guestColor,
      timeControlId: params.timeControlId,
      timeControlLabel: tcOption.label,
      initialSeconds: tcOption.initialSeconds,
      whiteTimeSeconds: tcOption.initialSeconds,
      blackTimeSeconds: tcOption.initialSeconds,
      colorPreference: params.colorPreference,
      status: 'pending_invite',
      fen: freshChess.fen(),
      moveHistorySan: [],
      turn: 'w',
      updatedAt: Date.now(),
    };

    realtimeNetwork.sendChessInvite({
      match: newMatch,
      friendshipId: params.friend.friendshipId,
    });
    setActiveChessMatchId(matchId);
    setActiveTab('chess');
  };

  // Los 4 botones principales de navegación con línea fina (strokeWidth={2}) + el 5º botón de Modo Claro/Oscuro
  const minimalistBottomTabs: {
    id: NavTabId;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'learn',
      label: 'Inicio',
      icon: <Home className="w-5 h-5" strokeWidth={2} />,
    },
    {
      id: 'library',
      label: 'Cuentos',
      icon: <BookOpen className="w-5 h-5" strokeWidth={2} />,
    },
    {
      id: 'friends',
      label: 'Amigos',
      icon: <Heart className="w-5 h-5" strokeWidth={2} />,
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: <User className="w-5 h-5" strokeWidth={2} />,
    },
  ].filter((t) => bottomBarTabIds.includes(t.id));

  const isYoungKid = currentProfile.ageGroup === '3-6';

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

  const acceptedFriendsForChess: AcceptedFriendSummary[] = userFriendships
    .filter((f) => f.statusForCurrent === 'accepted')
    .map((f) => ({
      id: f.peerProfile.id,
      friendCode: f.peerProfile.friendCode,
      username: f.peerProfile.username,
      name: f.peerProfile.name,
      avatarId: f.peerProfile.avatarId,
      friendshipId: f.id,
    }));

  // Buscar invitaciones de Ajedrez entrantes en tiempo real (CHESS_INVITE) para el jugador actual
  const incomingChessInvites = Object.values(networkState.chessMatches).filter(
    (m) =>
      m.status === 'pending_invite' &&
      m.hostId !== currentProfile.id &&
      (m.guestId === currentProfile.id ||
        (m.guestFriendCode &&
          m.guestFriendCode.toUpperCase() ===
            currentProfile.friendCode.toUpperCase()) ||
        m.guestName.toLowerCase() === currentProfile.name.toLowerCase())
  );

  // Partida activa sincronizada en red (por ID seleccionado o la más reciente donde participa el usuario)
  const activeNetworkChessMatch: NetworkChessMatch | null = (() => {
    if (activeChessMatchId && networkState.chessMatches[activeChessMatchId]) {
      return networkState.chessMatches[activeChessMatchId];
    }
    const myMatches = Object.values(networkState.chessMatches)
      .filter(
        (m) =>
          m.status !== 'declined' &&
          (m.hostId === currentProfile.id ||
            m.guestId === currentProfile.id ||
            m.hostFriendCode?.toUpperCase() ===
              currentProfile.friendCode.toUpperCase() ||
            m.guestFriendCode?.toUpperCase() ===
              currentProfile.friendCode.toUpperCase())
      )
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    return myMatches[0] || null;
  })();

  return (
    <div className={`min-h-screen w-full max-w-[100vw] overflow-x-hidden flex flex-col transition-colors duration-200 ${shellBgClass} pb-28`}>
      {/* TOP BAR LIMPIA Y RESPONSIVA */}
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

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-6xl w-full mx-auto px-3 sm:px-8 py-6 flex-1 min-w-0 space-y-5">
        {/* BANNER GLOBAL DE INVITACIÓN DE AJEDREZ EN TIEMPO REAL (CHESS_INVITE) */}
        {incomingChessInvites.map((invite) => (
          <div
            key={invite.id}
            data-testid="incoming-chess-invite-banner"
            className="p-4 sm:p-5 rounded-[28px] bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border-4 border-amber-300 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-300 text-slate-950 text-[11px] font-black uppercase tracking-wider">
                <span>♟️ Solicitud de Partida en Tiempo Real (CHESS_INVITE)</span>
              </div>
              <h3 className="text-base sm:text-lg font-black font-display">
                ¡{invite.hostName} ({invite.hostFriendCode}) te reta a jugar Ajedrez!
              </h3>
              <p className="text-xs sm:text-sm text-white/90 font-semibold">
                Reloj seleccionado: <strong>{invite.timeControlLabel}</strong> · Juegas con{' '}
                <strong>
                  {invite.guestColor === 'w' ? 'Blancas ♔' : 'Negras ♚'}
                </strong>
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                data-testid="accept-chess-invite-btn"
                onClick={() => {
                  playRewardSound('fanfare');
                  realtimeNetwork.respondChessInvite(invite.id, 'accept');
                  setActiveChessMatchId(invite.id);
                  setActiveTab('chess');
                }}
                className="px-4 py-2.5 rounded-2xl bg-[#BEF264] hover:bg-[#a3e635] text-slate-950 font-black text-xs sm:text-sm shadow-md cursor-pointer"
              >
                Aceptar Partida ♟️
              </button>
              <button
                type="button"
                data-testid="decline-chess-invite-btn"
                onClick={() => {
                  playRewardSound('pop');
                  realtimeNetwork.respondChessInvite(invite.id, 'decline');
                }}
                className="px-3.5 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs cursor-pointer"
              >
                Rechazar
              </button>
            </div>
          </div>
        ))}

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
            enrolledSubjects={currentProfile.enrolledSubjects}
            onToggleEnrolledSubject={handleToggleEnrolledSubject}
            selectedBoardId={currentProfile.selectedBoardId}
            selectedPiecesId={currentProfile.selectedPiecesId}
            completedLessonIds={currentProfile.completedLessonIds}
            completedBookIds={currentProfile.completedBookIds}
            onlinePeers={sameGroupUsersAcrossBrowsers}
            onCompleteLesson={handleCompleteLesson}
            onCompleteBook={handleCompleteBook}
            onOpenLibrary={() => setActiveTab('library')}
            onOpenChess={() => setActiveTab('chess')}
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
            currentUserId={currentProfile.id}
            currentUserName={currentProfile.name}
            currentUserFriendCode={currentProfile.friendCode}
            currentUserAvatarId={currentProfile.avatarId}
            ageGroup={currentProfile.ageGroup}
            chessXp={currentProfile.chessXp}
            completedChessLessonIds={currentProfile.completedChessLessonIds}
            acceptedFriends={acceptedFriendsForChess}
            activeNetworkMatch={activeNetworkChessMatch}
            onOpenFriendsTab={() => setActiveTab('friends')}
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
            onSendChessChallenge={handleSendChessChallengeFromChat}
            onOpenChessMatchById={(matchId) => {
              if (matchId) {
                realtimeNetwork.respondChessInvite(matchId, 'accept');
                setActiveChessMatchId(matchId);
              }
              setActiveTab('chess');
            }}
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

      {/* =====================================================================
          BARRA INFERIOR MINIMALISTA (IDÉNTICA AL 3ER EJEMPLO DE LA IMAGEN DE REFERENCIA):
          - Cápsula flotante limpia (border-radius: 32px -> rounded-[32px])
          - Fondo blanco puro en modo claro (bg-white) y gris oscuro limpio en modo oscuro (dark:bg-[#1E1E24])
          - Sombra suave y máximo 5 íconos minimalistas de línea fina (stroke-width: 2px):
            1. Inicio / Aprender
            2. Biblioteca / Cuentos
            3. Amigos / Chat
            4. Perfil
            5. Modo Claro / Oscuro
          - Botón activo: recuadro redondeado suave color rosa/lila pastel detrás (#F5E6F0),
            con el ícono y su etiqueta de texto corto debajo en rosa/magenta oscuro (#C84B8A),
            mientras los demás íconos permanecen en gris oscuro (#333333).
         ===================================================================== */}
      <div className="fixed bottom-4 left-0 right-0 z-40 px-3 sm:px-6 pointer-events-none flex justify-center">
        <nav
          aria-label="Menú inferior de navegación"
          data-testid="floating-bottom-nav"
          className="pointer-events-auto rounded-[32px] px-3 sm:px-5 py-2.5 bg-white dark:bg-[#1E1E24] border border-slate-200/80 dark:border-slate-800 shadow-[0_12px_36px_rgba(15,23,42,0.12)] flex items-center justify-between gap-2 sm:gap-5 w-full max-w-[460px]"
        >
          {minimalistBottomTabs.map((item) => {
            const active =
              currentSafeTab === item.id ||
              (currentSafeTab === 'chess' && item.id === 'learn') ||
              (currentSafeTab === 'games' && item.id === 'friends') ||
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
                className={`min-w-[64px] sm:min-w-[74px] py-2 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                  active
                    ? 'bg-[#F5E6F0] text-[#C84B8A]'
                    : 'bg-transparent text-[#333333] dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/5'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span
                  className={`text-[11px] leading-none tracking-tight ${
                    active ? 'font-bold text-[#C84B8A]' : 'font-medium'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* 5º ÍCONO: Modo Claro / Oscuro */}
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
            className="min-w-[64px] sm:min-w-[74px] py-2 px-3 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all cursor-pointer bg-transparent text-[#333333] dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-white/5"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-5 h-5 shrink-0" strokeWidth={2} />
                <span className="text-[11px] font-medium leading-none tracking-tight">
                  Claro
                </span>
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 shrink-0" strokeWidth={2} />
                <span className="text-[11px] font-medium leading-none tracking-tight">
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
              className="w-full py-4 rounded-2xl bg-[#84CC16] hover:bg-[#65A30D] text-slate-950 font-black text-base shadow-md"
            >
              ¡Entrar a mi Nueva Etapa (7 a 13 años)!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
