// components/planner/PlaceDetailScreen.jsx
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import React, { useEffect, useState, useCallback } from 'react';
import { MAIN_TAB_ID, defaultTabBarStyle, HIDDEN_TABBAR_STYLE } from '../../navigation/BottomTabNavigator';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

import { saveCacheData, getCacheData, CACHE_KEYS } from '../../caching/cacheService';
import { KAKAO_REST_API_KEY, KAKAO_JS_KEY } from '@env';
import { getScheduleDetail } from '../../api/planner_detail';

// 반응형 유틸
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

// Kakao 보강용 헬퍼
async function enrichFromKakao(keyword, KAKAO_KEY) {
  const r = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_KEY}` } }
  );
  const data = await r.json();
  const d = data?.documents?.[0];
  if (!d) throw new Error('NO_KAKAO_RESULT');
  const lat = Number(d.y), lng = Number(d.x);
  const addr = d.road_address_name || d.address_name || '';
  return {
    name: d.place_name || keyword,
    type: d.category_group_name || '장소',
    estimatedCost: 0,
    lat, lng,
    description: d.category_name || '',
    address: addr,
    kakaoPlaceUrl: d.place_url,
  };
}

export default function PlaceDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();

 useFocusEffect(
   useCallback(() => {
     const tabNav =
       navigation.getParent?.(MAIN_TAB_ID) ||
       navigation.getParent?.()?.getParent?.();
     console.log('[PlaceDetail] hide tabbar');
     tabNav?.setOptions({ tabBarStyle: HIDDEN_TABBAR_STYLE });
     return () => tabNav?.setOptions({ tabBarStyle: defaultTabBarStyle });
   }, [navigation])
 );

  const place = route?.params?.place ?? {};

  // 표시용 상태 (서버 상세 응답으로 보완)
  const [display, setDisplay] = useState({
    name: place?.name ?? '',
    type: place?.type ?? '',
    estimatedCost: Number.isFinite(place?.estimatedCost) ? Number(place?.estimatedCost) : 0,
    lat: typeof place?.lat === 'number' ? place.lat : undefined,
    lng: typeof place?.lng === 'number' ? place.lng : undefined,
    description: place?.description ?? '',
    address: place?.address ?? '',
  });

  const [resolvedAddress, setResolvedAddress] = useState(place?.address ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 상세 API 호출: 최초 1회
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const detail = await getScheduleDetail({
          placeId: place?.placeId, // 있으면 서버 우선 조회
          name: place?.name ?? '',
          type: place?.type ?? '',
          estimatedCost: Number.isFinite(place?.estimatedCost) ? Number(place?.estimatedCost) : 0,
        });

        if (!mounted) return;

        setDisplay(prev => ({
          name: detail?.name ?? prev.name,
          type: detail?.type ?? prev.type,
          estimatedCost: Number.isFinite(detail?.estimatedCost) ? Number(detail.estimatedCost) : prev.estimatedCost,
          lat: typeof detail?.lat === 'number' ? detail.lat : prev.lat,
          lng: typeof detail?.lng === 'number' ? detail.lng : prev.lng,
          description: detail?.description ?? prev.description,
          address: detail?.address ?? prev.address,
        }));

        saveCacheData(CACHE_KEYS.PLAN_DETAIL, { ...place, ...detail });
      } catch (e) {
        console.warn('📛 일정 상세 조회 실패:', e);
        // 404면 카카오로 보강
        if (e?.status === 404) {
          try {
            const keyword = (place?.name || '').trim();
            if (keyword) {
              const k = await enrichFromKakao(keyword, KAKAO_REST_API_KEY);
              if (!mounted) return;
              setDisplay(prev => ({ ...prev, ...k }));
              saveCacheData(CACHE_KEYS.PLAN_DETAIL, { ...place, ...k });
              setError(null);
            } else {
              setError('공식 상세가 없어 지도만 표시합니다.');
            }
          } catch (kerr) {
            console.warn('📛 Kakao 보강 실패:', kerr);
            setError('상세 정보가 없어 지도만 표시합니다.');
          }
        } else {
          setError(e?.message || '상세 조회 실패');
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // 디버그용 캐시 확인(선택)
  useEffect(() => {
    (async () => {
      const detail = await getCacheData(CACHE_KEYS.PLAN_DETAIL);
      console.log('PLAN_DETAIL:', detail);
    })();
  }, []);

  // 좌표 → 주소 역변환 (카카오)
  useEffect(() => {
    const fetchAddressFromCoords = async () => {
      try {
        const addrCandidate = resolvedAddress || display.address;
        if (!addrCandidate || String(addrCandidate).length < 10) {
          const x = display?.lng ?? place?.lng;
          const y = display?.lat ?? place?.lat;
          if (typeof x !== 'number' || typeof y !== 'number') return;

          const res = await fetch(
            `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${x}&y=${y}`,
            { headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` } }
          );
          const data = await res.json();
          const fullAddr =
            data?.documents?.[0]?.road_address?.address_name ||
            data?.documents?.[0]?.address?.address_name;

          if (fullAddr) {
            setResolvedAddress(fullAddr);
            setDisplay(prev => ({ ...prev, address: fullAddr }));
          }
        }
      } catch (e) {
        console.warn('📛 주소 변환 실패:', e);
      }
    };
    fetchAddressFromCoords();
  }, [display.lat, display.lng]);

  // 카카오 장소 상세(웹) 열기
  const openKakaoPlaceDetail = async () => {
    try {
      const keyword = display.name || place?.name || '';
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(keyword)}`,
        { headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` } }
      );
      const data = await res.json();
      const placeId = data?.documents?.[0]?.id;

      if (placeId) Linking.openURL(`https://place.map.kakao.com/${placeId}`);
      else Linking.openURL(`https://map.kakao.com/?q=${encodeURIComponent(keyword)}`);
    } catch {
      const keywordFallback = display.name || place?.name || '';
      Linking.openURL(`https://map.kakao.com/?q=${encodeURIComponent(keywordFallback)}`);
    }
  };

  const defaultLat =
    typeof display.lat === 'number' ? display.lat :
    (typeof place?.lat === 'number' ? place.lat : 33.450701);

  const defaultLng =
    typeof display.lng === 'number' ? display.lng :
    (typeof place?.lng === 'number' ? place.lng : 126.570667);

  const mapHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes" />
    <style>
      html, body, #map { margin:0; padding:0; width:100vw; height:100vh; overflow:hidden; }
    </style>
    <script>
      function initKakaoMap() {
        if (typeof kakao === 'undefined') {
          alert('❌ Kakao SDK 로드 실패');
          return;
        }
        var map = new kakao.maps.Map(document.getElementById('map'), {
          center: new kakao.maps.LatLng(${defaultLat}, ${defaultLng}),
          level: 3
        });
        var marker = new kakao.maps.Marker({
          position: new kakao.maps.LatLng(${defaultLat}, ${defaultLng})
        });
        marker.setMap(map);

        kakao.maps.event.addListener(marker, 'click', function() {
          window.ReactNativeWebView && window.ReactNativeWebView.postMessage('open_kakao_map');
        });
        kakao.maps.event.addListener(map, 'click', function() {
          console.log('지도 클릭됨: 이동 방지');
        });
      }
    </script>
    <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_JS_KEY}&autoload=false" onload="kakao.maps.load(initKakaoMap)"></script>
  </head>
  <body><div id="map"></div></body>
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
            scrollEnabled={true}
            scalesPageToFit={true}
            onMessage={(event) => {
              if (event?.nativeEvent?.data === 'open_kakao_map') {
                openKakaoPlaceDetail();
              }
            }}
          />
        </View>

        {/* 뒤로가기 버튼 */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={normalize(24)} color="#4F46E5" />
        </TouchableOpacity>

        {/* 카드 */}
        <View style={[styles.infoCard, { height: CARD_HEIGHT, marginBottom: normalize(30) }]}>
          {loading ? <Text style={{ color: '#666', marginBottom: normalize(6) }}>불러오는 중...</Text> : null}
          {error ? (
            <Text style={{ color: '#888', marginBottom: normalize(6) }}>
              {String(error)}
            </Text>
          ) : null}

          {/* 상단: 장소명/카테고리/가격 */}
          <View style={styles.row}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1 }}>
              <Text style={styles.placeName}>{display.name}</Text>
              {display.type ? <Text style={styles.type}>{display.type}</Text> : null}
            </View>
            {Number.isFinite(display.estimatedCost)
              ? (Number(display.estimatedCost) === 0
                  ? <Text style={styles.cost}>무료</Text>
                  : <Text style={styles.cost}>{Number(display.estimatedCost).toLocaleString()}원</Text>)
              : null}
          </View>

          {/* 설명 */}
          {display.description ? (
            <Text style={styles.description}>{display.description}</Text>
          ) : null}

          {/* 하단 주소 */}
          {(resolvedAddress || display.address) ? (
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={normalize(17)} color="#4F46E5" style={{ marginRight: normalize(3) }} />
              <Text style={styles.address}>{resolvedAddress || display.address}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

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
    top: normalize(0, 'height'),
    left: normalize(16),
    zIndex: 10,
    width: normalize(38),
    height: normalize(38),
    borderRadius: normalize(19),
    backgroundColor: '#ffffff',
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
