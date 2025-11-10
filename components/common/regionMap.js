// 📦 components/common/regionMap.js
// 백엔드 Enum 리스트와 동기화된 버전

export const REGION_MAP = {
    서울: [
        { name: '강남구', code: 'GANGNAM_GU' },
        { name: '강동구', code: 'GANGDONG_GU' },
        { name: '강북구', code: 'GANGBUK_GU' },
        { name: '강서구', code: 'GANGSEO_GU' },
        { name: '관악구', code: 'GWANAK_GU' },
        { name: '광진구', code: 'GWANGJIN_GU' },
        { name: '구로구', code: 'GURO_GU' },
        { name: '금천구', code: 'GEUMCHEON_GU' },
        { name: '노원구', code: 'NOWON_GU' },
        { name: '도봉구', code: 'DOBONG_GU' },
        { name: '동대문구', code: 'DONGDAEMUN_GU' },
        { name: '동작구', code: 'DONGJAK_GU' },
        { name: '마포구', code: 'MAPO_GU' },
        { name: '서대문구', code: 'SEODAEMUN_GU' },
        { name: '서초구', code: 'SEOCHO_GU' },
        { name: '성동구', code: 'SEONGDONG_GU' },
        { name: '성북구', code: 'SEONGBUK_GU' },
        { name: '송파구', code: 'SONGPA_GU' },
        { name: '양천구', code: 'YANGCHEON_GU' },
        { name: '영등포구', code: 'YEONGDEUNGPO_GU' },
        { name: '용산구', code: 'YONGSAN_GU' },
        { name: '은평구', code: 'EUNPYEONG_GU' },
        { name: '종로구', code: 'JONGNO_GU' },
        { name: '중구', code: 'JUNG_GU' },
        { name: '중랑구', code: 'JUNGNANG_GU' },
      ],
    부산: [
        // { name: '부산', code: 'BUSAN_SI' }, // ❌ 백엔드 목록에 없어 제거됨
    ],
    대구: [
        // { name: '대구', code: 'DAEGU_SI' }, // ❌ 백엔드 목록에 없어 제거됨
    ],
    인천: [
        // { name: '인천', code: 'INCHEON_SI' }, // ❌ 백엔드 목록에 없어 제거됨
    ],
    광주: [
        { name: '광주', code: 'GWANGJU_SI' }, // ✅ 'GWANGJU_SI'는 허용 목록에 있음
    ],
    대전: [
        // { name: '대전', code: 'DAEJEON_SI' }, // ❌ 백엔드 목록에 없어 제거됨
    ],
    울산: [
        // { name: '울산', code: 'ULSAN_SI' }, // ❌ 백엔드 목록에 없어 제거됨
    ],
    세종: [
        // { name: '세종', code: 'SEJONG_SI' }, // ❌ 백엔드 목록에 없어 제거됨
    ],
    경기도: [
      { name: '수원시', code: 'SUWON_SI' },
      { name: '성남시', code: 'SEONGNAM_SI' },
      { name: '고양시', code: 'GOYANG_SI' },
      { name: '용인시', code: 'YONGIN_SI' },
      { name: '부천시', code: 'BUCHEON_SI' },
      { name: '안산시', code: 'ANSAN_SI' },
      { name: '안양시', code: 'ANYANG_SI' },
      { name: '남양주시', code: 'NAMYANGJU_SI' },
      { name: '화성시', code: 'HWASEONG_SI' },
      { name: '평택시', code: 'PYEONGTAEK_SI' },
      { name: '의정부시', code: 'UIJEONGBU_SI' },
      { name: '파주시', code: 'PAJU_SI' },
       { name: '김포시', code: 'GIMPO_SI' }, 
      { name: '시흥시', code: 'SIHEUNG_SI' },
      { name: '광명시', code: 'GWANGMYEONG_SI' },
       { name: '광주시', code: 'GWANGJU_SI_GYEONGGI' }, 
      { name: '군포시', code: 'GUNPO_SI' },
      { name: '오산시', code: 'OSAN_SI' },
      { name: '이천시', code: 'ICHEON_SI' },
      { name: '안성시', code: 'ANSEONG_SI' },
       { name: '의왕시', code: 'UIWANG_SI' }, 
      { name: '하남시', code: 'HANAM_SI' },
       { name: '여주시', code: 'YEOJU_SI' } 
    ],
    강원도: [
      { name: '춘천시', code: 'CHUNCHEON_SI' },
      { name: '원주시', code: 'WONJU_SI' },
      { name: '강릉시', code: 'GANGNEUNG_SI' },
      { name: '동해시', code: 'DONGHAE_SI' },
      { name: '속초시', code: 'SOKCHO_SI' },
      { name: '삼척시', code: 'SAMCHEOK_SI' },
      { name: '태백시', code: 'TAEBAEK_SI' }
    ],
    충청북도: [
      { name: '청주시', code: 'CHEONGJU_SI' },
      { name: '충주시', code: 'CHUNGJU_SI' },
      { name: '제천시', code: 'JECHEON_SI' }
    ],
    충청남도: [
      { name: '천안시', code: 'CHEONAN_SI' },
      { name: '공주시', code: 'GONGJU_SI' },
      { name: '보령시', code: 'BORYEONG_SI' }, 
      { name: '아산시', code: 'ASAN_SI' },
      { name: '서산시', code: 'SEOSAN_SI' },
      { name: '논산시', code: 'NONSAN_SI' },
      { name: '계룡시', code: 'GYERYONG_SI' }
    ],
    전라북도: [
      { name: '전주시', code: 'JEONJU_SI' },
      { name: '군산시', code: 'GUNSAN_SI' },
      { name: '익산시', code: 'IKSAN_SI' }
    ],
    전라남도: [
      { name: '목포시', code: 'MOKPO_SI' },
      { name: '여수시', code: 'YEOSU_SI' },
      { name: '순천시', code: 'SUNCHEON_SI' },
      { name: '나주시', code: 'NAJU_SI' }
    ],
    경상북도: [
      { name: '포항시', code: 'POHANG_SI' },
      { name: '경주시', code: 'GYEONGJU_SI' },
      { name: '구미시', code: 'GUMI_SI' },
      { name: '김천시', code: 'GIMCHEON_SI' }
    ],
    경상남도: [
      { name: '창원시', code: 'CHANGWON_SI' },
      { name: '진주시', code: 'JINJU_SI' },
      { name: '통영시', code: 'TONGYEONG_SI' },
      { name: '사천시', code: 'SACHEON_SI' },
      { name: '김해시', code: 'GIMHAE_SI' },
      { name: '양산시', code: 'YANGSAN_SI' }
    ],
    제주도: [
      { name: '제주시', code: 'JEJU_SI' },
      { name: '서귀포시', code: 'SEOGWIPO_SI' }
    ]
  };
  
  export const PROVINCE_MAP = {
    '서울': 'SEOUL',
    '부산': 'BUSAN',
    '대구': 'DAEGU',
    '인천': 'INCHEON',
    '광주': 'GWANGJU',
    '대전': 'DAEJEON',
    '울산': 'ULSAN',
    '세종': 'SEJONG',
    '경기도': 'GYEONGGI',
    '강원도': 'GANGWON',
    '충청북도': 'CHUNGBUK',
    '충청남도': 'CHUNGNAM',
    '전라북도': 'JEONBUK',
    '전라남도': 'JEONNAM',
    '경상북도': 'GYEONGBUK',
    '경상남도': 'GYEONGNAM',
    '제주도': 'JEJU',
  };
  

  // 백엔드에게 받은 지역 ENUM 값을 다시 한글로 전환
  // 📦 ENUM → 한글 역매핑 생성
export const ENUM_TO_PROVINCE_KOR = Object.entries(PROVINCE_MAP).reduce((acc, [kor, eng]) => {
  acc[eng] = kor;
  return acc;
}, {});

// REGION_MAP이 수정되었으므로, 이 코드는 자동으로 새 목록을 반영합니다.
export const ENUM_TO_CITY_KOR = Object.values(REGION_MAP).flat().reduce((acc, { name, code }) => {
  acc[code] = name;
  return acc;
}, {});


// regionMap.js 내부
export function getKorProvince(provinceEnum) {
  return provinceEnum === "NONE" ? "선택없음" : (ENUM_TO_PROVINCE_KOR[provinceEnum] || provinceEnum);
}

export function getKorCity(cityEnum) {
  return cityEnum === "NONE" ? "선택없음" : (ENUM_TO_CITY_KOR[cityEnum] || cityEnum);
}