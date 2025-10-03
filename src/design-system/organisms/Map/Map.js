import React, { useEffect, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Button from '../../atoms/Button/Button';
import { geocodeAddress, createLatLng } from '../../../utils/geocoding';
import { colors, spacing, borderRadius, shadows } from '../../tokens';

const MapContainer = styled.div`
  position: relative;
  height: calc(100vh - 80px);
  min-height: 400px;
  width: 100%;
`;

const MapElement = styled.div`
  width: 100%;
  height: 100%;
  min-height: 400px;
  background: ${colors.gray[100]};
`;

const ControlButtons = styled.div`
  position: absolute;
  top: ${spacing[5]};
  right: ${spacing[5]};
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: ${spacing[3]};
`;

const ControlButton = styled(Button)`
  box-shadow: ${shadows.glass};
  min-width: 100px;
  height: 48px;
  padding: ${spacing[2]} ${spacing[3]};
  font-size: 14px;
  font-weight: 500;
  background: ${colors.liquid.glass};
  border: 1px solid ${colors.border.glass};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: ${colors.text.primary};
  
  span {
    font-size: 16px;
    margin-right: ${spacing[1]};
  }
  
  &:hover {
    background: ${colors.liquid.glassHover};
    transform: translateY(-2px);
    box-shadow: ${shadows.glassHover};
  }
  
  &:active {
    background: ${colors.liquid.glassActive};
    transform: translateY(0);
    box-shadow: ${shadows.glassActive};
  }
`;

const LocationError = styled.div`
  position: absolute;
  top: ${spacing[5]};
  right: ${spacing[5]};
  z-index: 1000;
  padding: ${spacing[3]} ${spacing[4]};
  background: ${colors.semantic.error};
  color: ${colors.text.inverse};
  border-radius: ${borderRadius.base};
  font-size: 14px;
  box-shadow: ${shadows.lg};
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  gap: ${spacing[4]};
`;

const LoadingText = styled.div`
  font-size: 18px;
  font-weight: 600;
  color: ${colors.text.primary};
  text-align: center;
`;

const LoadingProgress = styled.div`
  font-size: 14px;
  color: ${colors.text.secondary};
  text-align: center;
`;

const Map = ({
  restaurants = [],
  onRestaurantSelect,
  onLocationUpdate,
  onFilterToggle,
  onMapClick,
  onNearbyToggle,
  onShowFilteredRestaurants,
  onMapReady,
  onRestaurantsWithCoords,
  onMarkersLoaded,
  onRestaurantsInCurrentBounds,
  className 
}) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(false);
  const [markersLoaded, setMarkersLoaded] = useState(false);

  // 카카오맵 API 로드 확인
  const checkKakaoAPI = useCallback(() => {
    return window.kakao && 
           window.kakao.maps && 
           window.kakao.maps.LatLng && 
           window.kakao.maps.Map &&
           typeof window.kakao.maps.LatLng === 'function' &&
           typeof window.kakao.maps.Map === 'function';
  }, []);

  // 현재 위치 마커 이미지 생성
  const createCurrentLocationMarkerImage = useCallback(() => {
    const svg = `
      <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="${colors.primary[600]}" stroke="white" stroke-width="3"/>
        <circle cx="20" cy="20" r="8" fill="white"/>
        <circle cx="20" cy="20" r="4" fill="${colors.primary[600]}"/>
      </svg>
    `;
    return new window.kakao.maps.MarkerImage(
      'data:image/svg+xml;base64,' + btoa(svg),
      new window.kakao.maps.Size(40, 40),
      { offset: new window.kakao.maps.Point(20, 20) }
    );
  }, []);

  // 현재 위치 마커 추가
  const addCurrentLocationMarker = useCallback(() => {
    if (!mapInstance.current || !currentLocation) return;

    // 기존 현재 위치 마커 제거
    markersRef.current.forEach(marker => {
      if (marker.isCurrentLocation) {
        marker.setMap(null);
      }
    });
    markersRef.current = markersRef.current.filter(marker => !marker.isCurrentLocation);

    // 현재 위치 마커 생성
    const position = new window.kakao.maps.LatLng(currentLocation.lat, currentLocation.lng);
    
    const marker = new window.kakao.maps.Marker({
      position: position,
      image: createCurrentLocationMarkerImage(),
    });
    
    marker.isCurrentLocation = true;
    marker.setMap(mapInstance.current);
    markersRef.current.push(marker);
  }, [currentLocation, createCurrentLocationMarkerImage]);


  // 현재 위치 가져오기
  const getCurrentLocation = useCallback(() => {
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
        
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }
        
        // 위치를 가져온 즉시 해당 위치로 이동
        if (mapInstance.current) {
          const center = new window.kakao.maps.LatLng(latitude, longitude);
          mapInstance.current.setCenter(center);
          mapInstance.current.setLevel(6);
          
          // 현재 위치 마커 추가
          addCurrentLocationMarker();
        }
      },
      (error) => {
        let errorMessage = '위치를 가져올 수 없습니다.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 권한이 거부되었습니다.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 요청이 시간 초과되었습니다.';
            break;
          default:
            break;
        }
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, [onLocationUpdate, addCurrentLocationMarker]);

  // 마커 이미지 생성
  const getMarkerImage = useCallback((rating) => {
    if (!checkKakaoAPI()) return null;

    const michelinColors = {
      '3 Stars': colors.michelin['3-stars'],
      '2 Stars': colors.michelin['2-stars'],
      '1 Star': colors.michelin['1-star'],
      '기타': colors.michelin.other
    };

    let color = michelinColors['기타'];
    if (rating.includes('3 Stars')) {
      color = michelinColors['3 Stars'];
    } else if (rating.includes('2 Stars')) {
      color = michelinColors['2 Stars'];
    } else if (rating.includes('1 Star')) {
      color = michelinColors['1 Star'];
    } else {
      color = michelinColors['기타']; // Bib Gourmand, Small Shop, 0 Star 모두 기타로 분류
    }

    const svg = `
      <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="15" cy="15" r="6" fill="white"/>
      </svg>
    `;

    return new window.kakao.maps.MarkerImage(
      'data:image/svg+xml;base64,' + btoa(svg),
      new window.kakao.maps.Size(30, 30),
      { offset: new window.kakao.maps.Point(15, 15) }
    );
  }, [checkKakaoAPI]);

  // 지도 초기화
  const initMap = useCallback(() => {
    if (!checkKakaoAPI() || !mapRef.current) return;

    const container = mapRef.current;
    const options = {
      center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심
      level: 6,
      minLevel: 1,
      maxLevel: 20
    };

    mapInstance.current = new window.kakao.maps.Map(container, options);

    // 줌 레벨 변경 이벤트
    window.kakao.maps.event.addListener(mapInstance.current, 'zoom_changed', () => {
      const level = mapInstance.current.getLevel();
      console.log('현재 줌 레벨:', level);
    });

    // 지도 이동 이벤트 (드래그, 줌 등)
    window.kakao.maps.event.addListener(mapInstance.current, 'dragend', () => {
      if (onMapReady) {
        onMapReady(mapInstance.current);
      }
    });

    window.kakao.maps.event.addListener(mapInstance.current, 'zoom_changed', () => {
      if (onMapReady) {
        onMapReady(mapInstance.current);
      }
    });

    // 지도 클릭 이벤트
    window.kakao.maps.event.addListener(mapInstance.current, 'click', () => {
      if (onMapClick) {
        onMapClick();
      }
    });

    // 맵 초기화 완료 시 부모에게 전달
    if (onMapReady) {
      onMapReady(mapInstance.current);
    }
  }, [checkKakaoAPI]);

  // 현재 지도에 표시된 마커들의 음식점 정보 가져오기
  const getRestaurantsInCurrentBounds = useCallback(() => {
    if (!mapInstance.current || !checkKakaoAPI()) {
      console.log('지도 초기화 또는 API 확인 실패');
      return [];
    }

    const bounds = mapInstance.current.getBounds();
    const swLatLng = bounds.getSouthWest();
    const neLatLng = bounds.getNorthEast();
    
    console.log('현재 지도 경계:', {
      남서쪽: { lat: swLatLng.getLat(), lng: swLatLng.getLng() },
      북동쪽: { lat: neLatLng.getLat(), lng: neLatLng.getLng() }
    });

    // 현재 지도에 표시된 마커들 중에서 경계 내에 있는 것들만 필터링
    const restaurantsInBounds = [];
    
    markersRef.current.forEach(marker => {
      const position = marker.getPosition();
      const lat = position.getLat();
      const lng = position.getLng();
      
      // 현재 지도 경계 내에 있는지 확인
      if (lat >= swLatLng.getLat() && lat <= neLatLng.getLat() &&
          lng >= swLatLng.getLng() && lng <= neLatLng.getLng()) {
        
        // 마커에 저장된 음식점 정보 가져오기
        const restaurantData = marker.getData();
        if (restaurantData) {
          restaurantsInBounds.push({
            ...restaurantData,
            lat,
            lng
          });
        }
      }
    });
    
    console.log(`현재 지도에 표시된 음식점: ${restaurantsInBounds.length}개`);
    return restaurantsInBounds;
  }, []);

  // 마커들을 지도에 추가
  const addMarkersToMap = useCallback(async () => {
    if (!mapInstance.current || !checkKakaoAPI()) {
      console.log('지도 초기화 또는 API 확인 실패');
      return;
    }

    console.log('마커 추가 시작, 레스토랑 수:', restaurants.length);
    setIsLoadingMarkers(true);
    setMarkersLoaded(false);

    // 기존 마커들 제거 (현재 위치 마커 제외)
    markersRef.current.forEach(marker => {
      if (!marker.isCurrentLocation) {
        marker.setMap(null);
      }
    });
    markersRef.current = markersRef.current.filter(marker => marker.isCurrentLocation);

    // 레스토랑 마커들 추가
    let addedCount = 0;
    const restaurantsWithCoords = [];
    
    for (let i = 0; i < restaurants.length; i++) {
      const restaurant = restaurants[i];
      
      try {
        // 주소를 좌표로 변환
        const coordinates = await geocodeAddress(restaurant.address);
        
        if (coordinates) {
          const position = new window.kakao.maps.LatLng(coordinates.lat, coordinates.lng);
          const marker = new window.kakao.maps.Marker({
            position: position,
            image: getMarkerImage(restaurant.rating),
          });

          // 마커 클릭 이벤트
          window.kakao.maps.event.addListener(marker, 'click', () => {
            if (onRestaurantSelect) {
              console.log(`🎯 마커 클릭: ${restaurant.name}`, {
                hasImages: !!restaurant.images,
                imagesLength: restaurant.images?.length,
                firstImage: restaurant.images?.[0]
              });
              onRestaurantSelect(restaurant);
            }
          });

          marker.setMap(mapInstance.current);
          markersRef.current.push(marker);
          addedCount++;
          
          // 좌표가 변환된 음식점을 배열에 추가 (images 필드 포함)
          restaurantsWithCoords.push({
            ...restaurant,
            lat: coordinates.lat,
            lng: coordinates.lng
          });
          
          console.log(`마커 추가: ${restaurant.name} (${coordinates.lat}, ${coordinates.lng})`);
        } else {
          console.log(`좌표 변환 실패: ${restaurant.name}`);
        }
      } catch (error) {
        console.log(`에러: ${restaurant.name}`, error);
      }
    }
    
    console.log(`총 ${addedCount}개 마커 추가됨`);
    setIsLoadingMarkers(false);
    setMarkersLoaded(true);
    
    // 좌표가 있는 음식점들을 부모에게 전달
    if (onRestaurantsWithCoords) {
      console.log(`좌표가 변환된 음식점 ${restaurantsWithCoords.length}개를 부모에게 전달`);
      onRestaurantsWithCoords(restaurantsWithCoords);
    }
    
    // 마커 로딩 완료를 부모에게 알림
    if (onMarkersLoaded) {
      onMarkersLoaded(true);
    }
  }, [restaurants, onRestaurantSelect, getMarkerImage, checkKakaoAPI, onRestaurantsWithCoords, onMarkersLoaded]);

  // 지도 초기화 및 마커 추가
  useEffect(() => {
    const initMapWithRetry = () => {
      if (checkKakaoAPI()) {
        initMap();
        setTimeout(() => {
          addMarkersToMap();
        }, 100);
      } else {
        setTimeout(initMapWithRetry, 100);
      }
    };

    // DOM이 완전히 렌더링된 후 실행
    const timer = setTimeout(initMapWithRetry, 100);

    // ResizeObserver로 컨테이너 크기 변화 감지
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstance.current && mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          mapInstance.current.relayout();
        }
      }
    });

    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }

    return () => {
      clearTimeout(timer);
      resizeObserver.disconnect();
    };
  }, [initMap, addMarkersToMap, checkKakaoAPI]);

  // 레스토랑 데이터가 변경될 때 마커 업데이트
  useEffect(() => {
    if (mapInstance.current) {
      addMarkersToMap();
    }
  }, [addMarkersToMap, restaurants]);

  // 현재 위치가 변경될 때 마커 추가
  useEffect(() => {
    if (mapInstance.current && currentLocation) {
      addCurrentLocationMarker();
    }
  }, [currentLocation, addCurrentLocationMarker]);

  return (
    <MapContainer className={className}>
      <MapElement ref={mapRef} />
      
      {isLoadingMarkers && (
        <LoadingOverlay>
          <LoadingText>🍽️ 미슐랭 레스토랑 위치를 찾는 중이에요</LoadingText>
          <LoadingProgress>
            {restaurants.length}개 레스토랑의 정확한 좌표를 변환하고 있어요
          </LoadingProgress>
        </LoadingOverlay>
      )}
      
      <ControlButtons>
        <ControlButton
          variant="glass"
          size="sm"
          onClick={onFilterToggle}
          icon={<span>🔍</span>}
        >
          필터
        </ControlButton>
        
        <ControlButton
          variant="glass"
          size="sm"
          onClick={getCurrentLocation}
          disabled={isGettingLocation}
          icon={<span>📍</span>}
        >
          {isGettingLocation ? '위치 확인 중...' : '내 위치'}
        </ControlButton>
        
        <ControlButton
          variant="glass"
          size="sm"
          onClick={async () => {
            const restaurantsInBounds = await getRestaurantsInCurrentBounds();
            if (onRestaurantsInCurrentBounds) {
              onRestaurantsInCurrentBounds(restaurantsInBounds);
            }
          }}
          disabled={!markersLoaded}
          icon={<span>🍽️</span>}
        >
          {markersLoaded ? '현재 지도에서 찾기' : '로딩 중...'}
        </ControlButton>
      </ControlButtons>
      
      {locationError && (
        <LocationError>
          {locationError}
        </LocationError>
      )}
    </MapContainer>
  );
};

Map.propTypes = {
  restaurants: PropTypes.array,
  onRestaurantSelect: PropTypes.func,
  onLocationUpdate: PropTypes.func,
  onFilterToggle: PropTypes.func,
  onMapClick: PropTypes.func,
  onNearbyToggle: PropTypes.func,
  onMapReady: PropTypes.func,
  onRestaurantsWithCoords: PropTypes.func,
  onMarkersLoaded: PropTypes.func,
  className: PropTypes.string,
};

export default Map;