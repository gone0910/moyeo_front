import axios from 'axios';
import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경
import api from './AxiosInstance';

export async function fetchCommunityPosts({ page = 0, size = 10, province, city, title }) {
  let url = `${BASE_URL}/community/post/list?page=${page}&size=${size}`;
  // 필터 값 있으면 filter API 사용
  if (province || city || title) {
    url = `${BASE_URL}/community/post/filter/list?page=${page}&size=${size}` +
      `&province=${province || ''}&city=${city || ''}&title=${title || ''}`;
  }
  console.log('[API] fetchCommunityPosts REQUEST:', url);

  try {
    // 3. axios.get -> api.get
    // 4. headers: { ... } 제거
    const res = await api.get(url); 
    
    console.log('[API] fetchCommunityPosts RESPONSE:', res.data);
    return res.data;
  } catch (err) {
    // 401 재발급 실패 시 이쪽으로 옴
    console.log('[API] fetchCommunityPosts ERROR:', err?.response?.data || err);
    throw err;
  }
}
