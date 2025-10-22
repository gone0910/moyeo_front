// AxiosInstance.js
// [CHANGED] 전역 Content-Type 제거 (요청별 자동 설정, 특히 FormData 보호)

import axios from 'axios';
import { BASE_URL } from './config/api_Config';
import * as TokenManager from './TokenManager';
import { reissueToken } from './AuthApi';

// [ADDED] 운영 토글: true면 403/419도 만료로 간주, false면 401만
const ALLOW_NON401_EXPIRED = true;

// [ADDED] 재발급 동시성 제어용 단일 Promise
let refreshingPromise = null;

const api = axios.create({
  baseURL: BASE_URL,
  // headers: { 'Content-Type': 'application/json' }, // [REMOVED]
  // 필요하면 개별 요청에서 명시 (JSON 바디일 때만)
});

// [ADDED] 요청 전: JWT 자동 부착
api.interceptors.request.use(
  async (config) => {
    const at = await TokenManager.getAccessToken();
    // [DEBUG] 토큰 존재만 확인 (전체 토큰 로그 금지 권장)
    console.log('[AxiosInstance] ➡️ Authorization:', at ? 'Bearer <present>' : '없음');

    if (at) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${at}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// [ADDED] 도움 함수: 만료판정 & 재발급 자체 요청 차단
const isAuthReissueCall = (cfg) => {
  const url = (cfg?.url || '').toString();
  // 백엔드 재발급 엔드포인트 경로명에 맞게 조정
  return url.includes('/auth/reissue') || url.includes('/reissue');
};

const isExpiredStatus = (status) => {
  if (status === 401) return true;
  if (!ALLOW_NON401_EXPIRED) return false;
  return status === 403 || status === 419;
};

// [ADDED] 응답 후: 만료시 1회 재발급 + 원요청 재시도
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const original = error?.config;

    // 네트워크 오류 등 status 없음
    if (!original || typeof status !== 'number') {
      return Promise.reject(error);
    }

    // 재발급 대상 아님, 이미 재시도 했음, 혹은 재발급 호출 자체면 종료
    if (!isExpiredStatus(status) || original._retry || isAuthReissueCall(original)) {
      return Promise.reject(error);
    }

    original._retry = true; // [ADDED] 무한 재시도 방지

    try {
      // [ADDED] 단일 재발급 실행 (single-flight)
      if (!refreshingPromise) {
        refreshingPromise = (async () => {
          const rtRaw = await TokenManager.getRefreshToken();
          console.log('[Axios] 🔁 reissue start | RT present =', !!rtRaw);

          if (!rtRaw) {
            await TokenManager.clearTokens();
            throw error; // 세션 없음
          }

          const { accessToken: newAT, refreshToken: newRT } = await reissueToken(rtRaw);
          await TokenManager.setTokens(newAT, newRT);
          console.log('[Axios] 🔁 reissue success');
          return newAT;
        })().finally(() => {
          // 끝나면 다음 사이클 대비 초기화
          refreshingPromise = null;
        });
      }

      const newAT = await refreshingPromise;

      // [ADDED] 원요청 헤더 교체 후 재시도
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAT}`;

      // 주의: 전역 Content-Type을 박지 않았으므로,
      // 원요청이 multipart/form-data 였다면 boundary 자동 처리됨.
      return api(original);
    } catch (e) {
      console.warn('[Axios] reissue failed -> clear tokens');
      await TokenManager.clearTokens();
      return Promise.reject(e);
    }
  }
);

export default api;
