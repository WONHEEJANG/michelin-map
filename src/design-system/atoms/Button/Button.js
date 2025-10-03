import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { colors, typography, spacing, borderRadius, shadows } from '../../tokens';

const StyledButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['variant', 'size', 'fullWidth'].includes(prop),
})`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${spacing[2]};
  padding: ${spacing[3]} ${spacing[4]};
  border: 1px solid transparent;
  border-radius: ${borderRadius.lg};
  font-family: ${typography.fontFamily.primary};
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  line-height: ${typography.lineHeight.tight};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  outline: none;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  
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
  }
  
  &:hover::before {
    opacity: 1;
  }
  
  &:focus-visible {
    box-shadow: 0 0 0 3px ${colors.primary[200]};
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background: ${colors.liquid.glass};
          color: ${colors.text.primary};
          border: 1px solid ${colors.border.glass};
          box-shadow: ${shadows.glass};
          &:hover:not(:disabled) {
            background: ${colors.liquid.glassHover};
            transform: translateY(-2px);
            box-shadow: ${shadows.glassHover};
          }
          &:active:not(:disabled) {
            background: ${colors.liquid.glassActive};
            transform: translateY(0);
            box-shadow: ${shadows.glassActive};
          }
        `;
      case 'secondary':
        return `
          background: ${colors.background.glass};
          color: ${colors.text.glass};
          border: 1px solid ${colors.border.primary};
          box-shadow: ${shadows.glassSubtle};
          &:hover:not(:disabled) {
            background: ${colors.liquid.glassHover};
            border-color: ${colors.border.glass};
            box-shadow: ${shadows.glass};
          }
        `;
      case 'ghost':
        return `
          background: transparent;
          color: ${colors.primary[600]};
          border: 1px solid transparent;
          &:hover:not(:disabled) {
            background: ${colors.primary[50]};
            border-color: ${colors.primary[200]};
          }
        `;
      case 'tertiary':
        return `
          background: ${colors.gray[100]};
          color: ${colors.text.primary};
          border: 1px solid ${colors.gray[200]};
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          &:hover:not(:disabled) {
            background: ${colors.gray[200]};
            border-color: ${colors.gray[300]};
            transform: translateY(-1px);
            box-shadow: ${shadows.apple};
          }
        `;
      case 'danger':
        return `
          background: ${colors.semantic.error};
          color: ${colors.text.inverse};
          border: 1px solid ${colors.semantic.error};
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          &:hover:not(:disabled) {
            background: #EF4444;
            transform: translateY(-2px);
            box-shadow: ${shadows.appleHover};
          }
        `;
      case 'glass':
        return `
          background: ${colors.liquid.glass};
          color: ${colors.text.primary};
          border: 1px solid ${colors.border.glass};
          box-shadow: ${shadows.glass};
          &:hover:not(:disabled) {
            background: ${colors.liquid.glassHover};
            transform: translateY(-2px);
            box-shadow: ${shadows.glassHover};
          }
        `;
      default:
        return '';
    }
  }}
  
  ${({ $size }) => {
    switch ($size) {
      case 'sm':
        return `
          padding: ${spacing[2]} ${spacing[3]};
          font-size: ${typography.fontSize.xs};
          border-radius: ${borderRadius.base};
        `;
      case 'lg':
        return `
          padding: ${spacing[4]} ${spacing[6]};
          font-size: ${typography.fontSize.lg};
          border-radius: ${borderRadius.xl};
        `;
      default:
        return '';
    }
  }}
  
  ${({ $fullWidth }) => $fullWidth && `
    width: 100%;
  `}
`;

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'base', 
  fullWidth = false,
  disabled = false,
  loading = false,
  icon,
  ...props 
}) => {
  return (
    <StyledButton
      $variant={variant}
      $size={size}
      $fullWidth={fullWidth}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span>⏳</span>}
      {icon && !loading && icon}
      {children}
    </StyledButton>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'tertiary', 'danger', 'glass']),
  size: PropTypes.oneOf(['sm', 'base', 'lg']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.node,
};

export default Button;
