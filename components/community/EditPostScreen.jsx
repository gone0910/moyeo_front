// components/commnuity/EditPostScreen.jsx 수정화면면
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Image, FlatList,
  Dimensions, Platform, ScrollView, PixelRatio, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { KeyboardAvoidingView } from 'react-native';
import ToggleSelector from '../common/ToggleSelector';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { editPostWithImages } from '../../api/community_fetch';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy'; // sdk54 업데이트로 인해, 이미지 api와 버전을 맞춰야함.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from "react-native-safe-area-context";
import { getKorProvince, getKorCity } from '../common/regionMap';


// 리사이징 후 사진 크기의 제한 30mb
const MAX_IMAGE_SIZE = 30 * 1024 * 1024; // 30MB

const { width, height } = Dimensions.get('window');
const MAX_IMAGES = 3;


export default function EditPostScreen({ route, navigation }) {
  const { postId, post } = route.params || {};
  const [selectedRegion, setSelectedRegion] = useState('선택안함');
  const [selectedCity, setSelectedCity] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const inputRef = useRef(null);
  const [token, setToken] = useState(null);


  // 토큰 추출해서 저장
  useEffect(() => {
  const loadToken = async () => {
    try {
      const value = await AsyncStorage.getItem('jwt');
      if (value) setToken(value);
    } catch (e) {
      Alert.alert('토큰 로드 실패');
    }
  };
  loadToken();
}, []);


  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setContent(post.content || '');
      
      // ⬇️ [수정] import한 함수를 사용합니다.
      const regionKor = getKorProvince(post.province); // "SEOUL" -> "서울"
      setSelectedRegion(regionKor);
      
      if (regionKor !== '선택안함') {
        setSelectedCity(getKorCity(post.city)); // "GANGNAM_GU" -> "강남구"
      } else {
        setSelectedCity('선택안함');
      }
      setImages(post.postImages || []);
    }
  }, [post]);

  // 도/시 ENUM 변환 
    const Province = {
      '선택안함': 'NONE',
      '서울': 'SEOUL',
      '제주': 'JEJU',
      '경기도': 'GYEONGGI',
      '강원도': 'GANGWON',
      '충청북도': 'CHUNGBUK',
      '충청남도': 'CHUNGNAM',
      '전라북도': 'JEONBUK',
      '전라남도': 'JEONNAM',
      '경상북도': 'GYEONGBUK',
      '경상남도': 'GYEONGNAM',
    };
    const City = {
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
      '정읍시': 'JEONGEUP_SI',
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

  useEffect(() => {
    // 글쓰기 진입 시 탭바 숨기기
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });
    return () => {
      // 글쓰기 화면 벗어나면 탭바 다시 복원
      navigation.getParent()?.setOptions({
        tabBarStyle: undefined
      });
    };
  }, [navigation]);

   const handleEdit = async () => {
    try {
      console.log('게시글 수정 요청 시작');

      if (!token) {
        Alert.alert('인증 정보가 없습니다. 다시 로그인 해주세요.');
        return;
      }
      if (!title.trim()) {
        Alert.alert('제목을 입력해 주세요.');
        return;
      }
      if (!content.trim()) {
        Alert.alert('내용을 입력해 주세요.');
        return;
      }

    // 기존 서버 URL만 oldImageUrls
    // 반드시 null, undefined, ''까지 필터링!
    const oldImageUrls = images.filter(img => typeof img === 'string' && img.startsWith('http'));
    const newImages = images.filter(img => typeof img === 'string' && img.startsWith('file://')).map(uri => ({ uri }));


      const provinceVal = Province[selectedRegion] || 'NONE'; // 도
      const cityVal = City[selectedCity] || 'NONE';

      const result = await editPostWithImages(
        
      postId,
      {
        postInfo: {
          title,
          content,
          city: City[selectedCity] || 'NONE',
          province: Province[selectedRegion] || 'NONE'
        },
        newImages,
        oldImageUrls,
      },
      token
    );
    console.log('게시글 수정 요청 완료, 서버 응답:', result);

    navigation.reset({
        index: 0, // 스택의 최상위는 BottomTab (하나만 있음)
        routes: [
          {
            name: 'BottomTab', // 1. 최상위 스택은 BottomTab
            state: {
              index: 3, // 2. BottomTab의 4번째 탭(Community)을 활성화
                        // (0:Home, 1:MyTrips, 2:Chat, 3:Community)
              routes: [
                // 3. 모든 탭 스크린을 정의
                { name: 'Home' },
                { name: 'MyTrips' },
                { name: 'Chat' },
                {
                  name: 'Community', // 4. Community 탭의 상태를 지정
                  state: {
                    index: 1, // 5. Community 스택을 [CommunityMain, PostDetail]로 재설정
                    routes: [
                      { name: 'CommunityMain' },
                      { name: 'PostDetail', params: { postId } } // 6. PostDetail을 활성화
                    ],
                  },
                },
              ],
            },
          },
        ],
      });

  } catch (err) {
    // ✅ 반드시 에러 핸들링 (알림, 콘솔, 등)
    console.error('게시글 수정 실패:', err);
    Alert.alert('수정 실패', err.message || '게시글 수정 중 문제가 발생했습니다.');
  }
};

   const pickImage = async () => {
  if (images.length >= MAX_IMAGES) {
    Alert.alert(`이미지는 최대 ${MAX_IMAGES}장까지 업로드할 수 있습니다.`);
    return;
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('권한 필요', '이미지 접근 권한이 필요합니다.');
    return;
  }

  let result = await ImagePicker.launchImageLibraryAsync({
    quality: 1, // 원본 품질
  });

  if (!result.canceled) {
    const assets = Array.isArray(result.assets) ? result.assets : [result];
    let processedImages = [...images];

    for (let asset of assets) {
      let imageUri = asset.uri;
      let quality = 0.8;
      let resized = null;
      let info = await FileSystem.getInfoAsync(imageUri);

      // 반복적으로 리사이즈/압축
      while (info.size > MAX_IMAGE_SIZE) {
        if (quality > 0.4) quality -= 0.1;
        resized = await ImageManipulator.manipulateAsync(
          imageUri,
          [{ resize: { width: 1200 } }], // 필요시 더 낮게!
          { compress: quality, format: ImageManipulator.SaveFormat.JPEG }
        );
        imageUri = resized.uri;
        info = await FileSystem.getInfoAsync(imageUri);
        if (quality <= 0.4) break;
      }

      // 최종 용량 체크
      console.log(
        `[첨부이미지] 리사이즈 후 용량: ${info.size} bytes ≈ ${(info.size / 1024 / 1024).toFixed(2)} MB`
      );

      if (info.size > MAX_IMAGE_SIZE) {
        Alert.alert('이미지 용량 초과', '30MB 이하 이미지만 업로드 가능합니다.');
        continue; // 해당 이미지는 추가 안 함
      }
      processedImages.push(imageUri);

      // 최대 장수 제한
      if (processedImages.length >= MAX_IMAGES) break;
    }
    setImages(processedImages.slice(0, MAX_IMAGES));
    console.log('최종 이미지 배열:', processedImages.slice(0, MAX_IMAGES));
  }
};

  const removeImage = (idx) => {
  setImages(images.filter((_, i) => i !== idx));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.screen}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* 상단 헤더 */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="#4F46E5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>글 수정</Text>
          <TouchableOpacity onPress={handleEdit}>
            <Text style={styles.registerText}>수정완료</Text>
          </TouchableOpacity>
        </View>
        {/* <View style={styles.headerLine}/> */}
        {/* 목적지 필터 */}
        <View style={styles.filterSection}>
  <Text style={styles.filterLabel}>목적지 필터</Text>
  <View style={{ paddingHorizontal: 0, paddingBottom: 0 }}>
    <ToggleSelector
      items={[
         "서울", "제주", "경기도", "강원도", "충청북도",
        "충청남도", "전라북도", "전라남도", "경상북도", "경상남도"
      ]}
      selectedItem={selectedRegion}
      onSelect={item => {
        setSelectedRegion(item);
        setSelectedCity('');
      }}
      size="large"
      disableOnNone={false} // 선택안함 분기처리
    />

    {/* 도시 선택자들 */}
    {selectedRegion === '서울' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={[
            "선택안함","강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구",
            "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구",
            "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구",
            "은평구", "종로구", "중구", "중랑구"
          ]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
          disableOnNone={false} // 선택안함 분기처리
        />
      </View>
    )}
    {selectedRegion === '제주' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={["선택안함","제주시", "서귀포시"]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
          disableOnNone={false} // 선택안함 분기처리
        />
      </View>
    )}
    {selectedRegion === '경기도' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={[
            "선택안함","수원시", "성남시", "의정부시", "안양시", "부천시", "광명시", "평택시", "동두천시", "안산시",
            "고양시", "과천시", "구리시", "남양주시", "오산시", "시흥시", "군포시", "의왕시", "하남시",
            "용인시", "파주시", "이천시", "안성시", "김포시", "화성시", "광주시", "양주시", "포천시",
            "여주시", "연천군", "가평군", "양평군"
          ]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
          disableOnNone={false} // 선택안함 분기처리
        />
      </View>
    )}
    {selectedRegion === '강원도' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={["선택안함","춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시"]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
          disableOnNone={false} // 선택안함 분기처리
        />
      </View>
    )}
    {selectedRegion === '충청북도' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={["선택안함","청주시", "충주시", "제천시"]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
          disableOnNone={false} // 선택안함 분기처리
        />
      </View>
    )}
    {selectedRegion === '충청남도' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={["선택안함","천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시", "부여군", "홍성군"]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
          disableOnNone={false} // 선택안함 분기처리
        />
      </View>
    )}
    {selectedRegion === '전라북도' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={["선택안함","전주시", "군산시", "익산시", "정읍시", "남원시", "김제시", "순창군"]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
          disableOnNone={false} // 선택안함 분기처리
        />
      </View>
    )}
    {selectedRegion === '전라남도' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={["선택안함","목포시", "여수시", "순천시", "나주시", "광양시", "해남군"]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
          disableOnNone={false} // 선택안함 분기처리
        />
      </View>
    )}
    {selectedRegion === '경상북도' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={["선택안함","포항시", "경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시", "울진군", "울릉군"]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
          disableOnNone={false} // 선택안함 분기처리
        />
      </View>
    )}
    {selectedRegion === '경상남도' && (
      <View style={{ marginTop: 4 }}>
        <ToggleSelector
          items={["선택안함","창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시", "남해군"]}
          selectedItem={selectedCity}
          onSelect={setSelectedCity}
          size="small"
          disableOnNone={false} // 선택안함 분기처리
        />
      </View>
    )}
     <View style={styles.divider} />
  </View>
</View>
        {/* 입력 폼 */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.titleInput}
            placeholder="제목을 입력해 주세요"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#B3B3B3"
            maxLength={2000}
          />
          <TouchableOpacity
  activeOpacity={1}
  style={styles.contentBox}
  onPress={() => inputRef.current && inputRef.current.focus()}
>
  <TextInput
    ref={inputRef}
    style={styles.contentInput}
    value={content}
    onChangeText={setContent}
    placeholder="다양한 여행 이야기를 적어주세요"
    placeholderTextColor="#b3b3b3"
    multiline
  />
  {content.trim().length === 0 && (
    <View style={styles.guideBox} pointerEvents="none">
      <Text style={styles.guideText}>{'\u2022'} 여행 동행자 모집{'\n'}</Text>
      <Text style={styles.guideText}>{'\u2022'} 즐거웠던 여행 기억{'\n'}</Text>
      <Text style={styles.guideText}>{'\u2022'} 다른 여행자들에게 알려주고싶은 장소{'\n'}</Text>
    </View>
  )}
</TouchableOpacity>
          <View style={[styles.plusButtonContainer, { flexDirection: 'row', alignItems: 'center' }]}>
          <TouchableOpacity style={styles.plusButton} onPress={pickImage}>
            <Ionicons name="add" size={50} color="#b3b3b3" />
          </TouchableOpacity>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailScroll}contentContainerStyle={{ overflow: 'visible', paddingLeft: 8 }}>
              {images.map((uri, idx) => (
                <View key={idx} style={styles.previewWrapper}>
                  <Image source={{ uri }} style={styles.previewImg} />
                  {/* X 버튼(삭제) */}
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => removeImage(idx)}>
                    <Ionicons name="close-circle" size={22} color="#ff5c5c" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
        </View>
        </View>
        {/* 하단 +버튼 */}
      </KeyboardAvoidingView>
    </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#Fafafa',
  },
  screen: {
    flex: 1,
    backgroundColor: '#Fafafa',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    paddingHorizontal: width * 0.03,
    backgroundColor: '#fafafa',
    borderBottomColor: '#ededed',
    // 디바이스 비율에 따라 위쪽에 여백 추가
    marginTop: Platform.OS === 'ios' ? 0 : 0,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: width * 0.045,
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  registerText: {
    color: '#4F46E5',
    fontWeight: '400',
    fontSize: width * 0.04,
    paddingRight: 4,
  },
  filterSection: {
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.02,
    paddingBottom: height * 0.015,
  },
  filterLabel: {
    color: '#606060',
    fontSize: width * 0.035,
    marginBottom: 5,
    marginLeft: 2,
  },
  inputContainer: {
    flex: 1,
    paddingHorizontal: width * 0.04,
    marginTop: -15,
  },
  titleInput: {
    backgroundColor: '#fff',
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: width * 0.04,
    color: '#333',
    marginBottom: 10,
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: '#F2F2F4',
  },
  contentBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    minHeight: height * 0.4,
    padding: 14,
    justifyContent: 'flex-start',
    borderWidth: 0.5,
    borderColor: '#F2F2F4',
  },
  contentInput: {
    minHeight: height * 0.13,
    fontSize: width * 0.040,
    color: '#333',
    textAlignVertical: 'top',
    padding: 0,
    marginBottom: 10,
  },
  guideBox: {
    marginTop: -65,
  },
  guideText: {
    color: '#b3b3b3',
    fontSize: width * 0.04,
    lineHeight: 20,
  },
  plusButtonContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: width * 0.008,
    marginTop: 10,
    marginBottom: 120,
  },
  plusButton: {
    width: 60,
    height: 60,
    backgroundColor: '#F2F3F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLine: {
    height: 0,
    width: '92%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    backgroundColor: '#FAFAFA',
    marginTop: -5,
  },
  divider: {
    height: 8,
    width: '110%',
    backgroundColor: '#EBEBEB',
    marginLeft:-15,
    marginVertical: 12,
    marginHorizontal: 0, // <-- 좌우 여백
  },
  previewWrapper: {
    marginLeft: 10,
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'visible',
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  previewImg: {
    width: 56,
    height: 56,
    borderRadius: 10,
    resizeMode: 'cover',
  },
  deleteBtn: {
  position: 'absolute',
  top: -3,
  right: -3,
  backgroundColor: '#fff',
  borderRadius: 15,
  elevation: 3, // Android 그림자
  shadowColor: '#000', // iOS 그림자
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.15,
  shadowRadius: 1.5,
  zIndex: 2,
},
});