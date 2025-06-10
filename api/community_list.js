import axios from 'axios';

export async function fetchCommunityPosts({ page = 0, size = 10, token, province, city, title }) {
  let url = `http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080/community/post/list?page=${page}&size=${size}`;
  // 필터 값 있으면 filter API 사용
  if (province || city || title) {
    url = `http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080/community/post/filter/list?page=${page}&size=${size}` +
      `&province=${province || ''}&city=${city || ''}&title=${title || ''}`;
  }
  console.log('[API] fetchCommunityPosts REQUEST:', url);

  try {
    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    // console.log('[API] fetchCommunityPosts RESPONSE:', res.data);
    return res.data;
  } catch (err) {
    console.log('[API] fetchCommunityPosts ERROR:', err?.response?.data || err);
    throw err;
  }
}