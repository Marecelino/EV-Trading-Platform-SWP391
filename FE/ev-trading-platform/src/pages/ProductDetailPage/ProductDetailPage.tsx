import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import listingApi from "../../api/listingApi";
import priceSuggestionApi from "../../api/priceSuggestionApi";
import favoriteApi from "../../api/favoriteApi";
import type { Product, User, PriceSuggestion as PriceSuggestionType } from "../../types";
import ImageGallery from "../../components/modules/ImageGallery/ImageGallery";
import SpecificationTable from "../../components/modules/SpecificationTable/SpecificationTable";
import Button from '../../components/common/Button/Button';
import SellerInfoCard from "../../components/modules/SellerInfoCard/SellerInfoCard";
import KeySpecsBar from "../../components/modules/KeySpecsBar/KeySpecsBar";
import PriceSuggestion from "../../components/modules/PriceSuggestion/PriceSuggestion";
import { useAuth } from "../../contexts/AuthContext";
import "./ProductDetailPage.scss";

type PriceSuggestionSummary = {
  title: string;
  subtitle: string;
  display: {
    min: number;
    suggested: number;
    max: number;
    labelSuggested: string;
  };
};
const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [priceSuggestion, setPriceSuggestion] = useState<PriceSuggestionType | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    if (id) {
      const fetchProductData = async () => {
        setIsLoading(true);
        try {
          const productRes = await listingApi.getListingById(id);
          if (productRes.data) {
            const fetchedProduct = productRes.data;
            setProduct(fetchedProduct);

            const suggestionRes = await priceSuggestionApi.getLatestPriceSuggestionByListingId(id);
            if (suggestionRes.data) {
              setPriceSuggestion(suggestionRes.data);
            }

            if (user) {
              const favoriteRes = await favoriteApi.checkFavorite(user._id, id);
              if (favoriteRes.data) {
                setIsFavorited(true);
              }
            }
          }
        } catch (error) {
          console.error("Lỗi khi tải dữ liệu:", error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProductData();
    }
  }, [id, user]);

  if (isLoading)
    return (
      <div className="container page-loading">
        Đang tải chi tiết sản phẩm...
      </div>
    );
  if (!product)
    return (
      <div className="container page-loading">Không tìm thấy sản phẩm.</div>
    );

  const details = product.ev_details || product.battery_details;
  const seller = product.seller_id as User; // Ép kiểu vì mock đã populate

  return (
    <div className="product-detail-page container">
      <div className="main-content">
        {/* === TIÊU ĐỀ & GIÁ === */}
        <div className="content-card header-card">
          <h1>{product.title}</h1>
          <p className="price">
            {new Intl.NumberFormat("vi-VN", {
              style: "currency",
              currency: "VND",
            }).format(product.price)}
          </p>
          {priceSuggestion && <PriceSuggestion summary={priceSuggestion} />}

          <div className="meta-info">
            <span>
              Đăng {new Date(product.created_at).toLocaleDateString("vi-VN")}
            </span>
            <span>Lượt xem: {product.views}</span>
          </div>
        </div>

        {/* === BỘ SƯU TẬP ẢNH === */}
        <ImageGallery images={product.images} />

        {/* === THANH THÔNG SỐ CHÍNH === */}
        {product.ev_details && <KeySpecsBar details={product.ev_details} />}

        {/* === MÔ TẢ & THÔNG SỐ CHI TIẾT === */}
        <div className="content-card">
          <h2>Mô tả chi tiết</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>{product.description}</p>

          {details && <SpecificationTable details={details} />}
        </div>
      </div>

      <aside className="sidebar">
        <SellerInfoCard seller={seller} />

        <div className="content-card safety-tips">
          <h4>Mẹo an toàn</h4>
          <ul>
            <li>KHÔNG đặt cọc, thanh toán trước khi nhận xe.</li>
            <li>Kiểm tra kỹ giấy tờ xe và các chi tiết khác.</li>
            <li>Gặp mặt trực tiếp tại nơi công cộng, an toàn.</li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default ProductDetailPage;
