// AxiosInstance.js
// [ADDED] 명세서에 없는 상태코드/알림/네비게이션 처리 제거
// → 401에서만 재발급 1회 시도 후 원요청 재시도

import axios from 'axios';
import { BASE_URL } from './config/api_Config';
import * as TokenManager from './TokenManager';
import { reissueToken } from './AuthApi';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// [ADDED] 요청 전: jwt 자동 부착
api.interceptors.request.use(
  async (config) => {
    const at = await TokenManager.getAccessToken();       //' jwt'
    // 토큰 제대로 전송 여부할때만 체크
    console.log('[AxiosInstance] 💡 요청 헤더 Authorization:', at ? `Bearer ${at}` : '없음'); 

    if (at) config.headers.Authorization = `Bearer ${at}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// [ADDED] 응답 후: 오직 401만 재발급 트리거 (명세 준수)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const original = error.config || {};

    // [UPDATED] 만료 코드 확장: 401(명세) + 403/419(운영 대응)
    const isExpired = status === 401 || status === 403 || status === 419; // [UPDATED]
    if (!isExpired || original._retry) return Promise.reject(error);
    original._retry = true;

    try {
      // [DEBUG] 재발급 직전: 저장된 RT 확인
      const rtRaw = await TokenManager.getRefreshToken();
      console.log('[Axios RT] present=', !!rtRaw,
                  'len=', (rtRaw || '').length,
                  'dotParts=', (rtRaw || '').split('.').length,
                  'head=', (rtRaw || '').slice(0, 12));

      if (!rtRaw) {
        await TokenManager.clearTokens();
        return Promise.reject(error);
      }

      const { accessToken: newAT, refreshToken: newRT } = await reissueToken(rtRaw);
      console.log('[Axios] reissue ok -> saving + retry'); // [DEBUG]

      await TokenManager.setTokens(newAT, newRT);
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAT}`;
      return api(original);
    } catch (e) {
      console.warn('[Axios] reissue failed', e?.response?.status, e?.response?.data); // [DEBUG]
      if (TokenManager.__debugDumpTokens) {
        await TokenManager.__debugDumpTokens('before-clear'); // [DEBUG] Optional
      }
      await TokenManager.clearTokens();
      return Promise.reject(e);
    }
  }
);

export default api;
