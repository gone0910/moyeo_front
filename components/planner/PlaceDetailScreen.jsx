import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { saveCacheData, getCacheData, CACHE_KEYS } from '../../caching/cacheService';
import { KAKAO_REST_API_KEY, KAKAO_JS_KEY } from '@env';

// === 반응형 유틸 함수 ===
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BASE_WIDTH = 390; // iPhone 13 기준
const BASE_HEIGHT = 844;
function normalize(size, based = 'width') {
  const scale = based === 'height' ? SCREEN_HEIGHT / BASE_HEIGHT : SCREEN_WIDTH / BASE_WIDTH;
  return Math.round(size * scale);
}

const CARD_RATIO = 0.25;
const CARD_HEIGHT = SCREEN_HEIGHT * CARD_RATIO;
const MAP_HEIGHT = SCREEN_HEIGHT * (1 - CARD_RATIO);

export default function PlaceDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { place } = route.params;

  const {
    name,
    type,
    estimatedCost,
    gptOriginalName,
    lat,
    lng,
    description,
    region,
    address,
  } = place;

  const defaultLat = lat || 33.450701;
  const defaultLng = lng || 126.570667;
  const [resolvedAddress, setResolvedAddress] = useState(address);

  useEffect(() => {
    const fetchAddressFromCoords = async () => {
      try {
        if (!address || address.length < 10) {
          const res = await fetch(
            `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
            {
              headers: {
                Authorization: KAKAO_REST_API_KEY,
              },
            }
          );
          const data = await res.json();
          const fullAddr =
            data.documents?.[0]?.road_address?.address_name ||
            data.documents?.[0]?.address?.address_name;
          if (fullAddr) setResolvedAddress(fullAddr);
        }
      } catch (e) {
        console.warn('📛 주소 변환 실패:', e);
      }
    };
    fetchAddressFromCoords();
  }, []);

  useEffect(() => { saveCacheData(CACHE_KEYS.PLAN_DETAIL, place); }, [place]);
  useEffect(() => {
    (async () => {
      const detail = await getCacheData(CACHE_KEYS.PLAN_DETAIL);
      console.log('PLAN_DETAIL:', detail);
    })();
  }, []);

  const mapHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
      <style>
        html, body, #map {
          margin: 0;
          padding: 0;
          width: 100vw;
          height: 100vh;
          border-radius: 0px;
          overflow: hidden;
        }
      </style>
      <script>
        function initKakaoMap() {
          if (typeof kakao === 'undefined') {
            alert('❌ Kakao SDK 로드 실패');
            return;
          }
          var map = new kakao.maps.Map(document.getElementById('map'), {
            center: new kakao.maps.LatLng(${defaultLat}, ${defaultLng}),
            level: 1
          });
          var marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(${defaultLat}, ${defaultLng})
          });
          marker.setMap(map);
        }
      </script>
      <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false" onload="kakao.maps.load(initKakaoMap)"></script>
    </head>
    <body>
      <div id="map"></div>
    </body>
    </html>
  `;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F6FB' }}>
      <View style={styles.screen}>
        {/* 지도 */}
        <View style={[styles.mapBox, { height: MAP_HEIGHT }]}>
          <WebView
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.map}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            allowFileAccess
            allowUniversalAccessFromFileURLs
            useWebKit
            scrollEnabled={false}
            scalesPageToFit
          />
          {/* 뒤로가기 버튼 (지도 위에 고정) */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={normalize(24)} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* 카드 */}
        <View style={[styles.infoCard, { height: CARD_HEIGHT }]}>
          {/* 상단: 장소명/카테고리/가격 */}
          <View style={styles.row}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
              <Text style={styles.placeName}>{name}</Text>
              {type && (
                <Text style={styles.type}>{type}</Text>
              )}
            </View>
            {estimatedCost ? (
              <Text style={styles.cost}>{estimatedCost.toLocaleString()}원</Text>
            ) : null}
          </View>
          {/* 설명 */}
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}
          {/* 하단 주소 */}
          {resolvedAddress ? (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={normalize(17)} color="#4F46E5" style={{ marginRight: normalize(3) }} />
              <Text style={styles.address}>{resolvedAddress}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

const CARD_RADIUS = 18;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F4F6FB',
  },
  mapBox: {
    width: '100%',
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    overflow: 'hidden',
    backgroundColor: '#D8E1FF',
    marginBottom: 0,
    marginTop: -normalize(60, 'height'),
  },
  map: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D8E1FF',
    borderRadius: 0,
  },
  backButton: {
    position: 'absolute',
    top: normalize(60, 'height'),
    left: normalize(16),
    zIndex: 10,
    width: normalize(38),
    height: normalize(38),
    borderRadius: normalize(19),
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#869FCF',
    shadowOpacity: 0.13,
    shadowOffset: { width: 1, height: 2 },
    shadowRadius: normalize(7),
    elevation: 7,
  },
  infoCard: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: normalize(24),
    borderTopRightRadius: normalize(24),
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    alignSelf: 'center',
    paddingHorizontal: normalize(28),
    paddingTop: normalize(40),
    paddingBottom: normalize(60, 'height'),
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -normalize(8) },
    shadowOpacity: 0.23,
    shadowRadius: normalize(18),
    elevation: Platform.OS === 'android' ? 1 : 0,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: normalize(2),
  },
  placeName: {
    fontSize: normalize(24),
    fontWeight: 'bold',
    color: '#212237',
    maxWidth: normalize(180),
  },
  type: {
    fontSize: normalize(16),
    color: '#999',
    marginRight: normalize(8),
    marginBottom: -normalize(5),
    marginLeft: normalize(10),
  },
  cost: {
    fontSize: normalize(18),
    color: '#4F46E5',
    marginLeft: normalize(2),
    marginBottom: normalize(1),
  },
  description: {
    fontSize: normalize(16),
    color: '#3F3F3F',
    marginTop: normalize(13, 'height'),
    marginBottom: normalize(10, 'height'),
    fontWeight: '400',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: normalize(20, 'height'),
    marginLeft: -normalize(4),
  },
  address: {
    fontSize: normalize(16),
    color: '#868686',
    flexShrink: 1,
    marginLeft: normalize(2),
  },
});
