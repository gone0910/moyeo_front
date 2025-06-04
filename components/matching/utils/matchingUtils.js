// components/matching/utils/matchingUtils.js
// 사용자의 입력값을 백엔드 DTO 형식으로 변환해주는 함수
// 목적: React Native의 한글 입력값을 백엔드 ENUM + null 처리 기준에 맞게 변환
export const convertMatchingInputToDto = (input) => {
  // 🔹 한글 → ENUM 변환용 맵
  const groupTypeMap = {
    '단둘이': 'ALONE',
    '같이': 'TOGETHER',
    '무관': 'FLEXIBLE',
    '선택없음': null,
  };

  // 🔹 성별 한글 → 영문 ENUM
  const genderMap = {
    '남성': 'MALE',
    '여성': 'FEMALE',
    '선택없음': 'NONE',
  };

  // 🔹 연령대 한글 → 영문 ENUM
  const ageMap = {
    '10대': 10,
    '20대': 20,
    '30대': 30,
    '40대': 40,
    '50대': 50,
    '60대 이상': 60,
  };

  // 🔹 여행 스타일 한글 → 영문 ENUM
  const styleMap = {
    '힐링': 'HEALING',
    '맛집': 'FOOD',
    '문화/관광': 'CULTURE',
    '액티비티': 'ACTIVITY',
    '자연': 'NATURE',
    '도심': 'CITY',
    '선택없음': 'NONE',
  };



  // 🟡 변환 전 입력 로그 출력
  console.log('📝 [MatchingInput] 원본 입력값:', input);

  const dto = {
    startDate: input.startDate,  //  YYYY-MM-DD
    endDate: input.endDate,      //  YYYY-MM-DD

    province: input.province === '선택없음' ? 'NONE' : input.province,

    // 도시 선택이 없거나 '선택없음'이면 NONE 처리
    cities:
      !input.selectedCities || input.selectedCities.length === 0
        ? ['NONE']
        : input.selectedCities,

    groupType: groupTypeMap[input.groupType] ?? null,
    ageRange: ageMap[input.ageRange] ?? null,  // 나이는 int 외엔 null

    travelStyles:
      !input.travelStyles || input.travelStyles.includes('NONE') // ✅ NONE 감지
      ? ['NONE']
      : input.travelStyles.map((s) => styleMap[s] || 'NONE'),
  };

  // 🟢 변환 후 DTO 로그 출력
  console.log('📦 [MatchingInput] 변환된 DTO:', dto);

  return dto;
};

    // 🔄 ENUM → 한글 역변환 (모달 등에서 사용)
  export const GENDER_ENUM_TO_KOR = {
    MALE: '남성',
    FEMALE: '여성',
    NONE: '선택없음',
  };

  export const STYLE_ENUM_TO_KOR = {
    HEALING: '힐링',
    FOOD: '맛집',
    CULTURE: '문화/관광',
    ACTIVITY: '액티비티',
    NATURE: '자연',
    CITY: '도심',
    NONE: '선택없음',
  };