import requests
from bs4 import BeautifulSoup
import time
import json
import csv
from urllib.parse import urljoin, urlparse
import re

class MichelinScraper:
    def __init__(self):
        self.base_url = "https://guide.michelin.com"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        self.restaurants = []
        
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
                
                # 음식점 링크 찾기 - 더 구체적인 셀렉터 사용
                restaurant_links = soup.select('a[href*="/restaurant/"]')
                
                print(f"선택자 'a[href*=\"/restaurant/\"]'로 {len(restaurant_links)}개 링크 발견")
                
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
            
            restaurant_data = {
                'name': name,
                'address': address,
                'price': price,
                'category': category,
                'rating': rating,
                'url': url
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
        for i, url in enumerate(restaurant_urls, 1):
            print(f"({i}/{len(restaurant_urls)}) {url} 처리 중...")
            
            restaurant_data = self.scrape_restaurant_detail(url)
            if restaurant_data:
                self.restaurants.append(restaurant_data)
                print(f"✓ {restaurant_data['name']} 수집 완료")
            
            # 요청 간격 (서버 부하 방지)
            time.sleep(1)
        
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
            
        fieldnames = ['name', 'address', 'price', 'category', 'rating', 'url']
        
        with open(filename, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(self.restaurants)
        print(f"데이터가 {filename}에 저장되었습니다.")
    
    def print_results(self):
        """결과 출력"""
        print(f"\n=== 총 {len(self.restaurants)}개 음식점 정보 ===")
        for restaurant in self.restaurants:
            print(f"""
====
**{restaurant['name']}**
{restaurant['address']}
{restaurant['price']} · {restaurant['category']}
등급: {restaurant['rating']}
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
        
    except KeyboardInterrupt:
        print("\n\n스크래핑이 중단되었습니다.")
        print(f"현재까지 {len(scraper.restaurants)}개 음식점 정보가 수집되었습니다.")
        
        # 부분적으로라도 저장
        if scraper.restaurants:
            scraper.save_to_json('michelin_restaurants_partial.json')
            scraper.save_to_csv('michelin_restaurants_partial.csv')

if __name__ == "__main__":
    main()