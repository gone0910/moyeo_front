// components/chatBot/ResultWeatherBubble.jsx  날씨
import React from 'react';
import { View, Text, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons'; // umbrella
import ChatBotCardList from './common/ChatBotCardList';
import ChatBotCard from './common/ChatBotCard';
import { WEATHER_IMAGE_MAP } from './common/weatherImages';

// ✅ 날씨별 스타일 테이블(색상값/오브젝트) - 8가지 조합으로 확장
const WEATHER_STYLE_MAP = {
  // --- 1. DAY THEMES (밝은 배경용 - 어두운 텍스트, 회색 시간) ---
  sunny_day: {
    location:      "#373737",
    temperature:   "#000000",
    lowLabel:      "#4F46E5",
    lowValue:      "#4F46E5",
    highLabel:     "#E35656",
    highValue:     "#E35656",
    precipLabel:   "#000000",
    precipValue:   "#000000",
    umbrellaIcon:  "#000000",
    timeInfo:      "#606060", // 낮/흐림 = 회색
  },
  // --- 2. CLOUDY DAY THEME (어두운 배경용 - 밝은 텍스트, 회색 시간) ---
  cloudy_day: {
    location:      "#FFFFFF",
    temperature:   "#FFFFFF",
    lowLabel:      "#3593F9", //
    lowValue:      "#3593F9",
    highLabel:     "#FF8B8B",
    highValue:     "#FF8B8B",
    precipLabel:   "#FFFFFF",
    precipValue:   "#FFFFFF",
    umbrellaIcon:  "#FFFFFF",
    timeInfo:      "#606060", // 낮/흐림 = 회색
  },
};

// --- 3. DAY 복제 (요청사항 반영) ---
// ✅ rain_day, snow_day는 sunny_day 스타일 사용
WEATHER_STYLE_MAP.rain_day = WEATHER_STYLE_MAP.sunny_day;
WEATHER_STYLE_MAP.snow_day = WEATHER_STYLE_MAP.sunny_day;


// --- 4. NIGHT THEMES (어두운 배경용 - 밝은 텍스트, 흰색 시간) ---
const nightTheme = {
  ...WEATHER_STYLE_MAP.cloudy_day, // cloudy_day 스타일을 기본으로 복사
  timeInfo: "#FFFFFF",             // timeInfo만 흰색으로 덮어쓰기
};

WEATHER_STYLE_MAP.sunny_night = nightTheme;
WEATHER_STYLE_MAP.cloudy_night = nightTheme;
WEATHER_STYLE_MAP.rain_night = nightTheme;
WEATHER_STYLE_MAP.snow_night = nightTheme;
// --- 스타일 맵 정의 완료 ---


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

// ✅ 더미 데이터 (테스트용)
const dummyWeatherList = [
  {
    region: '올레길(낮/맑음)',
    currentTemp: '20.1°C',
    minTemp: '19.6°',
    maxTemp: '22.8°',
    rainProbability: '10%',
    weatherDescription: '맑음', // -> sunny
    timestamp: '2025-05-30T09:00:00', // -> day
  },
   {
    region: '에베레스트(밤/눈)',
    currentTemp: '-5.2°C',
    minTemp: '-12.1°C',
    maxTemp: '-2.3°C',
    rainProbability: '0%',
    weatherDescription: '눈',          // -> snow
    timestamp: '2025-05-30T22:00:00',  // -> night
  },
  {
    region: '런던(낮/비)',
    currentTemp: '12.2°C',
    minTemp: '9.0°C',
    maxTemp: '15.6°C',
    rainProbability: '75%',
    weatherDescription: '비',          // -> rain
    timestamp: '2025-05-30T15:00:00', // -> day
  },
];


// ✅ 카드 내부 내용 컴포넌트
// ✅ props로 weatherType, dayType을 받도록 수정
function WeatherCardContent({ 
  region, currentTemp, minTemp, maxTemp, rainProbability, timestamp, 
  weatherType, dayType 
}) {

    const getTimeLabel = (ts) => {
      if (!ts) return '';
      const d = new Date(ts);
      d.setHours(d.getHours() + 9); // KST

      const MM = (d.getMonth() + 1).toString().padStart(2, '0');
      const DD = d.getDate().toString().padStart(2, '0');
      const hh = d.getHours().toString().padStart(2, '0');
      const mm = d.getMinutes().toString().padStart(2, '0');
      return `${d.getFullYear()}.${MM}.${DD} ${hh}:${mm} 기준`;
    };

    // ✅ weatherType과 dayType을 조합하여 정확한 스타일 키를 찾습니다.
    // 예: "sunny_day", "rain_night"
    const styleKey = `${weatherType}_${dayType}`;
    
    // ✅ 맵에서 스타일셋을 찾습니다. 만약 조합이 없으면(예: 'foggy_day') sunny_day를 기본값으로 사용합니다.
    const styleSet = WEATHER_STYLE_MAP[styleKey] || WEATHER_STYLE_MAP.sunny_day;


    // ✅ precipLabel, precipValue가 문자열(color)일 수도, 객체(style)일 수도 있어서 처리
    const getDynamicStyle = (key) => {
      const styleValue = styleSet[key];
      if (typeof styleValue === 'string') {
        return { color: styleValue }; // 문자열이면 color 속성으로 변환
      }
      return styleValue; // 객체면 그대로 반환
    };

  
  return (
    <View style={styles.innerContainer}>
      {/* ✅ styleSet에서 동적으로 색상 적용 */}
      <Text style={[styles.location, { color: styleSet.location }]}>{region}</Text>
      <Text style={[styles.temperature, { color: styleSet.temperature }]}>{currentTemp}</Text>

      <View style={styles.tempRow}>
        <View style={styles.tempBlock}>
          <Text style={[styles.lowLabel, { color: styleSet.lowLabel }]}>최저 :</Text>
          <Text style={[styles.lowValue, { color: styleSet.lowValue }]}>{minTemp}</Text>
        </View>
        <View style={styles.tempBlock}>
          <Text style={[styles.highLabel, { color: styleSet.highLabel }]}>최고 :</Text>
          <Text style={[styles.highValue, { color: styleSet.highValue }]}>{maxTemp}</Text>
        </View>
      </View>

      <View style={styles.precipRow}>
        <MaterialIcons name="umbrella-outline" size={scale(16)} color={styleSet.umbrellaIcon} style={{ marginRight: scale(6) }} />
        <Text style={[styles.precipLabel, getDynamicStyle('precipLabel')]}>강수확률 :</Text>
        <Text style={[styles.precipValue, getDynamicStyle('precipValue')]}>{rainProbability}</Text>
      </View>

      <Text style={[
        styles.timeInfo, 
        { color: styleSet.timeInfo } // ✅ styleSet에서 timeInfo 색상 적용
      ]}>
        {getTimeLabel(timestamp)}
      </Text>
    </View>
  );
}


// ✅ 외부에서 호출되는 컴포넌트
export default function ResultWeatherBubble({ data }) {
  // data가 undefined면 더미 데이터 사용, 아니면 객체로 간주
  // ✅ 테스트를 위해 더미데이터 전체를 사용하도록 수정 (원래 로직: data || dummyWeatherList[0])
  const items = data ? [data] : dummyWeatherList; 

  return (
    <ChatBotCardList
      data={items} // ✅ dummyWeatherList 전체를 렌더링
      renderItem={({ item }) => {
        
        // ✅ weatherItem 객체 생성
        const weatherItem = {
          ...item,
          timestamp: item.requestTime || item.timestamp || new Date().toISOString(),
          weatherType: mapWeatherDescriptionToType(item.weatherDescription),
        };
        
        // ✅ dayType 계산
        const dayType = getDayTypeFromTimestamp(weatherItem.timestamp);
        
        return (
          <ChatBotCard 
            height={Math.max(width * (290 / 390), scale(210))}
            noPadding 
            noShadow
          >
            <ImageBackground
              source={getWeatherImage(weatherItem.weatherType, dayType)}
              style={{ flex: 1, width: '100%', height: '100%' }}
              imageStyle={{ borderRadius: 9 }}
              resizeMode="cover"
            >
              <View style={{ flex: 1, justifyContent: 'center' }}>
                {/* ✅ weatherItem의 모든 정보와 계산된 dayType, weatherType을 전달 */}
                <WeatherCardContent 
                  {...weatherItem}
                  dayType={dayType} 
                />
              </View>
            </ImageBackground>
          </ChatBotCard>
        );
      }}
    />
  );
}

// ✅ 스타일 (스타일은 변경할 필요 없음)
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
    color: '#FFF', 
    textAlign: 'left',
    alignSelf: 'left', 
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
  },
  lowValue: {
    fontSize: scale(16),
    fontFamily: 'Roboto',
    color: '#4F46E5', 
    lineHeight: scale(25),
    fontWeight: '400',
    textAlignVertical: 'center',
  },
  highLabel: {
    fontSize: scale(16),
    fontFamily: 'Roboto',
    color: '#E35656', 
    lineHeight: scale(25),
    fontWeight: '400',
    textAlignVertical: 'center',
    marginLeft: scale(0), 
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