import React from 'react';
import './RestaurantCard.css';

const RestaurantCard = ({ restaurant, onClose, onSelect }) => {
  const getRatingColor = (rating) => {
    // 4등급 체계: 3, 2, 1, 기타 (bib, small, shop, 0)
    const colors = {
      '3 Stars': '#003B99',  // 가장 진한 파란색
      '2 Stars': '#66A1FF',  // 진한 파란색
      '1 Star': '#8FBBFF',   // 중간 파란색
      '기타': '#E5EFFF'      // 가장 연한 파란색 (bib, small, shop, 0)
    };

    if (rating.includes('3 Stars')) {
      return colors['3 Stars'];
    } else if (rating.includes('2 Stars')) {
      return colors['2 Stars'];
    } else if (rating.includes('1 Star')) {
      return colors['1 Star'];
    } else {
      return colors['기타']; // Bib Gourmand, Small Shop, 0 Star 모두 기타로 분류
    }
  };

  const getRatingIcon = (rating) => {
    if (rating.includes('3 Stars')) return '⭐⭐⭐';
    if (rating.includes('2 Stars')) return '⭐⭐';
    if (rating.includes('1 Star')) return '⭐';
    if (rating.includes('Bib Gourmand')) return '🍽️';
    if (rating.includes('Small Shop')) return '🏪';
    return '📍';
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(restaurant);
    }
  };

  return (
    <div className="restaurant-card" onClick={handleCardClick}>
      <div className="restaurant-card-header">
        <h3 className="restaurant-name">{restaurant.name}</h3>
        <button className="close-button" onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}>
          ✕
        </button>
      </div>
      
      <div className="restaurant-rating">
        <span 
          className="rating-badge"
          style={{ backgroundColor: getRatingColor(restaurant.rating) }}
        >
          {getRatingIcon(restaurant.rating)} {restaurant.rating}
        </span>
      </div>
      
      <div className="restaurant-info">
        <p className="restaurant-address">📍 {restaurant.address}</p>
        <p className="restaurant-category">🍴 {restaurant.category}</p>
        <p className="restaurant-price">💰 {restaurant.price}</p>
      </div>
      
      <div className="restaurant-actions">
        <a 
          href={restaurant.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="michelin-link"
          onClick={(e) => e.stopPropagation()}
        >
          미슐랭 가이드 보기 →
        </a>
      </div>
    </div>
  );
};

export default RestaurantCard;
