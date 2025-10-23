// api/schedule_detail.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config';

// 한글 → 서버 ENUM 매핑 (필요시 추가)
const TYPE_MAP = {
  '관광지': 'TOURIST_SPOT',
  '식사':   'RESTAURANT',
  '숙소':   'ACCOMMODATION',
};

const norm = (v) => (typeof v === 'string' ? v.trim() : v);

async function callDetailAPI(body, token) {
  return axios.post(`${BASE_URL}/schedule/detail`, body, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    timeout: 15000,
  });
}

/**
 * @param {{ name?:string, type?:string, estimatedCost?:number, placeId?:string }} p
 */
export const getScheduleDetail = async (p) => {
  const token = await AsyncStorage.getItem('jwt');
  if (!token) throw new Error('JWT 토큰이 없습니다.');

  // 서버가 placeId로 조회하는 구조일 수 있음 → placeId 우선
  const placeId = norm(p?.placeId) || null;
  const safeName = String(norm(p?.name) ?? '');
  const rawType  = String(norm(p?.type) ?? '');
  const mapped   = TYPE_MAP[rawType] ?? rawType;
  const safeCost = Number.isFinite(p?.estimatedCost) ? Number(p?.estimatedCost) : 0;

  try {
    const body = placeId
      ? { placeId }
      : { name: safeName, type: mapped, estimatedCost: safeCost };

    const res = await callDetailAPI(body, token);
    if (res?.status === 200) return res.data;
    throw new Error(`조회 실패: ${res?.status ?? 'NO_STATUS'}`);
  } catch (err) {
    const status = err?.response?.status;
    const msg =
      err?.response?.data?.message ||
      (status === 404 ? '상세 정보가 존재하지 않습니다.' : err?.message || '알 수 없는 오류');
    const e = new Error(msg);
    e.status = status;
    throw e;
  }
};
