// api/community_fetch.js
// import * as FileSystem from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy'; // sdk54로 인해, 지원되지 않는 api를 위해 임시사용
import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경

// const BASE_URL = 'http://ec2-3-35-253-224.ap-northeast-2.compute.amazonaws.com:8080'; // 실제 서버 주소로 교체

// 1. 게시글 생성 (POST /community/post/create)
// (이미지 첨부)
// export async function createPostWithImages({ postInfo, postImages }, token) {
//   const formData = new FormData();

//   // JSON 데이터 인코딩 후 파일처럼 첨부
//   const jsonString = JSON.stringify(postInfo);
//   const base64Encoded = btoa(unescape(encodeURIComponent(jsonString)));
//   formData.append('postInfo', {
//     uri: `data:application/json;base64,${base64Encoded}`,
//     type: 'application/json',
//     name: 'postInfo.json',
//   });

//   // 이미지 파일 첨부 (여러장 가능)
//   if (Array.isArray(postImages)) {
//     postImages.forEach((img, idx) => {
//       formData.append('postImages', {
//         uri: img.uri,
//         type: img.type ?? 'image/jpeg',
//         name: img.name ?? `photo${idx}.jpg`,
//       });
//     });
//   }

//   // 디버깅: FormData 구조 확인
//   for (let [key, value] of formData.entries()) {
//     console.log(`${key}:`, value);
//   }

//   const response = await fetch(`${BASE_URL}/community/post/create`, {
//     method: 'POST',
//     headers: {
//       'Authorization': `Bearer ${token}`,
//       // 'Content-Type'을 절대 명시하지 않는다!
//     },
//     body: formData,
//   });

//   if (!response.ok) {
//     const errText = await response.text();
//     throw new Error(`게시글 생성 실패: ${response.status} - ${errText}`);
//   }
//   return response.json();
// }

// 2. 게시글 수정 (PUT /community/post/edit/{postId})
// 추가 수정 필요. 만약 기존에 받아온 사진을 편집하지 않고 보내면 사진 파일이 아닌 url로 보내져 기존 사진을 안보내질 수 있음.
// export async function editPostWithImages(postId, { postInfo, postImages }, token) {
//   const formData = new FormData();

//   // Base64 인코딩 후 파일처럼 첨부 (생성과 동일)
//   const jsonString = JSON.stringify(postInfo);
//   const base64Encoded = btoa(unescape(encodeURIComponent(jsonString)));
//   formData.append('postInfo', {
//     uri: `data:application/json;base64,${base64Encoded}`,
//     type: 'application/json',
//     name: 'postInfo.json',
//   });

//   if (Array.isArray(postImages)) {
//     postImages.forEach((img, idx) => {
//       formData.append('postImages', {
//         uri: img.uri,
//         type: img.type ?? 'image/jpeg',
//         name: img.name ?? `photo${idx}.jpg`,
//       });
//     });
//   }

//   const response = await fetch(`${BASE_URL}/community/post/edit/${postId}`, {
//     method: 'PUT',
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//     body: formData,
//   });

//   if (!response.ok) {
//     const errText = await response.text();
//     throw new Error(`게시글 수정 실패: ${response.status} - ${errText}`);
//   }
//   return response.json();
// }

// 게시글 수정.
// 이미지 URL → base64 파일 객체 변환
// 기존 이미지 URL → base64 파일 객체 변환
async function urlToBase64File(url, idx = 0) {
  const filename = `origin_${idx}.jpg`;
  const filePath = FileSystem.cacheDirectory + filename;
  await FileSystem.downloadAsync(url, filePath);

  const base64 = await FileSystem.readAsStringAsync(filePath, { encoding: FileSystem.EncodingType.Base64 });
  return {
    uri: `data:image/jpeg;base64,${base64}`,
    name: filename,
    type: 'image/jpeg',
  };
}

// 새로 추가된 파일 → base64 파일 객체 변환
async function localImageToBase64File(image, idx = 0) {
  if (!image?.uri) return null;
  const base64 = await FileSystem.readAsStringAsync(image.uri, { encoding: FileSystem.EncodingType.Base64 });
  return {
    uri: `data:image/jpeg;base64,${base64}`,
    name: image.name || `photo${idx}.jpg`,
    type: image.type || 'image/jpeg',
  };
}

// 게시글 수정 함수
export async function editPostWithImages(postId, { postInfo, newImages, oldImageUrls }, token) {
  const formData = new FormData();

  // 1. postInfo JSON → base64 인코딩 후 FormData에 첨부
  const jsonString = JSON.stringify(postInfo);
  const jsonBase64 = btoa(unescape(encodeURIComponent(jsonString)));
  formData.append('postInfo', {
    uri: `data:application/json;base64,${jsonBase64}`,
    type: 'application/json',
    name: 'postInfo.json',
  });

  // 2. 기존 이미지 URL → base64 파일 변환 후 FormData에 첨부
  if (Array.isArray(oldImageUrls)) {
    for (let i = 0; i < oldImageUrls.length; i++) {
      const file = await urlToBase64File(oldImageUrls[i], i);
      if (!file) continue;
      formData.append('postImages', file);
    }
  }

  // 3. 새 이미지 파일 → base64 파일 변환 후 FormData에 첨부
  if (Array.isArray(newImages)) {
    for (let i = 0; i < newImages.length; i++) {
      const file = await localImageToBase64File(newImages[i], i);
      if (!file) continue;
      formData.append('postImages', file);
    }
  }

  // ★ 빈 이미지일 때는 'postImages' 필드 자체를 아예 안 넣음 (방어코드 없음)

  // 4. FormData 로그 출력 (디버깅용)
  for (let pair of formData.entries()) {
    if (typeof pair[1] === 'object') {
      console.log(`[FormData] ${pair[0]}:`, {
        uri: pair[1].uri,
        name: pair[1].name,
        type: pair[1].type,
      });
    } else {
      console.log(`[FormData] ${pair[0]}:`, pair[1]);
    }
  }

  // 5. API 요청 보내기
  const response = await fetch(`${BASE_URL}/community/post/edit/${postId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`게시글 수정 실패: ${response.status} - ${errText}`);
  }

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.indexOf('application/json') !== -1) {
    return response.json();
  } else {
    return; // 성공 처리
  }
}