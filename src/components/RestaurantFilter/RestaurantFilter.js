import React, { useState, useEffect, useCallback } from 'react';
import './RestaurantFilter.css';

const RestaurantFilter = ({ restaurants, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');

  // 고유한 카테고리와 가격대 추출
  const categories = [...new Set(restaurants.map(r => r.category))].sort();
  const priceRanges = [...new Set(restaurants.map(r => r.price))].sort();
  const ratings = ['3 Stars', '2 Stars', '1 Star', 'Bib Gourmand', 'Small Shop', '0 Star, 추천 레스토랑'];

  // 필터링 로직
  const applyFilters = useCallback(() => {
    if (restaurants.length === 0) return;
    
    const filtered = restaurants.filter(restaurant => {
      const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          restaurant.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          restaurant.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRating = selectedRating === 'all' || restaurant.rating.includes(selectedRating);
      const matchesCategory = selectedCategory === 'all' || restaurant.category === selectedCategory;
      const matchesPrice = selectedPrice === 'all' || restaurant.price === selectedPrice;

      return matchesSearch && matchesRating && matchesCategory && matchesPrice;
    });

    onFilterChange(filtered);
  }, [searchTerm, selectedRating, selectedCategory, selectedPrice, restaurants, onFilterChange]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedRating('all');
    setSelectedCategory('all');
    setSelectedPrice('all');
  };

  return (
    <div className="restaurant-filter">
      <div className="filter-header">
        <h3>🔍 필터</h3>
        <button className="clear-button" onClick={clearFilters}>
          초기화
        </button>
      </div>

      <div className="filter-section">
        <label className="filter-label">검색</label>
        <input
          type="text"
          placeholder="레스토랑명, 주소, 카테고리 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="filter-section">
        <label className="filter-label">평점</label>
        <select
          value={selectedRating}
          onChange={(e) => setSelectedRating(e.target.value)}
          className="filter-select"
        >
          <option value="all">전체</option>
          {ratings.map(rating => (
            <option key={rating} value={rating}>
              {rating}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <label className="filter-label">카테고리</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="filter-select"
        >
          <option value="all">전체</option>
          {categories.map(category => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-section">
        <label className="filter-label">가격대</label>
        <select
          value={selectedPrice}
          onChange={(e) => setSelectedPrice(e.target.value)}
          className="filter-select"
        >
          <option value="all">전체</option>
          {priceRanges.map(price => (
            <option key={price} value={price}>
              {price}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default RestaurantFilter;
