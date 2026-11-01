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
} from 'lucide-react';
import {
  WALLPAPER_GALLERY,
  COURSES_DATA,
  CourseSubject,
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

interface StoredFriendship {
  id: string;
  requesterId: string;
  receiverId: string;
  ageGroup: UserProfile['ageGroup'];
  status: 'accepted' | 'pending' | 'blocked';
  chatMessages: {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    timestamp: string;
  }[];
}

const ACCOUNTS_STORAGE_KEY = 'lumiquest_accounts_v2';
const ACTIVE_USER_STORAGE_KEY = 'lumiquest_active_user_id_v2';
const FRIENDSHIPS_STORAGE_KEY = 'lumiquest_friendships_v2';

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

  const rawProfile = accounts.find((a) => a.id === activeUserId) || null;
  const currentProfile = rawProfile ? ensureShopDefaultsOnProfile(rawProfile) : null;

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

  // Construcción de las amistades reales de la misma etapa
  const userFriendships: FriendshipRecord[] = storedFriendships
    .filter(
      (sf) =>
        sf.ageGroup === currentProfile.ageGroup &&
        (sf.requesterId === currentProfile.id ||
          sf.receiverId === currentProfile.id)
    )
    .map((sf) => {
      const isRequester = sf.requesterId === currentProfile.id;
      const peerId = isRequester ? sf.receiverId : sf.requesterId;
      const peer = accounts.find((a) => a.id === peerId);
      if (!peer) return null;

      const statusForCurrent =
        sf.status === 'accepted'
          ? 'accepted'
          : sf.status === 'blocked'
          ? 'blocked'
          : isRequester
          ? 'pending_sent'
          : 'pending_received';

      return {
        id: sf.id,
        userAId: sf.requesterId,
        userBId: sf.receiverId,
        ageGroup: sf.ageGroup,
        statusForCurrent,
        peerProfile: {
          id: peer.id,
          username: peer.username,
          name: peer.name,
          ageGroup: peer.ageGroup,
          avatarId: peer.avatarId,
          xp: peer.xp,
          streak: peer.streak,
        },
        chatMessages: sf.chatMessages,
      } satisfies FriendshipRecord;
    })
    .filter((item): item is FriendshipRecord => item !== null);

  const handleSendFriendRequestByUserId = (targetUserId: string) => {
    const targetUser = accounts.find((a) => a.id === targetUserId);
    if (!targetUser || targetUser.ageGroup !== currentProfile.ageGroup) return;

    const alreadyExists = storedFriendships.some(
      (sf) =>
        (sf.requesterId === currentProfile.id &&
          sf.receiverId === targetUserId) ||
        (sf.requesterId === targetUserId &&
          sf.receiverId === currentProfile.id)
    );
    if (alreadyExists) return;

    setStoredFriendships((prev) => [
      ...prev,
      {
        id: `fr_${Date.now()}`,
        requesterId: currentProfile.id,
        receiverId: targetUserId,
        ageGroup: currentProfile.ageGroup,
        status: 'pending',
        chatMessages: [],
      },
    ]);
  };

  const handleAcceptFriend = (friendshipId: string) => {
    setStoredFriendships((prev) =>
      prev.map((sf) =>
        sf.id === friendshipId ? { ...sf, status: 'accepted' } : sf
      )
    );
  };

  const handleRejectFriend = (friendshipId: string) => {
    setStoredFriendships((prev) => prev.filter((sf) => sf.id !== friendshipId));
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
    }
  };

  const handleSendMessage = (friendshipId: string, text: string) => {
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
            },
          ],
        };
      })
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
  const isTeenDark = currentProfile.ageGroup === '14-18';
  const routinesVisible = canAccessRoutines(currentProfile.age);

  const activeWallpaper =
    WALLPAPER_GALLERY.find((w) => w.id === currentProfile.wallpaperId) ||
    WALLPAPER_GALLERY[0];

  const shellBgClass = isYoungKid
    ? 'bg-[#FFFDF7] text-slate-900'
    : isTeenDark
    ? 'bg-[#0F0B1A] text-slate-100'
    : canCustomizeWallpaper(currentProfile.age)
    ? `${activeWallpaper.pageBgClass} text-slate-900`
    : 'bg-[#F8FAFC] text-slate-900';

  const headerThemeClass = isYoungKid
    ? 'bg-[#FFFDF7]/95 border-[#FED7AA] text-slate-900'
    : isTeenDark
    ? 'bg-[#151024]/95 border-purple-900/50 text-white'
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
    <div className={`min-h-screen flex flex-col ${shellBgClass} pb-28`}>
      {/* TOP BAR LIMPIA (Sin selectores de grupo; con contador de gemas siempre visible junto al perfil) */}
      <header
        className={`sticky top-0 z-30 backdrop-blur-md border-b px-4 sm:px-8 h-14 flex items-center justify-between gap-4 ${headerThemeClass}`}
      >
        <a
          href="#aprender"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('learn');
          }}
          className={`text-xl font-black font-display tracking-tight whitespace-nowrap shrink-0 ${
            isYoungKid
              ? 'text-[#FF6B6B]'
              : isTeenDark
              ? 'text-[#BEF264]'
              : 'text-emerald-600'
          }`}
        >
          LumiQuest
        </a>

        {/* Contadores en vivo (Racha y XP) */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-extrabold tabular-nums">
          <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-amber-500/15 text-amber-500">
            {isTeenDark ? (
              <Zap className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Flame className="w-3.5 h-3.5 fill-current" />
            )}
            {currentProfile.streak}d
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-500">
            {currentProfile.xp} XP
          </span>
        </div>

        {/* Contador de Gemas (siempre visible arriba junto al perfil, con acceso directo a la Tienda) + Perfil */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            data-testid="top-gems-counter"
            onClick={() => {
              playRewardSound('pop');
              setActiveTab('shop');
            }}
            title="Ir a la Tienda de Gemas"
            className={`px-3 py-1.5 rounded-full font-extrabold text-xs flex items-center gap-1.5 border transition-all tabular-nums ${
              currentSafeTab === 'shop'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-xs'
                : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-500 hover:bg-cyan-500/25'
            }`}
          >
            <Gem className="w-3.5 h-3.5" />
            <span>{currentProfile.gems}</span>
            <span className="hidden sm:inline">Tienda</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className={`px-3.5 py-1.5 text-xs font-extrabold rounded-full transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              isTeenDark
                ? 'bg-[#BEF264] text-slate-950 hover:opacity-90'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            {currentProfile.name}
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 flex-1">
        {currentSafeTab === 'learn' && (
          <LearnView
            userName={currentProfile.name}
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
            onCompleteLesson={handleCompleteLesson}
            onCompleteBook={handleCompleteBook}
            onOpenLibrary={() => setActiveTab('library')}
            onOpenChess={() => setActiveTab('chess')}
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
            sameGroupRegisteredUsers={accounts.filter(
              (a) => a.ageGroup === currentProfile.ageGroup
            )}
            friendships={userFriendships}
            onSendFriendRequestByUserId={handleSendFriendRequestByUserId}
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

      {/* BARRA INFERIOR FLOTANTE EN FORMA DE PÍLDORA (Sin grupos y con Juegos incluidos) */}
      <div className="fixed bottom-4 left-0 right-0 z-40 px-4 pointer-events-none flex justify-center">
        <nav
          aria-label="Menú inferior de navegación"
          className={`pointer-events-auto rounded-full px-2.5 sm:px-3.5 py-2 shadow-2xl border-2 flex items-center gap-1 sm:gap-2 overflow-x-auto max-w-full ${
            isYoungKid
              ? 'bg-white/95 border-[#FF6B6B]/40 text-slate-900'
              : isTeenDark
              ? 'bg-[#1A142D]/95 border-purple-500/40 text-purple-100'
              : 'bg-white/95 border-emerald-200 text-slate-900'
          }`}
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
                className={`min-h-[44px] px-3 sm:px-4 rounded-full flex items-center gap-1.5 sm:gap-2 transition-all shrink-0 ${
                  active
                    ? isYoungKid
                      ? 'bg-[#FF6B6B] text-white font-black shadow-md scale-105'
                      : isTeenDark
                      ? 'bg-[#BEF264] text-slate-950 font-black shadow-md scale-105'
                      : 'bg-[#84CC16] text-slate-950 font-black shadow-md scale-105'
                    : 'opacity-70 hover:opacity-100 font-bold'
                }`}
              >
                {item.icon}
                <span className="text-xs sm:text-sm tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
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
