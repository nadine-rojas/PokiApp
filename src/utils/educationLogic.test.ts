import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAgeGroup,
  getAvatarAgeTier,
  getInitialAvatarForAgeGroup,
  getNavigationTabsForAgeGroup,
  createFreshUserAccount,
  isLessonUnlocked,
  completeDailyRoutineReward,
  calculateActivityGemReward,
  purchaseShopItemWithGems,
  purchaseAvatarWithGems,
  areUsersInSameAgeGroup,
  requiresParentalConsent,
  canCustomizeWallpaper,
  canAccessRoutines,
  isChatEnabledForGroup,
  checkGroup1ToGroup2Graduation,
  promoteChildFromGroup1ToGroup2,
  updateChildAgeByParent,
  calculateLevelFromXP,
  moderateChatMessage,
  canUsersChat,
  generateFriendCode,
  normalizeFriendCode,
  getLibraryConfigForAgeGroup,
} from './educationLogic';
import { getBooksForAgeGroup } from '../data/curriculumData';

test('createFreshUserAccount initializes a brand new child account completely from zero with starter items for all 4 shop categories', () => {
  const fresh = createFreshUserAccount({
    username: 'mateo_10',
    name: 'Mateo',
    age: 10,
    parentEmail: 'padre@familia.es',
    parentPin: '4321',
    parentalApproved: true,
  });

  assert.equal(fresh.xp, 0);
  assert.equal(fresh.chessXp, 0);
  assert.equal(fresh.gems, 0);
  assert.equal(fresh.streak, 0);
  assert.equal(fresh.ageGroup, '7-13');
  assert.equal(fresh.parentPin, '4321');
  assert.equal(fresh.avatarId, getInitialAvatarForAgeGroup('7-13', 10));
  assert.equal(fresh.selectedBoardId, 'board_classic_wood');
  assert.equal(fresh.selectedPiecesId, 'pieces_classic');
  assert.equal(fresh.selectedCoachId, 'coach_kind');
  assert.deepEqual(fresh.unlockedBoardIds, ['board_classic_wood']);
  assert.deepEqual(fresh.unlockedPiecesIds, ['pieces_classic']);
  assert.deepEqual(fresh.unlockedCoachIds, ['coach_kind']);
  assert.deepEqual(fresh.completedLessonIds, []);
  assert.deepEqual(fresh.unlockedMedalIds, []);
  assert.deepEqual(fresh.routines, []);

  const levelInfo = calculateLevelFromXP(fresh.xp);
  assert.equal(levelInfo.level, 1);
  assert.equal(levelInfo.progressPercent, 0);
});

test('getAvatarAgeTier separates children under 9 (< 9) from children 9 and older (>= 9)', () => {
  assert.equal(getAvatarAgeTier(5), 'under_9');
  assert.equal(getAvatarAgeTier(8), 'under_9');
  assert.equal(getAvatarAgeTier(9), '9_plus');
  assert.equal(getAvatarAgeTier(15), '9_plus');
});

test('isLessonUnlocked unlocks lesson 0 and locks subsequent lessons until previous is completed', () => {
  assert.equal(isLessonUnlocked(0, null, []), true);
  assert.equal(isLessonUnlocked(1, 'lesson-1', []), false);
  assert.equal(isLessonUnlocked(1, 'lesson-1', ['lesson-1']), true);
});

test('getNavigationTabsForAgeGroup includes games in navigation bar and Routines only for age >= 10 without exposing age groups', () => {
  assert.equal(canAccessRoutines(5), false);
  assert.equal(canAccessRoutines(8), false);
  assert.equal(canAccessRoutines(10), true);
  assert.equal(canAccessRoutines(15), true);

  assert.deepEqual(getNavigationTabsForAgeGroup('3-6', 5), [
    'learn',
    'library',
    'chess',
    'games',
    'friends',
    'profile',
  ]);
  // 8-year-old in Group 2 (7-13) sees 'games' but not 'routines'
  assert.deepEqual(getNavigationTabsForAgeGroup('7-13', 8), [
    'learn',
    'chess',
    'games',
    'friends',
    'profile',
  ]);
  // 10-year-old in Group 2 sees 'routines' and 'games'
  assert.deepEqual(getNavigationTabsForAgeGroup('7-13', 10), [
    'learn',
    'chess',
    'routines',
    'games',
    'friends',
    'profile',
  ]);
  // 16-year-old in Group 3 sees 'routines' and 'games'
  assert.deepEqual(getNavigationTabsForAgeGroup('14-18', 16), [
    'learn',
    'chess',
    'routines',
    'games',
    'friends',
    'profile',
  ]);
});

test('checkGroup1ToGroup2Graduation and promoteChildFromGroup1ToGroup2 transition Group 1 child when Reading and Chess are completed', () => {
  const child = createFreshUserAccount({
    username: 'sofi_5',
    name: 'Sofi',
    age: 5,
    parentEmail: 'mama@familia.es',
    parentPin: '1234',
  });

  const readingIds = ['l-36-vowels', 'l-36-syllables', 'l-36-sentences'];
  const chessIds = ['l-chess36-1', 'l-chess36-2'];

  assert.equal(
    checkGroup1ToGroup2Graduation('3-6', ['l-36-vowels'], readingIds, chessIds),
    false
  );
  assert.equal(
    checkGroup1ToGroup2Graduation(
      '3-6',
      [...readingIds, ...chessIds],
      readingIds,
      chessIds
    ),
    true
  );

  const promoted = promoteChildFromGroup1ToGroup2({
    ...child,
    completedLessonIds: [...readingIds, ...chessIds],
  });
  assert.equal(promoted.ageGroup, '7-13');
  assert.equal(promoted.unlockedMedalIds.includes('medal-graduado-g1'), true);
});

test('updateChildAgeByParent requires valid PIN and transitions Group 2 to Group 3 at age 14+', () => {
  const child = createFreshUserAccount({
    username: 'leo_13',
    name: 'Leo',
    age: 13,
    parentPin: '9999',
  });

  const wrongAttempt = updateChildAgeByParent(child, 14, '0000');
  assert.equal(wrongAttempt.success, false);
  assert.equal(wrongAttempt.updatedProfile.ageGroup, '7-13');

  const validAttempt = updateChildAgeByParent(child, 14, '9999');
  assert.equal(validAttempt.success, true);
  assert.equal(validAttempt.graduatedToGroup3, true);
  assert.equal(validAttempt.updatedProfile.age, 14);
  assert.equal(validAttempt.updatedProfile.ageGroup, '14-18');
});

test('completeDailyRoutineReward and calculateActivityGemReward grant gems for routines, lessons, chess wins, and videogames', () => {
  const firstCompletion = completeDailyRoutineReward(false, 0);
  assert.equal(firstCompletion.gemsEarned, 5);
  assert.equal(firstCompletion.newGemTotal, 5);

  const duplicateCompletion = completeDailyRoutineReward(true, 5);
  assert.equal(duplicateCompletion.gemsEarned, 0);
  assert.equal(duplicateCompletion.newGemTotal, 5);

  const lessonGem = calculateActivityGemReward('lesson', 5);
  assert.equal(lessonGem.gemsEarned, 5);
  assert.equal(lessonGem.newGemTotal, 10);

  const chessWinGem = calculateActivityGemReward('chess_win', 10);
  assert.equal(chessWinGem.gemsEarned, 8);
  assert.equal(chessWinGem.newGemTotal, 18);

  const gameWinGem = calculateActivityGemReward('videogame_win', 18);
  assert.equal(gameWinGem.gemsEarned, 5);
  assert.equal(gameWinGem.newGemTotal, 23);
});

test('purchaseShopItemWithGems and purchaseAvatarWithGems validate gem balance and return encouraging messages when insufficient', () => {
  const failed = purchaseShopItemWithGems(3, 15, false, 'Tablero Galaxia');
  assert.equal(failed.success, false);
  assert.equal(failed.remainingGems, 3);
  assert.equal(failed.missingGems, 12);
  assert.equal(Boolean(failed.reason && failed.reason.includes('12 gemas')), true);

  const bought = purchaseAvatarWithGems(15, 10, false);
  assert.equal(bought.success, true);
  assert.equal(bought.remainingGems, 5);
});

test('canUsersChat disables chat completely for Group 1 (3-6) and enforces same group & parent approval for Group 2 and 3', () => {
  assert.equal(isChatEnabledForGroup('3-6'), false);
  assert.equal(isChatEnabledForGroup('7-13'), true);

  // Group 1 child can never chat even with accepted friend
  assert.equal(canUsersChat('accepted', 5, true, true, '3-6').canChat, false);

  // Group 2/3 child can chat only if accepted, same group, and parent approved
  assert.equal(canUsersChat('accepted', 10, true, false, '7-13').canChat, false);
  assert.equal(canUsersChat('pending_sent', 10, true, true, '7-13').canChat, false);
  assert.equal(canUsersChat('accepted', 10, false, true, '7-13').canChat, false);
  assert.equal(canUsersChat('accepted', 16, false, true, '14-18').canChat, false);
  assert.equal(canUsersChat('accepted', 10, true, true, '7-13').canChat, true);
});

test('getAgeGroup, requiresParentalConsent, and canCustomizeWallpaper work across 3-18', () => {
  assert.equal(getAgeGroup(4), '3-6');
  assert.equal(getAgeGroup(10), '7-13');
  assert.equal(getAgeGroup(16), '14-18');
  assert.equal(requiresParentalConsent(12), true);
  assert.equal(requiresParentalConsent(13), false);
  assert.equal(canCustomizeWallpaper(5), false);
  assert.equal(canCustomizeWallpaper(10), true);
  assert.equal(areUsersInSameAgeGroup('7-13', '7-13'), true);
  assert.equal(areUsersInSameAgeGroup('3-6', '14-18'), false);
});

test('moderateChatMessage blocks inappropriate words and personal data', () => {
  assert.equal(moderateChatMessage('¡Hola amigo, jugamos serpientes!').allowed, true);
  assert.equal(moderateChatMessage('Eres un tonto').allowed, false);
  assert.equal(moderateChatMessage('Mi correo es nino@correo.com').allowed, false);
  assert.equal(moderateChatMessage('Llamame al 5551234567').allowed, false);
});

test('generateFriendCode and normalizeFriendCode assign unique LUMI-XXXX Friend Codes for cross-browser connection', () => {
  const fresh = createFreshUserAccount({
    username: 'valeria_11',
    name: 'Valeria',
    age: 11,
  });
  assert.match(fresh.friendCode, /^LUMI-\d{4}$/);
  assert.equal(normalizeFriendCode('lumi-4829'), 'LUMI-4829');
  assert.equal(normalizeFriendCode('4829'), 'LUMI-4829');
  assert.match(generateFriendCode('seed_test'), /^LUMI-\d{4}$/);
});

test('Library rules by age: 3-6 has Spanish stories WITH illustrations; 7-13 and 14-18 have English Stories WITHOUT illustrations', () => {
  const cfg36 = getLibraryConfigForAgeGroup('3-6');
  assert.equal(cfg36.language, 'es');
  assert.equal(cfg36.hasIllustrations, true);

  const books36 = getBooksForAgeGroup('3-6');
  assert.equal(books36.length >= 4, true);
  assert.equal(
    books36.every((b) => b.language === 'es' && b.hasIllustrations === true),
    true
  );

  const cfg713 = getLibraryConfigForAgeGroup('7-13');
  assert.equal(cfg713.language, 'en');
  assert.equal(cfg713.hasIllustrations, false);

  const books713 = getBooksForAgeGroup('7-13');
  assert.equal(books713.length >= 4, true);
  assert.equal(
    books713.every((b) => b.language === 'en' && b.hasIllustrations === false),
    true
  );

  const books1418 = getBooksForAgeGroup('14-18');
  assert.equal(books1418.length >= 4, true);
  assert.equal(
    books1418.every((b) => b.language === 'en' && b.hasIllustrations === false),
    true
  );
});

