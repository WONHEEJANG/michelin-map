import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Select from '../../molecules/Select/Select';
import Button from '../../atoms/Button/Button';
import { colors, spacing, borderRadius, shadows } from '../../tokens';

const FilterContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isCollapsed',
})`
  position: absolute;
  top: ${spacing[5]};
  left: 50%;
  transform: ${({ isCollapsed }) => 
    isCollapsed 
      ? 'translateX(-50%) translateY(-100%)' 
      : 'translateX(-50%) translateY(0)'
  };
  width: 90%;
  max-width: 600px;
  z-index: 1000;
  background: ${colors.liquid.glass};
  border-radius: ${borderRadius.xl};
  padding: ${spacing[4]};
  box-shadow: ${shadows.glass};
  border: 1px solid ${colors.border.glass};
  max-height: 50vh;
  overflow-y: auto;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: ${({ isCollapsed }) => isCollapsed ? '0' : '1'};
  pointer-events: ${({ isCollapsed }) => isCollapsed ? 'none' : 'auto'};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border-radius: inherit;
    opacity: 0.8;
    pointer-events: none;
  }
`;

const FilterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${spacing[3]};
  padding-bottom: ${spacing[2]};
  border-bottom: 1px solid ${colors.border.primary};
  flex-wrap: wrap;
  gap: ${spacing[2]};
`;

const FilterTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${colors.text.primary};
`;

const FilterGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${spacing[2]};
  
  @media (min-width: 640px) {
    grid-template-columns: 1fr 1fr;
    gap: ${spacing[3]};
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: 1fr 1fr 1fr;
  }
`;

const FilterSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
`;

const FilterLabel = styled.label`
  font-size: 14px;
  font-weight: 500;
  color: ${colors.text.primary};
`;

const RestaurantFilter = ({ 
  restaurants = [], 
  onFilterChange,
  onClose,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');

  // 고유한 카테고리와 가격대 추출
  const categories = [...new Set(restaurants.map(r => r.category))].sort();
  const priceRanges = [...new Set(restaurants.map(r => r.price))].sort();
  const ratings = ['3 Stars', '2 Stars', '1 Star', '기타'];

  // 필터링 로직
  const applyFilters = useCallback(() => {
    if (restaurants.length === 0) return;
    
    const filtered = restaurants.filter(restaurant => {
      const matchesRating = selectedRating === 'all' || 
        (selectedRating === '기타' ? 
          !restaurant.rating.includes('3 Stars') && 
          !restaurant.rating.includes('2 Stars') && 
          !restaurant.rating.includes('1 Star') :
          restaurant.rating.includes(selectedRating)
        );
      
      const matchesCategory = selectedCategory === 'all' || restaurant.category === selectedCategory;
      const matchesPrice = selectedPrice === 'all' || restaurant.price === selectedPrice;

      return matchesRating && matchesCategory && matchesPrice;
    });

    console.log(`🔍 필터링된 데이터 확인:`, {
      totalCount: filtered.length,
      firstRestaurant: filtered[0] ? {
        name: filtered[0].name,
        hasImages: !!filtered[0].images,
        imagesLength: filtered[0].images?.length
      } : null
    });
    onFilterChange(filtered);
  }, [selectedRating, selectedCategory, selectedPrice, restaurants, onFilterChange]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const clearFilters = () => {
    setSelectedRating('all');
    setSelectedCategory('all');
    setSelectedPrice('all');
  };

  return (
    <FilterContainer isCollapsed={isCollapsed}>
      <FilterHeader>
        <FilterTitle>🔍 필터</FilterTitle>
        <div style={{ 
          display: 'flex', 
          gap: spacing[2], 
          flexWrap: 'wrap',
          alignItems: 'center'
        }}>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearFilters}
          >
            초기화
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onToggleCollapse}
          >
            {isCollapsed ? '펼치기' : '접기'}
          </Button>
        </div>
      </FilterHeader>

      <FilterGrid>
        <FilterSection>
          <FilterLabel>평점</FilterLabel>
          <Select
            value={selectedRating}
            onChange={(e) => setSelectedRating(e.target.value)}
            options={[
              { value: 'all', label: '전체' },
              ...ratings.map(rating => ({ value: rating, label: rating }))
            ]}
          />
        </FilterSection>

        <FilterSection>
          <FilterLabel>카테고리</FilterLabel>
          <Select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            options={[
              { value: 'all', label: '전체' },
              ...categories.map(category => ({ value: category, label: category }))
            ]}
          />
        </FilterSection>

        <FilterSection>
          <FilterLabel>가격대</FilterLabel>
          <Select
            value={selectedPrice}
            onChange={(e) => setSelectedPrice(e.target.value)}
            options={[
              { value: 'all', label: '전체' },
              ...priceRanges.map(price => ({ value: price, label: price }))
            ]}
          />
        </FilterSection>
      </FilterGrid>
    </FilterContainer>
  );
};

RestaurantFilter.propTypes = {
  restaurants: PropTypes.array,
  onFilterChange: PropTypes.func.isRequired,
  onClose: PropTypes.func,
  isCollapsed: PropTypes.bool,
  onToggleCollapse: PropTypes.func,
};

export default RestaurantFilter;
