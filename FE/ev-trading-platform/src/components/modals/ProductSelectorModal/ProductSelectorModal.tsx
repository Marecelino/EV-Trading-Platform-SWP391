// src/components/modals/ProductSelectorModal/ProductSelectorModal.tsx
import React, { useState, useEffect } from 'react';
import type { Product } from '../../../types';
import listingsApi from '../../../api/listingsApi';
import { X } from 'lucide-react';
import './ProductSelectorModal.scss';

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  currentCategory: 'ev' | 'battery' | null;
}

const ProductSelectorModal: React.FC<ProductSelectorModalProps> = ({ isOpen, onClose, onSelect, currentCategory }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      listingsApi.getAll().then(res => {
        if (res.data.success) {
          // Lọc sản phẩm theo danh mục đã chọn (nếu có)
          const filtered = res.data.data.filter(p => {
            if (!currentCategory) return true;
            return currentCategory === 'ev' ? !!p.ev_details : !!p.battery_details;
          });
          setProducts(filtered);
        }
      }).finally(() => setIsLoading(false));
    }
  }, [isOpen, currentCategory]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Chọn sản phẩm để so sánh</h3>
          <button onClick={onClose} className="close-btn"><X /></button>
        </div>
        <div className="modal-body">
          {isLoading ? <p>Đang tải...</p> : (
            <div className="product-selection-list">
              {products.map(product => (
                <div key={product._id} className="selection-item" onClick={() => onSelect(product)}>
                  <img src={product.images[0]} alt={product.title} />
                  <div className="selection-item-info">
                    <p className="title">{product.title}</p>
                    <p className="price">{product.price.toLocaleString('vi-VN')} ₫</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSelectorModal;