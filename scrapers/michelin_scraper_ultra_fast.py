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
from concurrent.futures import ThreadPoolExecutor
import threading
from queue import Queue

class UltraFastMichelinScraper:
    def __init__(self, max_workers=4, driver_pool_size=4):
        self.base_url = "https://guide.michelin.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.restaurants = []
        self.images_dir = Path("restaurant_images")
        self.images_dir.mkdir(exist_ok=True)
        
        # 워커 수 설정
        self.max_workers = max_workers
        self.driver_pool_size = driver_pool_size
        
        # Selenium 드라이버 풀
        self.driver_pool = Queue(maxsize=driver_pool_size)
        self.driver_lock = threading.Lock()
        
        # 드라이버 풀 초기화
        self._initialize_driver_pool()
        
        print(f"🚀 울트라 빠른 스크래퍼 설정: {max_workers}개 워커, {driver_pool_size}개 드라이버 풀")
    
    def _initialize_driver_pool(self):
        """Selenium 드라이버 풀 초기화"""
        print("🔧 Selenium 드라이버 풀 초기화 중...")
        
        for i in range(self.driver_pool_size):
            driver = self._create_driver()
            if driver:
                self.driver_pool.put(driver)
                print(f"  ✅ 드라이버 {i+1}/{self.driver_pool_size} 초기화 완료")
            else:
                print(f"  ❌ 드라이버 {i+1}/{self.driver_pool_size} 초기화 실패")
        
        print(f"🎯 총 {self.driver_pool.qsize()}개 드라이버 풀 준비 완료")
    
    def _create_driver(self):
        """새로운 Selenium 드라이버 생성"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
        try:
            service = Service(ChromeDriverManager().install())
            driver = webdriver.Chrome(service=service, options=chrome_options)
            return driver
        except Exception as e:
            print(f"❌ Selenium 드라이버 생성 실패: {e}")
            return None
    
    def _get_driver_from_pool(self):
        """드라이버 풀에서 드라이버 가져오기"""
        try:
            driver = self.driver_pool.get(timeout=10)  # 10초 대기
            return driver
        except:
            # 풀이 비어있으면 새로 생성
            return self._create_driver()
    
    def _return_driver_to_pool(self, driver):
        """드라이버를 풀에 반환"""
        if driver:
            try:
                self.driver_pool.put_nowait(driver)
            except:
                # 풀이 가득 차면 드라이버 종료
                try:
                    driver.quit()
                except:
                    pass
    
    def get_restaurant_urls(self, start_url):
        """메인 페이지에서 모든 음식점 URL 수집"""
        print("음식점 URL 수집 중...")
        restaurant_urls = set()
        page = 1
        consecutive_empty_pages = 0
        
        while consecutive_empty_pages < 2:
            try:
                if page == 1:
                    url = start_url
                else:
                    url = f"https://guide.michelin.com/kr/ko/seoul-capital-area/kr-seoul/restaurants/page/{page}?sort=distance"
                    
                print(f"페이지 {page} 처리 중: {url}")
                response = self.session.get(url)
                response.raise_for_status()
                
                soup = BeautifulSoup(response.content, 'html.parser')
                
                # 음식점 카드 찾기
                restaurant_cards = soup.select('.js-restaurant__list_item')
                print(f"선택자 '.js-restaurant__list_item'로 {len(restaurant_cards)}개 카드 발견")
                
                restaurant_links = []
                for card in restaurant_cards:
                    title_link = card.select_one('.card__menu-content--title a[href*="/restaurant/"]')
                    if title_link:
                        restaurant_links.append(title_link)
                
                print(f"카드에서 추출한 제목 링크: {len(restaurant_links)}개")
                
                if not restaurant_links:
                    consecutive_empty_pages += 1
                    print(f"페이지 {page}에서 음식점을 찾을 수 없습니다. (연속 빈 페이지: {consecutive_empty_pages})")
                    page += 1
                    continue
                
                consecutive_empty_pages = 0
                page_urls = []
                
                for link in restaurant_links:
                    href = link.get('href')
                    if href and '/restaurant/' in href:
                        full_url = urljoin(self.base_url, href)
                        if full_url not in restaurant_urls:
                            restaurant_urls.add(full_url)
                            page_urls.append(full_url)
                
                print(f"페이지 {page}에서 {len(page_urls)}개 레스토랑 발견")
                
                # 페이지네이션 확인
                pagination = soup.find('nav', {'aria-label': 'pagination'}) or soup.find('div', class_=re.compile(r'pagination'))
                if pagination:
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
                time.sleep(0.3)  # 요청 간격 더 단축
                
            except Exception as e:
                print(f"페이지 {page} 처리 중 오류: {e}")
                consecutive_empty_pages += 1
                page += 1
                if consecutive_empty_pages >= 2:
                    break
        
        restaurant_urls_list = list(restaurant_urls)
        print(f"총 {len(restaurant_urls_list)}개 음식점 URL 수집 완료")
        return restaurant_urls_list
    
    def scrape_images_with_selenium_pool(self, url, restaurant_name):
        """드라이버 풀을 사용해서 이미지 수집"""
        driver = self._get_driver_from_pool()
        if not driver:
            return []
        
        try:
            print(f"    🌐 Selenium으로 {restaurant_name} 페이지 로드 중...")
            driver.get(url)
            
            # 페이지 로드 대기
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # 갤러리 버튼 찾기 및 클릭
            gallery_selectors = [
                "button.masthead__gallery-open.js-gallery-button",
                "button[data-target='#js-gallery-masthead']",
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
                    gallery_button = WebDriverWait(driver, 5).until(
                        EC.element_to_be_clickable((By.CSS_SELECTOR, selector))
                    )
                    print(f"    ✅ 갤러리 버튼 발견: {selector}")
                    break
                except TimeoutException:
                    continue
            
            if gallery_button:
                driver.execute_script("arguments[0].click();", gallery_button)
                print(f"    🖼️ 갤러리 모달 열기 시도...")
                
                try:
                    WebDriverWait(driver, 10).until(
                        EC.presence_of_element_located((By.CSS_SELECTOR, ".modal__gallery-image"))
                    )
                    print(f"    ✅ 갤러리 모달 열림 확인")
                    time.sleep(1.5)  # 이미지 로드 대기 단축
                except TimeoutException:
                    print(f"    ⚠️ 갤러리 모달 열기 실패, 기본 이미지만 수집")
            
            # 이미지 URL 추출
            image_urls = []
            processed_urls = set()
            
            ci_images = driver.find_elements(By.CSS_SELECTOR, "img[ci-src]")
            print(f"    📸 ci-src 속성이 있는 이미지: {len(ci_images)}개")
            
            for img in ci_images:
                try:
                    url = img.get_attribute('ci-src')
                    if url and url.strip():
                        if url.startswith('/'):
                            url = f"https://guide.michelin.com{url}"
                        
                        if '?' in url:
                            original_url = url.split('?')[0]
                        else:
                            original_url = url
                        
                        if original_url not in processed_urls:
                            if 'cloudimg.io' in original_url:
                                image_urls.append(original_url)
                                processed_urls.add(original_url)
                                print(f"      ✓ 이미지 발견: {original_url[:60]}...")
                except Exception as e:
                    continue
            
            print(f"    📸 총 {len(image_urls)}개 고유 이미지 URL 추출 (Selenium)")
            
            # 이미지 다운로드
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
            print(f"    ❌ Selenium 이미지 수집 실패: {e}")
            return []
        finally:
            # 드라이버를 풀에 반환
            self._return_driver_to_pool(driver)
    
    def download_image(self, image_url, restaurant_name, image_index):
        """이미지 다운로드 및 저장"""
        try:
            safe_name = re.sub(r'[^\w\-_\.]', '_', restaurant_name)
            safe_name = safe_name[:50]
            
            parsed_url = urlparse(image_url)
            file_extension = os.path.splitext(parsed_url.path)[1]
            if not file_extension:
                file_extension = '.jpg'
            
            filename = f"{safe_name}_{image_index:02d}{file_extension}"
            filepath = self.images_dir / filename
            
            # 이미지 다운로드
            response = self.session.get(image_url, timeout=20)  # 타임아웃 단축
            response.raise_for_status()
            
            # 파일 저장
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            print(f"  ✓ 이미지 저장: {filename}")
            return str(filepath)
            
        except Exception as e:
            print(f"  ❌ 이미지 다운로드 실패: {e}")
            return None
    
    def scrape_restaurant_detail(self, url):
        """개별 음식점 상세 정보 스크래핑"""
        try:
            response = self.session.get(url)  
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # 음식점 이름
            name_element = soup.find('h1', class_='data-sheet__title')
            name = name_element.get_text(strip=True) if name_element else "정보 없음"
            
            # 주소
            address = "정보 없음"
            data_blocks = soup.find_all('div', class_='data-sheet__block--text')
            for block in data_blocks:
                text = block.get_text(strip=True)
                if text and not text.startswith('₩') and not text.startswith('·') and len(text) > 5:
                    address = text
                    break
            
            # 가격대와 카테고리
            price = "정보 없음"
            category = "정보 없음"
            for block in data_blocks:
                text = block.get_text(strip=True)
                if '₩' in text and '·' in text:
                    parts = text.split('·')
                    if len(parts) >= 2:
                        price_raw = parts[0].strip()
                        category = parts[1].strip()
                        
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
            
            # 미슐랭 등급
            rating_parts = []
            classification_items = soup.find_all('div', class_='data-sheet__classification-item')
            for item in classification_items:
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
            
            rating = ', '.join(rating_parts) if rating_parts else "0 Star, 추천 레스토랑"
            
            # 이미지 스크래핑 (드라이버 풀 사용)
            print(f"  🖼️ {name} 이미지 수집 중...")
            images = self.scrape_images_with_selenium_pool(url, name)
            
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
    
    def save_to_json(self, filename='michelin_restaurants_ultra.json'):
        """JSON 파일로 저장"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(self.restaurants, f, ensure_ascii=False, indent=2)
        print(f"데이터가 {filename}에 저장되었습니다.")
    
    def save_to_csv(self, filename='michelin_restaurants_ultra.csv'):
        """CSV 파일로 저장"""
        if not self.restaurants:
            print("저장할 데이터가 없습니다.")
            return
            
        fieldnames = ['name', 'address', 'price', 'category', 'rating', 'url', 'image_count']
        
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

def scrape_single_restaurant_ultra(args):
    """단일 음식점 스크래핑 (울트라 빠른 버전)"""
    url, scraper_instance = args
    
    try:
        print(f"🔄 {url} 처리 중...")
        restaurant_data = scraper_instance.scrape_restaurant_detail(url)
        
        if restaurant_data:
            print(f"✓ {restaurant_data['name']} 수집 완료 (이미지 {restaurant_data.get('image_count', 0)}개)")
            return restaurant_data
        else:
            print(f"❌ {url} 수집 실패")
            return None
            
    except Exception as e:
        print(f"❌ {url} 처리 중 오류: {e}")
        return None

def main():
    # 울트라 빠른 스크래퍼 초기화
    scraper = UltraFastMichelinScraper(max_workers=4, driver_pool_size=4)
    
    # 시작 URL
    start_url = "https://guide.michelin.com/kr/ko/seoul-capital-area/kr-seoul/restaurants?sort=distance"
    
    try:
        # 1단계: 음식점 URL들 수집
        restaurant_urls = scraper.get_restaurant_urls(start_url)
        
        # 2단계: 멀티스레딩으로 상세 정보 수집
        print(f"\n상세 정보 수집 시작... (울트라 빠른 멀티스레딩: {scraper.max_workers}개 워커)")
        
        start_time = time.time()
        
        # 배치로 처리
        batch_size = scraper.max_workers * 2
        successful_count = 0
        failed_count = 0
        
        for i in range(0, len(restaurant_urls), batch_size):
            batch_urls = restaurant_urls[i:i + batch_size]
            batch_num = i // batch_size + 1
            total_batches = (len(restaurant_urls) + batch_size - 1) // batch_size
            
            print(f"\n📦 배치 {batch_num}/{total_batches} 처리 중... ({len(batch_urls)}개)")
            
            # 멀티스레딩으로 배치 처리
            with ThreadPoolExecutor(max_workers=scraper.max_workers) as executor:
                args = [(url, scraper) for url in batch_urls]
                results = list(executor.map(scrape_single_restaurant_ultra, args))
            
            # 결과 처리
            for result in results:
                if result:
                    scraper.restaurants.append(result)
                    successful_count += 1
                else:
                    failed_count += 1
            
            print(f"📊 배치 {batch_num} 완료: 성공 {len([r for r in results if r])}개")
            
            # 배치 간 대기
            if i + batch_size < len(restaurant_urls):
                time.sleep(0.5)  # 대기 시간 단축
        
        end_time = time.time()
        elapsed_time = end_time - start_time
        
        print(f"\n🎉 울트라 빠른 스크래핑 완료!")
        print(f"⏱️ 총 소요 시간: {elapsed_time:.2f}초")
        print(f"📊 총 음식점: {len(scraper.restaurants)}개")
        print(f"✅ 성공: {successful_count}개")
        print(f"❌ 실패: {failed_count}개")
        print(f"⚡ 평균 처리 시간: {elapsed_time/len(restaurant_urls):.2f}초/개")
        
        # 파일로 저장
        scraper.save_to_json()
        scraper.save_to_csv()
        
        # 최종 통계
        total_images = sum(restaurant.get('image_count', 0) for restaurant in scraper.restaurants)
        print(f"\n🎉 울트라 빠른 스크래핑 완료!")
        print(f"📊 총 음식점: {len(scraper.restaurants)}개")
        print(f"🖼️ 총 이미지: {total_images}개")
        print(f"📁 이미지 저장 위치: {scraper.images_dir.absolute()}")
        
    except KeyboardInterrupt:
        print("\n\n스크래핑이 중단되었습니다.")
        print(f"현재까지 {len(scraper.restaurants)}개 음식점 정보가 수집되었습니다.")
        
        # 부분적으로라도 저장
        if scraper.restaurants:
            scraper.save_to_json('michelin_restaurants_ultra_partial.json')
            scraper.save_to_csv('michelin_restaurants_ultra_partial.csv')
    
    finally:
        # 드라이버 풀 정리
        print("🧹 드라이버 풀 정리 중...")
        while not scraper.driver_pool.empty():
            try:
                driver = scraper.driver_pool.get_nowait()
                driver.quit()
            except:
                pass
        print("✅ 드라이버 풀 정리 완료")

if __name__ == "__main__":
    main()
