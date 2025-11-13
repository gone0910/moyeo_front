// components/community/common/regionMap.js

// 1. [한글 -> ENUM] : 글 작성/수정 시 사용
export const KOR_TO_PROVINCE_ENUM = {
  '선택안함': 'NONE',
  '서울': 'SEOUL',
  '제주도': 'JEJU', // '제주도'로 통일
  '경기도': 'GYEONGGI',
  '강원도': 'GANGWON',
  '충청북도': 'CHUNGBUK',
  '충청남도': 'CHUNGNAM',
  '전라북도': 'JEONBUK',
  '전라남도': 'JEONNAM',
  '경상북도': 'GYEONGBUK',
  '경상남도': 'GYEONGNAM',
};

// 2. [ENUM -> 한글] : 상세 보기/수정 시 사용 (KOR_TO_PROVINCE_ENUM의 역변환)
export const ENUM_TO_PROVINCE_KOR = {
  'NONE': '선택안함',
  'SEOUL': '서울',
  'JEJU': '제주도', // '제주도'로 통일
  'GYEONGGI': '경기도',
  'GANGWON': '강원도',
  'CHUNGBUK': '충청북도',
  'CHUNGNAM': '충청남도',
  'JEONBUK': '전라북도',
  'JEONNAM': '전라남도',
  'GYEONGBUK': '경상북도',
  'GYEONGNAM': '경상남도',
};

// 3. [한글 -> ENUM] : 도시
export const KOR_TO_CITY_ENUM = {
        // 서울특별시
      '강남구': 'GANGNAM_GU',
      '강동구': 'GANGDONG_GU',
      '강북구': 'GANGBUK_GU',
      '강서구': 'GANGSEO_GU',
      '관악구': 'GWANAK_GU',
      '광진구': 'GWANGJIN_GU',
      '구로구': 'GURO_GU',
      '금천구': 'GEUMCHEON_GU',
      '노원구': 'NOWON_GU',
      '도봉구': 'DOBONG_GU',
      '동대문구': 'DONGDAEMUN_GU',
      '동작구': 'DONGJAK_GU',
      '마포구': 'MAPO_GU',
      '서대문구': 'SEODAEMUN_GU',
      '서초구': 'SEOCHO_GU',
      '성동구': 'SEONGDONG_GU',
      '성북구': 'SEONGBUK_GU',
      '송파구': 'SONGPA_GU',
      '양천구': 'YANGCHEON_GU',
      '영등포구': 'YEONGDEUNGPO_GU',
      '용산구': 'YONGSAN_GU',
      '은평구': 'EUNPYEONG_GU',
      '종로구': 'JONGNO_GU',
      '중구': 'JUNG_GU',
      '중랑구': 'JUNGNANG_GU',

      // 제주특별자치도
      '제주시': 'JEJU_SI',
      '서귀포시': 'SEOGWIPO_SI',

      // 경기도
      '수원시': 'SUWON_SI',
      '성남시': 'SEONGNAM_SI',
      '고양시': 'GOYANG_SI',
      '용인시': 'YONGIN_SI',
      '부천시': 'BUCHEON_SI',
      '안산시': 'ANSAN_SI',
      '안양시': 'ANYANG_SI',
      '남양주시': 'NAMYANGJU_SI',
      '화성시': 'HWASeong_SI',
      '평택시': 'PYEONGTAEK_SI',
      '의정부시': 'UIJEONGBU_SI',
      '파주시': 'PAJU_SI',
      '시흥시': 'SIHEUNG_SI',
      '김포시': 'GIMPO_SI',
      '광명시': 'GWANGMYEONG_SI',
      '군포시': 'GUNPO_SI',
      '이천시': 'ICHEON_SI',
      '오산시': 'OSAN_SI',
      '하남시': 'HANAM_SI',
      '양주시': 'YANGJU_SI',
      '구리시': 'GURI_SI',
      '안성시': 'ANSEONG_SI',
      '포천시': 'POCHEON_SI',
      '의왕시': 'UIWANG_SI',
      '여주시': 'YEOJU_SI',
      '양평군': 'YANGPYEONG_GUN',
      '동두천시': 'DONGDUCHEON_SI',
      '과천시': 'GWACHEON_SI',
      '가평군': 'GAPYEONG_GUN',
      '연천군': 'YEONCHEON_GUN',

      // 강원특별자치도
      '춘천시': 'CHUNCHEON_SI',
      '원주시': 'WONJU_SI',
      '강릉시': 'GANGNEUNG_SI',
      '동해시': 'DONGHAE_SI',
      '태백시': 'TAEBAEK_SI',
      '속초시': 'SOKCHO_SI',
      '삼척시': 'SAMCHEOK_SI',

      // 충청북도
      '청주시': 'CHEONGJU_SI',
      '충주시': 'CHUNGJU_SI',
      '제천시': 'JECEHON_SI',

      // 충청남도
      '천안시': 'CHEONAN_SI',
      '공주시': 'GONGJU_SI',
      '보령시': 'BOREONG_SI',
      '아산시': 'ASAN_SI',
      '서산시': 'SEOSAN_SI',
      '논산시': 'NONSAN_SI',
      '계릉시': 'GYERYONG_SI',  
      '당진시': 'DANGJIN_SI',
      '부여군': 'BUYEO_GUN',
      '홍성군': 'HONGSEONG_GUN',

      // 전라북도
      '전주시': 'JEONJU_SI',
      '군산시': 'GUNSAN_SI',
      '익산시': 'IKSAN_SI',
      // '정읍시': 'JEONGEUP_SI',
      '남원시': 'NAMWON_SI',
      '김제시': 'GIMJE_SI',
      '순창군': 'SUNCHANG_GUN',

      // 전라남도
      '목포시': 'MOKPO_SI',
      '여수시': 'YEOSU_SI',
      '순천시': 'SUNCHEON_SI',
      '나주시': 'NAJU_SI',
      '광양시': 'GWANGYANG_SI',
      '해남군': 'HAENAM_GUN',
      
      // 경상북도
      '포항시': 'POHANG_SI',
      '경주시': 'GYEONGJU_SI',
      '김천시': 'GIMCHEON_SI',
      '안동시': 'ANDONG_SI',
      '구미시': 'GUMI_SI',
      '영주시': 'YEONGJU_SI',
      '영천시': 'YEONGCHEON_SI',
      '상주시': 'SANGJU_SI',
      '문경시': 'MUNGYEONG_SI',
      '경산시': 'GYEONGSAN_SI',
      '울진군': 'ULJIN_GUN',
      '울릉군': 'ULLUNG_GUN',
      
      // 경상남도
      '창원시': 'CHANGWON_SI',
      '진주시': 'JINJU_SI',
      '통영시': 'TONGYEONG_SI',
      '사천시': 'SACHEON_SI',
      '김해시': 'GIMHAE_SI',
      '밀양시': 'MIRYANG_SI',
      '거제시': 'GEOJE_SI',
      '양산시': 'YANGSAN_SI',
      '남해군': 'NAMHAE_GUN',

};

// 4. [ENUM -> 한글] : 도시 (KOR_TO_CITY_ENUM의 역변환)
export const ENUM_TO_CITY_KOR = {};
for (const key in KOR_TO_CITY_ENUM) {
  ENUM_TO_CITY_KOR[KOR_TO_CITY_ENUM[key]] = key;
}

// 5. [Province UI용 리스트] : 글 작성/수정 시 ToggleSelector items
export const PROVINCE_LIST_KOR = [
  "선택안함", "서울", "제주도", "경기도", "강원도", "충청북도",
  "충청남도", "전라북도", "전라남도", "경상북도", "경상남도"
];

// 6. [City UI용 객체] : 글 작성/수정 시
export const PROVINCE_CITIES_KOR = {
  '서울': [ "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구" ],
  '제주도': ["제주시", "서귀포시"],
  '경기도': [ "수원시", "성남시", "의정부시", "안양시", "부천시", "광명시", "평택시", "동두천시", "안산시", "고양시", "과천시", "구리시", "남양주시", "오산시", "시흥시", "군포시", "의왕시", "하남시", "용인시", "파주시", "이천시", "안성시", "김포시", "화성시", "광주시", "양주시", "포천시", "여주시", "연천군", "가평군", "양평군" ],
  '강원도': ["춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시"],
  '충청북도': ["청주시", "충주시", "제천시"],
  '충청남도': ["천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시", "부여군", "홍성군"],
  '전라북도': ["전주시", "군산시", "익산시", "정읍시", "남원시", "김제시", "순창군"],
  '전라남도': ["목포시", "여수시", "순천시", "나주시", "광양시", "해남군"],
  '경상북도': ["포항시", "경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시", "울진군", "울릉군"],
  '경상남도': ["창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시", "남해군"]
};

// 7. [ENUM -> 한글] 변환 함수 (EditPostScreen에서 사용하던 것)
export const getKorProvince = (enumVal) => ENUM_TO_PROVINCE_KOR[enumVal] || '선택안함';
export const getKorCity = (enumVal) => ENUM_TO_CITY_KOR[enumVal] || '';