// src/pages/ProductDetailPage/ProductDetailPage.tsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import listingApi from "../../api/listingApi";
import ImageGallery from "../../components/modules/ImageGallery/ImageGallery";
import SpecificationTable from "../../components/modules/SpecificationTable/SpecificationTable";
import SellerInfoCard from "../../components/modules/SellerInfoCard/SellerInfoCard";
import KeySpecsBar from "../../components/modules/KeySpecsBar/KeySpecsBar";
import "./ProductDetailPage.scss";
//import priceSuggestionApi from "../../api/priceSuggestionApi";
import favoriteApi from "../../api/favoriteApi";
import evDetailApi from "../../api/evDetailApi";
import batteryDetailApi from "../../api/batteryDetailApi";
import authApi, { extractUserFromResponse } from "../../api/authApi";
import type { Product, User, EVDetail, BatteryDetail } from "../../types";
//import PriceSuggestion from "../../components/modules/PriceSuggestion/PriceSuggestion";
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


  useEffect(() => {
    if (id) {
      const fetchProductData = async () => {
        setIsLoading(true);
        try {
          console.log("Fetching product with ID:", id);
          const productRes = await listingApi.getListingById(id);
          console.log("Product API Response:", productRes.data);

          // CRITICAL FIX: Handle response structure properly
          // getListingById returns AxiosResponse<Product>, so productRes.data is Product or wrapped
          const responseData = productRes.data as Product | { 
            data?: Product; 
            success?: boolean 
          };
          
          let productData: Product | null = null;
          if (responseData && typeof responseData === 'object' && 'data' in responseData && responseData.data) {
            productData = responseData.data;
          } else if (responseData && typeof responseData === 'object' && '_id' in responseData) {
            productData = responseData as Product;
          }

          if (productData) {

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

            // Try to fetch seller data - handle both populated objects and string IDs
            try {
              let sellerData: User | null = null;
              
              // First, try to extract seller from populated object (may be in _doc format)
              if (productData.seller_id && typeof productData.seller_id === 'object') {
                // Use helper to extract and normalize seller data (handles _doc structure)
                sellerData = extractUserFromResponse(productData.seller_id);
                if (sellerData) {
                  console.log("Extracted seller from productData.seller_id:", sellerData);
                  setSeller(sellerData);
                } else {
                  console.warn("Could not extract seller data from populated object:", productData.seller_id);
                }
              }
              
              // If seller_id is a string and we haven't extracted seller data yet, fetch from API
              if (!sellerData && typeof productData.seller_id === 'string') {
                try {
                  const sellerRes = await authApi.getUserById(productData.seller_id);
                  console.log("Seller response from API:", sellerRes.data);
                  
                  // Use helper function to extract user data from various response structures
                  const fetchedSellerData = extractUserFromResponse(sellerRes.data);
                  if (fetchedSellerData) {
                    setSeller(fetchedSellerData);
                  } else {
                    console.warn("Could not extract seller data from API response:", sellerRes.data);
                  }
                } catch (apiError) {
                  console.error("Error fetching seller data from API:", apiError);
                  // Don't set mock data - let the UI show loading state or error
                }
              }
            } catch (sellerError) {
              console.error("Error processing seller data:", sellerError);
            }

            

            if (user && id) {
              try {
                // CRITICAL FIX: checkFavorite now requires params object
                const favoriteRes = await favoriteApi.checkFavorite({ 
                  user_id: user._id, 
                  listing_id: id 
                });
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

  // Helper: Create details object from flat fields or nested details
  // Support both camelCase (evDetail) and snake_case (ev_details) naming conventions
  const getDetails = (): EVDetail | BatteryDetail | null => {
    // Check camelCase first (backend response), then snake_case (backward compatibility)
    if (product.evDetail) {
      return product.evDetail;
    }
    if (product.ev_details) {
      return product.ev_details;
    }
    if (product.batteryDetail) {
      return product.batteryDetail;
    }
    if (product.battery_details) {
      return product.battery_details;
    }
    // If flat fields exist on product, construct detail object
    if (product.category === 'ev' && (product.year || product.mileage || product.battery_capacity || product.range)) {
      return {
        _id: product._id,
        year: product.year || 0,
        mileage_km: product.mileage || 0,
        battery_capacity_kwh: product.battery_capacity || 0,
        range_km: product.range || 0,
      } as EVDetail;
    }
    if (product.category === 'battery' && (product.capacity_kwh !== undefined || product.soh_percent !== undefined)) {
      return {
        _id: product._id,
        capacity_kwh: product.capacity_kwh || 0,
        soh_percent: product.soh_percent || 0,
        battery_type: product.battery_type,
        manufacture_year: product.manufacture_year,
      } as BatteryDetail;
    }
    return null;
  };

  const details = getDetails();
  
  // Helper: Get location string
  const getLocationString = (): string => {
    if (typeof product.location === 'string') {
      return product.location;
    }
    if (product.location && typeof product.location === 'object') {
      const parts = [];
      if (product.location.district) parts.push(product.location.district);
      if (product.location.city) parts.push(product.location.city);
      if (product.location.address) parts.push(product.location.address);
      return parts.length > 0 ? parts.join(', ') : '';
    }
    return '';
  };

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
                {getLocationString() || 'N/A'}
              </span>
            </div>
            {product.views !== undefined && (
              <div className="meta-item">
                <Eye className="icon" size={18} />
                <span className="label">Lượt xem:</span>
                <span className="value">{product.views}</span>
              </div>
            )}
            {(product.created_at || product.createdAt) && (
              <div className="meta-item">
                <Calendar className="icon" size={18} />
                <span className="label">Ngày đăng:</span>
                <span className="value">
                  {(() => {
                    try {
                      const dateStr = product.createdAt || product.created_at || '';
                      const date = new Date(dateStr);
                      return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString("vi-VN");
                    } catch {
                      return 'N/A';
                    }
                  })()}
                </span>
              </div>
            )}
            {/* Display EV fields from nested evDetail/ev_details OR flat fields on product */}
            {(product.evDetail || product.ev_details || product.category === 'ev') && (
              <>
                {(product.evDetail?.year || product.ev_details?.year || product.year) && (
                  <div className="meta-item">
                    <Calendar className="icon" size={18} />
                    <span className="label">Năm sản xuất:</span>
                    <span className="value">
                      {product.evDetail?.year || product.ev_details?.year || product.year || 'N/A'}
                    </span>
                  </div>
                )}
                {(product.evDetail?.mileage_km !== undefined || product.ev_details?.mileage_km !== undefined || product.mileage !== undefined) && (
                  <div className="meta-item">
                    <Gauge className="icon" size={18} />
                    <span className="label">Đã đi:</span>
                    <span className="value">
                      {product.evDetail?.mileage_km !== undefined
                        ? `${product.evDetail.mileage_km.toLocaleString("vi-VN")} km`
                        : product.ev_details?.mileage_km !== undefined
                        ? `${product.ev_details.mileage_km.toLocaleString("vi-VN")} km`
                        : product.mileage !== undefined
                        ? `${product.mileage.toLocaleString("vi-VN")} km`
                        : 'N/A'}
                    </span>
                  </div>
                )}
                {(product.evDetail?.battery_capacity_kwh !== undefined || product.ev_details?.battery_capacity_kwh !== undefined || product.battery_capacity !== undefined) && (
                  <div className="meta-item">
                    <Battery className="icon" size={18} />
                    <span className="label">Dung lượng pin:</span>
                    <span className="value">
                      {product.evDetail?.battery_capacity_kwh !== undefined
                        ? `${product.evDetail.battery_capacity_kwh} kWh`
                        : product.ev_details?.battery_capacity_kwh !== undefined
                        ? `${product.ev_details.battery_capacity_kwh} kWh`
                        : product.battery_capacity !== undefined
                        ? `${product.battery_capacity} kWh`
                        : 'N/A'}
                    </span>
                  </div>
                )}
                {(product.evDetail?.range_km !== undefined || product.ev_details?.range_km !== undefined || product.range !== undefined) && (
                  <div className="meta-item">
                    <Gauge className="icon" size={18} />
                    <span className="label">Quãng đường:</span>
                    <span className="value">
                      {product.evDetail?.range_km !== undefined
                        ? `${product.evDetail.range_km.toLocaleString("vi-VN")} km`
                        : product.ev_details?.range_km !== undefined
                        ? `${product.ev_details.range_km.toLocaleString("vi-VN")} km`
                        : product.range !== undefined
                        ? `${product.range.toLocaleString("vi-VN")} km`
                        : 'N/A'}
                    </span>
                  </div>
                )}
              </>
            )}
            {/* Display Battery fields from nested batteryDetail/battery_details OR flat fields on product */}
            {(product.batteryDetail || product.battery_details || product.category === 'battery') && (
              <>
                {(product.batteryDetail?.capacity_kwh !== undefined || product.battery_details?.capacity_kwh !== undefined || product.capacity_kwh !== undefined) && (
                  <div className="meta-item">
                    <Battery className="icon" size={18} />
                    <span className="label">Dung lượng:</span>
                    <span className="value">
                      {product.batteryDetail?.capacity_kwh !== undefined
                        ? `${product.batteryDetail.capacity_kwh} kWh`
                        : product.battery_details?.capacity_kwh !== undefined
                        ? `${product.battery_details.capacity_kwh} kWh`
                        : product.capacity_kwh !== undefined
                        ? `${product.capacity_kwh} kWh`
                        : 'N/A'}
                    </span>
                  </div>
                )}
                {(product.batteryDetail?.soh_percent !== undefined || product.battery_details?.soh_percent !== undefined || product.soh_percent !== undefined) && (
                  <div className="meta-item">
                    <ShieldCheck className="icon" size={18} />
                    <span className="label">Sức khỏe pin (SOH):</span>
                    <span className="value">
                      {product.batteryDetail?.soh_percent !== undefined
                        ? `${product.batteryDetail.soh_percent}%`
                        : product.battery_details?.soh_percent !== undefined
                        ? `${product.battery_details.soh_percent}%`
                        : product.soh_percent !== undefined
                        ? `${product.soh_percent}%`
                        : 'N/A'}
                    </span>
                  </div>
                )}
                {(product.batteryDetail?.battery_type || product.battery_details?.battery_type || product.battery_type) && (
                  <div className="meta-item">
                    <ShieldCheck className="icon" size={18} />
                    <span className="label">Loại pin:</span>
                    <span className="value">
                      {product.batteryDetail?.battery_type || product.battery_details?.battery_type || product.battery_type || 'N/A'}
                    </span>
                  </div>
                )}
                {(product.batteryDetail?.manufacture_year !== undefined || product.battery_details?.manufacture_year !== undefined || product.manufacture_year !== undefined) && (
                  <div className="meta-item">
                    <Calendar className="icon" size={18} />
                    <span className="label">Năm sản xuất:</span>
                    <span className="value">
                      {product.batteryDetail?.manufacture_year || product.battery_details?.manufacture_year || product.manufacture_year || 'N/A'}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

        
        </div>

        {/* === BỘ SƯU TẬP ẢNH === */}
        <ImageGallery images={product.images} />

        {/* === THANH THÔNG SỐ CHÍNH === */}
        {details && (
          <div className="content-card">
            <KeySpecsBar details={details} />
          </div>
        )}

        {/* === MÔ TẢ === */}
        <div className="content-card">
          <h2>Mô tả chi tiết</h2>
          <p style={{ whiteSpace: "pre-wrap" }}>
            {product.description || "Người bán không cung cấp mô tả chi tiết."}
          </p>
        </div>

        {/* === ĐẶC ĐIỂM NỔI BẬT === */}
        {((product.evDetail?.features && product.evDetail.features.length > 0) || 
          (product.ev_details?.features && product.ev_details.features.length > 0)) && (
          <HighlightsCard
            title="Tính năng & Tiện ích"
            items={(product.evDetail?.features || product.ev_details?.features) || []}
            icon={<List size={20} />}
          />
        )}
        {(product.batteryDetail || product.battery_details) && (
          <>
            {((product.batteryDetail?.compatible_models && product.batteryDetail.compatible_models.length > 0) ||
              (product.battery_details?.compatible_models && product.battery_details.compatible_models.length > 0)) && (
              <HighlightsCard
                title="Model tương thích"
                items={(product.batteryDetail?.compatible_models || product.battery_details?.compatible_models) || []}
                icon={<List size={20} />}
              />
            )}
            {((product.batteryDetail?.certification && product.batteryDetail.certification.length > 0) ||
              (product.battery_details?.certification && product.battery_details.certification.length > 0)) && (
              <HighlightsCard
                title="Chứng nhận & Tiêu chuẩn"
                items={(product.batteryDetail?.certification || product.battery_details?.certification) || []}
                icon={<Shield size={20} />}
              />
            )}
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
        {seller && <SellerInfoCard seller={seller} product={product} />}
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