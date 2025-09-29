// src/pages/ProductDetailPage/ProductDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import listingsApi from '../../api/listingsApi';
import type { Product } from '../../types';
import ImageGallery from '../../components/modules/ImageGallery/ImageGallery';
import SpecificationTable from '../../components/modules/SpecificationTable/SpecificationTable';
import Button from '../../components/common/Button/Button';
import './ProductDetailPage.scss';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchProduct = async () => {
        setIsLoading(true);
        try {
          const response = await listingsApi.getById(id);
          if (response.data.success) {
            setProduct(response.data.data);
          }
        } catch (error) {
          console.error("Failed to fetch product", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id]);

  if (isLoading) return <div className="container page-loading">Đang tải...</div>;
  if (!product) return <div className="container page-loading">Không tìm thấy sản phẩm.</div>;

  const details = product.ev_details || product.battery_details;

  return (
    <div className="product-detail-page container">
      <div className="main-content">
        <ImageGallery images={product.images} />
        <div className="content-card">
          <h2>Mô tả chi tiết</h2>
          <p>{product.description}</p>
        </div>
        {details && (
          <div className="content-card">
            <SpecificationTable details={details} />
          </div>
        )}
      </div>
      <aside className="sidebar">
        <div className="content-card">
          <h1>{product.title}</h1>
          <p className="price">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.price)}</p>
          <p className="location">{`${product.location.district}, ${product.location.city}`}</p>
          <Button variant="primary" style={{ width: '100%' }}>Thỏa thuận mua</Button>
        </div>
        {/* TODO: Thêm SellerInfoCard ở đây */}
      </aside>
    </div>
  );
};

export default ProductDetailPage;