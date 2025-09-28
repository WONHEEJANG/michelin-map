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
  line-height: ${typography.lineHeight.tight};
`;

const RatingBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${spacing[1]};
  padding: ${spacing[1]} ${spacing[3]};
  border-radius: ${borderRadius.full};
  font-size: ${typography.fontSize.xs};
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.text.inverse};
  background-color: ${({ rating }) => {
    if (rating.includes('3 Stars')) return colors.michelin['3-stars'];
    if (rating.includes('2 Stars')) return colors.michelin['2-stars'];
    if (rating.includes('1 Star')) return colors.michelin['1-star'];
    return colors.michelin.other;
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

const InfoIcon = styled.span`
  font-size: ${typography.fontSize.base};
  width: 20px;
  text-align: center;
`;

const RestaurantActions = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${spacing[3]};
`;

const MichelinLink = styled.a`
  color: ${colors.primary[600]};
  text-decoration: none;
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  transition: color 0.2s ease;
  
  &:hover {
    color: ${colors.primary[700]};
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
  const getRatingIcon = (rating) => {
    if (rating.includes('3 Stars')) return '⭐⭐⭐';
    if (rating.includes('2 Stars')) return '⭐⭐';
    if (rating.includes('1 Star')) return '⭐';
    if (rating.includes('Bib Gourmand')) return '🍽️';
    if (rating.includes('Small Shop')) return '🏪';
    return '📍';
  };

  const getDisplayRating = (rating) => {
    // Small Shop 제거
    return rating.replace(', Small Shop', '').replace('Small Shop, ', '').trim();
  };

  const handleCardClick = () => {
    if (onSelect) {
      onSelect(restaurant);
    }
  };

  return (
    <RestaurantCardContainer>
      <Card 
        variant="elevated"
        onClick={handleCardClick}
        style={{ cursor: 'pointer' }}
      >
        <RestaurantHeader>
          <RestaurantName>{restaurant.name}</RestaurantName>
          <RatingBadge rating={restaurant.rating}>
            {getRatingIcon(restaurant.rating)} {getDisplayRating(restaurant.rating)}
          </RatingBadge>
        </RestaurantHeader>
        
        <RestaurantInfo>
          <InfoItem>
            <InfoIcon>📍</InfoIcon>
            <span>{restaurant.address}</span>
          </InfoItem>
          <InfoItem>
            <InfoIcon>🍴</InfoIcon>
            <span>{restaurant.category}</span>
          </InfoItem>
          <InfoItem>
            <InfoIcon>💰</InfoIcon>
            <span>{restaurant.price}</span>
          </InfoItem>
        </RestaurantInfo>
        
        <RestaurantActions>
          <MichelinLink 
            href={restaurant.url} 
            target="_blank" 
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            미슐랭 가이드 보기 →
          </MichelinLink>
        </RestaurantActions>
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
  }).isRequired,
  onClose: PropTypes.func,
  onSelect: PropTypes.func,
};

export default RestaurantCard;
