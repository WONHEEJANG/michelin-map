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

const ImageContainer = styled.div`
  width: 100%;
  height: 200px;
  margin-bottom: ${spacing[4]};
  border-radius: ${borderRadius.lg};
  overflow: hidden;
  background: ${colors.gray[100]};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const RestaurantImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const ImagePlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: ${colors.text.tertiary};
  font-size: ${typography.fontSize.sm};
  gap: ${spacing[2]};
`;

const ImageGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${spacing[2]};
  margin-bottom: ${spacing[4]};
`;

const GridImage = styled.img`
  width: 100%;
  height: 80px;
  object-fit: cover;
  border-radius: ${borderRadius.md};
  transition: transform 0.3s ease;
  cursor: pointer;
  
  &:hover {
    transform: scale(1.05);
  }
`;

const ImageModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: ${spacing[4]};
`;

const ModalImage = styled.img`
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: ${borderRadius.lg};
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
`;

const ModalCloseButton = styled(Button)`
  position: absolute;
  top: ${spacing[4]};
  right: ${spacing[4]};
  background: rgba(255, 255, 255, 0.9);
  color: ${colors.text.primary};
  z-index: 10001;
`;

const ImageCounter = styled.div`
  position: absolute;
  bottom: ${spacing[4]};
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: ${spacing[2]} ${spacing[4]};
  border-radius: ${borderRadius.full};
  font-size: ${typography.fontSize.sm};
`;

const NavigationButton = styled(Button).withConfig({
  shouldForwardProp: (prop) => !['direction'].includes(prop),
})`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(255, 255, 255, 0.9);
  color: ${colors.text.primary};
  z-index: 10001;
  width: 48px;
  height: 48px;
  border-radius: ${borderRadius.full};
  
  ${props => props.$direction === 'left' && `left: ${spacing[4]};`}
  ${props => props.$direction === 'right' && `right: ${spacing[4]};`}
  
  &:hover {
    background: rgba(255, 255, 255, 1);
  }
`;

const RestaurantCard = ({ 
  restaurant, 
  onClose, 
  onSelect 
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [loadedImages, setLoadedImages] = React.useState([]); // 성공적으로 로드된 이미지들

  // loadedImages 상태 변경 디버깅
  React.useEffect(() => {
    console.log(`🔍 ${restaurant.name} loadedImages 상태 변경:`, loadedImages.length, '개', loadedImages);
  }, [loadedImages, restaurant.name]);

  // 레스토랑이 변경될 때 loadedImages 초기화
  React.useEffect(() => {
    setLoadedImages([]);
    setSelectedImageIndex(null); // 선택된 이미지 인덱스도 초기화
  }, [restaurant]);

  // 이미지 로딩을 처리하는 useEffect
  React.useEffect(() => {
    const availableImages = getAvailableImages(restaurant);
    if (availableImages.length === 0) return;

    console.log(`🔄 ${restaurant.name} 이미지 로딩 시작:`, availableImages.length, '개');

    // 50개까지 시도하여 로드
    const imagesToLoad = availableImages.slice(0, 50);
    const loadingImages = new Set(); // 현재 로딩 중인 이미지 추적

    imagesToLoad.forEach((imagePath, index) => {
      // 이미 로딩 중이거나 로드된 이미지는 스킵
      if (loadingImages.has(imagePath)) {
        console.log(`⏭️ 이미 로딩 중인 이미지 스킵: ${imagePath}`);
        return;
      }

      loadingImages.add(imagePath);
      const img = new Image();
      
      img.onload = () => {
        console.log(`✅ 이미지 로딩 성공: ${imagePath}`);
        setLoadedImages(prev => {
          // 중복 체크를 더 엄격하게
          if (!prev.includes(imagePath)) {
            const newLoadedImages = [...prev, imagePath];
            console.log(`📸 ${restaurant.name} 로드된 이미지 업데이트:`, newLoadedImages.length, '개');
            return newLoadedImages;
          } else {
            console.log(`🔄 이미 로드된 이미지 스킵: ${imagePath}`);
          }
          return prev;
        });
        loadingImages.delete(imagePath);
      };
      
      img.onerror = () => {
        console.log(`❌ 이미지 로딩 실패: ${imagePath}`);
        loadingImages.delete(imagePath);
      };
      
      img.src = imagePath;
    });
  }, [restaurant]);
  // JSON 데이터에서 이미지 경로들을 가져오는 함수
  const getAvailableImages = (restaurant) => {
    console.log(`🔍 ${restaurant.name} 이미지 데이터 확인:`, {
      hasImages: !!restaurant.images,
      isArray: Array.isArray(restaurant.images),
      length: restaurant.images?.length,
      firstImage: restaurant.images?.[0]
    });
    
    // JSON 데이터에 images 배열이 있으면 사용
    if (restaurant.images && Array.isArray(restaurant.images) && restaurant.images.length > 0) {
      console.log(`📸 ${restaurant.name} JSON 이미지 사용:`, restaurant.images.length, '개');
      
      // 중복 제거를 위한 Set 사용
      const uniqueImages = new Set();
      const imagePaths = restaurant.images
        .map(img => {
          // 파일명에서 확장자를 .jpg로 변경 (모든 이미지가 JPG로 통일됨)
          const filename = img.filename.replace(/\.(jpeg|png)$/i, '.jpg');
          return `/restaurant_images/${filename}`;
        })
        .filter(path => {
          // 중복 제거
          if (uniqueImages.has(path)) {
            console.log(`🔄 중복 이미지 제거: ${path}`);
            return false;
          }
          uniqueImages.add(path);
          return true;
        });
      
      console.log(`📸 ${restaurant.name} 중복 제거 후 이미지:`, imagePaths.length, '개');
      return imagePaths;
    }
    
    // JSON에 images가 없으면 기존 방식으로 파일명 생성 (JPG만 시도)
    console.log(`🔍 ${restaurant.name} 파일명 매칭 시도`);
    const sanitizedName = restaurant.name.replace(/\s+/g, '_');
    const possibleImages = [];
    for (let i = 1; i <= 12; i++) {
      const paddedNumber = i.toString().padStart(2, '0');
      possibleImages.push(`${sanitizedName}_${paddedNumber}.jpg`);
    }
    return possibleImages.map(filename => `/restaurant_images/${filename}`);
  };

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

  // 현재 이미지 정보를 콘솔에 출력하는 함수
  const logCurrentImageInfo = (imageIndex) => {
    if (restaurant.images && restaurant.images[imageIndex]) {
      const currentImage = restaurant.images[imageIndex];
      console.log('🔄 이미지 변경 - 현재 이미지 정보:');
      console.log('📁 파일 이름:', currentImage.filename);
      console.log('📂 로컬 경로:', currentImage.local_path);
      console.log('🌐 URL:', currentImage.url);
      console.log('📍 레스토랑:', restaurant.name);
      console.log('🔢 이미지 순서:', `${imageIndex + 1}/${restaurant.images.length}`);
    }
  };

  const handleImageClick = (index) => {
    // loadedImages에서 해당 인덱스의 이미지를 찾아서 모달에서 올바른 인덱스로 설정
    const actualIndex = loadedImages.findIndex(img => img === loadedImages[index]);
    setSelectedImageIndex(actualIndex >= 0 ? actualIndex : index);
    setIsModalOpen(true);
    
    // 이미지 모달이 열릴 때 현재 이미지 정보를 콘솔에 출력
    if (actualIndex >= 0) {
      console.log('🖼️ 이미지 모달 열림 - 현재 이미지 정보:');
      logCurrentImageInfo(actualIndex);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedImageIndex(null);
  };

  const handlePreviousImage = () => {
    setSelectedImageIndex(prev => {
      const newIndex = prev > 0 ? prev - 1 : loadedImages.length - 1;
      // 이미지 변경 시 현재 이미지 정보를 콘솔에 출력
      logCurrentImageInfo(newIndex);
      return newIndex;
    });
  };

  const handleNextImage = () => {
    setSelectedImageIndex(prev => {
      const newIndex = prev < loadedImages.length - 1 ? prev + 1 : 0;
      // 이미지 변경 시 현재 이미지 정보를 콘솔에 출력
      logCurrentImageInfo(newIndex);
      return newIndex;
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleModalClose();
    } else if (e.key === 'ArrowLeft') {
      handlePreviousImage();
    } else if (e.key === 'ArrowRight') {
      handleNextImage();
    }
  };

  // 이미지 렌더링 함수
  const renderImages = () => {
    const availableImages = getAvailableImages(restaurant);
    console.log(`📸 ${restaurant.name} 렌더링할 이미지:`, availableImages);
    
    // 이미지가 없으면 플레이스홀더 표시
    if (availableImages.length === 0) {
      return (
        <ImageContainer>
          <ImagePlaceholder>
            <span>🍽️</span>
            <span>이미지 준비 중</span>
          </ImagePlaceholder>
        </ImageContainer>
      );
    }

    // 카드에서는 성공한 이미지 중 처음 4개만 표시
    const cardImagesToShow = loadedImages.slice(0, 4);
    
    return (
      <ImageGrid>
        {cardImagesToShow.map((imagePath, index) => {
          return (
            <GridImage
              key={index}
              src={imagePath}
              alt={`${restaurant.name} 음식점 이미지 ${index + 1}`}
              onClick={() => handleImageClick(index)}
            />
          );
        })}
      </ImageGrid>
    );
  };


  return (
    <RestaurantCardContainer>
      <Card 
        variant="elevated"
        onClick={handleCardClick}
        style={{ cursor: 'pointer' }}
      >
        {renderImages()}
        
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
      
      {/* 이미지 확대 모달 */}
      {isModalOpen && selectedImageIndex !== null && (
        <ImageModal 
          onClick={handleModalClose}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <ModalImage
            src={loadedImages[selectedImageIndex]}
            alt={`${restaurant.name} 음식점 이미지 ${selectedImageIndex + 1}`}
            onClick={(e) => e.stopPropagation()}
          />
          
          <ModalCloseButton
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleModalClose();
            }}
          >
            ✕
          </ModalCloseButton>
          
          {loadedImages.length > 0 && (
            <>
              <NavigationButton
                variant="ghost"
                size="sm"
                direction="left"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePreviousImage();
                }}
              >
                ‹
              </NavigationButton>
              
              <NavigationButton
                variant="ghost"
                size="sm"
                direction="right"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextImage();
                }}
              >
                ›
              </NavigationButton>
              
              <ImageCounter>
                {selectedImageIndex + 1} / {loadedImages.length}
              </ImageCounter>
            </>
          )}
        </ImageModal>
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
    images: PropTypes.arrayOf(PropTypes.shape({
      url: PropTypes.string,
      local_path: PropTypes.string,
      filename: PropTypes.string.isRequired,
    })),
    image_count: PropTypes.number,
  }).isRequired,
  onClose: PropTypes.func,
  onSelect: PropTypes.func,
};

export default RestaurantCard;
