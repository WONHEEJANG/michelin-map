import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Card from '../../atoms/Card/Card';
import Button from '../../atoms/Button/Button';
import { colors, typography, spacing, borderRadius } from '../../tokens';

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

const RatingBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${spacing[1]};
  padding: ${spacing[1]} ${spacing[3]};
  border-radius: ${borderRadius.full};
  font-size: ${typography.fontSize.xs};
  font-weight: ${typography.fontWeight.medium};
  color: white;
  background-color: ${({ rating }) => {
    if (rating.includes('3 Stars')) return '#D10F0F';
    if (rating.includes('2 Stars')) return '#E24949';
    if (rating.includes('1 Star')) return '#FFB2B2';
    return '#B3B3B3';
  }};
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
`;

const MichelinLink = styled.a`
  color: ${colors.primary[600]};
  text-decoration: none;
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  
  &:hover {
    text-decoration: underline;
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
`;

const RestaurantCardContainer = styled.div`
  position: relative;
  max-width: 400px;
  width: 100%;
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
        onClick={handleCardClick}
        style={{ cursor: 'pointer' }}
      >
        {firstImage && !imageError && (
          <img 
            src={firstImage} 
            alt={restaurant.name}
            style={{ 
              width: '100%', 
              height: '200px', 
              objectFit: 'cover',
              borderRadius: '8px',
              marginBottom: '16px'
            }}
            onError={() => setImageError(true)}
          />
        )}
        
        <RestaurantHeader>
          <RestaurantName>{restaurant.name}</RestaurantName>
          <RatingBadge rating={restaurant.rating}>
            {getRatingIcon(restaurant.rating)} {getDisplayRating(restaurant.rating)}
          </RatingBadge>
        </RestaurantHeader>
        
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
