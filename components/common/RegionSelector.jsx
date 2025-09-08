// components/common/RegionSelector.jsx , 지역 선택 컴포넌트.
import React from 'react';
import { REGION_MAP, PROVINCE_MAP } from './regionMap';
import ToggleSelector from './ToggleSelector';

export default function RegionSelector({
  selectedProvince,
  selectedCity,
  onProvinceChange,
  onCityChange,
  onCompleteSelect,
}) {
  // 🔹 도 목록: '선택없음' 포함하여 표시 (광역시는 DB에 구현안됨)
  const removedProvinces = ['부산', '대구', '인천', '광주', '대전', '울산', '세종'];
  const provinceNames = ['선택없음', ...Object.keys(REGION_MAP).filter(p => !removedProvinces.includes(p))];

  // 🔹 selectedProvince 코드 → 한글로 역매핑
  const selectedKorProvince = Object.entries(PROVINCE_MAP).find(
    ([kor, code]) => code === selectedProvince
  )?.[0];

  // 🔹 해당 도에 포함된 시 목록
  const cities = selectedKorProvince ? REGION_MAP[selectedKorProvince] : [];

  const handleProvinceSelect = (korName) => {
  const enumValue = PROVINCE_MAP[korName] || '';
  onProvinceChange(enumValue);
  onCityChange('');
  // ✅ 도만 골라도 다음으로
  if (onCompleteSelect) setTimeout(() => onCompleteSelect(), 100);
};

const handleCitySelect = (korName) => {
  const city = cities.find((c) => c.name === korName);
  onCityChange(city?.code || '');
  // ✅ 시 선택 후 다음으로
  if (onCompleteSelect) setTimeout(() => onCompleteSelect(), 100);
};

  return (
    <>
      {/* 🔸 도 선택 */}
      <ToggleSelector
        items={provinceNames}
        selectedItem={
          selectedProvince === 'NONE'
            ? '선택없음'
            : selectedKorProvince || ''
        }
        onSelect={handleProvinceSelect}
        disableOnNone={true}
        size="large"
      />

      {/* 🔸 시 선택 (도 선택 시만 표시) */}
      {selectedProvince !== 'NONE' && selectedProvince && cities.length > 0 && (
        <ToggleSelector
          items={['선택없음', ...cities.map((c) => c.name)]}
          selectedItem={
            selectedCity === 'NONE'
              ? '선택없음'
              : cities.find((c) => c.code === selectedCity)?.name || ''
          }
          onSelect={handleCitySelect}
          disableOnNone={true}
          size="small"
        />
      )}
    </>
  );
}
