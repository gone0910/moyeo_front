// api/planner_edit_request.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config';

/** 이름 기반 타입 간단 추론(서버가 type 안 줄 때만 보강) */
function inferPlaceType(name = '') {
  const n = String(name);
  if (/(호텔|호스텔|게스트하우스|모텔|리조트|펜션|숙소|hotel|resort|bnb)/i.test(n)) return '숙박';
  if (/(카페|커피|tea|카페베네|스타벅스)/i.test(n)) return '카페';
  if (/(식당|맛집|한식|중식|일식|양식|분식|고기|치킨|피자|국밥|비빔밥|냉면|초밥|라멘|칼국수|막국수|곱창|족발|보쌈|브런치|포차|bar|pub|restaurant)/i.test(n)) return '식사';
  if (/(박물관|미술관|사찰|성당|궁|성|전시|유적|공원|폭포|산|섬|전망대|동물원|수목원|랜드|비치|해변|temple|museum|park|falls|observatory)/i.test(n)) return '관광지';
  if (/(시장|백화점|아울렛|쇼핑몰|마트|면세점|플리마켓|시장)/i.test(n)) return '쇼핑';
  if (/(체험|공방|클래스|액티비티|서핑|카약|요트|승마|스키|래프팅)/i.test(n)) return '체험';
  return '관광지'; // 최후 기본값
}

/** '#청주#박물관' → '청주 박물관' */
function normalizeHashtagToTagsStr(hashtag) {
  if (!hashtag) return '';
  return String(hashtag).replace(/#/g, ' ').replace(/\s+/g, ' ').trim();
}

/** 서버 place → {name,type,estimatedCost,gptOriginalName} 만 남기기 */
function toMinimalPlace(p = {}) {
  const name = (p.name ?? '').trim();
  const type = p.type ?? inferPlaceType(name);
  const estimatedCost = Number.isFinite(Number(p.estimatedCost)) ? Number(p.estimatedCost) : 0;
  const gptOriginalName =
    (p.gptOriginalName && String(p.gptOriginalName).trim()) ||
    normalizeHashtagToTagsStr(p.hashtag) ||
    name;

  return { name, type, estimatedCost, gptOriginalName };
}

/**
 * 장소명 배열을 받아 편집 결과(장소 리스트/총예산)를 반환
 * - 요청 바디: { names: string[] }  ← 🔒 스펙 준수
 * - 응답 보강: place는 name/type/estimatedCost/gptOriginalName만 유지
 * @param {string[]} placeNames
 * @returns {Promise<{ totalEstimatedCost?: number, places: Array<{name:string,type:string,estimatedCost:number,gptOriginalName:string}> } | Array>}
 */
export async function editSchedule(placeNames = []) {
  if (!Array.isArray(placeNames)) {
    throw new Error('placeNames는 문자열 배열이어야 합니다.');
  }

  const names = placeNames
    .map(v => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean);

  if (!names.length) {
    throw new Error('편집할 장소명이 비어 있습니다.');
  }

  const token =
    (await AsyncStorage.getItem('accessToken')) ||
    (await AsyncStorage.getItem('jwt')) ||
    (await AsyncStorage.getItem('token'));

  if (!token) {
    throw new Error('JWT 토큰이 없습니다.');
  }

  // 🔒 스펙 준수: body 키는 반드시 "names"
  const body = { names };

  const res = await axios.post(`${BASE_URL}/schedule/edit`, body, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  const data = res?.data;

  // ✅ 성공 응답(문서 참고): { totalEstimatedCost, places: [...] }
  if (data && Array.isArray(data.places)) {
    return {
      totalEstimatedCost:
        Number.isFinite(Number(data.totalEstimatedCost)) ? Number(data.totalEstimatedCost) : undefined,
      places: data.places.map(toMinimalPlace),
    };
  }

  // ✅ 혹시 배열만 주는 서버(안전망)
  if (Array.isArray(data)) {
    return data.map(p => (typeof p === 'string' ? toMinimalPlace({ name: p }) : toMinimalPlace(p)));
  }

  // 알 수 없는 응답 형태 → 최소한 빈 배열 반환
  return { totalEstimatedCost: undefined, places: [] };
}
