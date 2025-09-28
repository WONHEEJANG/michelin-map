/**
 * 맵 관련 유틸리티 함수들
 */

/**
 * 현재 맵 영역 내에 있는 음식점들을 필터링
 * @param {Array} restaurants - 전체 음식점 배열
 * @param {Object} mapBounds - 맵의 경계 정보 {north, south, east, west}
 * @returns {Array} - 현재 맵 영역 내의 음식점 배열
 */
export const filterRestaurantsInBounds = (restaurants, mapBounds) => {
  if (!mapBounds || !restaurants) return [];
  
  return restaurants.filter(restaurant => {
    if (!restaurant.lat || !restaurant.lng) return false;
    
    const { lat, lng } = restaurant;
    const { north, south, east, west } = mapBounds;
    
    return lat >= south && lat <= north && lng >= west && lng <= east;
  });
};

/**
 * 카카오맵의 경계 정보를 가져오는 함수
 * @param {Object} map - 카카오맵 인스턴스
 * @returns {Object} - 경계 정보 {north, south, east, west}
 */
export const getMapBounds = (map) => {
  if (!map) return null;
  
  const bounds = map.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();
  
  return {
    north: ne.getLat(),
    south: sw.getLat(),
    east: ne.getLng(),
    west: sw.getLng()
  };
};

/**
 * 거리 기반으로 음식점들을 정렬
 * @param {Array} restaurants - 음식점 배열
 * @param {Object} center - 중심점 {lat, lng}
 * @returns {Array} - 거리순으로 정렬된 음식점 배열
 */
export const sortRestaurantsByDistance = (restaurants, center) => {
  if (!center) return restaurants;
  
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // 지구의 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  return restaurants.map(restaurant => ({
    ...restaurant,
    distance: calculateDistance(center.lat, center.lng, restaurant.lat, restaurant.lng)
  })).sort((a, b) => a.distance - b.distance);
};
