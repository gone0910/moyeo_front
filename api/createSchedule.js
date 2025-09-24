import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { BASE_URL } from './config/api_Config'; // apiConfig.js에서 baseUrl 주소 변경

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const createSchedule = async (
  startDate,
  endDate,
  destination,
  mbti,
  travelStyle,
  peopleGroup,
  budget
) => {
  try {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      console.warn('❌ 토큰 없음');
      return;
    }

    const requestData = {
      startDate,
      endDate,
      destination: destination[0],
      mbti,
      travelStyle,
      peopleGroup,
      budget,
    };

    console.log('📤 전송할 데이터:\n', JSON.stringify(requestData, null, 2));

    const response = {
      status: 200,
      data: {
        title: "서귀포시 1박 2일 여행",
        startDate: "2025-05-15",
        endDate: "2025-05-16",
        days: [
          {
            day: "1일차",
            date: "2025-05-15",
            totalEstimatedCost: 94000,
            places: [
              {
                name: "둘레길 중문본점",
                gptOriginalName: "서귀포 브런치 카페",
                type: "식사",
                estimatedCost: 15000,
                address: "제주특별자치도 서귀포시 천제연로 209-1",
                lat: 33.2517217984595,
                lng: 126.427123131015,
                description: "제주의 싱그러운 자연을 가로지르는 휘어진 길목",
                fromPrevious: { walk: 15, publicTransport: 10, car: 5 }
              },
              {
                name: "천지연폭포",
                gptOriginalName: "천지연 폭포 산책",
                type: "관광지",
                estimatedCost: 2000,
                address: "천지연폭포",
                lat: 33.24721231608811,
                lng: 126.55452234287986,
                description: "신비로운 물줄기가 만들어내는 자연의 경이로움",
                fromPrevious: { walk: 15, publicTransport: 10, car: 5 }
              },
              {
                name: "원조살아있는삼성혈해물탕 본점",
                gptOriginalName: "제주 해물탕",
                type: "식사",
                estimatedCost: 20000,
                address: "제주특별자치도 제주시 선덕로5길 20",
                lat: 33.487977169597634,
                lng: 126.49969792667322,
                description: "바다의 신선함을 한 그릇에 담아내는 진미",
                fromPrevious: { walk: 20, publicTransport: 15, car: 10 }
              },
              {
                name: "정방폭포",
                gptOriginalName: "정방 폭포 투어",
                type: "관광지",
                estimatedCost: 2000,
                address: "정방폭포",
                lat: 33.24490888344185,
                lng: 126.57152630834372,
                description: "절벽을 타고 쏟아지는 물의 장엄한 연주",
                fromPrevious: { walk: 25, publicTransport: 20, car: 15 }
              },
              {
                name: "쌍둥이횟집",
                gptOriginalName: "서귀포 횟집",
                type: "식사",
                estimatedCost: 25000,
                address: "제주특별자치도 서귀포시 중정로62번길 14",
                lat: 33.2465677180323,
                lng: 126.562927484565,
                description: "신선함과 주인장의 정이 깃든 바다의 맛",
                fromPrevious: { walk: 30, publicTransport: 20, car: 15 }
              },
              {
                name: "섭지코지",
                gptOriginalName: "섭지코지 야경",
                type: "관광지",
                estimatedCost: 0,
                address: "섭지코지",
                lat: 33.4239380655993,
                lng: 126.930609241011,
                description: "푸른 바다와 초원이 어우러진 낭만의 끝자락",
                fromPrevious: { walk: 40, publicTransport: 30, car: 25 }
              },
              {
                name: "플레이스캠프제주",
                gptOriginalName: "섭지코지 호텔",
                type: "숙소",
                estimatedCost: 30000,
                address: "제주특별자치도 서귀포시 성산읍 동류암로 20",
                lat: 33.44982752239807,
                lng: 126.91817254328247,
                description: "자유로운 영혼을 위한 창의적 쉼터",
                fromPrevious: { walk: 60, publicTransport: 40, car: 30 }
              }
            ]
          },
          {
            day: "2일차",
            date: "2025-05-16",
            totalEstimatedCost: 181000,
            places: [
              {
                name: "중문색달해수욕장",
                gptOriginalName: "중문 해변 산책",
                type: "액티비티",
                estimatedCost: 0,
                address: "중문색달해수욕장",
                lat: 33.2450381505136,
                lng: 126.411498674889,
                description: "눈부신 햇살이 비치는 시원한 파도의 노래",
                fromPrevious: { walk: 15, publicTransport: 12, car: 10 }
              },
              {
                name: "산방산",
                gptOriginalName: "산방산 드라이브",
                type: "관광지",
                estimatedCost: 1000,
                address: "산방산",
                lat: 34.86155288490255,
                lng: 128.53922269751203,
                description: "자연의 웅장함 속에서 마음의 고요를 찾는 시간",
                fromPrevious: { walk: 50, publicTransport: 35, car: 30 }
              },
              {
                name: "싱싱올레해산물",
                gptOriginalName: "서귀포 해산물 레스토랑",
                type: "식사",
                estimatedCost: 30000,
                address: "제주특별자치도 서귀포시 중앙로48번길 14",
                lat: 33.249069562786076,
                lng: 126.56313286379131,
                description: "갓 잡아 올린 신선함이 가득한 해산물 향연",
                fromPrevious: { walk: 20, publicTransport: 15, car: 10 }
              },
              {
                name: "중문리조트",
                gptOriginalName: "중문 리조트",
                type: "숙소",
                estimatedCost: 150000,
                address: "제주특별자치도 서귀포시 색달로 117",
                lat: 33.26255902339657,
                lng: 126.41563438473791,
                description: "여유로운 휴식을 선사하는 자연 속의 오아시스",
                fromPrevious: { walk: 40, publicTransport: 25, car: 20 }
              }
            ]
          }
        ]
      }
    };

    // 🔁 모든 장소에 UUID 부여
    response.data.days = response.data.days.map((day) => ({
      ...day,
      places: day.places.map((place) => ({
        ...place,
        id: uuid.v4(),
      })),
    }));

    if (response.status === 200) {
      console.log('✅ 일정 생성 성공:', JSON.stringify(response.data, null, 2));
      return response.data;
    } else {
      console.warn('⚠️ 서버 응답 실패:', response.status);
    }
  } catch (error) {
    console.error('❌ 예외 발생:', error.message);
  }
};