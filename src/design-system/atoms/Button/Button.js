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
  border-radius: ${borderRadius.base};
  font-family: ${typography.fontFamily.primary};
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  line-height: ${typography.lineHeight.tight};
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  text-decoration: none;
  outline: none;
  
  &:focus-visible {
    box-shadow: 0 0 0 2px ${colors.primary[200]};
  }
  
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  ${({ $variant }) => {
    switch ($variant) {
      case 'primary':
        return `
          background-color: ${colors.primary[600]};
          color: ${colors.text.inverse};
          &:hover:not(:disabled) {
            background-color: ${colors.primary[700]};
            transform: translateY(-1px);
            box-shadow: ${shadows.md};
          }
        `;
      case 'secondary':
        return `
          background-color: ${colors.background.primary};
          color: ${colors.text.primary};
          border-color: ${colors.border.primary};
          &:hover:not(:disabled) {
            background-color: ${colors.gray[50]};
            border-color: ${colors.border.secondary};
          }
        `;
      case 'ghost':
        return `
          background-color: transparent;
          color: ${colors.primary[600]};
          &:hover:not(:disabled) {
            background-color: ${colors.primary[50]};
          }
        `;
      case 'tertiary':
        return `
          background-color: ${colors.gray[100]};
          color: ${colors.text.primary};
          border-color: ${colors.gray[200]};
          &:hover:not(:disabled) {
            background-color: ${colors.gray[200]};
            border-color: ${colors.gray[300]};
          }
        `;
      case 'danger':
        return `
          background-color: ${colors.semantic.error};
          color: ${colors.text.inverse};
          &:hover:not(:disabled) {
            background-color: #E53E3E;
            transform: translateY(-1px);
            box-shadow: ${shadows.md};
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
        `;
      case 'lg':
        return `
          padding: ${spacing[4]} ${spacing[6]};
          font-size: ${typography.fontSize.lg};
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
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'tertiary', 'danger']),
  size: PropTypes.oneOf(['sm', 'base', 'lg']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.node,
};

export default Button;
