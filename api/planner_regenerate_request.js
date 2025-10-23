// api/planner_regenerate_request.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config';

/** ENUM 대문자/언더스코어 정규화 */
const toEnum = (val) =>
  typeof val === 'string' ? val.trim().toUpperCase().replace(/\s+/g, '_') : val;

/** 목적지 정규화: 다양한 입력 → 서버 City ENUM 으로 매핑 */
const normalizeDestination = (dest) => {
  const v = Array.isArray(dest) ? dest[0] : dest;
  const raw = toEnum(v || '');

  // 흔히 들어오는 제주 변형들을 안전하게 매핑
  const CITY_MAP = {
    'JEJU': 'JEJU_SI',
    'JEJU_CITY': 'JEJU_SI',
    'JEJU-SI': 'JEJU_SI',
    'JEJU_DO': 'JEJU_SI',
    'JEJU-DO': 'JEJU_SI',
    'JEJU_ISLAND': 'JEJU_SI',

    'SEOGWIPO': 'SEOGWIPO_SI',
    'SEOGWIPO-SI': 'SEOGWIPO_SI',

    // 필요 시 다른 지역도 여기에 추가
    // 'SEOUL_CITY': 'SEOUL',
    // 'BUSAN_CITY': 'BUSAN',
  };

  if (!raw) return 'JEJU_SI'; // 완전 공백이면 기본값

  // 이미 서버 ENUM 형태면 통과
  if (/_SI$/.test(raw)) return raw;

  // 매핑 표에 있으면 매핑, 없으면 원본 반환(서버가 허용하는 다른 City일 수 있음)
  return CITY_MAP[raw] || raw;
};

/**
 * @typedef {Object} PlanPlace
 * @property {'식사'|'관광지'|'숙소'|string} type
 * @property {string} name
 * @property {string} hashtag
 * @property {number} estimatedCost
 * @property {number} lat
 * @property {number} lng
 * @property {number|null} walkTime
 * @property {number|null} driveTime
 * @property {number|null} transitTime
 */

/**
 * @typedef {Object} PlanDay
 * @property {string} day
 * @property {string} date
 * @property {number} totalEstimatedCost
 * @property {PlanPlace[]} places
 */

/**
 * @typedef {Object} RegenerateResponse
 * @property {string} title
 * @property {string} startDate
 * @property {string} endDate
 * @property {PlanDay[]} days
 */

export const regenerateSchedule = async ({
  startDate,
  endDate,
  destination,
  mbti,
  travelStyle,
  peopleGroup,
  budget,
  excludedNames = [],
}) => {
  try {
    const token = await AsyncStorage.getItem('jwt');
    if (!token) throw new Error('JWT 토큰이 없습니다.');

    const requestBody = {
      request: {
        startDate,
        endDate,
        destination: normalizeDestination(destination), // ⬅️ 여기서 확정 변환
        mbti: toEnum(mbti),
        travelStyle: toEnum(travelStyle),
        peopleGroup: toEnum(peopleGroup),
        budget: Number(budget),
      },
      excludedNames: Array.isArray(excludedNames) ? excludedNames : [],
    };

    const url = `${BASE_URL}/schedule/recreate`;
    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      // timeout 제거(요청사항 반영)
    });

    if (response?.status === 200 && response?.data) {
      console.log('✅ 일정 재생성 성공:', JSON.stringify(response.data, null, 2));
      return response.data;
    }

    console.warn('⚠️ 일정 재생성: 정상 응답이 아니거나 데이터 없음');
    return response?.data;
  } catch (err) {
    console.error('❌ 일정 재생성 실패:', err?.response?.data || err?.message);
    throw err;
  }
};
