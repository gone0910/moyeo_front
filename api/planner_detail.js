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

/** 장소 상세 조회 (POST /place/detail) */
export async function fetchPlaceDetail({ name, type, estimatedCost, lat, lng }) {
  const token = await loadToken();
  const url = `${BASE_URL}/place/detail`;

  const body = {
    name,
    type,
    estimatedCost: Number(estimatedCost) || 0,
    lat: Number(lat),
    lng: Number(lng),
  };

  console.log('🌐 [PlaceDetail][POST]', url);
  console.log('📤 요청 바디:', body);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    // ✅ 실패 시 status 포함 Error 던지기 (PlaceDetailScreen에서 404 감지용)
    if (!res.ok) {
      const err = new Error(`상세 조회 실패 (${res.status})`);
      err.status = res.status;
      err.payload = data;
      throw err;
    }

    console.log('✅ [PlaceDetail][RES]', data);
    return data;
  } catch (error) {
    console.error('❌ [PlaceDetail] 오류:', error?.status, error?.message);
    throw error;
  }
}
