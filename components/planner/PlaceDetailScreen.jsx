import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// ✅ 환경변수 import
import { KAKAO_REST_API_KEY, KAKAO_JS_KEY } from '@env';
console.log('KAKAO_JS_KEY:', KAKAO_JS_KEY);

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

  // ✅ 도로명 주소 보완용 상태값
  const [resolvedAddress, setResolvedAddress] = useState(address);

  // ✅ Kakao REST API로 도로명 주소 자동 조회
  useEffect(() => {
    const fetchAddressFromCoords = async () => {
      try {
        if (!address || address.length < 10) {
          const res = await fetch(
            `https://dapi.kakao.com/v2/local/geo/coord2address.json?x=${lng}&y=${lat}`,
            {
              headers: {
                Authorization: KAKAO_REST_API_KEY, // 환경변수 사용
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

  // ✅ Kakao 지도 HTML 코드
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
          width: 100%;
          height: 100%;
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        {/* 상단 바 */}
        <View style={styles.headerLine}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <View style={{ width: 24 }} />
        </View>

        {/* 지도 */}
        <View style={styles.mapContainer}>
          <WebView
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={{ height: 200, width: '100%' }}
            javaScriptEnabled
            domStorageEnabled
            mixedContentMode="always"
            allowFileAccess
            allowUniversalAccessFromFileURLs
            useWebKit
            scalesPageToFit
          />
        </View>

        {/* 주소 */}
        {resolvedAddress ? (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={20} color="#4F46E5" style={{ marginRight: -16 }} />
            <Text style={styles.address}>{resolvedAddress}</Text>
          </View>
        ) : null}

        {/* 이름 + 비용 */}
        <View style={styles.titleRow}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.cost}>
            {estimatedCost ? `${estimatedCost.toLocaleString()}원` : ''}
          </Text>
        </View>

        {/* 카테고리 */}
        {type ? (
          <Text style={styles.type}>{type}</Text>
        ) : null}

        {/* 한 줄 설명 */}
        {description ? (
          <View style={styles.descBox}>
            <Text style={styles.description}>{description}</Text>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAFAFA' },
  screen: { flex: 1, backgroundColor: '#FAFAFA' },
  headerLine: {
    height: 48,
    width: '90%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#999',
    backgroundColor: '#FAFAFA',
  },
  headerTitle: { fontSize: 18, color: '#000' },
  mapContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginTop: 12,
    height: 280,
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  addressRow: {
  flexDirection: 'row',
  alignItems: 'center',
  marginTop: 12,
  marginHorizontal: 20,
},
  address: {
    fontSize: 18,
    color: '#868686',
    marginTop: 8,
    marginHorizontal: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 20,
  },
  title: {
    fontSize: 30,
    color: '#111111',
  },
  cost: {
    fontSize: 20,
    color: '#4F46E5',
    fontWeight: '400',
  },
  type: {
    fontSize: 20,
    color: '#999',
    marginTop: 10,
    marginHorizontal: 20,
  },
  descBox: {
    marginTop: 16,
    marginHorizontal: 20,
  },
  description: {
    fontSize: 20,
    color: '#3f3f3f',
    lineHeight: 22,
  },
});
