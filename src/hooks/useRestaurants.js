import { useState, useEffect } from 'react';

// 미슐랭 레스토랑 데이터를 가져오는 훅
export const useRestaurants = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);
        const response = await fetch('/michelin_restaurants.json');
        if (!response.ok) {
          throw new Error('데이터를 불러오는데 실패했습니다.');
        }
        const data = await response.json();
        setRestaurants(data);
        setError(null);
      } catch (err) {
        setError(err.message);
        console.error('레스토랑 데이터 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  return { restaurants, loading, error };
};
