import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRestaurants } from '../../hooks/useRestaurants';
import { geocodeAddress, createLatLng } from '../../utils/geocoding';
import RestaurantCard from '../../design-system/organisms/RestaurantCard/RestaurantCard';
import RestaurantFilter from '../../design-system/organisms/RestaurantFilter/RestaurantFilter';
import './MichelinMap.css';

const MichelinMap = () => {
  const mapRef = useRef(null);
  const { restaurants, loading, error } = useRestaurants();
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // 카카오맵 API 로딩 확인 (간소화)
  useEffect(() => {
    const checkKakaoAPI = () => {
      if (window.kakao?.maps?.LatLng && window.kakao?.maps?.Map) {
        setIsLoaded(true);
        setApiError(false);
      } else {
        setTimeout(checkKakaoAPI, 500);
      }
    };
    
    setTimeout(checkKakaoAPI, 1000);
  }, []);

  // 지도 초기화 (간소화)
  useEffect(() => {
    if (isLoaded && !map && mapRef.current) {
      const timer = setTimeout(() => {
        if (mapRef.current?.offsetWidth > 0) {
          initMap();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isLoaded, map]);

  // 초기 레스토랑 데이터 설정
  useEffect(() => {
    if (restaurants.length > 0 && filteredRestaurants.length === 0) {
      console.log('초기 레스토랑 데이터 설정:', restaurants.length, '개');
      setFilteredRestaurants(restaurants);
    }
  }, [restaurants, filteredRestaurants.length]);

  // 필터된 레스토랑이 변경되면 마커 업데이트
  useEffect(() => {
    if (map && filteredRestaurants.length > 0) {
      addMarkersToMap(filteredRestaurants);
    }
  }, [map, filteredRestaurants]);

  const initMap = () => {
    if (!window.kakao?.maps?.LatLng || !mapRef.current) return;

    try {
      const center = new window.kakao.maps.LatLng(37.5665, 126.9780);
      const options = {
        center: center,
        level: 6,
        minLevel: 1,
        maxLevel: 20
      };

      const newMap = new window.kakao.maps.Map(mapRef.current, options);
      
      // 지도 컨트롤 추가
      const mapTypeControl = new window.kakao.maps.MapTypeControl();
      newMap.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);
      
      const zoomControl = new window.kakao.maps.ZoomControl();
      newMap.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
      
      setMap(newMap);
    } catch (error) {
      console.error('지도 초기화 실패:', error);
      setApiError(true);
    }
  };


  const getMarkerImage = (rating) => {
    if (!window.kakao || !window.kakao.maps) return null;
    
    // 4등급 체계: 3, 2, 1, 기타 (bib, small, shop, 0)
    const colors = {
      '3 Stars': 'rgba(209, 15, 15, 0.9)',  // 가장 진한 빨간색
      '2 Stars': 'rgba(226, 73, 73, 0.9)',  // 진한 빨간색
      '1 Star': 'rgba(255, 178, 178, 0.9)',   // 중간 빨간색
      '기타': 'rgba(179, 179, 179, 0.9)'      // 가장 연한 빨간색 (bib, small, shop, 0)
    };

    let color = 'rgba(179, 179, 179, 0.9)'; // 기본값: 기타 등급
    if (rating.includes('3 Stars')) {
      color = colors['3 Stars'];
    } else if (rating.includes('2 Stars')) {
      color = colors['2 Stars'];
    } else if (rating.includes('1 Star')) {
      color = colors['1 Star'];
    } else {
      color = colors['기타']; // Bib Gourmand, Small Shop, 0 Star 모두 기타로 분류
    }

    const svg = `
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glassEffect" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2"/>
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.4 0"/>
          </filter>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="innerGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <!-- 외부 그림자 -->
        <circle cx="20" cy="20" r="16" fill="rgba(0, 0, 0, 0.3)" filter="url(#glassEffect)"/>
        <!-- 메인 원 배경 -->
        <circle cx="20" cy="20" r="14" fill="rgba(255, 255, 255, 0.1)" stroke="rgba(255, 255, 255, 0.3)" stroke-width="1"/>
        <!-- 메인 원 -->
        <circle cx="20" cy="20" r="12" fill="${color}" stroke="rgba(255, 255, 255, 0.9)" stroke-width="2" filter="url(#glow)"/>
        <!-- 내부 원 -->
        <circle cx="20" cy="20" r="7" fill="rgba(255, 255, 255, 0.9)" filter="url(#innerGlow)"/>
        <!-- 하이라이트 -->
        <circle cx="18" cy="18" r="2.5" fill="rgba(255, 255, 255, 0.8)"/>
        <!-- 반사 효과 -->
        <ellipse cx="18" cy="16" rx="3" ry="1.5" fill="rgba(255, 255, 255, 0.4)"/>
      </svg>
    `;
    
    return 'data:image/svg+xml;base64,' + btoa(svg);
  };

  const addMarkersToMap = (restaurantList) => {
    if (!map || !window.kakao || !window.kakao.maps) return;

    try {
      // 기존 마커 제거
      markers.forEach(marker => marker.setMap(null));
      const newMarkers = [];

      restaurantList.forEach(restaurant => {
        const coords = geocodeAddress(restaurant.address);
        if (coords) {
          const position = createLatLng(coords);
          if (position) {
            const imageSrc = getMarkerImage(restaurant.rating);
            if (imageSrc) {
              const imageSize = new window.kakao.maps.Size(40, 40);
              const imageOption = { offset: new window.kakao.maps.Point(20, 20) };
              const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize, imageOption);

              const marker = new window.kakao.maps.Marker({
                position: position,
                image: markerImage,
                title: restaurant.name
              });

              // 마커 클릭 이벤트
              window.kakao.maps.event.addListener(marker, 'click', function() {
                setSelectedRestaurant(restaurant);
                // 지도 위치와 줌 레벨 모두 유지 (setCenter, setLevel 제거)
              });

              marker.setMap(map);
              newMarkers.push(marker);
            }
          }
        }
      });

      setMarkers(newMarkers);
    } catch (error) {
      console.error('마커 추가 실패:', error);
    }
  };

  const handleFilterChange = useCallback((filtered) => {
    console.log('필터 변경 감지, 필터된 레스토랑 수:', filtered.length);
    setFilteredRestaurants(filtered);
  }, []);

  const handleRestaurantSelect = (restaurant) => {
    setSelectedRestaurant(restaurant);
    // 지도 위치와 줌 레벨 모두 유지 (setCenter, setLevel 제거)
  };

  const closeRestaurantCard = () => {
    setSelectedRestaurant(null);
  };

  // 현재 위치 가져오기 (간소화)
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        setCurrentLocation(location);
        setIsGettingLocation(false);
        
        if (map) {
          const position = new window.kakao.maps.LatLng(location.lat, location.lng);
          map.setCenter(position);
          map.setLevel(6);
        }
      },
      (error) => {
        setLocationError('위치를 가져올 수 없습니다.');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (loading) {
    return (
      <div className="michelin-map">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>미슐랭 레스토랑 데이터를 불러오는 중...</p>
          <p style={{fontSize: '12px', color: '#999', marginTop: '8px'}}>
            JSON 파일에서 데이터를 로딩 중입니다...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="michelin-map">
        <div className="error-container">
          <h3>❌ 데이터 로드 실패</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="michelin-map">
      <div className="map-header">
        <h1>🍽️ 서울 미슐랭 가이드</h1>
        <div className="header-actions">
          <button 
            className={`filter-toggle ${showFilter ? 'active' : ''}`}
            onClick={() => setShowFilter(!showFilter)}
          >
            🔍 필터
          </button>
          <button 
            className={`location-button ${isGettingLocation ? 'loading' : ''}`}
            onClick={getCurrentLocation}
            disabled={isGettingLocation}
            title="현재 위치로 이동"
          >
            {isGettingLocation ? '⏳' : '📍'}
          </button>
          <div className="restaurant-count">
            {filteredRestaurants.length}개 레스토랑
          </div>
        </div>
      </div>

      {showFilter && (
        <RestaurantFilter
          restaurants={restaurants}
          onFilterChange={handleFilterChange}
        />
      )}

      <div className="map-container">
        <div ref={mapRef} className="map" />
        {!isLoaded && !apiError && (
          <div className="map-loading">
            <div className="loading-spinner"></div>
            <p>지도를 불러오는 중...</p>
            <p style={{fontSize: '12px', color: '#999', marginTop: '8px'}}>
              카카오맵 API 로딩 중입니다...
            </p>
          </div>
        )}
        {apiError && (
          <div className="map-placeholder">
            <div className="placeholder-content">
              <h3>🗺️ 서울 지도 영역</h3>
              <p>카카오맵 API가 로드되면 서울 지역 지도가 표시됩니다.</p>
              <div className="sample-locations">
                <h4>서울 미슐랭 레스토랑:</h4>
                <p>총 {restaurants.length}개의 서울 레스토랑이 표시됩니다.</p>
                <p style={{fontSize: '12px', marginTop: '8px', opacity: 0.8}}>
                  강남구, 서초구, 중구, 종로구, 마포구, 용산구 등
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedRestaurant && (
        <div className="restaurant-card-overlay">
          <RestaurantCard
            restaurant={selectedRestaurant}
            onClose={closeRestaurantCard}
            onSelect={handleRestaurantSelect}
          />
        </div>
      )}

      {/* 위치 에러 메시지 */}
      {locationError && (
        <div className="location-error">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{locationError}</span>
            <button 
              className="error-close"
              onClick={() => setLocationError(null)}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MichelinMap;
