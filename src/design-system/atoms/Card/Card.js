import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { colors, spacing, borderRadius, shadows } from '../../tokens';

const StyledCard = styled.div.withConfig({
  shouldForwardProp: (prop) => !['variant', 'padding'].includes(prop),
})`
  background: ${colors.liquid.glass};
  border-radius: ${borderRadius.xl};
  box-shadow: ${shadows.glass};
  border: 1px solid ${colors.border.glass};
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    border-radius: inherit;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  
  &:hover {
    box-shadow: ${shadows.glassHover};
    transform: translateY(-4px);
    background: ${colors.liquid.glassHover};
    
    &::before {
      opacity: 1;
    }
  }
  
  &:active {
    transform: translateY(-2px);
    box-shadow: ${shadows.glassActive};
  }
  
  ${({ variant }) => {
    switch (variant) {
      case 'elevated':
        return `
          box-shadow: ${shadows.glassStrong};
          background: ${colors.liquid.glassHover};
        `;
      case 'outlined':
        return `
          box-shadow: none;
          border: 2px solid ${colors.border.glass};
          background: ${colors.background.glass};
        `;
      case 'flat':
        return `
          box-shadow: none;
          border: none;
          background: ${colors.background.primary};
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        `;
      case 'glass':
        return `
          background: ${colors.liquid.glass};
          border: 1px solid ${colors.border.glass};
          box-shadow: ${shadows.glass};
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
      case 0:
        return `padding: 0;`;
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
  padding: ${spacing[0]};
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
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined', 'flat', 'glass']),
  padding: PropTypes.oneOf(['sm', 'base', 'lg', 0]),
  header: PropTypes.node,
  footer: PropTypes.node,
};

export default Card;
