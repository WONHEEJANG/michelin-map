import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRestaurants } from '../../hooks/useRestaurants';
import { geocodeAddress, createLatLng } from '../../utils/geocoding';
import RestaurantCard from '../RestaurantCard/RestaurantCard';
import RestaurantFilter from '../RestaurantFilter/RestaurantFilter';
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

  // 카카오맵 API 로딩 확인
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 30;
    
    const checkKakaoAPI = () => {
      attempts++;
      console.log(`카카오맵 API 확인 시도 ${attempts}/${maxAttempts}`);
      
      // kakao.maps.load() 완료 후에만 API 사용 가능
      if (window.kakao && 
          window.kakao.maps && 
          window.kakao.maps.LatLng && 
          typeof window.kakao.maps.LatLng === 'function' &&
          window.kakao.maps.Map &&
          typeof window.kakao.maps.Map === 'function') {
        console.log('카카오맵 API 완전 로드 완료');
        console.log('사용 가능한 API:', {
          LatLng: !!window.kakao.maps.LatLng,
          Map: !!window.kakao.maps.Map,
          LatLngBounds: !!window.kakao.maps.LatLngBounds,
          MapTypeControl: !!window.kakao.maps.MapTypeControl,
          ZoomControl: !!window.kakao.maps.ZoomControl
        });
        setIsLoaded(true);
        setApiError(false);
      } else if (attempts < maxAttempts) {
        console.log(`카카오맵 API 로딩 시도 중... (${attempts}/${maxAttempts})`);
        console.log('현재 상태:', {
          hasKakao: !!window.kakao,
          hasMaps: !!(window.kakao && window.kakao.maps),
          hasLatLng: !!(window.kakao && window.kakao.maps && window.kakao.maps.LatLng),
          hasMap: !!(window.kakao && window.kakao.maps && window.kakao.maps.Map),
          LatLngType: window.kakao?.maps?.LatLng ? typeof window.kakao.maps.LatLng : 'undefined',
          MapType: window.kakao?.maps?.Map ? typeof window.kakao.maps.Map : 'undefined'
        });
        setTimeout(checkKakaoAPI, 300); // 간격을 300ms로 늘림
      } else {
        console.error('카카오맵 API 로딩 시간 초과');
        console.error('최종 상태:', {
          hasKakao: !!window.kakao,
          hasMaps: !!(window.kakao && window.kakao.maps),
          hasLatLng: !!(window.kakao && window.kakao.maps && window.kakao.maps.LatLng),
          hasMap: !!(window.kakao && window.kakao.maps && window.kakao.maps.Map)
        });
        setIsLoaded(false);
        setApiError(true);
      }
    };
    
    // 초기 지연 후 확인 시작 (kakao.maps.load() 완료를 기다림)
    setTimeout(checkKakaoAPI, 500);
  }, []);

  // 지도 초기화 - 더 안전한 타이밍 체크
  useEffect(() => {
    console.log('지도 초기화 useEffect 실행:', { isLoaded, hasMap: !!map, hasRef: !!mapRef.current });
    
    if (isLoaded && !map && mapRef.current) {
      console.log('지도 초기화 조건 만족, 타이머 시작');
      
      let resizeObserver = null;
      let retryCount = 0;
      const maxRetries = 5;
      
      const tryInitMap = () => {
        console.log('지도 초기화 시도:', {
          hasRef: !!mapRef.current,
          width: mapRef.current?.offsetWidth,
          height: mapRef.current?.offsetHeight,
          retryCount
        });
        
        if (mapRef.current && mapRef.current.offsetWidth > 0 && mapRef.current.offsetHeight > 0) {
          console.log('지도 초기화 시작');
          initMap();
          if (resizeObserver) {
            resizeObserver.disconnect();
          }
        } else if (retryCount < maxRetries) {
          retryCount++;
          console.warn(`지도 컨테이너 크기가 0입니다. 재시도 ${retryCount}/${maxRetries}...`, {
            width: mapRef.current?.offsetWidth,
            height: mapRef.current?.offsetHeight
          });
          
          // ResizeObserver로 크기 변화 감지
          if (window.ResizeObserver && mapRef.current) {
            resizeObserver = new ResizeObserver((entries) => {
              for (let entry of entries) {
                if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                  console.log('컨테이너 크기 변화 감지, 지도 초기화 재시도');
                  tryInitMap();
                }
              }
            });
            resizeObserver.observe(mapRef.current);
          }
          
          // 백업 타이머
          setTimeout(tryInitMap, 500);
        } else {
          console.error('최대 재시도 횟수 초과. 지도 초기화 실패');
          if (resizeObserver) {
            resizeObserver.disconnect();
          }
        }
      };
      
      // 초기 지연 후 시도
      const timer = setTimeout(tryInitMap, 100);
      
      return () => {
        clearTimeout(timer);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
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
    console.log('initMap 함수 호출됨');
    
    // API 완전 로드 확인
    if (!window.kakao || !window.kakao.maps || !window.kakao.maps.LatLng || typeof window.kakao.maps.LatLng !== 'function') {
      console.error('카카오맵 API가 완전히 로드되지 않았습니다.');
      console.error('API 상태:', {
        hasKakao: !!window.kakao,
        hasMaps: !!(window.kakao && window.kakao.maps),
        hasLatLng: !!(window.kakao && window.kakao.maps && window.kakao.maps.LatLng),
        LatLngType: window.kakao?.maps?.LatLng ? typeof window.kakao.maps.LatLng : 'undefined'
      });
      return;
    }

    if (!mapRef.current) {
      console.error('지도 컨테이너가 없습니다.');
      return;
    }

    // 컨테이너 크기 확인
    const containerWidth = mapRef.current.offsetWidth;
    const containerHeight = mapRef.current.offsetHeight;
    
    console.log('컨테이너 크기 확인:', { width: containerWidth, height: containerHeight });
    
    if (containerWidth === 0 || containerHeight === 0) {
      console.error('지도 컨테이너 크기가 0입니다:', {
        width: containerWidth,
        height: containerHeight
      });
      return;
    }

    try {
      console.log('지도 초기화 시작...', {
        containerSize: {
          width: containerWidth,
          height: containerHeight
        },
        kakaoMaps: !!window.kakao.maps
      });

      // 서울 중심 좌표 (시청 근처)
      const center = new window.kakao.maps.LatLng(37.5665, 126.9780);
      
      const options = {
        center: center,
        level: 6, // 기본 줌 레벨 (도/시 단위)
        minLevel: 1,  // 최소 줌 레벨 (전국 단위)
        maxLevel: 20  // 최대 줌 레벨 (매우 상세하게 볼 수 있도록)
      };

      console.log('카카오맵 Map 객체 생성 중...');
      const newMap = new window.kakao.maps.Map(mapRef.current, options);
      console.log('카카오맵 Map 객체 생성 완료:', newMap);
      
      // 지도 컨트롤 추가
      console.log('지도 컨트롤 추가 중...');
      const mapTypeControl = new window.kakao.maps.MapTypeControl();
      newMap.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);
      
      const zoomControl = new window.kakao.maps.ZoomControl();
      newMap.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
      
      // 지도 이동 제한 제거 - 전국 어디든 이동 가능
      // newMap.setBounds() 제거
      
      // 지도 드래그 제한 제거 - 자유로운 이동과 줌
      // newMap.setMinLevel() 제거
      // newMap.setMaxLevel() 제거
      
      // 줌 레벨 변경 이벤트 등록
      window.kakao.maps.event.addListener(newMap, 'zoom_changed', function() {
        const currentLevel = newMap.getLevel();
        console.log(`🔍 현재 지도 줌 레벨: ${currentLevel}`);
      });
      
      console.log('지도 설정 완료, state 업데이트 중...');
      setMap(newMap);
      console.log('서울 중심 지도 초기화 완료');
      
      // 지도가 실제로 렌더링되었는지 확인
      setTimeout(() => {
        console.log('지도 렌더링 검증 시작...');
        if (newMap && mapRef.current) {
          // 카카오맵이 생성하는 실제 DOM 요소 확인
          const mapContainer = mapRef.current.querySelector('div[id*="kakao"]') || 
                              mapRef.current.querySelector('.kakao-map') ||
                              mapRef.current.firstChild;
          
          console.log('지도 컨테이너 DOM 검색 결과:', {
            hasMapContainer: !!mapContainer,
            containerTagName: mapContainer?.tagName,
            containerId: mapContainer?.id,
            containerClass: mapContainer?.className,
            containerChildren: mapContainer?.children?.length || 0
          });
          
          if (mapContainer) {
            console.log('지도 DOM 요소 확인됨');
          } else {
            console.warn('지도 DOM 요소를 찾을 수 없습니다. 지도가 제대로 렌더링되지 않았을 수 있습니다.');
            console.log('mapRef.current 내용:', mapRef.current.innerHTML);
          }
        }
      }, 200);
      
    } catch (error) {
      console.error('지도 초기화 실패:', error);
      setApiError(true);
    }
  };


  const getMarkerImage = (rating) => {
    if (!window.kakao || !window.kakao.maps) return null;
    
        // 4등급 체계: 3, 2, 1, 기타 (bib, small, shop, 0)
        const colors = {
          '3 Stars': '#D10F0F',  // 가장 진한 빨간색
          '2 Stars': '#E24949',  // 진한 빨간색
          '1 Star': '#FFB2B2',   // 중간 빨간색
          '기타': '#B3B3B3'      // 가장 연한 빨간색 (bib, small, shop, 0)
        };

    let color = '#B3B3B3'; // 기본값: 기타 등급
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
      <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
        <circle cx="15" cy="15" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="15" cy="15" r="6" fill="white"/>
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
              const imageSize = new window.kakao.maps.Size(30, 30);
              const imageOption = { offset: new window.kakao.maps.Point(15, 15) };
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

  // 현재 위치 가져오기
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('이 브라우저는 위치 서비스를 지원하지 않습니다.');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5분
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log('현재 위치 가져오기 성공:', { latitude, longitude });
        
        const location = {
          lat: latitude,
          lng: longitude
        };
        
        setCurrentLocation(location);
        setIsGettingLocation(false);
        
        // 지도가 있으면 현재 위치로 이동
        if (map) {
          moveToCurrentLocation(location);
        }
      },
      (error) => {
        console.error('위치 가져오기 실패:', error);
        let errorMessage = '위치를 가져올 수 없습니다.';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 요청 시간이 초과되었습니다.';
            break;
        }
        
        setLocationError(errorMessage);
        setIsGettingLocation(false);
      },
      options
    );
  };

  // 현재 위치로 지도 이동
  const moveToCurrentLocation = (location) => {
    if (!map || !window.kakao || !window.kakao.maps) return;

    try {
      const position = new window.kakao.maps.LatLng(location.lat, location.lng);
      
      // 지도 중심을 현재 위치로 이동
      map.setCenter(position);
      map.setLevel(6); // 기본 줌 레벨 (도/시 단위)
      
      // 현재 위치 마커 추가
      addCurrentLocationMarker(position);
      
      console.log('현재 위치로 지도 이동 완료');
    } catch (error) {
      console.error('현재 위치로 이동 실패:', error);
    }
  };

  // 현재 위치 마커 추가
  const addCurrentLocationMarker = (position) => {
    if (!map || !window.kakao || !window.kakao.maps) return;

    try {
      // 기존 현재 위치 마커 제거
      const existingMarker = markers.find(marker => marker.getTitle() === '현재 위치');
      if (existingMarker) {
        existingMarker.setMap(null);
      }

      // 현재 위치 마커 이미지 생성
      const markerImageSrc = 'data:image/svg+xml;base64,' + btoa(`
        <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
          <circle cx="20" cy="20" r="18" fill="#4285f4" stroke="white" stroke-width="4"/>
          <circle cx="20" cy="20" r="8" fill="white"/>
          <circle cx="20" cy="20" r="4" fill="#4285f4"/>
        </svg>
      `);

      const imageSize = new window.kakao.maps.Size(40, 40);
      const imageOption = { offset: new window.kakao.maps.Point(20, 20) };
      const markerImage = new window.kakao.maps.MarkerImage(markerImageSrc, imageSize, imageOption);

      // 현재 위치 마커 생성
      const currentLocationMarker = new window.kakao.maps.Marker({
        position: position,
        image: markerImage,
        title: '현재 위치'
      });

      currentLocationMarker.setMap(map);

      // 마커 배열에 추가
      setMarkers(prev => [...prev.filter(marker => marker.getTitle() !== '현재 위치'), currentLocationMarker]);

      console.log('현재 위치 마커 추가 완료');
    } catch (error) {
      console.error('현재 위치 마커 추가 실패:', error);
    }
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
