// api/planner_create_request.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config';

// ENUM 대문자 정규화
const toEnum = (val) =>
  (typeof val === 'string' ? val.trim().toUpperCase().replace(/\s+/g, '_') : val);

// 목적지: 단일 문자열 + 대문자
const normalizeDestination = (dest) => {
  const v = Array.isArray(dest) ? dest[0] : dest;
  return toEnum(v);
};

// (선택) 간단 재시도 유틸 – 네트워크 일시 오류 대비
async function withRetry(fn, retries = 1, delayMs = 800) {
  try {
    return await fn();
  } catch (e) {
    if (retries <= 0) throw e;
    await new Promise((r) => setTimeout(r, delayMs));
    return withRetry(fn, retries - 1, delayMs * 1.5);
  }
}

/** 일정 생성 */
export const createSchedule = async (
  startDate,
  endDate,
  destination,
  mbti,
  travelStyle,
  peopleGroup,
  budget
) => {
  const token = await AsyncStorage.getItem('jwt');
  if (!token) {
    console.warn('❌ 토큰 없음 — 로그인 후 다시 시도하세요.');
    throw new Error('UNAUTHORIZED');
  }

  const requestData = {
    startDate,
    endDate,
    destination: normalizeDestination(destination),
    mbti: toEnum(mbti),
    travelStyle: toEnum(travelStyle),
    peopleGroup: toEnum(peopleGroup),
    budget: Number(budget),
  };

  console.log('📤 /schedule/create ->', requestData, 'BASE_URL:', BASE_URL);

  try {
    // ⬇️ 타임아웃 옵션 제거 (axios 기본: 무제한 대기)
    const doPost = () =>
      axios.post(`${BASE_URL}/schedule/create`, requestData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

    // (선택) 재시도 1회 — 네트워크 순간 끊김 방지
    const res = await withRetry(doPost, 1);

    const data = res.data;
    if (!data?.days || !Array.isArray(data.days)) {
      throw new Error('INVALID_RESPONSE_DAYS');
    }

    console.log('✅ 일정 생성 성공:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    // axios 에러 안전 분해
    const status = error?.response?.status;
    const msgFromServer = error?.response?.data?.message;
    const code = error?.code; // 'ECONNABORTED' 등
    const url = `${BASE_URL}/schedule/create`;

    // 상세 로깅
    console.error('❌ 일정 생성 실패 디테일:', {
      url,
      status,
      code,
      msgFromServer,
      axiosMessage: error?.message,
    });

    if (status === 401) throw new Error('UNAUTHORIZED');

    // 네트워크/서버 미응답 계열 안내 메시지
    if (!status) {
      // 서버 미응답 (DNS, 포트, 보안그룹, 서버다운/지연)
      throw new Error('서버 응답이 없습니다. 서버 상태나 네트워크를 확인해주세요.');
    }

    // 서버가 보낸 메시지 우선
    throw new Error(msgFromServer || '일정 생성 중 오류가 발생했습니다.');
  }
};
