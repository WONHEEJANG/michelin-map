// 주소를 좌표로 변환하는 유틸리티 함수들

// 주소 정규화 함수
const normalizeAddress = (address) => {
  if (!address) return null;
  
  // 영어 주소를 한국어로 변환
  let normalizedAddress = address
    .replace(/Seoul, \d+, 한국/g, '') // Seoul, 03930, 한국 제거
    .replace(/Seoul/g, '') // Seoul 제거
    .replace(/, \d{5}, 한국/g, '') // , 03930, 한국 제거
    .replace(/, 한국/g, '') // , 한국 제거
    .trim();
  
  // 서울이 앞에 없는 경우 추가
  if (!normalizedAddress.includes('서울') && !normalizedAddress.includes('Seoul')) {
    normalizedAddress = '서울특별시 ' + normalizedAddress;
  }
  
  // 이미 서울특별시가 포함된 경우 중복 제거
  if (normalizedAddress.includes('서울특별시') && normalizedAddress.split('서울특별시').length > 2) {
    normalizedAddress = normalizedAddress.replace(/서울특별시\s*/, '').trim();
    normalizedAddress = '서울특별시 ' + normalizedAddress;
  }
  
  return normalizedAddress;
};

// Vercel Serverless Function을 통한 주소-좌표 변환
export const geocodeAddress = async (address) => {
  try {
    if (!address) {
      return null;
    }

    // 주소 정규화
    const normalizedAddress = normalizeAddress(address);

    // Vercel API Route 호출
    const response = await fetch(`/api/geocode?query=${encodeURIComponent(normalizedAddress)}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.documents && data.documents.length > 0) {
      // 여러 결과 중 가장 정확한 결과 선택
      let bestResult = data.documents[0];
      
      // 도로명 주소가 있는 경우 우선 선택
      for (const item of data.documents) {
        if (item.road_address && item.road_address.building_name) {
          bestResult = item;
          break;
        }
      }
      
      return {
        lat: parseFloat(bestResult.y),
        lng: parseFloat(bestResult.x)
      };
    } else {
      // 실패 시 서울 중심 좌표 반환
      return { lat: 37.5665, lng: 126.9780 };
    }
  } catch (error) {
    console.error('Geocoding error:', error);
    // 실패 시 서울 중심 좌표 반환
    return { lat: 37.5665, lng: 126.9780 };
  }
};

// 카카오맵 LatLng 객체 생성
export const createLatLng = (coords) => {
  if (!window.kakao || !window.kakao.maps) return null;
  return new window.kakao.maps.LatLng(coords.lat, coords.lng);
};
