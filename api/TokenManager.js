// TokenManager.js
// [ADDED] 백엔드 명세 준수: AccessToken은 'jwt', RefreshToken은 'refreshToken' 키로만 관리


import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config'; // [ADDED] apiConfig.js에서 BASE_URL 주소 가져오기


const ACCESS_KEY = 'jwt';            // [CONFIRMED] AccessToken 전역 키
const REFRESH_KEY = 'refreshToken';  // [CONFIRMED] RefreshToken 전역 키


// [ADDED] 조회 시 정규화 유틸 (Bearer 접두어/공백/따옴표 제거)
const stripBearer = (t) => {
  const s = (t ?? '').toString().trim()
    .replace(/^Bearer\s+/i, '')
    .replace(/^"|"$/g, '');
  return (s && s !== 'undefined' && s !== 'null') ? s : '';
};


// [ADDED] 정식 토큰 저장 (회원가입/로그인/재발급 직후)
export async function setTokens(accessToken, refreshToken) {
  if (accessToken != null) await AsyncStorage.setItem(ACCESS_KEY, accessToken);
  if (refreshToken != null) await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
}


// [ADDED] 회원가입 前 임시/정식 모두 같은 키('jwt') 사용
export async function setJwt(token) {
  await AsyncStorage.setItem(ACCESS_KEY, token || '');
}


// [UPDATED] 항상 깨끗한 AT 반환
export async function getAccessToken() {
  const at = await AsyncStorage.getItem(ACCESS_KEY);
  const clean = stripBearer(at);        // [UPDATED]
  return clean || null;
}


// [UPDATED] 항상 깨끗한 RT 반환
export async function getRefreshToken() {
  const rt = await AsyncStorage.getItem(REFRESH_KEY);
  const clean = stripBearer(rt);        // [UPDATED]
  return clean || null;
}


// [ADDED] 전체 삭제 (로그아웃/재발급 실패 시)
export async function clearTokens() {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}


// TokenManager.js 맨 아래에 임시 추가 (테스트 후 삭제 권장)
export async function __debugDumpTokens(tag = '') {
  const at = await AsyncStorage.getItem('jwt');
  const rt = await AsyncStorage.getItem('refreshToken');
  const shape = (t) => ({
    len: (t || '').length,
    dots: (t || '').split('.').length, // JWT면 3이 정상
    head: (t || '').slice(0, 12),
  });
  console.log(`[TOKENS ${tag}] AT`, shape(at), 'RT', shape(rt), 'EQ?', at === rt);
}



