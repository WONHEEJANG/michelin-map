// 주소를 좌표로 변환하는 유틸리티 함수들

// 서울 구별 대략적인 중심 좌표
const districtCoords = {
  '강남구': { lat: 37.5172, lng: 127.0473 },
  '서초구': { lat: 37.4837, lng: 127.0324 },
  '중구': { lat: 37.5636, lng: 126.9970 },
  '종로구': { lat: 37.5735, lng: 126.9788 },
  '마포구': { lat: 37.5663, lng: 126.9019 },
  '용산구': { lat: 37.5384, lng: 126.9654 },
  '성동구': { lat: 37.5636, lng: 127.0365 },
  '송파구': { lat: 37.5145, lng: 127.1058 },
  '영등포구': { lat: 37.5264, lng: 126.8962 },
  '광진구': { lat: 37.5384, lng: 127.0823 },
  '서대문구': { lat: 37.5791, lng: 126.9368 },
  '성북구': { lat: 37.5894, lng: 127.0167 },
  '강동구': { lat: 37.5301, lng: 127.1238 },
  '강서구': { lat: 37.5509, lng: 126.8226 },
  '관악구': { lat: 37.4784, lng: 126.9516 },
  '금천구': { lat: 37.4519, lng: 126.9020 },
  '노원구': { lat: 37.6542, lng: 127.0568 },
  '도봉구': { lat: 37.6688, lng: 127.0471 },
  '동대문구': { lat: 37.5838, lng: 127.0507 },
  '동작구': { lat: 37.5124, lng: 126.9395 },
  '은평구': { lat: 37.6028, lng: 126.9291 }
};

// 주소에서 구 정보를 추출하여 좌표 반환
export const geocodeAddress = (address) => {
  if (!address) return null;

  // 주소에서 구 정보 찾기
  for (const [district, coords] of Object.entries(districtCoords)) {
    if (address.includes(district)) {
      // 구 내에서 랜덤한 위치 생성 (더 정확한 위치를 위해)
      const lat = coords.lat + (Math.random() - 0.5) * 0.01;
      const lng = coords.lng + (Math.random() - 0.5) * 0.01;
      return { lat, lng };
    }
  }

  // 구를 찾지 못한 경우 서울 중심 좌표 반환
  return { lat: 37.5665, lng: 126.9780 };
};

// 카카오맵 LatLng 객체 생성
export const createLatLng = (coords) => {
  if (!window.kakao || !window.kakao.maps) return null;
  return new window.kakao.maps.LatLng(coords.lat, coords.lng);
};
