// src/components/modules/SellerInfoCard/SellerInfoCard.tsx
import React from 'react';
import { Phone, MessageSquare } from 'lucide-react';
import type { User } from '../../../types';
import Button from '../../common/Button/Button';
import './SellerInfoCard.scss';

interface SellerInfoCardProps {
  seller: User;
}

const SellerInfoCard: React.FC<SellerInfoCardProps> = ({ seller }) => {
  return (
    <div className="seller-card content-card">
      <div className="seller-card__header">
        <img src={seller.avatar_url || 'https://i.pravatar.cc/150'} alt={seller.full_name} className="seller-card__avatar" />
        <div className="seller-card__info">
          <span className="seller-card__name">{seller.full_name}</span>
          <span className="seller-card__status">Cá nhân</span>
        </div>
      </div>
      <div className="seller-card__actions">
        <Button variant="primary" style={{ flex: 1 }}>
          <Phone size={18} /> 090... Hiện số
        </Button>
        <Button variant="outline" style={{ flex: 1 }}>
          <MessageSquare size={18} /> Chat
        </Button>
      </div>
    </div>
  );
};

export default SellerInfoCard;