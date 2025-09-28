import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import Card from '../../atoms/Card/Card';
import Button from '../../atoms/Button/Button';
import { colors, spacing, borderRadius, shadows, typography } from '../../tokens';

const NearbyContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isVisible',
})`
  position: absolute;
  bottom: ${spacing[5]};
  left: ${spacing[5]};
  right: ${spacing[5]};
  max-height: 60vh;
  z-index: 1000;
  background: white;
  border-radius: ${borderRadius.lg};
  box-shadow: ${shadows.xl};
  overflow: hidden;
  transform: ${props => props.isVisible ? 'translateY(0)' : 'translateY(100%)'};
  transition: transform 0.3s ease-in-out;
`;

const Header = styled.div`
  padding: ${spacing[4]} ${spacing[5]};
  border-bottom: 1px solid ${colors.gray[200]};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${colors.gray[50]};
`;

const Title = styled.h3`
  margin: 0;
  font-size: ${typography.fontSize.lg};
  font-weight: ${typography.fontWeight.semibold};
  color: ${colors.text.primary};
`;

const CloseButton = styled(Button)`
  min-width: auto;
  padding: ${spacing[2]};
`;

const RestaurantList = styled.div`
  max-height: 50vh;
  overflow-y: auto;
  padding: ${spacing[2]};
`;

const RestaurantCard = styled(Card)`
  margin-bottom: ${spacing[3]};
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid ${colors.gray[200]};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${shadows.lg};
    border-color: ${colors.primary[300]};
  }
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const RestaurantHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${spacing[2]};
`;

const RestaurantName = styled.h4`
  margin: 0;
  font-size: ${typography.fontSize.base};
  font-weight: ${typography.fontWeight.semibold};
  color: ${colors.text.primary};
  flex: 1;
`;

const RatingBadge = styled.span`
  padding: ${spacing[1]} ${spacing[2]};
  border-radius: ${borderRadius.full};
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  color: white;
  background: ${props => {
    const rating = props.rating;
    if (rating.includes('3 Stars')) return colors.michelin['3-stars'];
    if (rating.includes('2 Stars')) return colors.michelin['2-stars'];
    if (rating.includes('1 Star')) return colors.michelin['1-star'];
    return colors.michelin.other;
  }};
`;

const RestaurantInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacing[1]};
`;

const Address = styled.p`
  margin: 0;
  font-size: ${typography.fontSize.sm};
  color: ${colors.text.secondary};
  line-height: 1.4;
`;

const Category = styled.p`
  margin: 0;
  font-size: ${typography.fontSize.sm};
  color: ${colors.text.tertiary};
`;

const Distance = styled.span`
  font-size: ${typography.fontSize.xs};
  color: ${colors.text.tertiary};
  background: ${colors.gray[100]};
  padding: ${spacing[1]} ${spacing[2]};
  border-radius: ${borderRadius.sm};
  align-self: flex-start;
`;

const EmptyState = styled.div`
  padding: ${spacing[8]} ${spacing[4]};
  text-align: center;
  color: ${colors.text.secondary};
`;

const EmptyIcon = styled.div`
  font-size: 48px;
  margin-bottom: ${spacing[3]};
`;

const EmptyText = styled.p`
  margin: 0;
  font-size: ${typography.fontSize.base};
  line-height: 1.5;
`;

const NearbyRestaurants = ({ 
  restaurants = [], 
  isVisible, 
  onClose, 
  onRestaurantSelect 
}) => {
  const handleRestaurantClick = (restaurant) => {
    if (onRestaurantSelect) {
      onRestaurantSelect(restaurant);
    }
  };

  const getDisplayRating = (rating) => {
    if (rating.includes('Small Shop')) {
      return rating.replace(', Small Shop', '').replace('Small Shop, ', '');
    }
    return rating;
  };

  return (
    <NearbyContainer isVisible={isVisible}>
      <Header>
        <Title>
          🍽️ 내 주변 미쉐린 ({restaurants.length}개)
        </Title>
        <CloseButton
          variant="tertiary"
          size="sm"
          onClick={onClose}
          icon={<span>✕</span>}
        >
          닫기
        </CloseButton>
      </Header>
      
      <RestaurantList>
        {restaurants.length === 0 ? (
          <EmptyState>
            <EmptyIcon>🔍</EmptyIcon>
            <EmptyText>
              현재 지도 영역에<br />
              미쉐린 레스토랑이 없어요
            </EmptyText>
          </EmptyState>
        ) : (
          restaurants.map((restaurant, index) => (
            <RestaurantCard
              key={`${restaurant.name}-${index}`}
              onClick={() => handleRestaurantClick(restaurant)}
            >
              <RestaurantHeader>
                <RestaurantName>{restaurant.name}</RestaurantName>
                <RatingBadge rating={restaurant.rating}>
                  {getDisplayRating(restaurant.rating)}
                </RatingBadge>
              </RestaurantHeader>
              
              <RestaurantInfo>
                <Address>{restaurant.address}</Address>
                <Category>{restaurant.category}</Category>
                {restaurant.distance && (
                  <Distance>
                    📍 {restaurant.distance.toFixed(1)}km
                  </Distance>
                )}
              </RestaurantInfo>
            </RestaurantCard>
          ))
        )}
      </RestaurantList>
    </NearbyContainer>
  );
};

NearbyRestaurants.propTypes = {
  restaurants: PropTypes.array,
  isVisible: PropTypes.bool,
  onClose: PropTypes.func,
  onRestaurantSelect: PropTypes.func,
};

export default NearbyRestaurants;
