// 커뮤니티 게시글-상세보기- 이미지 가로 리스트 (사진 인디케이터 점.  dot 포함)
// components/common/PostImageCarousel.jsx
import React, { useState, useEffect } from 'react';
import { View, Image, FlatList, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_WIDTH = 390;
const scale = (size) => (SCREEN_WIDTH / BASE_WIDTH) * size;

const FIXED_HEIGHT = SCREEN_WIDTH * 0.8;

// [Mock] 테스트용 로컬 이미지 경로 (assets/images/ 폴더 기준)
const testImages = [
  // require('../../../assets/images/testImage1.png'),
  // require('../../../assets/images/testImage2.png'),
];

export default function PostImageCarousel({ images = testImages }) {
  const [imgSizes, setImgSizes] = useState([]);

  useEffect(() => {
    // 로컬 이미지는 require로 import하면 width/height를 바로 알 수 없음
    // => Image.getSize는 네트워크 URI에서만 동작하므로
    // 로컬은 Image.resolveAssetSource로 해결
    const resolveSize = (img) => {
      if (typeof img === 'number') {
        const source = Image.resolveAssetSource(img);
        return { w: source.width, h: source.height };
      }
      // 네트워크 이미지 (URL)
      return new Promise((resolve) => {
        Image.getSize(
          img,
          (w, h) => resolve({ w, h }),
          () => resolve({ w: SCREEN_WIDTH, h: FIXED_HEIGHT })
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

  // 현재 인덱스(도트표시)
  const [currentIndex, setCurrentIndex] = useState(0);
  const onScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(idx);
  };

  return (
    <View>
      <FlatList
        data={images}
        renderItem={({ item, index }) => {
          const size = imgSizes[index];
          if (!size) {
            // 이미지 사이즈 로딩 중 placeholder
            return (
              <View style={{ width: SCREEN_WIDTH, height: FIXED_HEIGHT, backgroundColor: '#C4C4C4' }} />
            );
          }
          
          // 이미지 비율 계산 (가로/세로)
          const aspectRatio = size.w / size.h;
          let imgWidth = SCREEN_WIDTH;
          let imgHeight = FIXED_HEIGHT;

          // 가로/세로 중 더 맞는 쪽으로 조정(비율 유지)
          if (aspectRatio > 1) {
            // 가로로 긴 사진
            imgWidth = SCREEN_WIDTH;
            imgHeight = SCREEN_WIDTH / aspectRatio;
            if (imgHeight > FIXED_HEIGHT) imgHeight = FIXED_HEIGHT;
          } else {
            // 세로로 긴 사진
            imgHeight = FIXED_HEIGHT;
            imgWidth = imgHeight * aspectRatio;
            if (imgWidth > SCREEN_WIDTH) imgWidth = SCREEN_WIDTH;
          }

          return (
            <View
              style={{
                width: SCREEN_WIDTH,
                height: FIXED_HEIGHT,
                backgroundColor: '#FAFAFA', // '#C4C4C4' 사진첨부 프레임 색상
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Image
                source={typeof item === 'string' ? { uri: item } : item}
                style={{
                  width: imgWidth,
                  height: imgHeight,
                  borderRadius: scale(4),
                }}
                resizeMode="contain"
              />
            </View>
          );
        }}
        keyExtractor={(_, i) => i.toString()}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        snapToInterval={SCREEN_WIDTH}
        decelerationRate="fast"
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
