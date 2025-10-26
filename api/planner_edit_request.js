// api/planner_edit_request.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config/api_Config';

/**
 * ✅ JWT 토큰 가져오기
 * 여러 키 후보를 순회하여 accessToken/jwt/token 중 하나라도 있으면 사용
 */
async function getJwtToken() {
  const keys = ['accessToken', 'jwt', 'token', 'Authorization'];
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value && typeof value === 'string' && value.trim().length > 0) {
      return value.replace(/^Bearer\s+/i, '').trim();
    }
  }
  throw new Error('NO_TOKEN');
}

/**
 * ✅ 일정 편집 요청 (/schedule/edit)
 * @param {string[]} names - 장소 이름 배열
 * @param {{ scheduleId?: number|string, dayIndex?: number }} opts
 * @returns {Promise<any>}
 */
export async function editSchedule(names, opts = {}) {
  const { scheduleId, dayIndex } = opts;

  if (!Array.isArray(names) || names.length === 0) {
    throw new Error('names 배열이 비어있습니다.');
  }

  const url = `${BASE_URL}/schedule/edit`;
  const token = await getJwtToken();

  const body = {
    names,
    ...(scheduleId ? { scheduleId } : {}),
    ...(typeof dayIndex === 'number' ? { dayIndex } : {}),
  };

  console.log('[editSchedule][REQ]', JSON.stringify({
    url,
    scheduleId,
    dayIndex,
    namesCount: names.length,
    names,
  }));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (response.status === 401 || response.status === 403 || response.status === 419) {
      const err = new Error('INVALID_TOKEN');
      err.code = 'INVALID_TOKEN';
      try { err.detail = await response.json(); } catch {}
      throw err;
    }

    if (!response.ok) {
      const detail = await response.json().catch(() => null);
      const err = new Error(detail?.error || `Request failed: ${response.status}`);
      err.status = response.status;
      err.detail = detail;
      throw err;
    }

    const data = await response.json();
    console.log(
      '[editSchedule][RES:ok]',
      Array.isArray(data)
        ? { type: 'array', length: data.length }
        : { keys: Object.keys(data || {}) }
    );
    return data;

  } catch (err) {
    console.warn('[editSchedule][ERR]', err);
    throw err;
  }
}
