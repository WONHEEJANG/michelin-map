import requests
from bs4 import BeautifulSoup
import time
import json
import csv
from urllib.parse import urljoin, urlparse
import re
import os
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager

class MichelinScraper:
    def __init__(self):
        self.base_url = "https://guide.michelin.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.restaurants = []
        self.images_dir = Path("restaurant_images")
        self.images_dir.mkdir(exist_ok=True)
        self.driver = None
        
    def get_restaurant_urls(self, start_url):
        """메인 페이지에서 모든 음식점 URL 수집"""
        print("음식점 URL 수집 중...")
        restaurant_urls = set()  # 중복 제거를 위해 set 사용
        page = 1
        consecutive_empty_pages = 0
        
        while consecutive_empty_pages < 2:  # 연속으로 2페이지가 비어있으면 중단
            try:
                # 페이지별로 URL 생성 (미슐랭 가이드 URL 패턴에 맞게 수정)
                if page == 1:
                    url = start_url
                else:
                    # 실제 미슐랭 가이드의 페이지네이션 패턴 확인
                    url = f"https://guide.michelin.com/kr/ko/seoul-capital-area/kr-seoul/restaurants/page/{page}?sort=distance"
                    
                print(f"페이지 {page} 처리 중: {url}")
                response = self.session.get(url)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 음식점 카드 찾기 - 카드 컨테이너 기준으로 중복 방지
                # js-restaurant__list_item 클래스를 가진 카드 컨테이너에서 제목 링크 추출
                restaurant_cards = soup.select('.js-restaurant__list_item')
                
                print(f"선택자 '.js-restaurant__list_item'로 {len(restaurant_cards)}개 카드 발견")
                
                restaurant_links = []
                for card in restaurant_cards:
                    # 각 카드에서 제목 링크만 추출
                    title_link = card.select_one('.card__menu-content--title a[href*="/restaurant/"]')
                    if title_link:
                        restaurant_links.append(title_link)
                
                print(f"카드에서 추출한 제목 링크: {len(restaurant_links)}개")
                
                if not restaurant_links:
                    consecutive_empty_pages += 1
                    print(f"페이지 {page}에서 음식점을 찾을 수 없습니다. (연속 빈 페이지: {consecutive_empty_pages})")
                    page += 1
                    continue
                
                # 이 페이지에서 새로운 링크를 찾았으므로 카운터 리셋
                consecutive_empty_pages = 0
                page_urls = []
                
                for link in restaurant_links:
                    href = link.get('href')
                    if href and '/restaurant/' in href:
                        full_url = urljoin(self.base_url, href)
                        
                        # 전체 목록에서 이미 처리된 URL인지 확인 (제목 링크만 추출하므로 페이지 내 중복 없음)
                        if full_url not in restaurant_urls:
                            restaurant_urls.add(full_url)
                            page_urls.append(full_url)
                
                print(f"페이지 {page}에서 {len(page_urls)}개 레스토랑 발견")
                
                # 페이지네이션에서 현재 페이지 번호 확인
                pagination = soup.find('nav', {'aria-label': 'pagination'}) or soup.find('div', class_=re.compile(r'pagination'))
                if pagination:
                    # 현재 페이지가 마지막인지 확인
                    current_page_elem = pagination.find('span', class_=re.compile(r'current|active')) or \
                                       pagination.find('a', class_=re.compile(r'current|active'))
                    
                    # 다음 페이지 링크가 있는지 확인
                    all_page_links = pagination.find_all('a')
                    max_page_num = 0
                    for link in all_page_links:
                        try:
                            page_num = int(link.get_text(strip=True))
                            max_page_num = max(max_page_num, page_num)
                        except ValueError:
                            continue
                    
                    if max_page_num > 0 and page >= max_page_num:
                        print(f"페이지네이션에서 최대 페이지 {max_page_num}에 도달했습니다.")
                        break
                
                page += 1
                time.sleep(1)  # 요청 간격
                
            except Exception as e:
                print(f"페이지 {page} 처리 중 오류: {e}")
                consecutive_empty_pages += 1
                page += 1
                if consecutive_empty_pages >= 2:
                    break
        
        restaurant_urls_list = list(restaurant_urls)
        print(f"총 {len(restaurant_urls_list)}개 음식점 URL 수집 완료")
        return restaurant_urls_list
    
    def setup_selenium_driver(self):
        """Selenium 드라이버 설정"""
        if self.driver is None:
            chrome_options = Options()
            chrome_options.add_argument('--headless')  # 브라우저 창을 띄우지 않음
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            chrome_options.add_argument('--disable-gpu')
            chrome_options.add_argument('--window-size=1920,1080')
            chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            
            try:
                # webdriver-manager를 사용해서 자동으로 드라이버 다운로드 및 설정
                service = Service(ChromeDriverManager().install())
                self.driver = webdriver.Chrome(service=service, options=chrome_options)
                print("✅ Selenium 드라이버 초기화 완료")
            except Exception as e:
                print(f"❌ Selenium 드라이버 초기화 실패: {e}")
                print("💡 Chrome 브라우저가 설치되어 있는지 확인하세요")
                return False
        return True
    
    def close_selenium_driver(self):
        """Selenium 드라이버 종료"""
        if self.driver:
            self.driver.quit()
            self.driver = None
            print("✅ Selenium 드라이버 종료 완료")
    
    def scrape_images_with_selenium(self, url, restaurant_name):
        """Selenium을 사용해서 모달을 열고 모든 이미지 수집"""
        if not self.setup_selenium_driver():
            return []
        
        try:
            print(f"    🌐 Selenium으로 {restaurant_name} 페이지 로드 중...")
            self.driver.get(url)
            
            # 페이지 로드 대기
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # 이미지 갤러리 버튼 찾기 및 클릭
            gallery_selectors = [
                "button.masthead__gallery-open.js-gallery-button",  # 우래옥에서 발견된 갤러리 버튼
                "button[data-target='#js-gallery-masthead']",  # data-target으로 찾기
                "button[data-target='#js-modal-gallery']",
                ".js-modal-gallery-trigger",
                "button[aria-label*='gallery']",
                "button[aria-label*='Gallery']",
                ".gallery-trigger",
                ".image-gallery-trigger"
            ]
            
            gallery_button = None
            for selector in gallery_selectors:
                try:
                    gallery_button = WebDriverWait(self.driver, 5).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                    )
                    print(f"    ✅ 갤러리 버튼 발견: {selector}")
                    break
                except TimeoutException:
                    continue
            
            if gallery_button:
                # 갤러리 버튼 클릭
                self.driver.execute_script("arguments[0].click();", gallery_button)
                print(f"    🖼️ 갤러리 모달 열기 시도...")
                
                # 모달이 열릴 때까지 대기
                try:
                    WebDriverWait(self.driver, 10).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, ".modal__gallery-image"))
                    )
                    print(f"    ✅ 갤러리 모달 열림 확인")
                    
                    # 모든 이미지가 로드될 때까지 잠시 대기
                    time.sleep(3)
                    
                except TimeoutException:
                    print(f"    ⚠️ 갤러리 모달 열기 실패, 기본 이미지만 수집")
            else:
                print(f"    ⚠️ 갤러리 버튼을 찾을 수 없음, 기본 이미지만 수집")
            
            # 현재 페이지의 모든 이미지 URL 추출
            image_urls = []
            processed_urls = set()
            
            # ci-src 속성이 있는 모든 이미지 찾기
            ci_images = self.driver.find_elements(By.CSS_SELECTOR, "img[ci-src]")
            print(f"    📸 ci-src 속성이 있는 이미지: {len(ci_images)}개")
            
            for img in ci_images:
                try:
                    url = img.get_attribute('ci-src')
                    if url and url.strip():
                        # 상대 URL을 절대 URL로 변환
                        if url.startswith('/'):
                            url = f"https://guide.michelin.com{url}"
                        
                        # 크기 조정 파라미터 제거
                        if '?' in url:
                            original_url = url.split('?')[0]
                        else:
                            original_url = url
                        
                        if original_url not in processed_urls:
                            # 간단한 필터링 (cloudimg.io 도메인만)
                            if 'cloudimg.io' in original_url:
                                image_urls.append(original_url)
                                processed_urls.add(original_url)
                                print(f"      ✓ 이미지 발견: {original_url[:60]}...")
                except Exception as e:
                    continue
            
            print(f"    📸 총 {len(image_urls)}개 고유 이미지 URL 추출 (Selenium)")
            return image_urls
            
        except Exception as e:
            print(f"    ❌ Selenium 이미지 수집 실패: {e}")
            return []
    
    def extract_image_urls(self, soup, restaurant_name):
        """음식점 페이지에서 이미지 URL들 추출 (개선된 버전)"""
        image_urls = []
        processed_urls = set()  # 중복 방지를 위한 set
        
        print(f"    🔍 {restaurant_name} 이미지 추출 시작...")
        
        # 음식점별 고유 이미지 선택자 (우선순위 순)
        selectors = [
            '.modal__gallery-image img',  # 모달 갤러리 이미지 (가장 중요 - 모든 갤러리 이미지)
            '.owl-item img',  # 캐러셀 아이템 내 이미지
            '.masthead__gallery img',  # 메인 갤러리 이미지
            '.masthead img',  # 마스트헤드 내 이미지
            '.gallery img',   # 갤러리 내 이미지
            '.image-gallery img',  # 이미지 갤러리
            '.restaurant-image img',  # 레스토랑 이미지
        ]
        
        for selector in selectors:
            image_elements = soup.select(selector)
            print(f"    선택자 '{selector}': {len(image_elements)}개 이미지 발견")
            
            for img in image_elements:
                # 다양한 속성에서 URL 추출
                url_attributes = ['ci-src', 'data-src', 'src']
                
                for attr in url_attributes:
                    url = img.get(attr)
                    if url:
                        # 상대 URL을 절대 URL로 변환
                        if url.startswith('/'):
                            url = f"https://guide.michelin.com{url}"
                        
                        # 크기 조정 파라미터 제거하여 원본 URL 얻기
                        if '?' in url:
                            original_url = url.split('?')[0]
                        else:
                            original_url = url
                        
                        # 이미 처리된 URL인지 확인
                        if original_url in processed_urls:
                            continue
                        
                        # 음식점 이미지 필터링 (아이콘, 로고 제외)
                        if self.is_restaurant_image(original_url, img, restaurant_name):
                            image_urls.append(original_url)
                            processed_urls.add(original_url)
                            print(f"      ✓ 고유 이미지 발견: {original_url[:60]}...")
                        else:
                            print(f"      ❌ 필터링됨: {original_url[:60]}...")
        
        # 추가: 모든 img 태그에서 ci-src 속성만 따로 찾기 (JavaScript로 동적 로드된 이미지들)
        print(f"    🔍 추가 검색: 모든 img 태그에서 ci-src 속성 찾기...")
        all_ci_images = soup.find_all('img', {'ci-src': True})
        print(f"    ci-src 속성이 있는 이미지: {len(all_ci_images)}개")
        
        for img in all_ci_images:
            url = img.get('ci-src')
            if url and url.strip():
                # 상대 URL을 절대 URL로 변환
                if url.startswith('/'):
                    url = f"https://guide.michelin.com{url}"
                
                # 크기 조정 파라미터 제거하여 원본 URL 얻기
                if '?' in url:
                    original_url = url.split('?')[0]
                else:
                    original_url = url
                
                # 이미 처리된 URL인지 확인
                if original_url in processed_urls:
                    continue
                
                # 음식점 이미지 필터링
                if self.is_restaurant_image(original_url, img, restaurant_name):
                    image_urls.append(original_url)
                    processed_urls.add(original_url)
                    print(f"      ✓ ci-src 이미지 발견: {original_url[:60]}...")
                else:
                    print(f"      ❌ ci-src 이미지 필터링됨: {original_url[:60]}...")
        
        print(f"    📸 총 {len(image_urls)}개 고유 이미지 URL 추출")
        return image_urls
    
    def is_restaurant_image(self, url, img_element, restaurant_name):
        """음식점 이미지인지 판단하는 함수 (개선된 버전)"""
        
        # 1. 갤러리 이미지인 경우 최우선으로 통과
        # 'modal__gallery-image' 클래스를 가진 부모 div 안에 있는 이미지는 갤러리 이미지로 간주
        parent_div = img_element.find_parent('div', class_='modal__gallery-image')
        if parent_div:
            print(f"      ✅ 갤러리 이미지로 확인되어 통과: {url[:60]}...")
            return True
        
        # 2. owl-item 내부의 이미지도 갤러리 이미지로 간주
        owl_item = img_element.find_parent('div', class_='owl-item')
        if owl_item:
            print(f"      ✅ 캐러셀 이미지로 확인되어 통과: {url[:60]}...")
            return True
        
        # 3. 제외할 이미지 패턴들 (갤러리 이미지가 아닌 경우에만 적용)
        exclude_patterns = [
            'michelin-award', 'icons/', 'social-', 'footer', 'logo',
            'bib-michelin-man', '1star', '2star', '3star',
            'hot', 'close', 'jcb', 'maestro', 'visa', 'amex', 'union',
            'default', 'placeholder', 'sample'
        ]
        
        # URL에서 제외 패턴 확인
        for pattern in exclude_patterns:
            if pattern in url.lower():
                print(f"      ❌ URL 패턴 제외: {pattern}")
                return False
        
        # 클래스에서 제외 패턴 확인
        classes = img_element.get('class', [])
        for cls in classes:
            if any(pattern in cls.lower() for pattern in exclude_patterns):
                print(f"      ❌ 클래스 패턴 제외: {cls}")
                return False
        
        # alt 텍스트에서 제외 패턴 확인
        alt_text = img_element.get('alt', '').lower()
        if any(pattern in alt_text for pattern in exclude_patterns):
            print(f"      ❌ alt 텍스트 제외: {alt_text}")
            return False
        
        # 4. 공통 이미지 URL 패턴들 (여러 음식점에서 반복 사용되는 이미지)
        common_image_patterns = [
            '0b9dfd084d714be0ad8666feb11efbb3',  # 비빔냉면 이미지
            'a15ac7eea1c6420f9025ce233045161e',  # 또 다른 공통 이미지
            'cab8a8283cd146cda6ca584be6e992c6',  # 또 다른 공통 이미지
        ]
        
        # 공통 이미지 패턴 확인
        for pattern in common_image_patterns:
            if pattern in url:
                print(f"      ❌ 공통 이미지 제외: {pattern}")
                return False
        
        # 5. cloudimg.io 도메인의 이미지는 음식점 이미지일 가능성이 높음
        if 'cloudimg.io' in url:
            print(f"      ✅ cloudimg.io 이미지로 통과: {url[:60]}...")
            return True
        
        # 6. 크기가 작은 이미지들 제외 (아이콘일 가능성)
        width = img_element.get('width')
        height = img_element.get('height')
        if width and height:
            try:
                w, h = int(width), int(height)
                if w < 100 or h < 100:  # 100px 미만은 아이콘으로 간주
                    print(f"      ❌ 크기 너무 작음 ({w}x{h}): {url[:60]}...")
                    return False
            except ValueError:
                pass
        
        print(f"      ✅ 모든 필터 통과: {url[:60]}...")
        return True
    
    def download_image(self, image_url, restaurant_name, image_index):
        """이미지 다운로드 및 저장"""
        try:
            # 안전한 파일명 생성
            safe_name = re.sub(r'[^\w\-_\.]', '_', restaurant_name)
            safe_name = safe_name[:50]  # 파일명 길이 제한
            
            # 이미지 확장자 추출
            parsed_url = urlparse(image_url)
            file_extension = os.path.splitext(parsed_url.path)[1]
            if not file_extension:
                file_extension = '.jpg'  # 기본값
            
            filename = f"{safe_name}_{image_index:02d}{file_extension}"
            filepath = self.images_dir / filename
            
            # 이미지 다운로드
            response = self.session.get(image_url, timeout=30)
            response.raise_for_status()
            
            # 파일 저장
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            print(f"  ✓ 이미지 저장: {filename}")
            return str(filepath)
            
        except Exception as e:
            print(f"  ❌ 이미지 다운로드 실패: {e}")
            return None
    
    def debug_html_structure(self, soup, restaurant_name):
        """HTML 구조 디버깅을 위한 함수"""
        print(f"    🔍 {restaurant_name} HTML 구조 분석:")
        
        # 모든 img 태그 찾기
        all_images = soup.find_all('img')
        print(f"    - 전체 img 태그: {len(all_images)}개")
        
        # 클래스별 이미지 분석
        image_classes = {}
        for img in all_images:
            classes = img.get('class', [])
            for cls in classes:
                if cls not in image_classes:
                    image_classes[cls] = 0
                image_classes[cls] += 1
        
        print(f"    - 이미지 클래스 분포: {image_classes}")
        
        # 속성별 분석
        attributes = ['ci-src', 'data-src', 'src', 'data-srcset']
        for attr in attributes:
            count = len(soup.find_all('img', {attr: True}))
            if count > 0:
                print(f"    - {attr} 속성: {count}개")
        
        # 갤러리 관련 요소 찾기
        gallery_selectors = ['.gallery', '.image-gallery', '.restaurant-image', '.photo-gallery', '.carousel']
        for selector in gallery_selectors:
            elements = soup.select(selector)
            if elements:
                print(f"    - {selector}: {len(elements)}개 발견")
    
    def scrape_restaurant_images(self, url, restaurant_name):
        """음식점 이미지들 스크래핑 및 다운로드 (Selenium 사용)"""
        try:
            print(f"  🖼️ {restaurant_name} 이미지 수집 중...")
            
            # 먼저 Selenium으로 모달을 열고 모든 이미지 수집 시도
            selenium_image_urls = self.scrape_images_with_selenium(url, restaurant_name)
            
            if selenium_image_urls:
                print(f"  📸 {restaurant_name}: Selenium으로 {len(selenium_image_urls)}개 이미지 발견")
                image_urls = selenium_image_urls
            else:
                # Selenium 실패 시 기존 방식으로 폴백
                print(f"  🔄 Selenium 실패, 기존 방식으로 폴백...")
                response = self.session.get(url)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 디버깅 정보 출력 (처음 몇 개만)
                if len(self.restaurants) < 3:
                    self.debug_html_structure(soup, restaurant_name)
                
                # 이미지 URL들 추출
                image_urls = self.extract_image_urls(soup, restaurant_name)
                
                if not image_urls:
                    print(f"  ⚠️ {restaurant_name}: 이미지를 찾을 수 없습니다.")
                    return []
                
                print(f"  📸 {restaurant_name}: 기존 방식으로 {len(image_urls)}개 이미지 발견")
            
            # 이미지들 다운로드
            downloaded_images = []
            for i, image_url in enumerate(image_urls, 1):
                filepath = self.download_image(image_url, restaurant_name, i)
                if filepath:
                    downloaded_images.append({
                        'url': image_url,
                        'local_path': filepath,
                        'filename': os.path.basename(filepath)
                    })
            
            return downloaded_images
            
        except Exception as e:
            print(f"  ❌ {restaurant_name} 이미지 스크래핑 실패: {e}")
            return []
    
    def scrape_restaurant_detail(self, url):
        """개별 음식점 상세 정보 스크래핑"""
        try:
            response = self.session.get(url)  
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 음식점 이름 - data-sheet__title 클래스 사용
            name_element = soup.find('h1', class_='data-sheet__title')
            name = name_element.get_text(strip=True) if name_element else "정보 없음"
            
            # 주소 - data-sheet__block--text 클래스에서 첫 번째 텍스트
            address = "정보 없음"
            data_blocks = soup.find_all('div', class_='data-sheet__block--text')
            for block in data_blocks:
                text = block.get_text(strip=True)
                # 주소는 보통 첫 번째 블록이고, 숫자와 한글이 포함된 형태
                if text and not text.startswith('₩') and not text.startswith('·') and len(text) > 5:
                    address = text
                    break
            
            # 가격대와 카테고리 - data-sheet__block--text에서 ₩와 · 포함된 블록
            price = "정보 없음"
            category = "정보 없음"
            for block in data_blocks:
                text = block.get_text(strip=True)
                if '₩' in text and '·' in text:
                    # ₩ · 도가니탕 형태에서 분리
                    parts = text.split('·')
                    if len(parts) >= 2:
                        price_raw = parts[0].strip()  # ₩
                        category = parts[1].strip()  # 도가니탕
                        
                        # 가격대 설명 추가
                        if price_raw == '₩':
                            price = '₩ (저렴)'
                        elif price_raw == '₩₩':
                            price = '₩₩ (보통)'
                        elif price_raw == '₩₩₩':
                            price = '₩₩₩ (다소 고가)'
                        elif price_raw == '₩₩₩₩':
                            price = '₩₩₩₩ (고가)'
                        else:
                            price = price_raw
                    break
            
            # 미슐랭 등급 - data-sheet__classification 클래스에서 추출
            rating_parts = []
            
            # classification-item들을 순회하면서 등급 정보 추출
            classification_items = soup.find_all('div', class_='data-sheet__classification-item')
            for item in classification_items:
                # 텍스트 설명에서 등급 확인 (가장 정확한 방법)
                content_divs = item.find_all('div', class_='data-sheet__classification-item--content')
                for content_div in content_divs:
                    text = content_div.get_text(strip=True)
                    if '한 개의 별' in text and '1 Star' not in rating_parts:
                        rating_parts.append('1 Star')
                    elif '두 개의 별' in text and '2 Stars' not in rating_parts:
                        rating_parts.append('2 Stars')
                    elif '세 개의 별' in text and '3 Stars' not in rating_parts:
                        rating_parts.append('3 Stars')
                    elif '빕 구르망' in text and 'Bib Gourmand' not in rating_parts:
                        rating_parts.append('Bib Gourmand')
                    elif text == 'New' and 'New' not in rating_parts:
                        rating_parts.append('New')
                    elif '스몰 숍' in text and 'Small Shop' not in rating_parts:
                        rating_parts.append('Small Shop')
            
            # 텍스트에서 찾지 못한 경우에만 이미지에서 확인
            if not rating_parts:
                for item in classification_items:
                    icon_span = item.find('span', class_='distinction-icon')
                    if icon_span:
                        # 이미지 태그에서 별점 확인
                        img_tag = icon_span.find('img', class_='michelin-award')
                        if img_tag:
                            src = img_tag.get('src', '')
                            if '1star' in src and '1 Star' not in rating_parts:
                                rating_parts.append('1 Star')
                            elif '2star' in src and '2 Stars' not in rating_parts:
                                rating_parts.append('2 Stars')
                            elif '3star' in src and '3 Stars' not in rating_parts:
                                rating_parts.append('3 Stars')
                            elif 'bib-gourmand' in src and 'Bib Gourmand' not in rating_parts:
                                rating_parts.append('Bib Gourmand')
                        else:
                            # i 태그에서 숫자 확인
                            i_tag = icon_span.find('i', class_='fa-michelin')
                            if i_tag:
                                icon_text = i_tag.get_text(strip=True)
                                if icon_text.isdigit():
                                    if icon_text == '1' and '1 Star' not in rating_parts:
                                        rating_parts.append('1 Star')
                                    elif icon_text == '2' and '2 Stars' not in rating_parts:
                                        rating_parts.append('2 Stars')
                                    elif icon_text == '3' and '3 Stars' not in rating_parts:
                                        rating_parts.append('3 Stars')
            
            rating = ', '.join(rating_parts) if rating_parts else "0 Star, 추천 레스토랑"
            
            # 이미지 스크래핑
            print(f"  🖼️ {name} 이미지 수집 중...")
            images = self.scrape_restaurant_images(url, name)
            
            restaurant_data = {
                'name': name,
                'address': address,
                'price': price,
                'category': category,
                'rating': rating,
                'url': url,
                'images': images,
                'image_count': len(images)
            }
            
            return restaurant_data
            
        except Exception as e:
            print(f"URL {url} 처리 중 오류: {e}")
            return None
    
    def scrape_all_restaurants(self, start_url):
        """모든 음식점 정보 수집"""
        # 1단계: 음식점 URL들 수집
        restaurant_urls = self.get_restaurant_urls(start_url)
        
        # 2단계: 각 음식점 상세 정보 수집
        print("\n상세 정보 수집 시작...")
        successful_count = 0
        failed_count = 0
        
        for i, url in enumerate(restaurant_urls, 1):
            print(f"\n({i}/{len(restaurant_urls)}) {url} 처리 중...")
            
            try:
                restaurant_data = self.scrape_restaurant_detail(url)
                if restaurant_data:
                    self.restaurants.append(restaurant_data)
                    successful_count += 1
                    print(f"✓ {restaurant_data['name']} 수집 완료 (이미지 {restaurant_data.get('image_count', 0)}개)")
                else:
                    failed_count += 1
                    print(f"❌ {url} 수집 실패")
            except Exception as e:
                failed_count += 1
                print(f"❌ {url} 처리 중 오류: {e}")
            
            # 진행 상황 출력
            if i % 10 == 0:
                print(f"\n📊 진행 상황: {i}/{len(restaurant_urls)} (성공: {successful_count}, 실패: {failed_count})")
            
            # 요청 간격 (서버 부하 방지)
            time.sleep(2)  # 이미지 다운로드로 인해 간격 증가
        
        return self.restaurants
    
    def save_to_json(self, filename='michelin_restaurants.json'):
        """JSON 파일로 저장"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.restaurants, f, ensure_ascii=False, indent=2)
        print(f"데이터가 {filename}에 저장되었습니다.")
    
    def save_to_csv(self, filename='michelin_restaurants.csv'):
        """CSV 파일로 저장"""
        if not self.restaurants:
            print("저장할 데이터가 없습니다.")
            return
            
        fieldnames = ['name', 'address', 'price', 'category', 'rating', 'url', 'image_count']
        
        # CSV용 데이터 준비 (이미지 정보는 JSON으로 저장)
        csv_data = []
        for restaurant in self.restaurants:
            csv_row = {
                'name': restaurant['name'],
                'address': restaurant['address'],
                'price': restaurant['price'],
                'category': restaurant['category'],
                'rating': restaurant['rating'],
                'url': restaurant['url'],
                'image_count': restaurant.get('image_count', 0)
            }
            csv_data.append(csv_row)
        
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(csv_data)
        print(f"데이터가 {filename}에 저장되었습니다.")
    
    def print_results(self):
        """결과 출력"""
        print(f"\n=== 총 {len(self.restaurants)}개 음식점 정보 ===")
        total_images = sum(restaurant.get('image_count', 0) for restaurant in self.restaurants)
        print(f"총 다운로드된 이미지: {total_images}개")
        
        for restaurant in self.restaurants:
            image_info = f"이미지: {restaurant.get('image_count', 0)}개"
            if restaurant.get('images'):
                image_info += f" (첫 번째: {restaurant['images'][0]['filename']})"
            
            print(f"""
====
**{restaurant['name']}**
{restaurant['address']}
{restaurant['price']} · {restaurant['category']}
등급: {restaurant['rating']}
{image_info}
URL: {restaurant['url']}
====
""")

def main():
    # 스크래퍼 초기화
    scraper = MichelinScraper()
    
    # 시작 URL
    start_url = "https://guide.michelin.com/kr/ko/seoul-capital-area/kr-seoul/restaurants?sort=distance"
    
    try:
        # 데이터 수집
        restaurants = scraper.scrape_all_restaurants(start_url)
        
        # 결과 출력
        scraper.print_results()
        
        # 파일로 저장
        scraper.save_to_json()
        scraper.save_to_csv()
        
        # 최종 통계
        total_images = sum(restaurant.get('image_count', 0) for restaurant in scraper.restaurants)
        print(f"\n🎉 스크래핑 완료!")
        print(f"📊 총 음식점: {len(scraper.restaurants)}개")
        print(f"🖼️ 총 이미지: {total_images}개")
        print(f"📁 이미지 저장 위치: {scraper.images_dir.absolute()}")
        
    except KeyboardInterrupt:
        print("\n\n스크래핑이 중단되었습니다.")
        print(f"현재까지 {len(scraper.restaurants)}개 음식점 정보가 수집되었습니다.")
        
        # 부분적으로라도 저장
        if scraper.restaurants:
            scraper.save_to_json('michelin_restaurants_partial.json')
            scraper.save_to_csv('michelin_restaurants_partial.csv')

if __name__ == "__main__":
    main()