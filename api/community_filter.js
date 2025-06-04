import axios from 'axios';

export async function fetchFilteredPostList({ page = 0, size = 10, city, province, title, token }) {
  let url = `http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080/community/post/filter/list?page=${page}&size=${size}`;
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
