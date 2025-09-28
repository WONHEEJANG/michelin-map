import React, { useEffect, useRef, useState } from 'react';
import './KakaoMapSample.css';

const KakaoMapSample = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [apiError, setApiError] = useState(false);

  // 카카오맵 API 로딩 확인
  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 50; // 5초 동안 시도
    
    const checkKakaoAPI = () => {
      attempts++;
      
      if (window.kakao && window.kakao.maps) {
        console.log('카카오맵 API 로드 완료');
        setIsLoaded(true);
        setApiError(false);
      } else if (attempts < maxAttempts) {
        console.log(`카카오맵 API 로딩 시도 중... (${attempts}/${maxAttempts})`);
        setTimeout(checkKakaoAPI, 100);
      } else {
        console.error('카카오맵 API 로딩 시간 초과');
        setIsLoaded(false);
        setApiError(true);
      }
    };
    
    checkKakaoAPI();
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (isLoaded && !map && mapRef.current) {
      initMap();
    }
  }, [isLoaded, map]);

  const initMap = () => {
    if (!window.kakao || !window.kakao.maps) return;

    try {
      // 서울 중심 좌표
      const center = new window.kakao.maps.LatLng(37.5665, 126.9780);
      
      const options = {
        center: center,
        level: 10
      };

      const newMap = new window.kakao.maps.Map(mapRef.current, options);
      
      // 지도 컨트롤 추가
      const mapTypeControl = new window.kakao.maps.MapTypeControl();
      newMap.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);
      
      const zoomControl = new window.kakao.maps.ZoomControl();
      newMap.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
      
      setMap(newMap);
      console.log('지도 초기화 완료');
    } catch (error) {
      console.error('지도 초기화 실패:', error);
      setApiError(true);
    }
  };

  // 샘플 마커 추가
  const addSampleMarkers = () => {
    if (!map || !window.kakao || !window.kakao.maps) return;

    try {
      // 기존 마커 제거
      markers.forEach(marker => marker.setMap(null));

      // 샘플 위치들
      const sampleLocations = [
        { name: '강남역', lat: 37.4979, lng: 127.0276 },
        { name: '홍대입구역', lat: 37.5563, lng: 126.9236 },
        { name: '명동', lat: 37.5636, lng: 126.9826 },
        { name: '이태원', lat: 37.5347, lng: 126.9947 },
        { name: '건대입구역', lat: 37.5403, lng: 127.0692 }
      ];

      const newMarkers = sampleLocations.map(location => {
        const position = new window.kakao.maps.LatLng(location.lat, location.lng);
        
        // 마커 이미지 생성
        const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png';
        const imageSize = new window.kakao.maps.Size(24, 35);
        const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize);

        const marker = new window.kakao.maps.Marker({
          position: position,
          image: markerImage,
          title: location.name
        });

        // 인포윈도우 생성
        const infoWindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding: 10px; text-align: center;">
                      <strong>${location.name}</strong><br>
                      <span style="font-size: 12px; color: #666;">샘플 위치입니다</span>
                    </div>`
        });

        // 마커 클릭 이벤트
        window.kakao.maps.event.addListener(marker, 'click', function() {
          infoWindow.open(map, marker);
        });

        marker.setMap(map);
        return marker;
      });

      setMarkers(newMarkers);
    } catch (error) {
      console.error('마커 추가 실패:', error);
    }
  };

  // 마커 제거
  const removeMarkers = () => {
    try {
      markers.forEach(marker => marker.setMap(null));
      setMarkers([]);
    } catch (error) {
      console.error('마커 제거 실패:', error);
    }
  };

  // 지도 중심 이동
  const moveToLocation = (lat, lng) => {
    if (!map) return;
    
    try {
      const moveLatLon = new window.kakao.maps.LatLng(lat, lng);
      map.setCenter(moveLatLon);
      map.setLevel(5);
    } catch (error) {
      console.error('지도 이동 실패:', error);
    }
  };

  return (
    <div className="kakao-map-sample">
      <h2>카카오 지도 샘플</h2>
      
      {apiError && (
        <div className="api-error">
          <h3>⚠️ 카카오맵 API 로드 실패</h3>
          <p>API 키가 유효하지 않거나 도메인이 등록되지 않았습니다.</p>
          <div className="error-solution">
            <h4>해결 방법:</h4>
            <ol>
              <li><a href="https://developers.kakao.com" target="_blank" rel="noopener noreferrer">카카오 개발자사이트</a>에서 새 앱 생성</li>
              <li>웹 플랫폼 추가 및 도메인 등록 (localhost:3000)</li>
              <li>JavaScript 키를 복사하여 public/index.html의 API_KEY에 입력</li>
            </ol>
          </div>
        </div>
      )}
      
      <div className="map-controls">
        <button onClick={addSampleMarkers} disabled={!isLoaded || apiError}>
          샘플 마커 추가
        </button>
        <button onClick={removeMarkers} disabled={!isLoaded || apiError}>
          마커 제거
        </button>
        <button onClick={() => moveToLocation(37.4979, 127.0276)} disabled={!isLoaded || apiError}>
          강남역으로 이동
        </button>
        <button onClick={() => moveToLocation(37.5563, 126.9236)} disabled={!isLoaded || apiError}>
          홍대입구역으로 이동
        </button>
      </div>

      <div className="map-container">
        <div ref={mapRef} className="map" />
        {!isLoaded && !apiError && (
          <div className="map-loading">
            <p>지도를 불러오는 중...</p>
            <div className="loading-spinner"></div>
          </div>
        )}
        {apiError && (
          <div className="map-placeholder">
            <div className="placeholder-content">
              <h3>🗺️ 지도 영역</h3>
              <p>카카오맵 API가 로드되면 여기에 지도가 표시됩니다.</p>
              <div className="sample-locations">
                <h4>샘플 위치들:</h4>
                <ul>
                  <li>강남역 (37.4979, 127.0276)</li>
                  <li>홍대입구역 (37.5563, 126.9236)</li>
                  <li>명동 (37.5636, 126.9826)</li>
                  <li>이태원 (37.5347, 126.9947)</li>
                  <li>건대입구역 (37.5403, 127.0692)</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="map-info">
        <h3>기능 설명</h3>
        <ul>
          <li>지도 확대/축소 및 드래그 가능</li>
          <li>지도 타입 변경 (일반/위성/하이브리드)</li>
          <li>샘플 마커 추가/제거</li>
          <li>마커 클릭 시 정보창 표시</li>
          <li>특정 위치로 지도 중심 이동</li>
        </ul>
      </div>
    </div>
  );
};

export default KakaoMapSample;
