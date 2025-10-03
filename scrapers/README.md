# 🍽️ 미슐랭 가이드 스크래퍼

이 폴더는 미슐랭 가이드 웹사이트에서 레스토랑 데이터를 수집하는 Python 스크래핑 도구들을 포함합니다.

## 📁 파일 구조

```
scrapers/
├── michelin_scraper_ultra_fast.py  # 고성능 멀티스레드 스크래퍼
├── michelin_scraper.py             # 기본 스크래퍼
├── convert_images_auto.py          # 이미지 변환 및 최적화 도구
├── requirements.txt                # Python 의존성 패키지
└── README.md                       # 이 파일
```

## 🚀 주요 기능

### 1. Ultra Fast Scraper (`michelin_scraper_ultra_fast.py`)
- **멀티스레딩**: 4개 워커로 병렬 처리
- **Selenium 드라이버 풀**: 4개 드라이버 재사용으로 성능 최적화
- **이미지 다운로드**: 레스토랑 이미지 자동 수집 및 로컬 저장
- **데이터 정규화**: 주소, 가격, 카테고리 표준화
- **에러 처리**: 강력한 예외 처리 및 재시도 로직

### 2. 기본 스크래퍼 (`michelin_scraper.py`)
- 단일 스레드 기반의 안정적인 스크래핑
- 기본적인 데이터 수집 기능
- 디버깅 및 테스트용

### 3. 이미지 변환 도구 (`convert_images_auto.py`)
- 다운로드된 이미지 포맷 통일
- 이미지 압축 및 최적화
- 파일명 정규화

## 🛠️ 설치 및 실행

### 1. 의존성 설치
```bash
cd scrapers
pip install -r requirements.txt
```

### 2. 스크래핑 실행
```bash
# 고성능 스크래퍼 실행
python michelin_scraper_ultra_fast.py

# 기본 스크래퍼 실행
python michelin_scraper.py
```

### 3. 이미지 변환
```bash
python convert_images_auto.py
```

## 📊 수집되는 데이터

각 레스토랑에 대해 다음 정보를 수집합니다:

```json
{
  "name": "레스토랑 이름",
  "address": "주소",
  "price": "가격대 (₩, ₩₩, ₩₩₩)",
  "category": "음식 카테고리",
  "rating": "미슐랭 등급 (3 Stars, 2 Stars, 1 Star, Bib Gourmand 등)",
  "url": "미슐랭 공식 페이지 URL",
  "images": [
    {
      "url": "이미지 원본 URL",
      "local_path": "로컬 저장 경로",
      "filename": "파일명"
    }
  ]
}
```

## ⚙️ 설정 옵션

### Ultra Fast Scraper 설정
```python
# 워커 수 조정
max_workers = 4

# 드라이버 풀 크기 조정
driver_pool_size = 4

# 이미지 다운로드 여부
download_images = True

# 최대 재시도 횟수
max_retries = 3
```

## 🔧 기술 스택

- **Python 3.8+**
- **Selenium**: 동적 웹 페이지 크롤링
- **BeautifulSoup**: HTML 파싱
- **Requests**: HTTP 요청
- **Pillow**: 이미지 처리
- **WebDriver Manager**: Chrome 드라이버 자동 관리

## 📝 주의사항

1. **로봇 배제 표준 준수**: 웹사이트의 robots.txt를 확인하고 적절한 지연 시간을 설정하세요.
2. **API 제한**: 과도한 요청으로 인한 IP 차단을 방지하기 위해 적절한 지연 시간을 설정하세요.
3. **법적 고려사항**: 웹 스크래핑 시 해당 웹사이트의 이용약관을 확인하세요.
4. **데이터 사용**: 수집된 데이터는 개인적 용도로만 사용하세요.

## 🐛 문제 해결

### Chrome 드라이버 오류
```bash
# Chrome 드라이버 재설치
pip install --upgrade webdriver-manager
```

### 메모리 부족 오류
- `max_workers` 수를 줄이세요
- `driver_pool_size`를 줄이세요

### 네트워크 오류
- 인터넷 연결을 확인하세요
- 방화벽 설정을 확인하세요
- 프록시 설정이 필요한 경우 코드를 수정하세요

## 📈 성능 최적화

1. **멀티스레딩**: CPU 코어 수에 맞게 워커 수 조정
2. **드라이버 풀**: 드라이버 재사용으로 초기화 시간 단축
3. **이미지 압축**: Pillow를 사용한 이미지 최적화
4. **메모리 관리**: 적절한 가비지 컬렉션 및 메모리 해제

## 📞 지원

문제가 발생하거나 개선 사항이 있으시면 이슈를 등록해주세요.
