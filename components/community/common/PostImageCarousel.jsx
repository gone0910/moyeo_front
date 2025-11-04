// components/common/PostImageCarousel.jsx
import React, { useState, useEffect } from 'react';
import { View, Image, FlatList, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;

// ⬇️ [추가] 부모(PostDetailScreen)의 카드 마진 값을 정의합니다.
const HORIZONTAL_MARGIN = scale(16);
// ⬇️ [추가] 캐러셀이 사용 가능한 실제 너비를 계산합니다.
const ACTUAL_WIDTH = SCREEN_WIDTH - (HORIZONTAL_MARGIN * 2);

// ⬇️ [수정] 실제 너비를 기준으로 높이를 계산합니다.
const FIXED_HEIGHT = ACTUAL_WIDTH * 0.8; 

// [Mock] 테스트용 로컬 이미지 경로
const testImages = [];

export default function PostImageCarousel({ images = testImages }) {
  const [imgSizes, setImgSizes] = useState([]);

  useEffect(() => {
    const resolveSize = (img) => {
      if (typeof img === 'number') {
        const source = Image.resolveAssetSource(img);
        return { w: source.width, h: source.height };
      }
      return new Promise((resolve) => {
        Image.getSize(
          img,
          (w, h) => resolve({ w, h }),
          // ⬇️ [수정] SCREEN_WIDTH -> ACTUAL_WIDTH
          () => resolve({ w: ACTUAL_WIDTH, h: FIXED_HEIGHT })
        );
      });
    };

    Promise.all(
      images.map((img) =>
        typeof img === 'number'
          ? Promise.resolve(resolveSize(img))
          : resolveSize(img)
      )
    ).then((sizes) => setImgSizes(sizes));
  }, [images]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const onScroll = (e) => {
    // ⬇️ [수정] SCREEN_WIDTH -> ACTUAL_WIDTH
    const idx = Math.round(e.nativeEvent.contentOffset.x / ACTUAL_WIDTH);
    setCurrentIndex(idx);
  };

  // ⬇️ [참고] images가 비어있으면(0) 컴포넌트 자체를 렌더링하지 않습니다.
  if (!images || images.length === 0) {
    return null;
  }

  return (
    <View>
      <FlatList
        data={images}
        renderItem={({ item, index }) => {
          const size = imgSizes[index];
          if (!size) {
            return (
              // ⬇️ [수정] SCREEN_WIDTH -> ACTUAL_WIDTH
              <View style={{ width: ACTUAL_WIDTH, height: FIXED_HEIGHT, backgroundColor: '#C4C4C4' }} />
            );
          }
          
          const aspectRatio = size.w / size.h;
          let imgWidth = ACTUAL_WIDTH; // ⬇️ [수정]
          let imgHeight = FIXED_HEIGHT;

          if (aspectRatio > 1) {
            imgWidth = ACTUAL_WIDTH; // ⬇️ [수정]
            imgHeight = ACTUAL_WIDTH / aspectRatio; // ⬇️ [수정]
            if (imgHeight > FIXED_HEIGHT) imgHeight = FIXED_HEIGHT;
          } else {
            imgHeight = FIXED_HEIGHT;
            imgWidth = imgHeight * aspectRatio;
            if (imgWidth > ACTUAL_WIDTH) imgWidth = ACTUAL_WIDTH; // ⬇️ [수정]
          }

          return (
            <View
              style={{
                // ⬇️ [수정] SCREEN_WIDTH -> ACTUAL_WIDTH
                width: ACTUAL_WIDTH,
                height: FIXED_HEIGHT,
                backgroundColor: '#ffffff',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Image
                source={typeof item === 'string' ? { uri: item } : item}
                style={{
                  // ⬇️ [수정] 너비/높이 기준을 ACTUAL_WIDTH로 변경
                  width: ACTUAL_WIDTH,
                  height: FIXED_HEIGHT,
                  maxWidth: ACTUAL_WIDTH,
                  maxHeight: FIXED_HEIGHT,
                  borderRadius: scale(4),
                }}
                resizeMode="contain" // ★ 비율 유지는 이 속성이 담당
              />
            </View>
          );
        }}
        keyExtractor={(_, i) => i.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        // ⬇️ [수정] 스냅 간격을 실제 너비로 변경
        snapToInterval={ACTUAL_WIDTH}
        decelerationRate="fast"
        scrollEnabled={images.length > 1}
      />
      <View style={styles.dotContainer}>
        {images.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.dot,
              idx === currentIndex && styles.activeDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: scale(8),
  },
  dot: {
    width: scale(8),
    height: scale(8),
    borderRadius: scale(4),
    backgroundColor: '#D9D9D9',
    marginHorizontal: scale(2),
  },
  activeDot: {
    backgroundColor: '#616161',
  },
});