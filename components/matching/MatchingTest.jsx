// (import 및 스타일 관련)
export default function MatchingInfoScreen() {
  // 사용자 context 및 네비게이션, 조건 state
  const { user } = useContext(UserContext);
  const navigation = useNavigation();

  // 여행 일정, 지역, 기타 조건 state 선언
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedItems, setSelectedItems] = useState({ group: '', tripstyle: [], gender: '', age: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 날짜 선택 핸들러
  const handleDayPress = (day) => {
    const selected = day.dateString;
    // 날짜 선택 로직 (시작/종료일 지정)
    if (!startDate || (startDate && endDate)) {
      setStartDate(selected);
      setEndDate(null);
    } else if (startDate && !endDate) {
      selected > startDate ? setEndDate(selected) : setStartDate(selected);
    }
  };

  // 조건 선택 핸들러 (단일/다중)
  const handleSelect = (key) => (value) => {
    setSelectedItems((prev) => ({ ...prev, [key]: value }));
  };
  const handleMultiSelect = (key) => (value) => {
    setSelectedItems((prev) => {
      const current = prev[key];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  // 백엔드로 조건 제출 (API 연동)
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // JWT 토큰, 조건값 가공
      const token = await AsyncStorage.getItem('jwt');
      // 조건값을 DTO로 변환 (백엔드 요구 형식)
      const dto = convertMatchingInputToDto({
        startDate, endDate, province: selectedProvince || 'NONE',
        selectedCities: selectedCity ? [selectedCity] : ['NONE'],
        groupType: selectedItems.group,
        ageRange: selectedItems.age,
        travelStyles: Array.isArray(selectedItems.tripstyle)
          ? selectedItems.tripstyle.length > 0 ? selectedItems.tripstyle : ['NONE']
          : selectedItems.tripstyle ? [selectedItems.tripstyle] : ['NONE'],
      });
      await submitMatchingProfile(dto, token);
      navigation.navigate('MatchingList'); // 리스트 화면으로 이동
    } catch (error) {
      Alert.alert('오류', '매칭 조건 전송에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <HeaderBar />
      {/* 달력, 조건(도/시/여행인원/성향/성별/나이대) 입력 UI */}
      {/* '함께할 여행자 찾아보기' 버튼 */}
      <View style={styles.fixedButtonContainer}>
        <TouchableOpacity
          style={[styles.fixedButton, (isSubmitting || !startDate || !endDate) && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={isSubmitting || !startDate || !endDate}
        >
          <Text style={styles.fixedButtonText}>함께할 여행자 찾아보기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}




const MatchingList = () => {
  const [matches, setMatches] = useState([]);   // 동행자 리스트 상태
  const [selectedMatch, setSelectedMatch] = useState(null); // 상세정보 모달 상태
  const navigation = useNavigation();

  // 리스트 데이터 불러오기 (API)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const token = await AsyncStorage.getItem('jwt');
      const result = await getMatchingList(token); // 동행자 리스트 조회
      if (result === null) {
        Alert.alert('에러', '서버 연결에 실패했습니다.');
        setMatches([]);
      } else {
        setMatches(result);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // 카드 클릭 시 상세정보 조회 & 모달 오픈
  const handleCardPress = async (nickname) => {
    try {
      const token = await AsyncStorage.getItem('jwt');
      const detail = await getUserMatchingDetail(nickname, token); // 상세정보 API
      setSelectedMatch(detail);
    } catch (error) {
      Alert.alert('상세정보 조회 실패', '다시 시도해주세요.');
    }
  };

  // 동행자 리스트 없으면 안내 문구
  if (matches.length === 0) {
    return (
      <View style={styles.container}>
        <HeaderBar />
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <Text style={styles.NoneListText1}>같이 떠날 수 있는 여행자가 없어요</Text>
          <Text style={styles.NoneListText2}>동행자 정보를 수정하시는 걸 추천드려요</Text>
        </ScrollView>
      </View>
    );
  }

  // 동행자 리스트 렌더링
  return (
    <View style={styles.container}>
      <HeaderBar />
      <View style={{ flex: 1, backgroundColor: '#F9F9F9' }}>
        <ScrollView contentContainerStyle={{ paddingTop: 10, paddingHorizontal: 16, paddingBottom: 100 }}>
          {/* 동행자 리스트 map 출력 */}
          {matches.map((item, index) => (
            <TouchableOpacity key={index} onPress={() => handleCardPress(item.nickname || item.name)}>
              <View style={styles.matchBox}>
                <Image source={{ uri: item.image || item.imageUrl }} style={styles.matchImage} />
                <View style={styles.matchInfoColumn}>
                  <Text style={styles.matchName}>{item.name || item.nickname}</Text>
                  <Text style={styles.matchDate}>{/* 날짜 포맷팅 */}</Text>
                  <View style={styles.tagsContainer}>
                    {(item.tags || item.travelStyles)?.map((tag, i) => (
                      <View key={i} style={styles.tag}> 
                        <Text style={styles.tagText}>#{STYLE_ENUM_TO_KOR[tag] || tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 상세정보 모달 */}
      <Modal visible={!!selectedMatch} transparent animationType="fade" onRequestClose={() => setSelectedMatch(null)}>
        {/* 상세 정보 UI */}
        {/* 모달 내 '동행을 위해 채팅하기' 버튼 → 채팅방 생성 및 이동 */}
      </Modal>
    </View>
  );
};
