import React from 'react';

// 레스토랑 마커 컴포넌트 (표시용)
const RestaurantMarker = ({ restaurant, onClick }) => {
  const getRatingColor = (rating) => {
    const colors = {
      '3 Stars': '#ff6b6b',
      '2 Stars': '#4ecdc4', 
      '1 Star': '#45b7d1',
      'Bib Gourmand': '#96ceb4',
      'Small Shop': '#feca57',
      '0 Star, 추천 레스토랑': '#a4b0be'
    };

    for (const [key, value] of Object.entries(colors)) {
      if (rating.includes(key)) {
        return value;
      }
    }
    return '#a4b0be';
  };

  const getRatingIcon = (rating) => {
    if (rating.includes('3 Stars')) return '⭐⭐⭐';
    if (rating.includes('2 Stars')) return '⭐⭐';
    if (rating.includes('1 Star')) return '⭐';
    if (rating.includes('Bib Gourmand')) return '🍽️';
    if (rating.includes('Small Shop')) return '🏪';
    return '📍';
  };

  return (
    <div 
      className="restaurant-marker"
      onClick={() => onClick(restaurant)}
      style={{
        backgroundColor: getRatingColor(restaurant.rating),
        color: 'white',
        padding: '8px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        minWidth: 'fit-content',
        whiteSpace: 'nowrap'
      }}
    >
      <span>{getRatingIcon(restaurant.rating)}</span>
      <span>{restaurant.name}</span>
    </div>
  );
};

export default RestaurantMarker;
