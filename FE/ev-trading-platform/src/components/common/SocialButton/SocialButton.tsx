// src/components/common/SocialButton/SocialButton.tsx
import React from 'react';
import './SocialButton.scss';

interface SocialButtonProps {
  provider: 'google' | 'facebook';
  onClick: () => void;
  children: React.ReactNode;
}

const SocialButton: React.FC<SocialButtonProps> = ({ provider, onClick, children }) => {
  return (
    <button className={`social-button social-button--${provider}`} onClick={onClick}>
      {children}
    </button>
  );
};

export default SocialButton;