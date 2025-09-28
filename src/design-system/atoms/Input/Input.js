import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { colors, typography, spacing, borderRadius } from '../../tokens';

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const StyledInput = styled.input`
  width: 100%;
  padding: ${spacing[3]} ${spacing[4]};
  border: 1px solid ${colors.border.primary};
  border-radius: ${borderRadius.base};
  font-family: ${typography.fontFamily.primary};
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.normal};
  line-height: ${typography.lineHeight.normal};
  color: ${colors.text.primary};
  background-color: ${colors.background.primary};
  transition: all 0.2s ease-in-out;
  outline: none;
  
  &::placeholder {
    color: ${colors.text.tertiary};
  }
  
  &:focus {
    border-color: ${colors.border.focus};
    box-shadow: 0 0 0 3px ${colors.primary[100]};
  }
  
  &:disabled {
    background-color: ${colors.gray[100]};
    color: ${colors.text.disabled};
    cursor: not-allowed;
  }
  
  ${({ error }) => error && `
    border-color: ${colors.semantic.error};
    &:focus {
      border-color: ${colors.semantic.error};
      box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.1);
    }
  `}
  
  ${({ size }) => {
    switch (size) {
      case 'sm':
        return `
          padding: ${spacing[2]} ${spacing[3]};
          font-size: ${typography.fontSize.xs};
        `;
      case 'lg':
        return `
          padding: ${spacing[4]} ${spacing[5]};
          font-size: ${typography.fontSize.lg};
        `;
      default:
        return '';
    }
  }}
`;

const Label = styled.label`
  display: block;
  margin-bottom: ${spacing[2]};
  font-family: ${typography.fontFamily.primary};
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.medium};
  color: ${colors.text.primary};
`;

const ErrorMessage = styled.span`
  display: block;
  margin-top: ${spacing[1]};
  font-family: ${typography.fontFamily.primary};
  font-size: ${typography.fontSize.xs};
  color: ${colors.semantic.error};
`;

const Input = forwardRef(({ 
  label, 
  error, 
  errorMessage, 
  size = 'base',
  ...props 
}, ref) => {
  return (
    <InputWrapper>
      {label && <Label>{label}</Label>}
      <StyledInput
        ref={ref}
        error={error}
        size={size}
        {...props}
      />
      {error && errorMessage && (
        <ErrorMessage>{errorMessage}</ErrorMessage>
      )}
    </InputWrapper>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  error: PropTypes.bool,
  errorMessage: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'base', 'lg']),
};

export default Input;
