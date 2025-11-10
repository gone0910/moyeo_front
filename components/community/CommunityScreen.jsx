import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Image, FlatList,
  Dimensions, Platform, PixelRatio, Keyboard, TouchableWithoutFeedback, Alert
} from 'react-native';
import HeaderBar from '../../components/common/HeaderBar';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import ToggleSelector from '../common/ToggleSelector';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { fetchCommunityPosts } from '../../api/community_list';
import { fetchFilteredPostList } from '../../api/community_filter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

// === 반응형 유틸 함수 ===
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const scale = SCREEN_WIDTH / 375; // iPhone 6 기준
const paddingHorizontalValue = SCREEN_WIDTH * 0.07;
function normalize(size) {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  } else {
    return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
  }
}

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
  // [FIX] 시 토글에서 '선택안함'을 누르면 NONE으로 인식하도록 추가
  '선택안함': 'NONE',

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
  '제천시': 'JECEHEON_SI',

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

// =========== [API 연동용 STATE 추가] ===========
const CommunityScreen = () => {
  const navigation = useNavigation();
  const [selectedRegion, setSelectedRegion] = useState('선택안함');
  const [selectedCity, setSelectedCity] = useState('');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTitle, setSearchTitle] = useState('');
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isPressed, setIsPressed] = useState(false);


  function formatKST(isoString) {
  if (!isoString) return '';
  const utc = new Date(isoString);
  if (isNaN(utc.getTime())) return '';
  const kst = new Date(utc.getTime() + 9 * 60 * 60 * 1000); // +9시간
  const yyyy = kst.getFullYear();
  const mm = String(kst.getMonth() + 1).padStart(2, '0');
  const dd = String(kst.getDate()).padStart(2, '0');
  const hh = String(kst.getHours()).padStart(2, '0');
  const mi = String(kst.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

  // ✅ 포커스될 때마다 목록 새로고침 (맨 위로)
useFocusEffect(
  useCallback(() => {
    setPage(0);
    loadPosts(0);
  }, [loadPosts])
);

// ✅ 하단 탭(Community)을 다시 눌러도 새로고침
useEffect(() => {
  const unsub = navigation.addListener('tabPress', () => {
    setPage(0);
    loadPosts(0);
  });
  return unsub;
}, [navigation, loadPosts]);

  useEffect(() => {
    setSelectedCity('선택안함');
  }, [selectedRegion]);

  // =========== [API 연동 함수] ===========
  const loadPosts = async (_page = 0) => {
    if (loading) return;
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwt');

      const provinceEnum = Province[selectedRegion]; // 'SEOUL' | 'NONE' | undefined
      const cityEnum = City[selectedCity];           // 'GANGNAM_GU' | 'NONE' | undefined
      const trimmedTitle = (searchTitle || '').trim();

      // NONE/빈값은 필터에서 제외
      const hasProvince = !!provinceEnum && provinceEnum !== 'NONE';
      const effectiveCityEnum = hasProvince ? cityEnum : undefined; // [FIX] 도가 선택되지 않으면 시는 무시
      const hasCity = !!effectiveCityEnum && effectiveCityEnum !== 'NONE';
      const hasTitle = trimmedTitle.length > 0;

      let data;

      if (hasProvince || hasCity || hasTitle) {
        // NONE은 보내지 않음(=필터 미적용)
        data = await fetchFilteredPostList({
          page: _page,
          size: 10,
          token,
          province: hasProvince ? provinceEnum : undefined,
          city: hasCity ? effectiveCityEnum : undefined,
          title: hasTitle ? trimmedTitle : undefined,
        });
      } else {
        // 아무 필터도 없으면 전체 목록 API
        data = await fetchCommunityPosts({
          page: _page,
          size: 10,
          token,
        });
      }

      setPosts(_page === 0 ? data.postListResDtos : (prev) => [...prev, ...data.postListResDtos]);
      setPage(data.nowPage);
      setHasNextPage(data.hasNextPage);
    } catch (err) {
      setPosts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPosts(0);
  }, [selectedRegion, selectedCity, searchTitle]);

  const handleLoadMore = () => {
    if (hasNextPage && !loading) {
      loadPosts(page + 1);
    }
  };


  return (
    <SafeAreaView style={styles.screen} edges={['left','right','bottom']}>
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1 }}>
        <HeaderBar/>

        {/* 검색 + 연필 아이콘 라인 */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <TextInput
              style={styles.input}
              placeholder="제목을 통하여 검색"
              placeholderTextColor="#B3B3B3"
              value={searchTitle}
              onChangeText={setSearchTitle}
              onSubmitEditing={() => loadPosts(0)}
            />
            <TouchableOpacity onPress={() => loadPosts(0)}>
              <Ionicons name="search" size={normalize(22)} color="#7D5CF6" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.editIconBtn} onPress={() => navigation.navigate('NewPost')}>
            <MaterialIcons name="edit" size={normalize(22)} color="#4F46E5" />
          </TouchableOpacity>
        </View>

        {/* 목적지 필터 버튼 & 토글 UI */}
        <Text style={styles.filterText}>목적지 필터</Text>

        <View style={{ paddingHorizontal: SCREEN_WIDTH * 0.04, paddingBottom: normalize(12) }}>
          <ToggleSelector
            items={["선택안함", "서울", "제주", "경기도", "강원도", "충청북도", "충청남도", "전라북도", "전라남도", "경상북도", "경상남도"]}
            selectedItem={selectedRegion}
            onSelect={(val) => {
            setSelectedRegion(val);
            if (val === '선택안함') {
              // [FIX] 도=선택안함이면 시도 즉시 선택안함으로 초기화 (트랜지언트 필터링 방지)
              setSelectedCity('선택안함');
            }
          }}
            size="large"
          />

          {/* [FIX][A방법] 모든 '시' 토글에 동일 로직 적용: '선택안함' 클릭 시 도/시 모두 해제 */}
          {selectedRegion === '서울' && (
            <View style={{ marginTop: 4 }}>
              <ToggleSelector
                items={["선택안함","강남구", "강동구", "강북구", "강서구", "관악구", "광진구", "구로구", "금천구", "노원구", "도봉구", "동대문구", "동작구", "마포구", "서대문구", "서초구", "성동구", "성북구", "송파구", "양천구", "영등포구", "용산구", "은평구", "종로구", "중구", "중랑구"]}
                selectedItem={selectedCity}
                onSelect={(val) => {
                  if (val === '선택안함') {
                    setSelectedCity('선택안함');
                    setSelectedRegion('선택안함'); // [FIX]
                  } else {
                    setSelectedCity(val);
                  }
                }}
                size="small"
              />
            </View>
          )}

          {selectedRegion === '제주' && (
            <View style={{ marginTop: 4 }}>
              <ToggleSelector
                items={["선택안함","제주시", "서귀포시"]}
                selectedItem={selectedCity}
                onSelect={(val) => {
                  if (val === '선택안함') {
                    setSelectedCity('선택안함');
                    setSelectedRegion('선택안함'); // [FIX]
                  } else {
                    setSelectedCity(val);
                  }
                }}
                size="small"
              />
            </View>
          )}

          {selectedRegion === '경기도' && (
            <View style={{ marginTop: 4 }}>
              <ToggleSelector
                items={["선택안함","수원시", "성남시", "의정부시", "안양시", "부천시", "광명시", "평택시", "동두천시", "안산시", "고양시", "과천시",
                        "구리시", "남양주시", "오산시", "시흥시", "군포시", "의왕시", "하남시", "용인시", "파주시", "이천시", "안성시",
                        "김포시", "화성시", "광주시", "양주시", "포천시", "여주시", "연천군", "가평군", "양평군"
                ]}
                selectedItem={selectedCity}
                onSelect={(val) => {
                  if (val === '선택안함') {
                    setSelectedCity('선택안함');
                    setSelectedRegion('선택안함'); // [FIX]
                  } else {
                    setSelectedCity(val);
                  }
                }}
                size="small"
              />
            </View>
          )}

          {selectedRegion === '강원도' && (
            <View style={{ marginTop: 4 }}>
              <ToggleSelector
                items={["선택안함","춘천시", "원주시", "강릉시", "동해시", "태백시", "속초시", "삼척시"]}
                selectedItem={selectedCity}
                onSelect={(val) => {
                  if (val === '선택안함') {
                    setSelectedCity('선택안함');
                    setSelectedRegion('선택안함'); // [FIX]
                  } else {
                    setSelectedCity(val);
                  }
                }}
                size="small"
              />
            </View>
          )}

          {selectedRegion === '충청북도' && (
            <View style={{ marginTop: 4 }}>
              <ToggleSelector
                items={["선택안함","청주시", "충주시", "제천시"]}
                selectedItem={selectedCity}
                onSelect={(val) => {
                  if (val === '선택안함') {
                    setSelectedCity('선택안함');
                    setSelectedRegion('선택안함'); // [FIX]
                  } else {
                    setSelectedCity(val);
                  }
                }}
                size="small"
              />
            </View>
          )}

          {selectedRegion === '충청남도' && (
            <View style={{ marginTop: 4 }}>
              <ToggleSelector
                items={["선택안함","천안시", "공주시", "보령시", "아산시", "서산시", "논산시", "계룡시", "당진시", "부여군", "홍성군"]}
                selectedItem={selectedCity}
                onSelect={(val) => {
                  if (val === '선택안함') {
                    setSelectedCity('선택안함');
                    setSelectedRegion('선택안함'); // [FIX]
                  } else {
                    setSelectedCity(val);
                  }
                }}
                size="small"
              />
            </View>
          )}

          {selectedRegion === '전라북도' && (
            <View style={{ marginTop: 4 }}>
              <ToggleSelector
                items={["선택안함","전주시", "군산시", "익산시", "정읍시", "남원시", "김제시", "순창군"]}
                selectedItem={selectedCity}
                onSelect={(val) => {
                  if (val === '선택안함') {
                    setSelectedCity('선택안함');
                    setSelectedRegion('선택안함'); // [FIX]
                  } else {
                    setSelectedCity(val);
                  }
                }}
                size="small"
              />
            </View>
          )}

          {selectedRegion === '전라남도' && (
            <View style={{ marginTop: 4 }}>
              <ToggleSelector
                items={["선택안함","목포시", "여수시", "순천시", "나주시", "광양시", "해남군"]}
                selectedItem={selectedCity}
                onSelect={(val) => {
                  if (val === '선택안함') {
                    setSelectedCity('선택안함');
                    setSelectedRegion('선택안함'); // [FIX]
                  } else {
                    setSelectedCity(val);
                  }
                }}
                size="small"
              />
            </View>
          )}

          {selectedRegion === '경상북도' && (
            <View style={{ marginTop: 4 }}>
              <ToggleSelector
                items={["선택안함","포항시"," 경주시", "김천시", "안동시", "구미시", "영주시", "영천시", "상주시", "문경시", "경산시", "울진군", "울릉군"]}
                selectedItem={selectedCity}
                onSelect={(val) => {
                  if (val === '선택안함') {
                    setSelectedCity('선택안함');
                    setSelectedRegion('선택안함'); // [FIX]
                  } else {
                    setSelectedCity(val);
                  }
                }}
                size="small"
              />
            </View>
          )}

          {selectedRegion === '경상남도' && (
            <View style={{ marginTop: 4 }}>
              <ToggleSelector
                items={["선택안함","창원시", "진주시", "통영시", "사천시", "김해시", "밀양시", "거제시", "양산시", "남해군"]}
                selectedItem={selectedCity}
                onSelect={(val) => {
                  if (val === '선택안함') {
                    setSelectedCity('선택안함');
                    setSelectedRegion('선택안함'); // [FIX]
                  } else {
                    setSelectedCity(val);
                  }
                }}
                size="small"
              />
            </View>
          )}
          {/* <== 모든 조건문 View 닫힘 주의! */}
        </View>

        {/* 게시글 목록 */}
        <FlatList
          data={posts}
          keyExtractor={(item, idx) => (item.id?.toString() || idx.toString())}
          contentContainerStyle={{ paddingBottom: normalize(24) }}
          renderItem={({ item }) => (
            <View>
              <TouchableOpacity
                style={styles.postCard}
                activeOpacity={0.3}
                onPress={() => {
                  const postId = item.postId ?? item.id;
                  if (!postId) {
                    Alert.alert('게시글 ID를 찾을 수 없습니다.');
                    return;
                  }
                  navigation.navigate('PostDetail', { postId });
                }}
              >
                <View style={styles.leftCol}>
                  <View style={styles.profileRow}>
                    <Text style={styles.username}>{item.nickname || '익명'}</Text>
                  </View>
                  <Text style={styles.title}>{item.title}</Text>
                  <View style={styles.postMeta}>
                    <Ionicons name="chatbubble-ellipses-outline" size={normalize(14)} color="#A0A0A0" />
                    <Text style={styles.views}>{item.countComment ?? 0}</Text>
                    <Text style={styles.time}>{formatKST(item.createdAt)}</Text>
                  </View>
                </View>
                {item.firstImage ? (
                  <Image
                    style={styles.thumbnail}
                    source={{ uri: item.firstImage }}
                    resizeMode="cover"
                  />
                ) : null}
              </TouchableOpacity>
            </View>
          )}
          refreshing={loading}
          onRefresh={() => loadPosts(0)}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.8}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 40, color: '#aaa' }}>게시글이 없습니다.</Text>}
        />
        </View>
    </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

export default CommunityScreen;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SCREEN_WIDTH * 0.03, // 20px -> 반응형
    marginBottom: normalize(2),
  },
  searchBox: {
    flex: 1,
    width: '95%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#Fff',
    borderRadius: normalize(20),
    height: normalize(38),
    paddingHorizontal: normalize(12),
    borderColor: '#F0F0F0',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    color: '#222',
    fontSize: normalize(16),
    backgroundColor: 'transparent',
    paddingVertical: 0,
    paddingRight: normalize(8),
  },
  editIconBtn: {
    marginLeft: normalize(8),
    padding: normalize(6),
  },
  filterText: {
    fontSize: normalize(14),
    color: '#777',
    marginLeft: normalize(16),
    marginTop: normalize(14),
    marginBottom: normalize(8),
  },
  postCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fafafa',
    paddingVertical: normalize(14),
    paddingHorizontal: normalize(18),
  },
  leftCol: {
    flex: 1,
    justifyContent: 'center',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: normalize(2),
  },
  profileImg: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: normalize(12),
    backgroundColor: '#abc8db',
    marginRight: normalize(7),
  },
  username: {
    fontSize: normalize(14),
    color: '#50626a',
    fontWeight: '500',
  },
  title: {
    fontSize: normalize(14),
    color: '#232a33',
    marginBottom: normalize(10),  // 기존 6 -> 10으로 살짝 늘림
    marginTop: normalize(15), 
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: normalize(8),
  },
  views: {
    marginLeft: normalize(5),
    fontSize: normalize(12),
    color: '#aaa',
    marginRight: normalize(13),
  },
  time: {
    fontSize: normalize(12),
    color: '#aaa',
  },
  thumbnail: {
    width: normalize(80),
    height: normalize(80),
    borderRadius: normalize(12),
    backgroundColor: '#eee',
    marginLeft: normalize(12),
  },
  divider: {
    height: 1,
    backgroundColor: '#B3B3B3',
    marginLeft: 0,
    marginRight: 0,
  },
  divider2: {
    height: 8,
    width: '110%',
    backgroundColor: '#EBEBEB',
    marginLeft:-15,
    marginVertical: 12,
    marginHorizontal: 0, // <-- 좌우 여백
  },
});
