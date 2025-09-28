import { useState, useEffect, useCallback } from 'react';

// 미슐랭 레스토랑 데이터를 가져오는 훅
export const useRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🍽️ 미슐랭 레스토랑 데이터 로딩 시작...');
      
      const response = await fetch('/michelin_restaurants.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: 데이터를 불러오는데 실패했습니다.`);
      }
      
      const data = await response.json();
      
      // 데이터 유효성 검사
      if (!Array.isArray(data)) {
        throw new Error('데이터 형식이 올바르지 않습니다.');
      }
      
      console.log(`✅ ${data.length}개 레스토랑 데이터 로드 완료`);
      
      // 첫 번째 레스토랑의 images 필드 확인
      if (data.length > 0) {
        console.log(`🔍 첫 번째 레스토랑 데이터 확인:`, {
          name: data[0].name,
          hasImages: !!data[0].images,
          imagesLength: data[0].images?.length,
          firstImage: data[0].images?.[0]
        });
      }
      
      setRestaurants(data);
      
    } catch (err) {
      const errorMessage = err.message || '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      console.error('❌ 레스토랑 데이터 로드 실패:', err);
      
      // 빈 배열로 초기화하여 앱이 크래시되지 않도록 함
      setRestaurants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  // 수동으로 데이터 다시 로드하는 함수
  const refetch = useCallback(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  return { 
    restaurants, 
    loading, 
    error, 
    refetch 
  };
};