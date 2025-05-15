import axios from 'axios';
/**
 * 💾 일정 저장 요청 함수
 * 
 * 사용자가 GPT로 생성·편집한 일정을 최종적으로 저장합니다.
 * 서버는 DB에 저장하거나 사용자 일정 리스트에 추가하게 됩니다.
 * 
 * @param {Object} request - 저장 요청 객체
 * @param {number} request.userId - 유저 ID
 * @param {string} request.title - 일정 제목
 * @param {string} request.startDate - 여행 시작일 (예: "2024-06-01")
 * @param {string} request.endDate - 여행 종료일 (예: "2024-06-03")
 * @param {Array<Object>} request.days - 각 날짜별 장소 리스트
 * @returns {Promise<Object>} - 서버 응답
 */
async function saveSchedule(request) {
  try {
    // 서버에 POST 요청을 보냅니다
    const response = await axios.post(
      '/gpt/schedule/detail/save', // 🔗 저장 API 엔드포인트
      request,                     // ✉️ 본문 데이터 (JSON 형식)
      {
        headers: {
          'Content-Type': 'application/json' // JSON으로 데이터 전송
        }
      }
    );

    // 성공 응답이 오면 출력 및 반환
    console.log('✅ 일정 저장 성공:', response.data);
    return response.data;

  } catch (error) {
    // 에러 발생 시 콘솔 출력 후 throw
    console.error('❌ 일정 저장 실패:', error.response?.data || error.message);
    throw error;
  }
}

// ✅ 실제 사용 예시
saveSchedule({
  userId: 1, // 사용자의 고유 ID

  title: '청주 여행 2박 3일', // 일정 제목

  startDate: '2024-06-01',  // 여행 시작일
  endDate: '2024-06-03',    // 여행 종료일

  days: [
    {
      dayNumber: 1, // 첫째 날
      places: [
        {
          name: '수암골',                     // 장소 이름
          type: '관광지',                     // 장소 유형 (관광지, 음식점 등)
          address: '청주시 상당구 수암로 23',  // 상세 주소
          lat: 36.6405,                      // 위도
          lng: 127.4889,                     // 경도
          description: '고즈넉한 골목길 산책 명소', // 설명
          estimatedCost: 0,                 // 예상 비용 (₩)
          gptOriginalName: '수암골 산책',     // GPT가 생성한 원본 입력값
          fromPrevious: {                   // 이전 장소로부터의 거리/시간 정보
            walk: 8,                        // 도보 이동 시간 (분)
            publicTransport: 15,           // 대중교통 시간 (분)
            car: 5                          // 자동차 이동 시간 (분)
          },
          placeOrder: 1                    // 당일 장소 순서 (1부터 시작)
        }
      ]
    }
  ]
});
