// src/pages/ProductDetailPage/ProductDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import listingApi from "../../api/listingApi";
import ImageGallery from "../../components/modules/ImageGallery/ImageGallery";
import SpecificationTable from "../../components/modules/SpecificationTable/SpecificationTable";
import SellerInfoCard from "../../components/modules/SellerInfoCard/SellerInfoCard";
import KeySpecsBar from "../../components/modules/KeySpecsBar/KeySpecsBar";
import "./ProductDetailPage.scss";
import priceSuggestionApi from "../../api/priceSuggestionApi";
import favoriteApi from "../../api/favoriteApi";
import evDetailApi from "../../api/evDetailApi";
import batteryDetailApi from "../../api/batteryDetailApi";
import authApi from "../../api/authApi";
import type { Product, User } from "../../types";
import PriceSuggestion from "../../components/modules/PriceSuggestion/PriceSuggestion";
import { useAuth } from "../../contexts/AuthContext";
import {
  MapPin,
  Tag,
  Eye,
  Calendar,
  CheckCircle,
  Shield,
  List,
  Gauge,
  Battery,
  ShieldCheck,
} from "lucide-react";

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

// Helper component for the new Highlights section
const HighlightsCard: React.FC<{
  title: string;
  items: string[];
  icon: React.ReactNode;
}> = ({ title, items, icon }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className="content-card highlights-card">
      <h3>
        {icon} {title}
      </h3>
      <ul className="highlights-list">
        {items.map((item, index) => (
          <li key={index}>
            <CheckCircle size={16} className="check-icon" /> {item}
          </li>
        ))}
      </ul>
    </div>
  );
};

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [priceSuggestion, setPriceSuggestion] =
    useState<PriceSuggestionSummary | null>(null);

  useEffect(() => {
    if (id) {
      const fetchProductData = async () => {
        setIsLoading(true);
        try {
          console.log("Fetching product with ID:", id);
          const productRes = await listingApi.getListingById(id);
          console.log("Product API Response:", productRes.data);

          if (productRes.data) {
            let productData: Product = productRes.data;

            // Try to fetch EV details
            try {
              const evDetailsRes = await evDetailApi.getEVDetailByListingId(id);
              if (evDetailsRes.data) {
                productData = { ...productData, ev_details: evDetailsRes.data };
              }
            } catch {
              // Could not fetch EV details, try battery details
              try {
                const batteryDetailsRes = await batteryDetailApi.getBatteryDetailByListingId(id);
                if (batteryDetailsRes.data) {
                  productData = { ...productData, battery_details: batteryDetailsRes.data };
                }
              } catch (batteryError) {
                console.log("Could not fetch EV or Battery details", batteryError);
              }
            }

            setProduct(productData);

            // Try to fetch seller data if not populated
            try {
              if (typeof productData.seller_id === 'string') {
                // If seller_id is just a string, fetch seller data from API
                try {
                  const sellerRes = await authApi.getUserById(productData.seller_id);
                  console.log("Seller response:", sellerRes.data);
                  if (sellerRes.data && sellerRes.data.data) {
                    setSeller(sellerRes.data.data);
                  }
                } catch (apiError) {
                  // Fallback to mock data if API fails
                  console.log("API failed, using mock seller data:", apiError);
                  const mockSeller: User = {
                    _id: productData.seller_id,
                    email: 'seller@example.com',
                    full_name: 'Người bán',
                    role: 'member',
                    status: 'active',
                    rating: {
                      average: 4.5,
                      count: 10
                    }
                  };
                  setSeller(mockSeller);
                }
              } else if (productData.seller_id && typeof productData.seller_id === 'object') {
                // If seller_id is already populated as User object
                setSeller(productData.seller_id as User);
              }
            } catch (sellerError) {
              console.log("Could not fetch seller data:", sellerError);
            }

            // Try to get price suggestion
            try {
              const suggestionRes = await priceSuggestionApi.getLatestPriceSuggestionByListingId(id);
              console.log("Price suggestion response:", suggestionRes.data);
              if (suggestionRes.data && suggestionRes.data.data) {
                // Transform API response to match component expected format
                const suggestionData = suggestionRes.data.data;
                const transformedSuggestion = {
                  title: "Gợi ý giá từ AI",
                  subtitle: `Dựa trên ${suggestionData.based_on_transactions || 0} giao dịch tương tự`,
                  display: {
                    min: suggestionData.min_price,
                    suggested: suggestionData.suggested_price,
                    max: suggestionData.max_price,
                    labelSuggested: `${(suggestionData.suggested_price / 1000000).toFixed(0)}tr`
                  }
                };
                setPriceSuggestion(transformedSuggestion);
              }
            } catch (suggestionError) {
              console.log("No price suggestion available:", suggestionError);
            }

            if (user) {
              try {
                const favoriteRes = await favoriteApi.checkFavorite(user._id, id);
                console.log("Favorite check result:", favoriteRes.data);
              } catch (favoriteError) {
                console.log("Favorite check failed:", favoriteError);
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

  const getConditionText = (condition: string) => {
    const map: Record<string, string> = {
      new: "Mới",
      like_new: "Như mới",
      good: "Tốt",
      fair: "Khá",
    };
    return map[condition] || condition;
  };

  return (
    <div className="product-detail-page container">
      <div className="main-content">
        {/* === TIÊU ĐỀ & GIÁ === */}
        <div className="content-card header-card">
          {product.is_verified && (
            <span className="status-badge verified">
              <CheckCircle size={14} /> Đã kiểm định
            </span>
          )}
          <h1>{product.title}</h1>
          <p
            className="price"
            data-negotiable={product.price > 0 ? "false" : "true"}
          >
            {product.price > 0
              ? new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(product.price)
              : "Thương lượng"}
          </p>

          <div className="meta-info">
            <div className="meta-item">
              <Tag className="icon" size={18} />
              <span className="label">Tình trạng:</span>
              <span className="value">
                {getConditionText(product.condition)}
              </span>
            </div>
            <div className="meta-item">
              <MapPin className="icon" size={18} />
              <span className="label">Khu vực:</span>
              <span className="value">
                {product.location.district}, {product.location.city}
              </span>
            </div>
            <div className="meta-item">
              <Eye className="icon" size={18} />
              <span className="label">Lượt xem:</span>
              <span className="value">{product.views}</span>
            </div>
            <div className="meta-item">
              <Calendar className="icon" size={18} />
              <span className="label">Ngày đăng:</span>
              <span className="value">
                {new Date(product.created_at).toLocaleDateString("vi-VN")}
              </span>
            </div>
            {product.ev_details && (
              <>
                <div className="meta-item">
                  <Calendar className="icon" size={18} />
                  <span className="label">Năm sản xuất:</span>
                  <span className="value">{product.ev_details.year_of_manufacture}</span>
                </div>
                <div className="meta-item">
                  <Gauge className="icon" size={18} />
                  <span className="label">Đã đi:</span>
                  <span className="value">{product.ev_details.mileage.toLocaleString("vi-VN")} km</span>
                </div>
              </>
            )}
            {product.battery_details && (
              <>
                <div className="meta-item">
                  <Battery className="icon" size={18} />
                  <span className="label">Dung lượng:</span>
                  <span className="value">{product.battery_details.capacity} kWh</span>
                </div>
                <div className="meta-item">
                  <ShieldCheck className="icon" size={18} />
                  <span className="label">Sức khỏe pin:</span>
                  <span className="value">{product.battery_details.state_of_health}%</span>
                </div>
              </>
            )}
          </div>

          {priceSuggestion && <PriceSuggestion summary={priceSuggestion} />}
        </div>

        {/* === BỘ SƯU TẬP ẢNH === */}
        <ImageGallery images={product.images} />

        {/* === THANH THÔNG SỐ CHÍNH === */}
        {details && <KeySpecsBar details={details} />}

        {/* === MÔ TẢ === */}
        <div className="content-card">
          <h2>Mô tả chi tiết</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {product.description || "Người bán không cung cấp mô tả chi tiết."}
          </p>
        </div>

        {/* === ĐẶC ĐIỂM NỔI BẬT === */}
        {product.ev_details && (
          <HighlightsCard
            title="Tính năng & Tiện ích"
            items={product.ev_details.features}
            icon={<List size={20} />}
          />
        )}
        {product.battery_details && (
          <>
            <HighlightsCard
              title="Model tương thích"
              items={product.battery_details.compatible_models}
              icon={<List size={20} />}
            />
            <HighlightsCard
              title="Chứng nhận & Tiêu chuẩn"
              items={product.battery_details.certification}
              icon={<Shield size={20} />}
            />
          </>
        )}

        {/* === THÔNG SỐ KỸ THUẬT CHI TIẾT === */}
        {details && (
          <div className="content-card">
            <SpecificationTable details={details} />
          </div>
        )}
      </div>

      <aside className="sidebar">
        {/* === THÔNG TIN NGƯỜI BÁN === */}
        {seller && <SellerInfoCard seller={seller} />}
        {!seller && product.seller_id && (
          <div className="content-card">
            <h4>Thông tin người bán</h4>
            <p>Đang tải thông tin người bán...</p>
          </div>
        )}

        {/* === MẸO AN TOÀN === */}
        <div className="content-card safety-tips">
          <h4>
            <Shield size={20} /> Mẹo an toàn
          </h4>
          <ul>
            <li>
              <strong>KHÔNG</strong> đặt cọc, thanh toán trước khi nhận sản phẩm.
            </li>
            <li>
              <strong>KIỂM TRA</strong> kỹ giấy tờ, nguồn gốc và tình trạng thực
              tế.
            </li>
            <li>
              <strong>GẶP MẶT</strong> trực tiếp tại nơi công cộng, an toàn để
              giao dịch.
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
};

export default ProductDetailPage;