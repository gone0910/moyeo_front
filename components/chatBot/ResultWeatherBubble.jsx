// components/chatBot/ResultWeatherBubble.jsx  날씨
import React from 'react';
import { View, Text, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons'; // umbrella
import ChatBotCardList from './common/ChatBotCardList';
import ChatBotCard from './common/ChatBotCard';
import { WEATHER_IMAGE_MAP } from './common/weatherImages';

// ✅ 날씨별 스타일 테이블(색상값/오브젝트)
const WEATHER_STYLE_MAP = {
  sunny_day: {
    location:      "#373737",
    temperature:   "#000000",
    lowLabel:      "#3593F9",
    lowValue:      "#3593F9",
    highLabel:     "#E35656",
    highValue:     "#E35656",
    precipLabel:   "#000000",
    precipValue:   "#000000",
    umbrellaIcon:  "#000000",
    timeInfo:      "#606060",
  },
  cloudy_day: {
    location:      "#FFFFFF",
    temperature:   "#FFFFFF",
    lowLabel:      "#FFFFFF",
    lowValue:      "#FFFFFF",
    highLabel:     "#FF8B8B",
    highValue:     "#FF8B8B",
    precipLabel:   { color: "#161616", borderColor: "#FFFFFF94", borderWidth: 1 },
    precipValue:   { color: "#161616", borderColor: "#FFFFFF94", borderWidth: 1 },
    umbrellaIcon:  "#161616",
    timeInfo:      "#606060",
  },
  // rain_day = cloudy_day, snow_day = sunny_day
};
WEATHER_STYLE_MAP.rain_day = WEATHER_STYLE_MAP.cloudy_day;
WEATHER_STYLE_MAP.snow_day = WEATHER_STYLE_MAP.sunny_day;

// weatherDescription → weatherType 변환 함수
const mapWeatherDescriptionToType = (desc) => {
  if (!desc) return 'sunny';
  const lower = desc.toLowerCase();
  if (lower.includes('구름')) return 'cloudy';
  if (lower.includes('맑음') || lower.includes('맑')) return 'sunny';
  if (lower.includes('비')) return 'rain';
  if (lower.includes('눈')) return 'snow';
  return 'sunny';
};



const getWeatherImage = (weatherType, dayType) => {
  const key = `${weatherType}_${dayType}`;
  return WEATHER_IMAGE_MAP[key] || WEATHER_IMAGE_MAP['sunny_day'];
};

// 낮밤 구분.
function getDayTypeByHour(hour) {
  // 06~19시는 낮(day), 그 외는 밤(night)
  if (hour >= 6 && hour < 18) return 'day';
  return 'night';
}

function getDayTypeFromTimestamp(timestamp) {
  // timestamp가 없다면 현재 시간 사용
  const date = timestamp ? new Date(timestamp) : new Date();
  date.setHours(date.getHours() + 9); // ✅ UTC→KST 변환
  const hour = date.getHours();
  return getDayTypeByHour(hour);
}

// 반응형 디자인 가로세로 선언.
const { width } = Dimensions.get('window');
const scale = (size) => (width / 390) * size;

// ✅ 더미 데이터
const dummyWeatherList = [
  {
    region: '올레길 17코스',
    currentTemp: '20.1°C',
    minTemp: '19.6°',
    maxTemp: '22.8°',
    rainProbability: '10%',
    weatherType: 'sunny',
    timestamp: '2025-05-30T09:00:00',
  },
   /* {
    region: '에베레스트',
    currentTemp: '-5.2°C',
    minTemp: '-12.1°C',
    maxTemp: '-2.3°C',
    rainProbability: '0%',
    weatherDescription: '눈',          // API 필드명
    timestamp: '2025-05-30T22:00:00',  // API 필드명 그대로 사용
  },
  {
    region: '런던',
    currentTemp: '12.2°C',
    minTemp: '9.0°C',
    maxTemp: '15.6°C',
    rainProbability: '75%',
    weatherDescription: '비',          // API 필드명
    timestamp: '2025-05-30T15:00:00',
  },*/
];


// ✅ 카드 내부 내용 컴포넌트
function WeatherCardContent({ region, currentTemp, minTemp, maxTemp, rainProbability, timestamp, dayType }) {

    const getTimeLabel = (ts) => {
  if (!ts) return '';
  const d = new Date(ts);

  // ✅ KST(UTC+9)로 변환
  d.setHours(d.getHours() + 9);

  const MM = (d.getMonth() + 1).toString().padStart(2, '0');
  const DD = d.getDate().toString().padStart(2, '0');
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${d.getFullYear()}.${MM}.${DD} ${hh}:${mm} 기준`;
};

  
  return (
    <View style={styles.innerContainer}>
      <Text style={styles.location}>{region}</Text>
      <Text style={styles.temperature}>{currentTemp}</Text>

      <View style={styles.tempRow}>
        <View style={styles.tempBlock}>
          <Text style={styles.lowLabel}>최저 :</Text>
          <Text style={styles.lowValue}>{minTemp}</Text>
        </View>
        <View style={styles.tempBlock}>
          <Text style={styles.highLabel}>최고 :</Text>
          <Text style={styles.highValue}>{maxTemp}</Text>
        </View>
      </View>

      <View style={styles.precipRow}>
        <MaterialIcons name="umbrella-outline" size={scale(16)} color="#FFFFFF" style={{ marginRight: scale(6) }} />
        <Text style={styles.precipLabel}>강수확률 :</Text>
        <Text style={styles.precipValue}>{rainProbability}</Text>
      </View>

      <Text style={[
        styles.timeInfo, 
        { color: dayType === 'night' ? '#FFFFFF' : '#606060' }
      ]}>
        {getTimeLabel(timestamp)}
      </Text>
    </View>
  );
}


// ✅ 외부에서 호출되는 컴포넌트
export default function ResultWeatherBubble({ data }) {
  // data가 undefined면 더미 데이터 사용, 아니면 객체로 간주
  const item = data || dummyWeatherList[0];

  const weatherItem = {
    ...item,
    timestamp: item.requestTime || item.timestamp || new Date().toISOString(),
    weatherType: mapWeatherDescriptionToType(item.weatherDescription),
  };

  return (
    <ChatBotCardList
      data={[weatherItem]}
      renderItem={({ item }) => {
        const dayType = getDayTypeFromTimestamp(item.timestamp);
        return (
          <ChatBotCard height={Math.max(width * (290 / 390), scale(210))}
          noPadding 
          noShadow
          >
            <ImageBackground
              source={getWeatherImage(item.weatherType, dayType)}
              style={{ flex: 1, width: '100%', height: '100%' }}    // 100%로 카드 채우기
              imageStyle={{ borderRadius: 9 }}
              resizeMode="cover"
            >
              <View style={{ flex: 1, justifyContent: 'center' }}>  {/* 필요하면 flex:1만 남기기 */}
                <WeatherCardContent {...item} />
              </View>
            </ImageBackground>
          </ChatBotCard>
        );
      }}
    />
  );
}

// ✅ 스타일
const styles = StyleSheet.create({
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: scale(10),
  },
  location: {
    width: scale(114),
    height: scale(25),
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(19),
    lineHeight: scale(25),
    color: '#FFF', // 배경이 밝으면 '#373737'
    textAlign: 'left',
    alignSelf: 'left', // 가로 중앙
    backgroundColor: 'transparent',
    marginBottom: scale(30),
    marginLeft: scale(16),
  },
  temperature: {
    width: scale(107),
    height: scale(40),
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(33),
    lineHeight: scale(40),
    color: '#FFF',
    textAlign: 'center',
    alignSelf: 'center',
    backgroundColor: 'transparent',
    marginBottom: scale(30),
  },
  tempRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: scale(20),
    width: '100%',
  },
  tempBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: scale(25),
    flexShrink: 1,
  },
  lowLabel: {
    fontSize: scale(16),
    fontFamily: 'Roboto',
    color: '#4F46E5',
    lineHeight: scale(25),
    fontWeight: '400',
    textAlignVertical: 'center',
    marginLeft: scale(16),
    // width, height 삭제!
  },
  lowValue: {
    fontSize: scale(16),
    fontFamily: 'Roboto',
    color: '#4F46E5',
    lineHeight: scale(25),
    fontWeight: '400',
    textAlignVertical: 'center',
    // width, height 삭제!
  },
  highLabel: {
    fontSize: scale(16),
    fontFamily: 'Roboto',
    color: '#E35656', // #E35656도 대체가능 #FF8B8B
    lineHeight: scale(25),
    fontWeight: '400',
    textAlignVertical: 'center',
    marginLeft: scale(0), // 최고기온 left 25 맞추기 (조절 필요요)
  },
  highValue: {
    fontSize: scale(16),
    fontFamily: 'Roboto',
    color: '#E35656',
    lineHeight: scale(25),
    fontWeight: '400',
    textAlignVertical: 'center',
  },
  precipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: scale(8),
    marginTop: 0,
    paddingLeft: 0,
    width: '100%',
    marginLeft: scale(16),
  },
  umbrellaIcon: {
    width: scale(16),
    height: scale(15),
    marginRight: scale(6),
  },
  precipLabel: {
    width: scale(74),
    height: scale(25),
    fontSize: scale(16),
    fontFamily: 'Roboto',
    color: '#FFF',
    lineHeight: scale(25),
    fontWeight: '400',
    marginLeft: scale(1),
    textAlignVertical: 'center',
    marginRight: scale(4),
  },
  precipValue: {
    width: scale(39),
    height: scale(25),
    fontSize: scale(16),
    fontFamily: 'Roboto',
    color: '#FFF',
    lineHeight: scale(25),
    fontWeight: '400',
    marginLeft: scale(4),
    textAlignVertical: 'center',
  },
  timeInfo: {
    position: 'absolute',
    right: scale(12),
    bottom: scale(6),
    width: scale(119),
    height: scale(25),
    fontFamily: 'Roboto',
    fontWeight: '400',
    fontSize: scale(12),
    lineHeight: scale(25),
    color: '#606060',
    textAlign: 'right',
    backgroundColor: 'transparent',
    opacity: 0.88,
  },
});

