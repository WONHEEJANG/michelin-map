import React from 'react';
import MichelinMapPage from './design-system/pages/MichelinMapPage/MichelinMapPage';
import { useRestaurants } from './hooks/useRestaurants';
import './styles/App.css';

function App() {
  const { restaurants, loading, error } = useRestaurants();

  if (loading) {
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

  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#E24949'
      }}>
        ❌ 데이터를 불러오는 중 오류가 발생했습니다: {error}
      </div>
    );
  }

  return (
    <div className="App">
      <MichelinMapPage restaurants={restaurants} />
    </div>
  );
}

export default App;
