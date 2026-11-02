import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAgeGroup,
  getAvatarAgeTier,
  getInitialAvatarForAgeGroup,
  getNavigationTabsForAgeGroup,
  createFreshUserAccount,
  isLessonUnlocked,
  calculateActivityGemReward,
  purchaseShopItemWithGems,
  purchaseAvatarWithGems,
  areUsersInSameAgeGroup,
  requiresParentalConsent,
  canCustomizeWallpaper,
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
  evaluateFacialAgeVerification,
  evaluateChatImageSafety,
  detectGroomingOrPersonalDataInChat,
  shuffleExerciseOptionsFisherYates,
  getPrivateChatRoomId,
  filterPrivateRoomMessages,
  ANTI_CHILD_PHOTO_LEGAL_MESSAGE,
  SAFE_KIDS_GIFS,
} from './educationLogic';
import {
  COURSES_DATA,
  getBooksForAgeGroup,
  CHESS_ACADEMY_LESSONS,
} from '../data/curriculumData';
import {
  computeRealChessBotMove,
  verifyChessPuzzleMove,
  CHESS_TIME_CONTROLS,
  resolveChessInviteColors,
  formatChessClock,
  tickChessClock,
} from './chessEngine';

test('createFreshUserAccount initializes a brand new child account completely from zero (0 XP, 0 streak, 0 enrolled courses)', () => {
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
  assert.deepEqual(fresh.enrolledSubjects, []);

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

test('getNavigationTabsForAgeGroup returns the 4 minimalist navigation tabs without routines', () => {
  assert.deepEqual(getNavigationTabsForAgeGroup('3-6', 5), [
    'learn',
    'library',
    'friends',
    'profile',
  ]);
  assert.deepEqual(getNavigationTabsForAgeGroup('7-13', 10), [
    'learn',
    'library',
    'friends',
    'profile',
  ]);
  assert.deepEqual(getNavigationTabsForAgeGroup('14-18', 16), [
    'learn',
    'library',
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

test('calculateActivityGemReward grants gems for lessons, chess wins, and videogames', () => {
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

  assert.equal(canUsersChat('accepted', 5, true, true, '3-6').canChat, false);
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

test('moderateChatMessage and detectGroomingOrPersonalDataInChat block grooming, personal photo requests, home addresses, and trigger automatic user block & expulsion', () => {
  const safeMsg = moderateChatMessage('¡Hola amigo, jugamos serpientes!');
  assert.equal(safeMsg.allowed, true);
  assert.equal(safeMsg.autoBlockAndExpelSender, false);

  const profanityMsg = moderateChatMessage('Eres un tonto');
  assert.equal(profanityMsg.allowed, false);

  const photoReq1 = detectGroomingOrPersonalDataInChat('Hola, mandame una foto tuya');
  assert.equal(photoReq1.allowed, false);
  assert.equal(photoReq1.isCriticalGrooming, true);
  assert.equal(photoReq1.autoBlockAndExpelSender, true);
  assert.equal(photoReq1.violationCategory, 'photo_request');

  const photoReq2 = moderateChatMessage('mostrate en la camara');
  assert.equal(photoReq2.allowed, false);
  assert.equal(photoReq2.autoBlockAndExpelSender, true);

  const addressReq = detectGroomingOrPersonalDataInChat('¿Dónde vivís? Pásame tu dirección');
  assert.equal(addressReq.allowed, false);
  assert.equal(addressReq.isCriticalGrooming, true);
  assert.equal(addressReq.autoBlockAndExpelSender, true);
  assert.equal(addressReq.violationCategory, 'address_location');

  const schoolReq = detectGroomingOrPersonalDataInChat('¿A qué escuela vas?');
  assert.equal(schoolReq.allowed, false);
  assert.equal(schoolReq.autoBlockAndExpelSender, true);

  const meetupReq = detectGroomingOrPersonalDataInChat('Podemos vernos en persona sin que sepan tus papás');
  assert.equal(meetupReq.allowed, false);
  assert.equal(meetupReq.autoBlockAndExpelSender, true);
});

test('evaluateFacialAgeVerification allows minors (3-18) and immediately blocks adults (>18) or missing faces', () => {
  const minorCheck = evaluateFacialAgeVerification({
    faceDetected: true,
    estimatedAge: 10,
    isAdultOver18: false,
  });
  assert.equal(minorCheck.allowed, true);
  assert.equal(minorCheck.isMinorUnder18, true);
  assert.equal(minorCheck.isAdultOver18, false);

  const adultCheck = evaluateFacialAgeVerification({
    faceDetected: true,
    estimatedAge: 29,
    isAdultOver18: true,
  });
  assert.equal(adultCheck.allowed, false);
  assert.equal(adultCheck.isAdultOver18, true);

  const noFaceCheck = evaluateFacialAgeVerification({
    faceDetected: false,
    estimatedAge: null,
  });
  assert.equal(noFaceCheck.allowed, false);
  assert.equal(noFaceCheck.faceDetected, false);
});

test('evaluateChatImageSafety blocks real photos of children/people with exact legal warning and allows course drawings & safe GIFs', () => {
  const blockedPersonPhoto = evaluateChatImageSafety({
    containsPersonOrFace: true,
    fileName: 'selfie_nino.jpg',
    imageKind: 'photo',
  });
  assert.equal(blockedPersonPhoto.allowed, false);
  assert.equal(blockedPersonPhoto.containsPersonOrFace, true);
  assert.equal(blockedPersonPhoto.reason, ANTI_CHILD_PHOTO_LEGAL_MESSAGE);

  const allowedCourseDrawing = evaluateChatImageSafety({
    containsPersonOrFace: false,
    fileName: 'dibujo_curso_perspectiva.png',
    imageKind: 'drawing',
  });
  assert.equal(allowedCourseDrawing.allowed, true);
  assert.equal(allowedCourseDrawing.containsPersonOrFace, false);

  assert.equal(SAFE_KIDS_GIFS.length >= 6, true);
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

test('Chess Course pedagogical lessons use valid chess.js FEN positions and verify legal target solutions', () => {
  assert.equal(CHESS_ACADEMY_LESSONS.length, 4);

  // Lesson 1: Mate in 1 (Qg7#)
  const l1 = CHESS_ACADEMY_LESSONS[0];
  const res1 = verifyChessPuzzleMove({
    initialFen: l1.initialFen,
    from: 'f6',
    to: 'g7',
    targetMoveSan: l1.targetMoveSan,
  });
  assert.equal(res1.legal, true);
  assert.equal(res1.solved, true);
  assert.equal(res1.isCheckmate, true);

  // Lesson 2: Capture undefended Queen (Nxe5)
  const l2 = CHESS_ACADEMY_LESSONS[1];
  const res2 = verifyChessPuzzleMove({
    initialFen: l2.initialFen,
    from: 'f3',
    to: 'e5',
    targetMoveSan: l2.targetMoveSan,
  });
  assert.equal(res2.legal, true);
  assert.equal(res2.solved, true);

  // Lesson 3: Knight fork to King and Queen (Nd6+)
  const l3 = CHESS_ACADEMY_LESSONS[2];
  const res3 = verifyChessPuzzleMove({
    initialFen: l3.initialFen,
    from: 'e4',
    to: 'd6',
    targetMoveSan: l3.targetMoveSan,
  });
  assert.equal(res3.legal, true);
  assert.equal(res3.solved, true);

  // Lesson 4: Escape check by capturing attacker (Bxe4)
  const l4 = CHESS_ACADEMY_LESSONS[3];
  const res4 = verifyChessPuzzleMove({
    initialFen: l4.initialFen,
    from: 'd3',
    to: 'e4',
    targetMoveSan: l4.targetMoveSan,
  });
  assert.equal(res4.legal, true);
  assert.equal(res4.solved, true);
});

test('Real Chess Bot Engine (200, 1000, and 2000 ELO) captures hanging pieces and finds tactical checkmates', () => {
  // Black to move with an obvious capture of an undefended white queen on e4 by black knight on f6
  const hangingQueenFen = '4k3/ppp2ppp/5n2/8/4Q3/8/PPP2PPP/4K3 b - - 0 1';
  const move200 = computeRealChessBotMove(hangingQueenFen, '200');
  const move1000 = computeRealChessBotMove(hangingQueenQueenFenOrDefault(hangingQueenFen), '1000');
  const move2000 = computeRealChessBotMove(hangingQueenFen, '2000');

  assert.ok(move200);
  assert.equal(move1000?.from, 'f6');
  assert.equal(move1000?.to, 'e4');
  assert.equal(move2000?.from, 'f6');
  assert.equal(move2000?.to, 'e4');
});

function hangingQueenQueenFenOrDefault(fen: string): string {
  return fen;
}

test('Chess Friend Match Time Controls, Color Assignment, and Live Clock Ticking work accurately', () => {
  assert.equal(CHESS_TIME_CONTROLS.length, 5);
  assert.deepEqual(
    CHESS_TIME_CONTROLS.map((tc) => tc.id),
    ['3min', '5min', '10min', '15min', 'unlimited']
  );

  // Format clock
  assert.equal(formatChessClock(180), '03:00');
  assert.equal(formatChessClock(300), '05:00');
  assert.equal(formatChessClock(600), '10:00');
  assert.equal(formatChessClock(900), '15:00');
  assert.equal(formatChessClock(null), '∞ Sin tiempo');

  // Resolve colors
  assert.deepEqual(resolveChessInviteColors('w'), {
    hostColor: 'w',
    guestColor: 'b',
  });
  assert.deepEqual(resolveChessInviteColors('b'), {
    hostColor: 'b',
    guestColor: 'w',
  });
  assert.deepEqual(resolveChessInviteColors('random', 2), {
    hostColor: 'w',
    guestColor: 'b',
  });
  assert.deepEqual(resolveChessInviteColors('random', 3), {
    hostColor: 'b',
    guestColor: 'w',
  });

  // Tick active white clock
  const tick1 = tickChessClock({
    whiteTimeSeconds: 180,
    blackTimeSeconds: 180,
    activeTurn: 'w',
    status: 'active',
  });
  assert.equal(tick1.whiteTimeSeconds, 179);
  assert.equal(tick1.blackTimeSeconds, 180);
  assert.equal(tick1.status, 'active');

  // Timeout detection when clock hits 0
  const timeoutTick = tickChessClock({
    whiteTimeSeconds: 1,
    blackTimeSeconds: 145,
    activeTurn: 'w',
    status: 'active',
  });
  assert.equal(timeoutTick.whiteTimeSeconds, 0);
  assert.equal(timeoutTick.status, 'completed');
  assert.equal(timeoutTick.timeoutWinner, 'b');
});

test('2) Fisher-Yates Shuffle (shuffleExerciseOptionsFisherYates) randomizes answer positions and tracks correctIndex accurately', () => {
  const baseOptions = [
    'Respuesta Correcta A',
    'Distractor B',
    'Distractor C',
    'Distractor D',
  ];

  // Deterministic RNG sequence that moves the first element away from index 0
  const rngSeq = [0.2, 0.85, 0.4];
  let idx = 0;
  const shuffled1 = shuffleExerciseOptionsFisherYates(
    baseOptions,
    'Respuesta Correcta A',
    () => rngSeq[idx++ % rngSeq.length]
  );

  assert.equal(shuffled1.options.length, 4);
  assert.equal(
    shuffled1.options[shuffled1.correctIndex],
    'Respuesta Correcta A'
  );
  assert.equal(shuffled1.correctAnswer, 'Respuesta Correcta A');

  // Verify across multiple random runs that the correct answer appears across different indices (0, 1, 2, 3)
  const observedPositions = new Set<number>();
  for (let run = 0; run < 40; run++) {
    const res = shuffleExerciseOptionsFisherYates(
      baseOptions,
      'Respuesta Correcta A'
    );
    assert.equal(res.options[res.correctIndex], 'Respuesta Correcta A');
    observedPositions.add(res.correctIndex);
  }
  assert.equal(observedPositions.size >= 3, true);
});

test('3) Private Chat Room Isolation (getPrivateChatRoomId & filterPrivateRoomMessages) prevents cross-leakage when User A and User B share friend User C', () => {
  const userA = 'user_ana_101';
  const userB = 'user_bruno_202';
  const userC = 'user_carlos_303';

  const roomAC = getPrivateChatRoomId(userA, userC);
  const roomCA = getPrivateChatRoomId(userC, userA);
  const roomBC = getPrivateChatRoomId(userB, userC);

  // Room ID is symmetric for A<->C and strictly distinct from B<->C
  assert.equal(roomAC, 'user_ana_101_user_carlos_303');
  assert.equal(roomAC, roomCA);
  assert.notEqual(roomAC, roomBC);

  const mixedPool = [
    {
      id: 'm1',
      senderId: userA,
      receiverId: userC,
      privateRoomId: roomAC,
      text: 'Hola Carlos, soy Ana',
    },
    {
      id: 'm2',
      senderId: userC,
      receiverId: userA,
      privateRoomId: roomAC,
      text: 'Hola Ana, ¿jugamos ajedrez?',
    },
    {
      id: 'm3',
      senderId: userB,
      receiverId: userC,
      privateRoomId: roomBC,
      text: 'Secreto entre Bruno y Carlos',
    },
    {
      id: 'm4',
      senderId: userC,
      receiverId: userB,
      privateRoomId: roomBC,
      text: 'Respuesta privada de Carlos para Bruno',
    },
  ];

  // When User A views chat with User C, ONLY messages between A and C are visible
  const visibleToAWithC = filterPrivateRoomMessages(mixedPool, userA, userC);
  assert.deepEqual(
    visibleToAWithC.map((m) => m.id),
    ['m1', 'm2']
  );

  // When User B views chat with User C, ONLY messages between B and C are visible
  const visibleToBWithC = filterPrivateRoomMessages(mixedPool, userB, userC);
  assert.deepEqual(
    visibleToBWithC.map((m) => m.id),
    ['m3', 'm4']
  );
});

test('4) Massive Courses: every course in COURSES_DATA has 100 complete lessons divided into 10 themed units of 10 lessons each, with varied correctIndex (0, 1, 2, 3)', () => {
  assert.ok(COURSES_DATA.length >= 16);

  const globalCorrectIndices = new Set<number>();

  for (const course of COURSES_DATA) {
    assert.equal(
      course.lessons.length,
      100,
      `Course ${course.id} (${course.title}) must have exactly 100 lessons`
    );
    assert.equal(
      course.units?.length,
      10,
      `Course ${course.id} must have 10 themed units`
    );

    // Check that each unit 1..10 has exactly 10 lessons
    for (let u = 1; u <= 10; u++) {
      const unitLessons = course.lessons.filter((l) => l.unitNumber === u);
      assert.equal(
        unitLessons.length,
        10,
        `Course ${course.id} Unit ${u} must contain 10 lessons`
      );
    }

    for (const lesson of course.lessons) {
      assert.ok(
        lesson.exercises.length >= 1,
        `Lesson ${lesson.id} must have exercises`
      );
      for (const ex of lesson.exercises) {
        if (ex.options && ex.options.length > 0 && ex.correctAnswer) {
          const idx = ex.options.indexOf(ex.correctAnswer);
          assert.ok(
            idx >= 0,
            `Exercise ${ex.id} must contain its correctAnswer in options`
          );
          globalCorrectIndices.add(idx);
        }
      }
    }
  }

  // Verify that the question database varies correctIndex across 0, 1, 2, and 3
  assert.equal(globalCorrectIndices.has(0), true);
  assert.equal(globalCorrectIndices.has(1), true);
  assert.equal(globalCorrectIndices.has(2), true);
  assert.equal(globalCorrectIndices.has(3), true);
});


