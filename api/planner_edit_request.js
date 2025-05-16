import axios from 'axios';

/**
 * 📝 일정 편집 요청 함수 (추가 / 수정 / 삭제 / 순서변경)
 * 
 * GPT에게 기존 일정(scheduleId)을 기준으로 편집 요청을 보냅니다.
 *
 * @param {Object} request - 편집 요청 객체
 * @param {number} request.scheduleId - 편집 대상 일정의 고유 ID
 * @param {Array<Object>} request.edits - 편집 동작 목록 (add, update, delete, reorder)
 *
 * @returns {Promise<Object>} - 서버 응답 데이터
 */
async function editSchedule({ scheduleId, edits }) {
  // 요청 본문을 구성합니다.
  // scheduleId는 필수이며, edits 배열에 여러 편집 작업을 정의합니다.
  const requestBody = {
    scheduleId, // 어떤 일정을 수정할 것인지 ID로 지정
    edits       // 편집 작업들이 담긴 배열
  };

  try {
    // Axios를 이용해 POST 요청을 보냅니다.
    const response = await axios.post(
      '/gpt/schedule/detail/edit',  // 📌 편집 API 엔드포인트
      requestBody,                  // ✉️ 전송할 데이터
      {
        headers: {
          'Content-Type': 'application/json' // JSON 형식으로 요청함을 명시
        }
      }
    );

    // 성공적으로 응답이 오면 그 결과를 출력하고 반환
    console.log('✏️ 편집 완료:', response.data);
    return response.data;

  } catch (error) {
    // 오류가 발생하면 콘솔에 에러 출력하고 에러를 다시 던져 상위에서 처리 가능하도록 함
    console.error('❌ 일정 편집 실패:', error.response?.data || error.message);
    throw error;
  }
}

// ✅ 실제 사용 예시
editSchedule({
  scheduleId: 123,  // 예: 기존 일정 ID

  edits: [
    {
      action: "add",         // 동작 유형: "추가"
      day: 1,                // 첫째 날에
      index: 2,              // 2번째 위치에 추가
      rawInput: "청남대"     // 자연어로 전달할 장소명
    },
    {
      action: "update",      // 동작 유형: "수정"
      day: 1,                // 첫째 날의
      index: 3,              // 3번째 장소를
      rawInput: "수암골"     // "수암골"로 수정
    },
    {
      action: "delete",      // 동작 유형: "삭제"
      day: 1,                // 첫째 날
      index: 4               // 4번째 장소 삭제
    },
    {
      action: "reorder",     // 동작 유형: "순서 변경"
      day: 1,                // 첫째 날에서
      from: 5,               // 기존 5번째 장소를
      to: 2                  // 2번째로 이동
    }
  ]
});
