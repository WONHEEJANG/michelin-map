import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { colors, spacing, borderRadius, shadows } from '../../tokens';

const StyledCard = styled.div`
  background: ${colors.background.primary};
  border-radius: ${borderRadius.lg};
  box-shadow: ${shadows.base};
  border: 1px solid ${colors.border.primary};
  overflow: hidden;
  transition: all 0.2s ease-in-out;
  
  &:hover {
    box-shadow: ${shadows.lg};
    transform: translateY(-2px);
  }
  
  ${({ variant }) => {
    switch (variant) {
      case 'elevated':
        return `
          box-shadow: ${shadows.lg};
        `;
      case 'outlined':
        return `
          box-shadow: none;
          border: 2px solid ${colors.border.primary};
        `;
      case 'flat':
        return `
          box-shadow: none;
          border: none;
        `;
      default:
        return '';
    }
  }}
  
  ${({ padding }) => {
    switch (padding) {
      case 'sm':
        return `padding: ${spacing[4]};`;
      case 'lg':
        return `padding: ${spacing[8]};`;
      default:
        return `padding: ${spacing[6]};`;
    }
  }}
`;

const CardHeader = styled.div`
  padding: ${spacing[4]} ${spacing[6]};
  border-bottom: 1px solid ${colors.border.primary};
  background: ${colors.gray[50]};
`;

const CardBody = styled.div`
  padding: ${spacing[6]};
`;

const CardFooter = styled.div`
  padding: ${spacing[4]} ${spacing[6]};
  border-top: 1px solid ${colors.border.primary};
  background: ${colors.gray[50]};
`;

const Card = ({ 
  children, 
  variant = 'default',
  padding = 'base',
  header,
  footer,
  ...props 
}) => {
  return (
    <StyledCard variant={variant} padding={padding} {...props}>
      {header && <CardHeader>{header}</CardHeader>}
      <CardBody>{children}</CardBody>
      {footer && <CardFooter>{footer}</CardFooter>}
    </StyledCard>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined', 'flat']),
  padding: PropTypes.oneOf(['sm', 'base', 'lg']),
  header: PropTypes.node,
  footer: PropTypes.node,
};

export default Card;
