// api/MyPlanner_fetch_list.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config';

const CACHE_KEY = 'MY_TRIPS'; // 화면들과 맞춤

/**
 * 플랜 리스트 호출
 * @returns {Promise<{items: Array, status: number|null}>}
 *  - items: 정상/폴백 최종 배열
 *  - status: HTTP 상태코드 (성공=200대, 서버에러=500대, 네트워크= null)
 */
export async function fetchPlanList() {
  const url = `${BASE_URL}/schedule/list?_ts=${Date.now()}`;

  try {
    const token = await AsyncStorage.getItem('jwt');
    if (!token) throw new Error('NO_JWT');

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      timeout: 15000,
      validateStatus: (s) => s >= 200 && s < 600, // 5xx도 받음
      transitional: { clarifyTimeoutError: true },
    });

    const ok = res.status >= 200 && res.status < 300;
    if (ok) {
      const items = Array.isArray(res.data) ? res.data : (res?.data?.content ?? []);
      // 최신 성공본을 캐시에 보관
      try { await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(items)); } catch {}
      return { items, status: res.status };
    }

    // 4xx/5xx → 캐시 폴백
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    const items = cached ? JSON.parse(cached) : [];
    return { items, status: res.status };
  } catch (e) {
    // 네트워크/타임아웃/예외 → 캐시 폴백
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    const items = cached ? JSON.parse(cached) : [];
    return { items, status: null };
  }
}
