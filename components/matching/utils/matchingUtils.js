// components/matching/utils/matchingUtils.js
// 사용자의 입력값을 백엔드 DTO 형식으로 변환해주는 함수
// 목적: React Native의 한글 입력값을 백엔드 ENUM + null 처리 기준에 맞게 변환
export const convertMatchingInputToDto = (input) => {
  // 🔹 성별 한글 → 영문 ENUM
  const genderMap = {
    '남성': 'MALE',
    '여성': 'FEMALE',
    '선택없음': 'NONE',
  };

  // 🔹 연령대 한글 → 영문 ENUM
  const ageMap = {
    '10대': 'TEENS',
    '20대': 'TWENTIES',
    '30대': 'THIRTIES',
    '40대': 'FORTIES',
    '50대': 'FIFTIES',
    '60대 이상': 'SIXTIES',
    '선택없음': 'NONE',
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

    groupType: genderMap[input.groupType] || 'NONE',

    ageRange: ageMap[input.ageRange] || 'NONE',

    travelStyles:
      !input.travelStyles || input.travelStyles.includes('선택없음')
        ? ['NONE']
        : input.travelStyles.map((s) => styleMap[s] || 'NONE'),
  };

  // 🟢 변환 후 DTO 로그 출력
  console.log('📦 [MatchingInput] 변환된 DTO:', dto);

  return dto;
};
