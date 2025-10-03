import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Card from '../../atoms/Card/Card';
import Button from '../../atoms/Button/Button';
import { colors, typography, spacing, borderRadius, shadows } from '../../tokens';

const RestaurantHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${spacing[4]};
`;

const RestaurantName = styled.h3`
  margin: 0;
  font-size: ${typography.fontSize.lg};
  font-weight: ${typography.fontWeight.semibold};
  color: ${colors.text.primary};
`;

const RatingBadge = styled.span.withConfig({
  shouldForwardProp: (prop) => prop !== 'rating',
})`
  display: inline-flex;
  align-items: center;
  gap: ${spacing[1]};
  padding: ${spacing[1]} ${spacing[3]};
  border-radius: ${borderRadius.full};
  font-size: ${typography.fontSize.xs};
  font-weight: ${typography.fontWeight.medium};
  color: white;
  background: ${({ rating }) => {
    if (rating.includes('3 Stars')) return 'rgba(209, 15, 15, 0.8)';
    if (rating.includes('2 Stars')) return 'rgba(226, 73, 73, 0.8)';
    if (rating.includes('1 Star')) return 'rgba(255, 178, 178, 0.8)';
    return 'rgba(179, 179, 179, 0.8)';
  }};
  border: 1px solid ${({ rating }) => {
    if (rating.includes('3 Stars')) return 'rgba(209, 15, 15, 0.5)';
    if (rating.includes('2 Stars')) return 'rgba(226, 73, 73, 0.5)';
    if (rating.includes('1 Star')) return 'rgba(255, 178, 178, 0.5)';
    return 'rgba(179, 179, 179, 0.5)';
  }};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: ${shadows.glassSubtle};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
    border-radius: inherit;
    opacity: 0.6;
    pointer-events: none;
  }
`;

const RestaurantInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[3]};
  margin-bottom: ${spacing[6]};
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${spacing[2]};
  font-size: ${typography.fontSize.sm};
  color: ${colors.text.secondary};
  padding: ${spacing[2]} ${spacing[3]};
  background: ${colors.liquid.backdrop};
  border-radius: ${borderRadius.base};
  border: 1px solid ${colors.border.secondary};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  
  &:hover {
    background: ${colors.liquid.glass};
    transform: translateY(-1px);
    box-shadow: ${shadows.glassSubtle};
  }
`;

const MichelinLink = styled.a`
  color: ${colors.primary[600]};
  text-decoration: none;
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  padding: ${spacing[2]} ${spacing[4]};
  background: ${colors.liquid.backdrop};
  border-radius: ${borderRadius.base};
  border: 1px solid ${colors.border.secondary};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: inline-block;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(14, 165, 233, 0.1) 0%, rgba(14, 165, 233, 0.05) 100%);
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  
  &:hover {
    background: ${colors.liquid.glass};
    transform: translateY(-2px);
    box-shadow: ${shadows.glass};
    border-color: ${colors.primary[300]};
    
    &::before {
      opacity: 1;
    }
  }
  
  &:active {
    transform: translateY(-1px);
    box-shadow: ${shadows.glassActive};
  }
`;

const CloseButton = styled(Button)`
  position: absolute;
  top: ${spacing[4]};
  right: ${spacing[4]};
  padding: ${spacing[1]};
  min-width: auto;
  width: 32px;
  height: 32px;
  border-radius: ${borderRadius.full};
  background: ${colors.liquid.glass};
  border: 1px solid ${colors.border.glass};
  box-shadow: ${shadows.glassSubtle};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  color: ${colors.text.primary};
  
  &:hover {
    background: ${colors.liquid.glassHover};
    transform: translateY(-1px);
    box-shadow: ${shadows.glass};
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: ${shadows.glassActive};
  }
`;

const RestaurantCardContainer = styled.div`
  position: relative;
  max-width: 400px;
  width: 100%;
  background: rgba(255, 255, 255, 0.95); // 더 불투명한 배경으로 변경
  border-radius: ${borderRadius.xl};
  box-shadow: ${shadows.glass};
  border: 1px solid ${colors.border.glass};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%);
    border-radius: inherit;
    opacity: 0.9;
    pointer-events: none;
  }
`;

const RestaurantImage = styled.img`
  width: 100%;
  height: 240px;
  object-fit: cover;
  border-radius: 0;
  margin-bottom: 0;
  display: block;
`;

const RestaurantCard = ({ 
  restaurant, 
  onClose, 
  onSelect 
}) => {
  const [imageError, setImageError] = React.useState(false);
  
  // 레스토랑이 변경될 때마다 이미지 에러 상태 초기화
  React.useEffect(() => {
    setImageError(false);
  }, [restaurant]);
  
  // 간단한 이미지 처리
  const getFirstImage = () => {
    if (restaurant.images && restaurant.images.length > 0) {
      const filename = restaurant.images[0].filename.replace(/\.(jpeg|png)$/i, '.jpg');
      return `/restaurant_images/${filename}`;
    }
    return null;
  };

  const getRatingIcon = (rating) => {
    if (rating.includes('3 Stars')) return '⭐⭐⭐';
    if (rating.includes('2 Stars')) return '⭐⭐';
    if (rating.includes('1 Star')) return '⭐';
    if (rating.includes('Bib Gourmand')) return '🍽️';
    return '📍';
  };

  const getDisplayRating = (rating) => {
    return rating.replace(', Small Shop', '').replace('Small Shop, ', '').trim();
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(restaurant);
    }
  };


  const firstImage = getFirstImage();

  return (
    <RestaurantCardContainer>
      <Card
        variant="elevated"
        padding={0}
        onClick={handleCardClick}
        style={{ cursor: 'pointer' }}
      >
        {firstImage && !imageError && (
          <RestaurantImage 
            src={firstImage} 
            alt={restaurant.name}
            onError={() => setImageError(true)}
          />
        )}
        
        <div style={{ padding: `${spacing[4]} ${spacing[4]} 0 ${spacing[4]}` }}>
          <RestaurantHeader>
            <RestaurantName>{restaurant.name}</RestaurantName>
            <RatingBadge rating={restaurant.rating}>
              {getRatingIcon(restaurant.rating)} {getDisplayRating(restaurant.rating)}
            </RatingBadge>
          </RestaurantHeader>
        </div>
        
        <div style={{ padding: `0 ${spacing[4]} ${spacing[4]} ${spacing[4]}` }}>
          <RestaurantInfo>
            <InfoItem>
              <span>📍</span>
              <span>{restaurant.address}</span>
            </InfoItem>
            <InfoItem>
              <span>🍴</span>
              <span>{restaurant.category}</span>
            </InfoItem>
            <InfoItem>
              <span>💰</span>
              <span>{restaurant.price}</span>
            </InfoItem>
          </RestaurantInfo>
          
          <div style={{ marginTop: '16px' }}>
            <MichelinLink 
              href={restaurant.url} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              미슐랭 가이드 보기 →
            </MichelinLink>
          </div>
        </div>
      </Card>
      
      {onClose && (
        <CloseButton
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          ✕
        </CloseButton>
      )}
    </RestaurantCardContainer>
  );
};

RestaurantCard.propTypes = {
  restaurant: PropTypes.shape({
    name: PropTypes.string.isRequired,
    address: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    price: PropTypes.string.isRequired,
    rating: PropTypes.string.isRequired,
    url: PropTypes.string.isRequired,
    images: PropTypes.array,
  }).isRequired,
  onClose: PropTypes.func,
  onSelect: PropTypes.func,
};

export default RestaurantCard;
