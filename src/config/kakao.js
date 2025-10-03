// 카카오맵 API 설정
export const KAKAO_MAP_API_KEY = process.env.REACT_APP_KAKAO_MAP_API_KEY || 'd0b37e1734b022c9fdf66ebf05fadcd1';

// 카카오맵 API 로드 함수
export const loadKakaoMapAPI = () => {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우
    if (window.kakao && window.kakao.maps) {
      resolve();
      return;
    }

    // API 키 유효성 검사
    if (!KAKAO_MAP_API_KEY || KAKAO_MAP_API_KEY.length < 10) {
      console.error('카카오맵 API 키가 올바르지 않습니다.');
      reject(new Error('Invalid API key'));
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_MAP_API_KEY}&libraries=services&autoload=false`;
    script.async = true;
    
    script.onload = function() {
      console.log('카카오맵 API 로드 완료');
      if (window.kakao && window.kakao.maps) {
        // autoload=false이므로 수동으로 초기화
        window.kakao.maps.load(function() {
          console.log('카카오맵 초기화 완료');
          resolve();
        });
      } else {
        reject(new Error('카카오맵 API 로드 후에도 kakao.maps가 없습니다'));
      }
    };
    
    script.onerror = function(error) {
      console.error('카카오맵 API 로드 실패:', error);
      reject(error);
    };
    
    document.head.appendChild(script);
  });
};
