# 🚀 Vercel 배포 가이드

## 1. Vercel 계정 준비
1. [vercel.com](https://vercel.com)에 접속
2. GitHub 계정으로 로그인
3. "New Project" 클릭

## 2. GitHub 저장소 연결
1. GitHub 저장소 선택
2. 프로젝트 이름 설정 (예: `michelin-map`)
3. "Deploy" 클릭

## 3. 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수를 설정:

```
REACT_APP_KAKAO_MAP_API_KEY=your_kakao_api_key_here
```

## 4. 빌드 설정 확인
- **Framework Preset**: Create React App
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Install Command**: `npm install`

## 5. 배포 완료
- 자동으로 빌드가 시작됩니다
- 빌드 완료 후 배포 URL이 제공됩니다
- 예: `https://michelin-map.vercel.app`

## 6. 도메인 설정 (선택사항)
- Vercel 대시보드에서 커스텀 도메인 설정 가능
- SSL 인증서 자동 적용

## 7. 자동 배포 설정
- GitHub에 push할 때마다 자동 배포
- Pull Request별로 미리보기 배포
- 프로덕션/스테이징 환경 분리 가능

## 🔧 문제 해결

### 빌드 실패 시
1. `npm run build` 로컬에서 테스트
2. Vercel 로그 확인
3. 환경 변수 설정 확인

### 카카오맵 API 오류 시
1. API 키 유효성 확인
2. 도메인 등록 확인 (카카오 개발자 콘솔)
3. CORS 설정 확인

## 📱 모바일 최적화
- 반응형 디자인 적용됨
- 터치 제스처 지원
- 모바일 브라우저 호환성 확인

## 🚀 성능 최적화
- Vercel CDN 자동 적용
- 이미지 최적화
- 코드 스플리팅
- 캐싱 최적화
