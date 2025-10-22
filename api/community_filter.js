import axios from 'axios';
import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경

export async function fetchFilteredPostList({ page = 0, size = 10, city, province, title, token }) {
  let url = `${BASE_URL}/community/post/filter/list?page=${page}&size=${size}`;
  if (city) url += `&city=${encodeURIComponent(city)}`;
  if (province) url += `&province=${encodeURIComponent(province)}`;
  if (title) url += `&title=${encodeURIComponent(title)}`;

  console.log('[API] fetchFilteredPostList REQUEST:', { url, page, size, city, province, title });

  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('[API] fetchFilteredPostList RESPONSE:', res.data);
    return res.data;
  } catch (err) {
    console.log('[API] fetchFilteredPostList ERROR:', err?.response?.data || err);
    throw err;
  }
}