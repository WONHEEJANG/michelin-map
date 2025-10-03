import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Map from '../../organisms/Map/Map';
import RestaurantFilter from '../../organisms/RestaurantFilter/RestaurantFilter';
import RestaurantCard from '../../organisms/RestaurantCard/RestaurantCard';
import NearbyRestaurants from '../../organisms/NearbyRestaurants/NearbyRestaurants';
import { filterRestaurantsInBounds, sortRestaurantsByDistance, getMapBounds } from '../../../utils/mapUtils';
import { geocodeAddress } from '../../../utils/geocoding';
import { colors, spacing, shadows, borderRadius } from '../../tokens';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: ${colors.background.secondary};
`;

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  background: ${colors.liquid.glass};
  border-bottom: 1px solid ${colors.border.glass};
  box-shadow: ${shadows.glass};
  z-index: 1000;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    opacity: 0.8;
    pointer-events: none;
  }
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: ${colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${spacing[3]};
  position: relative;
  z-index: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: -8px;
    right: -8px;
    bottom: -4px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
    border-radius: ${borderRadius.lg};
    opacity: 0.6;
    z-index: -1;
  }
`;

const MapSection = styled.div`
  position: relative;
  flex: 1;
  overflow: hidden;
`;

const RestaurantCardContainer = styled.div`
  position: absolute;
  bottom: ${spacing[5]};
  left: ${spacing[5]};
  right: ${spacing[5]};
  z-index: 1100; // NearbyRestaurants보다 높은 z-index로 설정
  display: flex;
  justify-content: center;
  user-select: none;
  -webkit-user-drag: none;
  -webkit-touch-callout: none;
`;

const MichelinMapPage = ({ 
  restaurants = [],
  onRestaurantsLoad 
}) => {
  const [filteredRestaurants, setFilteredRestaurants] = useState(restaurants);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);
  const [isNearbyVisible, setIsNearbyVisible] = useState(false);
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const mapInstanceRef = useRef(null);
  const [restaurantsWithCoords, setRestaurantsWithCoords] = useState([]);
  const [markersLoaded, setMarkersLoaded] = useState(false);
  const [filterMarkersFunction, setFilterMarkersFunction] = useState(null);

  // 초기 데이터 로드
  useEffect(() => {
    if (restaurants.length > 0) {
      setFilteredRestaurants(restaurants);
    }
  }, [restaurants]);

  // 필터 변경 핸들러
  const handleFilterChange = useCallback((filtered) => {
    setFilteredRestaurants(filtered);
    setSelectedRestaurant(null); // 필터 변경 시 선택된 레스토랑 초기화
    
    // 마커 필터링 함수가 있으면 호출
    if (filterMarkersFunction) {
      console.log('마커 필터링 실행:', filtered.length, '개');
      filterMarkersFunction(filtered);
    }
  }, [filterMarkersFunction]);

  // 레스토랑 선택 핸들러
  const handleRestaurantSelect = useCallback((restaurant) => {
    setSelectedRestaurant(restaurant);
  }, []);

  // 레스토랑 카드 닫기 핸들러
  const handleRestaurantClose = useCallback(() => {
    setSelectedRestaurant(null);
  }, []);

  // 위치 업데이트 핸들러
  const handleLocationUpdate = useCallback((location) => {
    setCurrentLocation(location);
  }, []);

  // 필터 토글 핸들러
  const handleFilterToggle = useCallback(() => {
    setIsFilterCollapsed(prev => !prev);
  }, []);

  // 지도 클릭 핸들러 (필터와 카드 접기)
  const handleMapClick = useCallback(() => {
    setIsFilterCollapsed(true);
    setSelectedRestaurant(null);
    setIsNearbyVisible(false);
  }, []);

  // 내 주변 음식점 업데이트
  const updateNearbyRestaurants = useCallback(() => {
    if (!mapInstanceRef.current || !window.kakao || !window.kakao.maps) {
      console.log('맵 인스턴스가 없어서 내 주변 음식점을 업데이트할 수 없습니다.');
      return;
    }
    
    try {
      // 현재 맵의 경계 정보 가져오기
      const mapBounds = getMapBounds(mapInstanceRef.current);
      console.log('현재 맵 경계:', mapBounds);
      
      // 실제 지도에 표시되는 마커들의 좌표를 사용
      const restaurantsToFilter = restaurantsWithCoords.length > 0 ? restaurantsWithCoords : filteredRestaurants;
      const restaurantsWithValidCoords = restaurantsToFilter.filter(restaurant => 
        restaurant.lat && restaurant.lng
      );
      
      console.log(`전체 음식점: ${filteredRestaurants.length}개`);
      console.log(`좌표가 있는 음식점: ${restaurantsWithValidCoords.length}개`);
      
      // 맵 경계 내의 음식점들 필터링
      const nearby = filterRestaurantsInBounds(restaurantsWithValidCoords, mapBounds);
      console.log(`맵 영역 내 음식점: ${nearby.length}개`);
      console.log('맵 경계:', mapBounds);
      console.log('필터링된 음식점들:', nearby.map(r => ({ 
        name: r.name, 
        lat: r.lat, 
        lng: r.lng 
      })));
      
      // 현재 위치가 있으면 거리순으로 정렬
      if (currentLocation) {
        const sorted = sortRestaurantsByDistance(nearby, currentLocation);
        setNearbyRestaurants(sorted);
      } else {
        setNearbyRestaurants(nearby);
      }
    } catch (error) {
      console.error('내 주변 음식점 업데이트 실패:', error);
      setNearbyRestaurants([]);
    }
  }, [filteredRestaurants, restaurantsWithCoords, currentLocation]);

  // 내 주변 미쉐린 토글 핸들러
  const handleNearbyToggle = useCallback(() => {
    if (!markersLoaded) {
      console.log('마커가 아직 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    setIsNearbyVisible(prev => !prev);
    if (!isNearbyVisible) {
      // 현재 맵 영역의 음식점들을 필터링
      updateNearbyRestaurants();
    }
  }, [isNearbyVisible, markersLoaded, updateNearbyRestaurants]);

  // 현재 지도에서 찾기 핸들러
  const handleShowFilteredRestaurants = useCallback(() => {
    if (!markersLoaded) {
      console.log('마커가 아직 로딩 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    console.log('필터링된 음식점들:', filteredRestaurants);
    
    // 필터링된 음식점들을 지도에 마커로 표시
    if (filteredRestaurants.length > 0) {
      console.log(`${filteredRestaurants.length}개의 필터링된 음식점을 지도에 표시합니다.`);
      
      // Map 컴포넌트에 필터링된 음식점들을 전달하면
      // useEffect에서 자동으로 마커가 업데이트됩니다.
      // 추가적인 로직은 필요하지 않습니다.
    } else {
      console.log('표시할 필터링된 음식점이 없습니다.');
    }
  }, [markersLoaded, filteredRestaurants]);

  // 현재 지도 영역 내의 음식점들 핸들러
  const handleRestaurantsInCurrentBounds = useCallback((restaurantsInBounds) => {
    console.log('현재 지도 영역 내 음식점들:', restaurantsInBounds);
    console.log(`현재 지도에 표시된 음식점: ${restaurantsInBounds.length}개`);
    
    // 현재 위치가 있으면 거리순으로 정렬
    if (currentLocation) {
      const sorted = sortRestaurantsByDistance(restaurantsInBounds, currentLocation);
      setNearbyRestaurants(sorted);
      console.log('거리순 정렬된 음식점들:', sorted);
    } else {
      setNearbyRestaurants(restaurantsInBounds);
      console.log('정렬되지 않은 음식점들:', restaurantsInBounds);
    }
    
    // 내 주변 미쉐린 패널을 표시
    console.log('isNearbyVisible을 true로 설정합니다');
    setIsNearbyVisible(true);
  }, [currentLocation]);

  // 내 주변 음식점에서 레스토랑 선택 핸들러
  const handleNearbyRestaurantSelect = useCallback((restaurant) => {
    setSelectedRestaurant(restaurant);
    // NearbyRestaurants는 유지하고 음식점만 선택
    // setIsNearbyVisible(false); // 이 줄을 제거하여 패널이 유지되도록 함
  }, []);

  // 맵 인스턴스 받기 핸들러
  const handleMapReady = useCallback((mapInstance) => {
    mapInstanceRef.current = mapInstance;
    console.log('맵 인스턴스가 준비되었습니다.');
    
    // 내 주변 미쉐린이 열려있으면 업데이트
    if (isNearbyVisible) {
      updateNearbyRestaurants();
    }
  }, [isNearbyVisible, updateNearbyRestaurants]);

  // 좌표가 있는 음식점들 업데이트 핸들러
  const handleRestaurantsWithCoords = useCallback((restaurants) => {
    setRestaurantsWithCoords(restaurants);
    console.log(`좌표가 있는 음식점 업데이트: ${restaurants.length}개`);
  }, []);

  // 마커 로딩 완료 핸들러
  const handleMarkersLoaded = useCallback((loaded) => {
    setMarkersLoaded(loaded);
    console.log(`마커 로딩 상태: ${loaded ? '완료' : '진행중'}`);
  }, []);

  // 필터링 함수 받기 핸들러
  const handleFilterMarkers = useCallback((filterFn) => {
    setFilterMarkersFunction(() => filterFn);
    console.log('필터링 함수를 받았습니다.');
  }, []);

  // isNearbyVisible 상태 변화 추적
  useEffect(() => {
    console.log('isNearbyVisible 상태 변화:', isNearbyVisible);
    console.log('nearbyRestaurants 상태:', nearbyRestaurants);
  }, [isNearbyVisible, nearbyRestaurants]);


  return (
    <PageContainer>
      <MapSection>
        <Map
          restaurants={restaurants}
          onRestaurantSelect={handleRestaurantSelect}
          onLocationUpdate={handleLocationUpdate}
          onFilterToggle={handleFilterToggle}
          onMapClick={handleMapClick}
          onNearbyToggle={handleNearbyToggle}
          onShowFilteredRestaurants={handleShowFilteredRestaurants}
          onRestaurantsInCurrentBounds={handleRestaurantsInCurrentBounds}
          onMapReady={handleMapReady}
          onRestaurantsWithCoords={handleRestaurantsWithCoords}
          onMarkersLoaded={handleMarkersLoaded}
          onFilterMarkers={handleFilterMarkers}
        />
        
        <RestaurantFilter
          restaurants={restaurants}
          onFilterChange={handleFilterChange}
          isCollapsed={isFilterCollapsed}
          onToggleCollapse={handleFilterToggle}
        />
        
        {selectedRestaurant && (
          <RestaurantCardContainer>
            <RestaurantCard
              restaurant={selectedRestaurant}
              onClose={handleRestaurantClose}
              onSelect={handleRestaurantSelect}
            />
          </RestaurantCardContainer>
        )}
        
        <NearbyRestaurants
          restaurants={nearbyRestaurants}
          isVisible={isNearbyVisible}
          onClose={() => {
            console.log('NearbyRestaurants 닫기 버튼 클릭');
            setIsNearbyVisible(false);
          }}
          onRestaurantSelect={handleNearbyRestaurantSelect}
        />
      </MapSection>
    </PageContainer>
  );
};

MichelinMapPage.propTypes = {
  restaurants: PropTypes.array,
  onRestaurantsLoad: PropTypes.func,
};

export default MichelinMapPage;
