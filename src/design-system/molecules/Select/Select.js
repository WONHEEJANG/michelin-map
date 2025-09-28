import React from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { colors, typography, spacing, borderRadius } from '../../tokens';

const SelectWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const StyledSelect = styled.select`
  width: 100%;
  padding: ${spacing[3]} ${spacing[4]};
  padding-right: ${spacing[10]};
  border: 1px solid ${colors.border.primary};
  border-radius: ${borderRadius.base};
  font-family: ${typography.fontFamily.primary};
  font-size: ${typography.fontSize.sm};
  font-weight: ${typography.fontWeight.normal};
  line-height: ${typography.lineHeight.normal};
  color: ${colors.text.primary};
  background-color: ${colors.background.primary};
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
  background-position: right ${spacing[3]} center;
  background-repeat: no-repeat;
  background-size: 1.5em 1.5em;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  outline: none;
  
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
          padding-right: ${spacing[8]};
          font-size: ${typography.fontSize.xs};
        `;
      case 'lg':
        return `
          padding: ${spacing[4]} ${spacing[5]};
          padding-right: ${spacing[12]};
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

const Select = ({ 
  label,
  options = [],
  placeholder = "선택하세요",
  error,
  errorMessage,
  size = 'base',
  ...props 
}) => {
  return (
    <SelectWrapper>
      {label && <Label>{label}</Label>}
      <StyledSelect
        error={error}
        size={size}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </StyledSelect>
      {error && errorMessage && (
        <ErrorMessage>{errorMessage}</ErrorMessage>
      )}
    </SelectWrapper>
  );
};

Select.propTypes = {
  label: PropTypes.string,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
  })),
  placeholder: PropTypes.string,
  error: PropTypes.bool,
  errorMessage: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'base', 'lg']),
};

export default Select;
