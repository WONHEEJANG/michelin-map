import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Map from '../../organisms/Map/Map';
import RestaurantFilter from '../../organisms/RestaurantFilter/RestaurantFilter';
import RestaurantCard from '../../organisms/RestaurantCard/RestaurantCard';
import { colors, spacing } from '../../tokens';

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
  background: ${colors.background.primary};
  border-bottom: 1px solid ${colors.border.primary};
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
`;

const HeaderTitle = styled.h1`
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: ${colors.text.primary};
  display: flex;
  align-items: center;
  gap: ${spacing[3]};
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
  z-index: 1000;
  display: flex;
  justify-content: center;
`;

const MichelinMapPage = ({ 
  restaurants = [],
  onRestaurantsLoad 
}) => {
  const [filteredRestaurants, setFilteredRestaurants] = useState(restaurants);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true);

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
  }, []);

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
  }, []);


  return (
    <PageContainer>
      <Header>
        <HeaderTitle>
          🍽️ 서울 미슐랭 가이드
        </HeaderTitle>
      </Header>
      
      <MapSection>
        <Map
          restaurants={filteredRestaurants}
          onRestaurantSelect={handleRestaurantSelect}
          onLocationUpdate={handleLocationUpdate}
          onFilterToggle={handleFilterToggle}
          onMapClick={handleMapClick}
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
      </MapSection>
    </PageContainer>
  );
};

MichelinMapPage.propTypes = {
  restaurants: PropTypes.array,
  onRestaurantsLoad: PropTypes.func,
};

export default MichelinMapPage;
