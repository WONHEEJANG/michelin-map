// 카카오맵 API 설정
export const KAKAO_MAP_API_KEY = process.env.KAKAO_MAP_API_KEY;

// 디버깅용 로그
console.log('🔑 카카오맵 API 키 확인:', {
  hasKey: !!KAKAO_MAP_API_KEY,
  keyLength: KAKAO_MAP_API_KEY?.length,
  keyPrefix: KAKAO_MAP_API_KEY?.substring(0, 8) + '...'
});

// 카카오맵 API 로드 함수
export const loadKakaoMapAPI = () => {
  return new Promise((resolve, reject) => {
    // 이미 로드된 경우
    if (window.kakao && window.kakao.maps) {
      resolve();
      return;
    }

    // API 키 유효성 검사
    if (!KAKAO_MAP_API_KEY) {
      console.error('카카오맵 API 키가 설정되지 않았습니다. 환경 변수 KAKAO_MAP_API_KEY를 확인해주세요.');
      reject(new Error('API key not configured'));
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
      console.error('API 키:', KAKAO_MAP_API_KEY);
      console.error('스크립트 URL:', script.src);
      reject(error);
    };
    
    document.head.appendChild(script);
  });
};
