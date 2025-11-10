// 📁 api/community_filter.js
import axios from 'axios';
import api from './AxiosInstance'; // 
import { BASE_URL } from './config/api_Config'; 

// ⬅️ [변경] token 인자 제거
export async function fetchFilteredPostList({ page = 0, size = 10, city, province, title }) {
  let url = `${BASE_URL}/community/post/filter/list?page=${page}&size=${size}`;
  if (city) url += `&city=${encodeURIComponent(city)}`;
  if (province) url += `&province=${encodeURIComponent(province)}`;
  if (title) url += `&title=${encodeURIComponent(title)}`;

  console.log('[API] fetchFilteredPostList REQUEST:', { url, page, size, city, province, title });

  try {
    // ⬇️ [변경] axios.get -> api.get, headers 제거
    const res = await api.get(url); 
    
    console.log('[API] fetchFilteredPostList RESPONSE:', res.data);
    return res.data;
  } catch (err) {
    console.log('[API] fetchFilteredPostList ERROR:', err?.response?.data || err);
    throw err;
  }
}