// TokenManager.js
// [RULE] AT: 'jwt', RT: 'refreshToken' (백엔드 명세 확정 키만 사용)

import AsyncStorage from '@react-native-async-storage/async-storage';

// ───────────────────────────────────────────────────────────────────────────────
// 설정
// ───────────────────────────────────────────────────────────────────────────────
const ACCESS_KEY = 'jwt';             // AccessToken
const REFRESH_KEY = 'refreshToken';   // RefreshToken

// 과거/타 팀 코드에서 사용했을 수 있는 레거시 키들(있으면 한 번만 마이그레이션)
const LEGACY_KEYS = ['access', 'accessToken', 'rt', 'refresh', 'refresh_token'];

// 런타임 캐시(앱 실행 중 I/O 최소화)
let cachedAT = null;
let cachedRT = null;
let initialized = false;

// ───────────────────────────────────────────────────────────────────────────────
// 내부 유틸
// ───────────────────────────────────────────────────────────────────────────────
const stripBearer = (t) => {
  const s = (t ?? '')
    .toString()
    .trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/^['"]+|['"]+$/g, ''); // 양끝 따옴표 제거
  return s && s !== 'undefined' && s !== 'null' ? s : '';
};

async function ensureInit() {
  if (initialized) return;
  // 1) 현재 키 로드
  const [at, rt] = await AsyncStorage.multiGet([ACCESS_KEY, REFRESH_KEY]);
  cachedAT = stripBearer(at?.[1]);
  cachedRT = stripBearer(rt?.[1]);

  // 2) 레거시 키가 남아있다면 1회 마이그레이션
  if (!cachedAT || !cachedRT) {
    const legacyPairs = await AsyncStorage.multiGet(LEGACY_KEYS);
    let foundAT = cachedAT;
    let foundRT = cachedRT;

    for (const [k, v] of legacyPairs) {
      if (!v) continue;
      const clean = stripBearer(v);
      if (!foundAT && /access/i.test(k)) foundAT = clean;
      if (!foundRT && /refresh/i.test(k)) foundRT = clean;
    }

    if (foundAT || foundRT) {
      const sets = [];
      if (foundAT) sets.push([ACCESS_KEY, foundAT]);
      if (foundRT) sets.push([REFRESH_KEY, foundRT]);
      if (sets.length) await AsyncStorage.multiSet(sets);
      cachedAT = foundAT || cachedAT;
      cachedRT = foundRT || cachedRT;
      // 레거시 키 정리(옵션) — 깔끔하게
      if (legacyPairs.length) {
        const toRemove = legacyPairs.map(([k]) => k);
        await AsyncStorage.multiRemove(toRemove);
      }
    }
  }

  initialized = true;
}

// ───────────────────────────────────────────────────────────────────────────────
// 공개 API
// ───────────────────────────────────────────────────────────────────────────────

// [ADDED] 정식 토큰 저장 (회원가입/로그인/재발급 직후)
export async function setTokens(accessToken, refreshToken) {
  await ensureInit();
  const sets = [];
  if (accessToken != null) {
    const clean = stripBearer(accessToken);
    sets.push([ACCESS_KEY, clean]);
    cachedAT = clean;
  }
  if (refreshToken != null) {
    const clean = stripBearer(refreshToken);
    sets.push([REFRESH_KEY, clean]);
    cachedRT = clean;
  }
  if (sets.length) await AsyncStorage.multiSet(sets);
}

// [KEEP] 회원가입 前 임시/정식 모두 같은 키('jwt') 사용
export async function setJwt(token) {
  await ensureInit();
  const clean = stripBearer(token);
  await AsyncStorage.setItem(ACCESS_KEY, clean);
  cachedAT = clean;
}

// 항상 깨끗한 AT 반환
export async function getAccessToken() {
  await ensureInit();
  return cachedAT || null;
}

// 항상 깨끗한 RT 반환
export async function getRefreshToken() {
  await ensureInit();
  return cachedRT || null;
}

// 전체 삭제 (로그아웃/재발급 실패 시)
export async function clearTokens() {
  await ensureInit();
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
  cachedAT = null;
  cachedRT = null;
}

// 로그인 여부
export async function isLoggedIn() {
  const at = await getAccessToken();
  return !!at;
}

// Authorization 헤더 헬퍼
export async function getAuthHeader() {
  const at = await getAccessToken();
  return at ? { Authorization: `Bearer ${at}` } : {};
}

// 디버그용 (테스트 후 삭제 권장)
export async function __debugDumpTokens(tag = '') {
  const [[, at], [, rt]] = await AsyncStorage.multiGet([ACCESS_KEY, REFRESH_KEY]);
  const shape = (t) => ({
    len: (t || '').length,
    dots: (t || '').split('.').length, // JWT면 보통 3
    head: (t || '').slice(0, 12),
  });
  console.log(`[TOKENS ${tag}] AT`, shape(at), 'RT', shape(rt), 'EQ?', at === rt);
}
