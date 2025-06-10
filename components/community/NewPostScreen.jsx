import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Image, ScrollView,
  Dimensions, Platform, PixelRatio, Keyboard, TouchableWithoutFeedback, Animated
} from 'react-native';
import { Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ToggleSelector from '../common/ToggleSelector';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { createCommunityPost } from '../../api/community_create_request';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

const { width, height } = Dimensions.get('window');
const MAX_IMAGES = 3;

export default function NewPostScreen() {
  const [selectedRegion, setSelectedRegion] = useState('선택안함');
  const [selectedCity, setSelectedCity] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const navigation = useNavigation();
  const [images, setImages] = useState([]);
  const inputRef = useRef(null);

  // 키보드 감지 상태
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const keyboardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      Animated.timing(keyboardAnim, {
        toValue: e.endCoordinates.height,
        duration: 150,
        useNativeDriver: false,
      }).start();
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardHeight(0);
      Animated.timing(keyboardAnim, {
        toValue: 0,
        duration: 120,
        useNativeDriver: false,
      }).start();
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [keyboardAnim]);

  // 도/시 ENUM 변환 (생략 없이)
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
    '제주시': 'JEJU_SI',
    '서귀포시': 'SEOGWIPO_SI',
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
    '춘천시': 'CHUNCHEON_SI',
    '원주시': 'WONJU_SI',
    '강릉시': 'GANGNEUNG_SI',
    '동해시': 'DONGHAE_SI',
    '태백시': 'TAEBAEK_SI',
    '속초시': 'SOKCHO_SI',
    '삼척시': 'SAMCHEOK_SI',
    '청주시': 'CHEONGJU_SI',
    '충주시': 'CHUNGJU_SI',
    '제천시': 'JECEHON_SI',
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
    '전주시': 'JEONJU_SI',
    '군산시': 'GUNSAN_SI',
    '익산시': 'IKSAN_SI',
    '정읍시': 'JEONGEUP_SI',
    '남원시': 'NAMWON_SI',
    '김제시': 'GIMJE_SI',
    '순창군': 'SUNCHANG_GUN',
    '목포시': 'MOKPO_SI',
    '여수시': 'YEOSU_SI',
    '순천시': 'SUNCHEON_SI',
    '나주시': 'NAJU_SI',
    '광양시': 'GWANGYANG_SI',
    '해남군': 'HAENAM_GUN',
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
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' }
    });
    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: undefined
      });
    };
  }, [navigation]);

  const handleRegister = async () => {
    try {
      if (!title.trim()) {
        Alert.alert('제목을 입력해 주세요.');
        return;
      }
      if (!content.trim()) {
        Alert.alert('내용을 입력해 주세요.');
        return;
      }
      const provinceVal = Province[selectedRegion] || 'NONE';
      const cityVal = City[selectedCity] || 'NONE';

      const result = await createCommunityPost({
        title,
        content,
        city: cityVal,
        province: provinceVal,
        imageUris: images,
      });

      let msg = '글이 정상적으로 등록되었습니다.';
      if (result?.postId) msg = `postId: ${result.postId}`;

      Alert.alert('글 등록 완료', msg, [
        {
          text: '확인',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err) {
      Alert.alert('오류', err.message || '글 등록 중 문제가 발생했습니다.');
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
      quality: 0.8,
    });

    if (!result.canceled) {
      const uris = Array.isArray(result.assets)
        ? result.assets.map(asset => asset.uri)
        : result.uri ? [result.uri] : [];
      let allImages = [...images, ...uris].filter(Boolean);
      if (allImages.length > MAX_IMAGES) {
        allImages = allImages.slice(0, MAX_IMAGES);
      }
      setImages(allImages);
      console.log('이미지 배열:', allImages);
    }
  };

  const removeImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1 }}>
          {/* 상단 헤더 */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons
  name="chevron-back"
  size={24}
  color="#4F46E5"
  style={{ marginTop: -12 }} // ✅ 여기서 위로 올림
/>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>글쓰기</Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerText}>등록</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerLine} />

          {/* 목적지 필터 */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>목적지 필터</Text>
            <View style={{ paddingHorizontal: 0, paddingBottom: 0 }}>
              <ToggleSelector
                items={[
                  "선택안함","서울", "제주", "경기도", "강원도", "충청북도",
                  "충청남도", "전라북도", "전라남도", "경상북도", "경상남도"
                ]}
                selectedItem={selectedRegion}
                onSelect={item => {
                  setSelectedRegion(item);
                  setSelectedCity('');
                }}
                size="large"
              />

              {/* 서울/제주/경기/강원/충북/충남/전북/전남/경북/경남 toggleSelector 전부 동일하게 기존대로 조건문으로 포함 */}

              {selectedRegion === '서울' && (
                <View style={{ marginTop: 4 }}>
                  <ToggleSelector
                    items={[
                      "강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구",
                      "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구",
                      "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구",
                      "은평구", "종로구", "중구", "중랑구"
                    ]}
                    selectedItem={selectedCity}
                    onSelect={setSelectedCity}
                    size="small"
                  />
                </View>
              )}
              {selectedRegion === '제주' && (
                <View style={{ marginTop: 4 }}>
                  <ToggleSelector
                    items={["제주시", "서귀포시"]}
                    selectedItem={selectedCity}
                    onSelect={setSelectedCity}
                    size="small"
                  />
                </View>
              )}
              {selectedRegion === '경기도' && (
                <View style={{ marginTop: 4 }}>
                  <ToggleSelector
                    items={[
                      "수원시", "성남시", "의정부시", "안양시", "부천시", "광명시", "평택시", "동두천시", "안산시",
                      "고양시", "과천시", "구리시", "남양주시", "오산시", "시흥시", "군포시", "의왕시", "하남시",
                      "용인시", "파주시", "이천시", "안성시", "김포시", "화성시", "광주시", "양주시", "포천시",
                      "여주시", "연천군", "가평군", "양평군"
                    ]}
                    selectedItem={selectedCity}
                    onSelect={setSelectedCity}
                    size="small"
                  />
                </View>
              )}
              {selectedRegion === '강원도' && (
                <View style={{ marginTop: 4 }}>
                  <ToggleSelector
                    items={["춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시"]}
                    selectedItem={selectedCity}
                    onSelect={setSelectedCity}
                    size="small"
                  />
                </View>
              )}
              {selectedRegion === '충청북도' && (
                <View style={{ marginTop: 4 }}>
                  <ToggleSelector
                    items={["청주시", "충주시", "제천시"]}
                    selectedItem={selectedCity}
                    onSelect={setSelectedCity}
                    size="small"
                  />
                </View>
              )}
              {selectedRegion === '충청남도' && (
                <View style={{ marginTop: 4 }}>
                  <ToggleSelector
                    items={["천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시", "부여군", "홍성군"]}
                    selectedItem={selectedCity}
                    onSelect={setSelectedCity}
                    size="small"
                  />
                </View>
              )}
              {selectedRegion === '전라북도' && (
                <View style={{ marginTop: 4 }}>
                  <ToggleSelector
                    items={["전주시", "군산시", "익산시", "정읍시", "남원시", "김제시", "순창군"]}
                    selectedItem={selectedCity}
                    onSelect={setSelectedCity}
                    size="small"
                  />
                </View>
              )}
              {selectedRegion === '전라남도' && (
                <View style={{ marginTop: 4 }}>
                  <ToggleSelector
                    items={["목포시", "여수시", "순천시", "나주시", "광양시", "해남군"]}
                    selectedItem={selectedCity}
                    onSelect={setSelectedCity}
                    size="small"
                  />
                </View>
              )}
              {selectedRegion === '경상북도' && (
                <View style={{ marginTop: 4 }}>
                  <ToggleSelector
                    items={["포항시", "경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시", "울진군", "울릉군"]}
                    selectedItem={selectedCity}
                    onSelect={setSelectedCity}
                    size="small"
                  />
                </View>
              )}
              {selectedRegion === '경상남도' && (
                <View style={{ marginTop: 4 }}>
                  <ToggleSelector
                    items={["창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시", "남해군"]}
                    selectedItem={selectedCity}
                    onSelect={setSelectedCity}
                    size="small"
                  />
                </View>
              )}
            </View>
          </View>
          {/* 입력 폼 */}
          <KeyboardAwareScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.titleInput}
                placeholder="제목을 입력해 주세요"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor="#B3B3B3"
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
                    <Text style={styles.guideText}>{'\u2022'} 여행 동행자 모집</Text>
                    <Text style={styles.guideText}>{'\u2022'} 즐거웠던 여행 기억</Text>
                    <Text style={styles.guideText}>{'\u2022'} 다른 여행자들에게 알려주고싶은 장소</Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={{ height: 80 }} /> {/* 하단 버튼 영역 여백 확보 */}
            </View>
          </KeyboardAwareScrollView>
          {/* 플러스 버튼/이미지 썸네일, 항상 하단. 키보드 올라오면 키보드 위로 */}
          <Animated.View
            style={[
              styles.bottomFloatBox,
              { bottom: keyboardAnim }
            ]}
          >
            <View style={[styles.plusButtonContainer, { flexDirection: 'row', alignItems: 'center' }]}>
              <TouchableOpacity style={styles.plusButton} onPress={pickImage}>
                <Ionicons name="add" size={50} color="#b3b3b3" />
              </TouchableOpacity>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.thumbnailScroll}
                contentContainerStyle={{ overflow: 'visible', paddingLeft: 8 }}
              >
                {images.map((uri, idx) => (
                  <View key={idx} style={styles.previewWrapper}>
                    <Image source={{ uri }} style={styles.previewImg} />
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => removeImage(idx)}>
                      <Ionicons name="close-circle" size={22} color="#ff5c5c" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          </Animated.View>
        </View>
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
    marginTop: Platform.OS === 'ios' ? 0 : 0,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: width * 0.045,
    color: '#000000',
    flex: 1,
    textAlign: 'center',
    marginTop: -12,
  },
  registerText: {
    color: '#4F46E5',
    fontWeight: '400',
    fontSize: width * 0.04,
     marginTop: -12,
    paddingRight: 4,
  },
  filterSection: {
    paddingHorizontal: width * 0.04,
    paddingTop: height * 0.02,
    paddingBottom: height * 0.015,
    marginBottom: 14,
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
    fontSize: width * 0.045,
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
    fontSize: width * 0.045,
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
    marginBottom: 30,
  },
  plusButtonContainer: {
    alignItems: 'flex-start',
    paddingHorizontal: width * 0.008,
    marginTop: 10,
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
    height: 1,
    backgroundColor: '#B5B5B5',
    marginTop: -14,
    marginHorizontal: 16,
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
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 1.5,
    zIndex: 2,
  },
  bottomFloatBox: {
    position: 'absolute',
    left: 0,
    right: 0,
    
    paddingTop: 8,
    zIndex: 999,
  },
});
