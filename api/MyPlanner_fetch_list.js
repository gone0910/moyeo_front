import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경
import api from './AxiosInstance';

/**
 * 플랜(여행 일정) 리스트 조회 API
 * GET /schedule/list
 * @returns {Promise<Array>} 플랜 리스트 배열 반환
 */
export async function fetchPlanList() {
  const url = `${BASE_URL}/schedule/list`;

  try {
    const token = await AsyncStorage.getItem('jwt');
    if (!token) throw new Error('NO_JWT');

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
      params: { t: Date.now() },
      timeout: 15000,
      validateStatus: (s) => s >= 200 && s < 600, // 5xx도 받음
      transitional: { clarifyTimeoutError: true },
    });

    const ok = res.status >= 200 && res.status < 300;
    if (ok) {
      const serverItems = Array.isArray(res.data) ? res.data : (res?.data?.content ?? []);

      // [ADDED] 로컬 캐시 읽기
      let localItems = [];
      try {
        const cachedRaw = await AsyncStorage.getItem(CACHE_KEY);
        localItems = cachedRaw ? JSON.parse(cachedRaw) : [];
      } catch {
        localItems = [];
      }

      // [ADDED] 동일 일정 매칭을 위한 키 함수 (serverId 우선, 없으면 id)
      const toKey = (t) => {
        const k = t?.serverId ?? t?.id;
        // 숫자/문자 혼재 대비 안전 문자열화
        return k == null ? '' : String(k);
      };

      // [ADDED] 로컬 맵 구성 (최근에 상세 저장 후 반영한 요약이 들어있음)
      const localMap = new Map(localItems.map((l) => [toKey(l), l]));

      // [ADDED] 서버 응답과 로컬 요약을 병합
      //  - 상세 저장 직후 refreshAfterSave()에서 saveTripToList()로 넣은
      //    firstPlaceName / placeCount / updatedAt / (제목/기간) 등을 우선 보존
      const merged = serverItems.map((s) => {
        const key = toKey(s);
        const l = localMap.get(key);
        if (!l) return s;

        return {
          ...s,
          // 서버가 지연/미제공할 수 있는 요약값은 로컬 우선
          firstPlaceName: l.firstPlaceName ?? s.firstPlaceName,
          placeCount: l.placeCount ?? s.placeCount,
          updatedAt: l.updatedAt ?? s.updatedAt,

          // 제목/기간이 상세에서 방금 바뀐 직후라도 즉시 반영되도록 로컬 우선
          title: l.title ?? s.title,
          startDate: l.startDate ?? s.startDate,
          endDate: l.endDate ?? s.endDate,

          // 필요 시 기타 카드 표시용 보조 필드가 있다면 여기에 동일하게 병합
          // e.g. thumbnailUrl, provinceName 등 프로젝트에서 쓰는 필드
          thumbnailUrl: l.thumbnailUrl ?? s.thumbnailUrl,
        };
      });

      // 최신 성공본(로컬 병합 결과)을 캐시에 보관
      try { await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(merged)); } catch {}
      return { items: merged, status: res.status };
    }
  } catch (error) {
    console.error('❌ 플랜 리스트 조회 예외:', error.response?.data || error.message);
    return [];
  }
}
