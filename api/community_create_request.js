import AsyncStorage from '@react-native-async-storage/async-storage';

export async function createCommunityPost({ title, content, city, province, imageUris }) {
  const url = 'http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080/community/post/create';
  const jwtToken = await AsyncStorage.getItem('jwt');
  if (!jwtToken) throw new Error('로그인이 필요합니다. (토큰 없음)');

  const formData = new FormData();

  // base64로 인코딩된 JSON 데이터 생성
  const postData = {
    title,
    content,
    city,
    province,
  };

  const jsonString = JSON.stringify(postData);
  const base64Encoded = btoa(unescape(encodeURIComponent(jsonString)));

  formData.append('postInfo', {
    uri: `data:application/json;base64,${base64Encoded}`, // JSON을 base64로 인코딩하여 URI 형태로
    type: 'application/json',
    name: 'postInfo.json',
  });

  // 이미지 파일 첨부
  if (imageUris?.length) {
    imageUris.forEach((uri) => {
      const fileName = uri.split('/').pop();
      let ext = fileName.split('.').pop().toLowerCase();
      let mimeType = 'image/jpeg';
      if (ext === 'png') mimeType = 'image/png';
      if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';

      formData.append('postImages', {
        uri,
        name: fileName,
        type: mimeType,
      });
    });
  }

  // 디버그용 로그
  console.log(formData._parts);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        // 'Content-Type' 생략 필수!
      },
      body: formData,
    });

    const resText = await response.text();
    console.log('response.status:', response.status);
    console.log('response.body:', resText);

    if (!response.ok) throw new Error(resText);

    try {
      return JSON.parse(resText);
    } catch {
      return resText;
    }
  } catch (err) {
    console.error('게시글 생성 오류:', err.message, err);
    throw err;
  }
}