// 📁 api/planner_place_detail.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config';

/** 내부: JWT 로드 */
async function loadToken() {
  const keys = ['jwt', 'accessToken', 'token'];
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value) return value;
  }
  return null;
}

/** 서버가 기대하는 한글 type으로 보정 */
function normalizeType(t = '') {
  const s = String(t).trim();
  // 서버에서 쓰는 대표 카테고리로 맵핑
  // (필요시 추가: '카페/디저트' → '카페' 등)
  const map = {
    '관광지': '관광명소',
    '관광명소': '관광명소',
    '음식점': '음식점',
    '식사': '음식점',
    '카페': '카페',
    '숙소': '숙소',
  };
  return map[s] || s || '';
}

/** 장소 상세 조회 (POST /place/detail) */
export async function fetchPlaceDetail({ name, type, estimatedCost, lat, lng }) {
  const token = await loadToken();
  const url = `${BASE_URL}/place/detail`;

  const body = {
    name: String(name || '').trim(),
    type: normalizeType(type),
    estimatedCost: Number(estimatedCost) || 0,
    lat: typeof lat === 'number' ? lat : Number(lat),
    lng: typeof lng === 'number' ? lng : Number(lng),
  };

  console.log('🌐 [PlaceDetail][POST]', url);
  console.log('📤 요청 바디:', body);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // ✅ 스프레드로 교체
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      const err = new Error(`상세 조회 실패 (${res.status})`);
      err.status = res.status;
      err.payload = data;
      throw err;
    }

    console.log('✅ [PlaceDetail][RES]', data);
    return data;
  } catch (error) {
    // 404는 정상 플로우(카카오 보강)로 넘길 것이므로 콘솔 소음 제거
    if (error?.status && Number(error.status) === 404) {
      // 로그 생략 — 화면에서 보강 처리
    } else {
      console.error('❌ [PlaceDetail] 오류:', error?.status, error?.message);
    }
    throw error;
  }
}

export default fetchPlaceDetail;
