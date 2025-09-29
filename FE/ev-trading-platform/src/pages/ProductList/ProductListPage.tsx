// src/pages/ProductListPage.tsx
import React, { useState, useEffect } from 'react';
import ProductCard from '../../components/modules/ProductCard/ProductCard';
import SidebarFilter from '../../components/modules/SidebarFilter/SidebarFilter';
import listingsApi from '../../api/listingsApi';
import type { Product } from '../../types';
import './ProductListPage.scss';

const ProductListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      const response = await listingsApi.getAll();
      if (response.data.success) {
        setProducts(response.data.data);
      }
      setIsLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <div className="product-list-page container">
      {/* TODO: Thêm TopFilterBar ở đây */}
      <div className="page-header">
        <h1>Danh sách xe điện & Pin</h1>
        {/* TODO: Thêm dropdown sắp xếp ở đây */}
      </div>

      <div className="page-content">
        <div className="product-grid">
          {isLoading ? (
            <p>Đang tải...</p>
          ) : (
            products.map(product => <ProductCard key={product._id} product={product} variant="detailed" />)
          )}
        </div>
        <SidebarFilter />
      </div>
    </div>
  );
};

export default ProductListPage;