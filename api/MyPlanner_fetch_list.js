import axios from 'axios'; // ⬅️ [참고] 기존 axios는 삭제해도 되나, 캐시 로직 등에서 필요시 유지
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config';
import api from './AxiosInstance'; // ⬅️ [확인] api 인스턴스 사용

// [참고] 캐시 키가 정의되어 있지 않아 임의로 추가합니다.
const CACHE_KEY = 'planListCache'; 

/**
 * 플랜(여행 일정) 리스트 조회 API
 * GET /schedule/list
 * @returns {Promise<Array>} 플랜 리스트 배열 반환
 */
export async function fetchPlanList() {
  const url = `${BASE_URL}/schedule/list`;

  try {
    // const token = await AsyncStorage.getItem('jwt'); // ⬅️ [제거] api가 자동으로 처리
    // if (!token) throw new Error('NO_JWT');

    // ⬇️ [수정] axios.get -> api.get
    const res = await api.get(url, {
      // ⬇️ [제거] Authorization 헤더는 api가 자동으로 추가
      // headers: {
      //   Authorization: `Bearer ${token}`,
      //   Accept: 'application/json',
      //   'Cache-Control': 'no-cache',
      //   Pragma: 'no-cache',
      // },
      
      // ⬇️ [수정] Authorization을 제외한 나머지 헤더는 유지
      headers: {
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
    
    // [참고] 200-300이 아닌 응답(캐시 로직을 타지 않은)은 여기서 처리해야 합니다.
    // 예를 들어 4xx, 5xx 오류 시 캐시를 반환할지, 오류를 던질지 등
    // 여기서는 기존 로직을 따라 빈 배열을 반환합니다.
    console.warn(`❌ 플랜 리스트 조회 실패 (Status: ${res.status})`, res.data);
    return [];

  } catch (error) {
    // ⬇️ [수정] api.get()이 401 재발급 실패 등으로 오류를 throw한 경우
    console.error('❌ 플랜 리스트 조회 예외:', error.response?.data || error.message);
    
    // [참고] 네트워크 오류 시 로컬 캐시 반환 (선택적)
    // const cachedRaw = await AsyncStorage.getItem(CACHE_KEY);
    // if (cachedRaw) {
    //   console.log('📦 [오류] 네트워크 오류로 캐시된 데이터 반환');
    //   return { items: JSON.parse(cachedRaw), status: 'cached' };
    // }

    return [];
  }
}