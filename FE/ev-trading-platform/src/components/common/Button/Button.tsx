// src/components/common/Button/Button.tsx
import React from 'react';
import './Button.scss';

// Định nghĩa kiểu cho props
type ButtonVariant = 'primary' | 'secondary' | 'outline';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  ...props 
}) => {
  return (
    <button className={`btn btn--${variant}`} {...props}>
      {children}
    </button>
  );
};

export default Button;