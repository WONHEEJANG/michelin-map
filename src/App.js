import React, { useEffect, useState } from 'react';
import MichelinMapPage from './design-system/pages/MichelinMapPage/MichelinMapPage';
import { useRestaurants } from './hooks/useRestaurants';
import { loadKakaoMapAPI } from './config/kakao';
import './styles/App.css';

function App() {
  const { restaurants, loading, error } = useRestaurants();
  const [kakaoLoaded, setKakaoLoaded] = useState(false);
  const [kakaoError, setKakaoError] = useState(null);

  // 카카오맵 API 로드
  useEffect(() => {
    loadKakaoMapAPI()
      .then(() => {
        setKakaoLoaded(true);
      })
      .catch((err) => {
        console.error('카카오맵 API 로드 실패:', err);
        setKakaoError(err.message);
      });
  }, []);

  if (loading || !kakaoLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        🍽️ 미슐랭 레스토랑 데이터를 불러오는 중...
      </div>
    );
  }

  if (error || kakaoError) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#E24949'
      }}>
        ❌ 오류가 발생했습니다: {error || kakaoError}
      </div>
    );
  }

  return <MichelinMapPage restaurants={restaurants} />;
}

export default App;
