// src/pages/CreateListingPage/CreateListingPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Car, BatteryCharging } from "lucide-react";
import AuctionFormSection from "../../components/modules/forms/AuctionFormSection";
import Button from "../../components/common/Button/Button";
import ImageUploader from "../../components/common/ImageUploader/ImageUploader";
import PaymentModal from "../../components/modals/PaymentModal/PaymentModal";
import listingApi from "../../api/listingApi";
import auctionApi from "../../api/auctionApi";
import brandApi from "../../api/brandApi";
import { Brand } from "../../types";
import { CreateEVListingDto, CreateBatteryListingDto, CreateEVAuctionDto, CreateBatteryAuctionDto, CreateListingResponse, CreateAuctionResponse } from "../../types/api";
import { useAuth } from "../../contexts/AuthContext";
import "./CreateListingPage.scss";

// Default placeholder image URL - sử dụng khi seller không upload ảnh
const DEFAULT_PLACEHOLDER_IMAGE_URL = "https://tse1.mm.bing.net/th/id/OIP.CpI4hlHw3GEBWi67sFUFpQHaHa?rs=1&pid=ImgDetMain&o=7&rm=3";

type Category = "ev" | "battery";
type ListingType = "direct_sale" | "auction";
type FormState = Record<string, unknown>;

// CRITICAL FIX: Define proper interfaces for form data structures
interface LocationFormData {
  city?: string;
  district?: string;
  address?: string;
}

interface EVDetailsFormData {
  year_of_manufacture?: number;
  mileage?: number;
  battery_capacity?: number;
  range?: number;
}

interface BatteryDetailsFormData {
  capacity?: number; // maps to capacity_kwh
  state_of_health?: number; // maps to soh_percent
  manufacturing_date?: string; // maps to manufacture_year
}

// CreateListingResponse and CreateAuctionResponse are now imported from types/api

// Validation errors state
type ValidationErrors = {
  title?: string;
  description?: string;
  price?: string;
  brand_name?: string;
  images?: string;
  [key: string]: string | undefined;
};

const FormSection: React.FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <div className="form-section">
    <h2>{title}</h2>
    {children}
  </div>
);

const CreateListingPage: React.FC = () => {
  const { user } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const navigate = useNavigate();
  const [listingType, setListingType] = useState<ListingType>("direct_sale");
  const [formData, setFormData] = useState<FormState>({});
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [feeInfo, setFeeInfo] = useState<{
    paymentId: string;
    amount: number;
    paymentUrl: string;
  } | null>(null);
  
  // CRITICAL FIX: Fetch brands for brand_name mapping
  const [brands, setBrands] = useState<Brand[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  // Fetch brands on mount
  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const response = await brandApi.getActiveBrands();
        const brandsData = response.data?.data || response.data || [];
        setBrands(Array.isArray(brandsData) ? brandsData : []);
      } catch (error) {
        console.error("Failed to fetch brands:", error);
      }
    };
    fetchBrands();
  }, []);
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    // Xử lý input cho các trường lồng nhau như auction.starting_price
    if (name.includes(".")) {
      const [outer, inner] = name.split(".");
      setFormData((prev) => {
        const next: FormState = { ...prev };
        const nested = next[outer];
        const nestedObject =
          nested && typeof nested === "object"
            ? (nested as Record<string, unknown>)
            : {};

        next[outer] = {
          ...nestedObject,
          [inner]: value,
        };

        return next;
      });
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Validation function
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};

    // Title validation: min 5, max 100
    const title = (formData.title as string) || "";
    if (title.length < 5) {
      errors.title = "Tiêu đề phải có ít nhất 5 ký tự";
    } else if (title.length > 100) {
      errors.title = "Tiêu đề không được vượt quá 100 ký tự";
    }

    // Description validation: min 20, max 2000
    const description = (formData.description as string) || "";
    if (description.length < 20) {
      errors.description = "Mô tả phải có ít nhất 20 ký tự";
    } else if (description.length > 2000) {
      errors.description = "Mô tả không được vượt quá 2000 ký tự";
    }

    // Price validation: min 0
    const price = Number(formData.price) || 0;
    if (price <= 0) {
      errors.price = "Giá phải lớn hơn 0";
    }

    // Brand validation: must select a brand
    if (!formData.brand_id) {
      errors.brand_name = "Vui lòng chọn hãng";
    }

    // Images validation: max 10 (removed min requirement - will use placeholder if no images)
    if (imageUrls.length > 10) {
      errors.images = "Chỉ được tải lên tối đa 10 hình ảnh";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }

    if (!category) {
      setValidationErrors({ brand_name: "Vui lòng chọn loại sản phẩm (Xe điện hoặc Pin)" });
      return;
    }

    if (!user?._id) {
      alert("Vui lòng đăng nhập để tạo tin đăng");
      navigate("/login");
      return;
    }

    setIsLoading(true);
    setValidationErrors({});

    try {
      // CRITICAL FIX: Map brand_id to brand_name
      const selectedBrand = brands.find(b => b._id === formData.brand_id);
      if (!selectedBrand) {
        setValidationErrors({ brand_name: "Hãng không hợp lệ" });
        setIsLoading(false);
        return;
      }

      // CRITICAL FIX: Location should be string, not object
      const locationString = formData.location
        ? (typeof formData.location === 'string'
            ? formData.location
            : (() => {
                const location = formData.location as LocationFormData;
                return `${location.district || ''}, ${location.city || ''}`.trim();
              })())
        : undefined;

      // CRITICAL FIX: Ensure images array has at least 1 URL (use placeholder if no images uploaded)
      const finalImageUrls = imageUrls.length > 0 
        ? imageUrls 
        : [DEFAULT_PLACEHOLDER_IMAGE_URL];

      // CRITICAL FIX: Backend requires separate endpoints for EV and Battery
      // Map form data to the correct DTO structure based on category
      
      const baseListingData = {
        seller_id: user._id,
        brand_name: selectedBrand.name, // FIXED: Use brand name from selected brand
        title: (formData.title as string).trim(),
        description: (formData.description as string).trim(),
        price: Number(formData.price),
        condition: (formData.condition as 'new' | 'like_new' | 'excellent' | 'good' | 'fair' | 'poor') || 'good',
        images: finalImageUrls, // Use finalImageUrls (with placeholder if needed)
        location: locationString, // FIXED: Use string instead of object
      };

      let response;
      
      // Handle auction vs direct sale
      if (listingType === "auction") {
        // Auction creation - use separate endpoints for EV and Battery
        const selectedBrand = brands.find(b => b._id === formData.brand_id);
        if (!selectedBrand) {
          setValidationErrors({ brand_name: "Hãng không hợp lệ" });
          setIsLoading(false);
          return;
        }

        // CRITICAL FIX: Ensure images array has at least 1 URL for auction too
        const finalAuctionImageUrls = imageUrls.length > 0 
          ? imageUrls 
          : [DEFAULT_PLACEHOLDER_IMAGE_URL];

        const auctionBaseData = {
          seller_id: user._id,
          brand_name: selectedBrand.name,
          title: (formData.title as string).trim(),
          description: (formData.description as string).trim(),
          condition: (formData.condition as 'new' | 'like_new' | 'excellent' | 'good' | 'fair' | 'poor') || 'good',
          images: finalAuctionImageUrls, // Use finalAuctionImageUrls (with placeholder if needed)
          location: locationString,
          starting_price: Number((formData.auction as { starting_price?: string })?.starting_price || 0),
          min_increment: Number((formData.auction as { min_increment?: string })?.min_increment || 0),
          buy_now_price: (formData.auction as { buy_now_price?: string })?.buy_now_price 
            ? Number((formData.auction as { buy_now_price?: string }).buy_now_price) 
            : undefined,
        };

        // Convert datetime-local to ISO 8601
        const startTime = (formData.auction as { start_time?: string })?.start_time;
        const endTime = (formData.auction as { end_time?: string })?.end_time;
        
        if (!startTime || !endTime) {
          setValidationErrors({ title: "Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc đấu giá" });
          setIsLoading(false);
          return;
        }

        if (category === "ev") {
          const evDetails = formData.ev_details as EVDetailsFormData | undefined;
          const evAuctionData: CreateEVAuctionDto = {
            ...auctionBaseData,
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
            year: evDetails?.year_of_manufacture,
            mileage: evDetails?.mileage,
            battery_capacity: evDetails?.battery_capacity,
            range: evDetails?.range,
            manufacture_year: evDetails?.year_of_manufacture, // Can be same as year
          };
          response = await auctionApi.createEVAuction(evAuctionData);
        } else {
          const batteryDetails = formData.battery_details as BatteryDetailsFormData | undefined;
          const batteryAuctionData: CreateBatteryAuctionDto = {
            ...auctionBaseData,
            start_time: new Date(startTime).toISOString(),
            end_time: new Date(endTime).toISOString(),
            capacity_kwh: batteryDetails?.capacity,
            soh_percent: batteryDetails?.state_of_health,
            manufacture_year: batteryDetails?.manufacturing_date 
              ? new Date(batteryDetails.manufacturing_date).getFullYear() 
              : undefined,
          };
          response = await auctionApi.createBatteryAuction(batteryAuctionData);
        }
      } else {
        // Direct sale - use listing endpoints
        if (category === "ev") {
          const evDetails = formData.ev_details as EVDetailsFormData | undefined;
          // Map EV-specific fields - FIXED: Use correct field names
          const evData: CreateEVListingDto = {
            ...baseListingData,
            year: evDetails?.year_of_manufacture,
            mileage: evDetails?.mileage, // FIXED: mileage not mileage_km
            battery_capacity: evDetails?.battery_capacity, // FIXED: battery_capacity not battery_capacity_kwh
            range: evDetails?.range, // FIXED: range not range_km
          };
          response = await listingApi.createEV(evData);
        } else {
          const batteryDetails = formData.battery_details as BatteryDetailsFormData | undefined;
          // Map Battery-specific fields - FIXED: Remove battery_type
          const batteryData: CreateBatteryListingDto = {
            ...baseListingData,
            capacity_kwh: batteryDetails?.capacity,
            soh_percent: batteryDetails?.state_of_health,
            manufacture_year: batteryDetails?.manufacturing_date 
              ? new Date(batteryDetails.manufacturing_date).getFullYear() 
              : undefined,
          };
          response = await listingApi.createBattery(batteryData);
        }
      }

      // Handle response - backend returns { listing/auction, payment, paymentUrl }
      if (response.data) {
        // Extract response data - backend may wrap in 'data' property or return directly
        let responseData: CreateListingResponse | CreateAuctionResponse | null = null;
        const rawData = response.data as CreateListingResponse | CreateAuctionResponse | { data?: CreateListingResponse | CreateAuctionResponse };
        
        if (typeof rawData === 'object' && rawData !== null) {
          if ('data' in rawData && rawData.data && typeof rawData.data === 'object') {
            responseData = rawData.data as CreateListingResponse | CreateAuctionResponse;
          } else if ('paymentUrl' in rawData || 'payment' in rawData) {
            responseData = rawData as CreateListingResponse | CreateAuctionResponse;
          }
        }

        // Check if payment is required (paymentUrl should always be present for new listings/auctions)
        if (responseData && responseData.paymentUrl && responseData.payment) {
          // Successfully created listing/auction, now need to pay
          setFeeInfo({
            paymentId: responseData.payment._id,
            amount: responseData.payment.amount,
            paymentUrl: responseData.paymentUrl,
          });
          setIsPaymentModalOpen(true);
        } else {
          // Unexpected response structure - show success anyway and navigate
          console.warn("Unexpected response structure:", response.data);
          alert("Tạo tin đăng thành công! Vui lòng kiểm tra trong mục quản lý tin đăng.");
          navigate("/dashboard/my-listings");
        }
      }
    } catch (error: unknown) {

      const axiosError = error as { 
        message?: string; 
        data?: { message?: string }; 
        response?: { data?: { message?: string } } 
      };
      const message = axiosError?.message || axiosError?.data?.message || axiosError?.response?.data?.message || "Có lỗi xảy ra";
      alert(`Không thể tạo tin đăng: ${message}`);
      console.error("Create listing error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  // Note: Payment success is now handled by PaymentCallbackPage
  // This function is kept for backward compatibility but won't be called
  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    // User will be redirected to VNPay, then to PaymentCallbackPage
    // No need to navigate here
  };
  const renderDetailedForm = () => (
    <form onSubmit={handleFormSubmit} className="detailed-form">
      <FormSection title="Hình thức bán">
        <div className="listing-type-selector">
          <button
            type="button"
            className={listingType === "direct_sale" ? "active" : ""}
            onClick={() => setListingType("direct_sale")}
          >
            Bán trực tiếp
          </button>
          <button
            type="button"
            className={listingType === "auction" ? "active" : ""}
            onClick={() => setListingType("auction")}
          >
            Đấu giá
          </button>
        </div>
      </FormSection>

      {/* FORM ĐẤU GIÁ (NẾU CHỌN) */}
      {listingType === "auction" && (
        <FormSection title="Thông tin đấu giá">
          <AuctionFormSection handleInputChange={handleInputChange} />
        </FormSection>
      )}
      <FormSection title="Thông tin cơ bản">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="brand_id">Hãng {validationErrors.brand_name && <span className="error-text">* {validationErrors.brand_name}</span>}</label>
            <select 
              id="brand_id"
              name="brand_id" 
              onChange={handleInputChange} 
              required
              className={validationErrors.brand_name ? 'error' : ''}
              aria-invalid={!!validationErrors.brand_name}
            >
              <option value="">Chọn hãng</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
          {/* Bạn có thể thêm dropdown cho Model ở đây */}
          <div className="form-group full-width">
            <label htmlFor="title">
              Tiêu đề tin đăng 
              {validationErrors.title && <span className="error-text"> * {validationErrors.title}</span>}
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="VD: Vinfast VF8 Eco 2023 còn mới"
              onChange={handleInputChange}
              required
              minLength={5}
              maxLength={100}
              className={validationErrors.title ? 'error' : ''}
              aria-invalid={!!validationErrors.title}
              aria-describedby={validationErrors.title ? 'title-error' : undefined}
            />
            {validationErrors.title && <span id="title-error" className="error-message">{validationErrors.title}</span>}
            <small className="help-text">Tối thiểu 5 ký tự, tối đa 100 ký tự</small>
          </div>
          <div className="form-group full-width">
            <label htmlFor="description">
              Mô tả chi tiết
              {validationErrors.description && <span className="error-text"> * {validationErrors.description}</span>}
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              placeholder="Mô tả tình trạng, lịch sử bảo dưỡng..."
              onChange={handleInputChange}
              required
              minLength={20}
              maxLength={2000}
              className={validationErrors.description ? 'error' : ''}
              aria-invalid={!!validationErrors.description}
              aria-describedby={validationErrors.description ? 'description-error' : undefined}
            ></textarea>
            {validationErrors.description && <span id="description-error" className="error-message">{validationErrors.description}</span>}
            <small className="help-text">Tối thiểu 20 ký tự, tối đa 2000 ký tự</small>
          </div>
        </div>
      </FormSection>

      <FormSection title="Thông số kỹ thuật">
        {category === "ev" && (
          <div className="form-grid">
            <div className="form-group">
              <label>Năm sản xuất</label>
              <input
                name="ev_details.year_of_manufacture"
                type="number"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Số km đã đi</label>
              <input
                name="ev_details.mileage"
                type="number"
                onChange={handleInputChange}
                min={0}
              />
              <small className="help-text">Số kilomet đã đi</small>
            </div>
            <div className="form-group">
              <label>Dung lượng pin (kWh)</label>
              <input
                name="ev_details.battery_capacity"
                type="number"
                onChange={handleInputChange}
                min={0}
                step={0.1}
              />
              <small className="help-text">Dung lượng pin tính bằng kWh</small>
            </div>
            <div className="form-group">
              <label>Quãng đường (km)</label>
              <input
                name="ev_details.range"
                type="number"
                onChange={handleInputChange}
                min={0}
              />
              <small className="help-text">Quãng đường có thể đi trên một lần sạc</small>
            </div>
          </div>
        )}
        {category === "battery" && (
          <div className="form-grid">
            <div className="form-group">
              <label>Dung lượng (kWh) *</label>
              <input
                name="battery_details.capacity"
                type="number"
                onChange={handleInputChange}
                min={0}
                step={0.1}
                required
              />
              <small className="help-text">Dung lượng pin tính bằng kWh</small>
            </div>
            <div className="form-group">
              <label>Sức khỏe pin (%) *</label>
              <input
                name="battery_details.state_of_health"
                type="number"
                onChange={handleInputChange}
                min={0}
                max={100}
                required
              />
              <small className="help-text">Tình trạng pin còn lại (0-100%)</small>
            </div>
            <div className="form-group">
              <label>Năm sản xuất</label>
              <input
                name="battery_details.manufacturing_date"
                type="date"
                onChange={handleInputChange}
              />
              <small className="help-text">Ngày sản xuất pin (sẽ tự động chuyển thành năm)</small>
            </div>
          </div>
        )}
      </FormSection>

      <FormSection title="Hình ảnh sản phẩm">
        {validationErrors.images && (
          <div className="error-message">{validationErrors.images}</div>
        )}
        <ImageUploader
          onUploadComplete={(urls) => {
            setImageUrls((prev) => {
              const newUrls = [...prev, ...urls];
              if (newUrls.length > 10) {
                setValidationErrors(prev => ({ ...prev, images: "Chỉ được tải lên tối đa 10 hình ảnh" }));
                return prev.slice(0, 10);
              }
              if (newUrls.length <= 10) {
                setValidationErrors(prev => {
                  // eslint-disable-next-line @typescript-eslint/no-unused-vars
                  const { images: _images, ...rest } = prev;
                  return rest;
                });
              }
              return newUrls;
            });
          }}
        />
        <small className="help-text">
          Khuyến nghị tải lên ảnh để tin đăng hấp dẫn hơn (tối đa 10 ảnh, hiện tại: {imageUrls.length}/10)
          {imageUrls.length === 0 && (
            <span className="placeholder-hint"> • Nếu không tải ảnh, hệ thống sẽ sử dụng ảnh mặc định</span>
          )}
        </small>
      </FormSection>

      <FormSection title="Thông tin bán">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="condition">Tình trạng</label>
            <select 
              id="condition"
              name="condition" 
              onChange={handleInputChange} 
              required
            >
              <option value="">Chọn tình trạng</option>
              <option value="new">Mới</option>
              <option value="like_new">Như mới</option>
              <option value="excellent">Xuất sắc</option>
              <option value="good">Tốt</option>
              <option value="fair">Khá</option>
              <option value="poor">Kém</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="price">
              Giá bán (VND)
              {validationErrors.price && <span className="error-text"> * {validationErrors.price}</span>}
            </label>
            <input
              id="price"
              name="price"
              type="number"
              onChange={handleInputChange}
              required
              min={0}
              step={1000}
              className={validationErrors.price ? 'error' : ''}
              aria-invalid={!!validationErrors.price}
            />
            {validationErrors.price && <span className="error-message">{validationErrors.price}</span>}
          </div>
          <div className="form-group">
            <label>Thành phố</label>
            <select name="location.city" onChange={handleInputChange} required>
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
              <option value="Hà Nội">Hà Nội</option>
            </select>
          </div>
          <div className="form-group">
            <label>Quận/Huyện</label>
            <input
              name="location.district"
              type="text"
              onChange={handleInputChange}
              required
            />
          </div>
        </div>
      </FormSection>

      <div className="form-actions">
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Đang xử lý..."
            : listingType === "auction"
            ? "Tạo phiên đấu giá"
            : "Đăng tin"}
        </Button>{" "}
      </div>
    </form>
  );

  return (
    <>
      {/* Thêm Modal vào trang, nó sẽ tự ẩn/hiện */}
      {feeInfo && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          feeInfo={feeInfo}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
      <div className="create-listing-page container">
        <div className="page-header">
          <h1>
            {category
              ? `Đăng tin ${category === "ev" ? "Xe điện" : "Pin"}`
              : "Đăng tin mới"}
          </h1>
          <p>
            {category
              ? "Vui lòng điền đầy đủ thông tin bên dưới."
              : "Bắt đầu bằng cách chọn danh mục sản phẩm của bạn."}
          </p>
        </div>

        <div className="form-container">
          {/* === BƯỚC 1: CHỌN DANH MỤC (NẾU CHƯA CHỌN) === */}
          {!category ? (
            <div className="category-selection">
              <div className="category-card" onClick={() => setCategory("ev")}>
                <Car size={48} />
                <span>Xe điện</span>
              </div>
              <div
                className="category-card"
                onClick={() => setCategory("battery")}
              >
                <BatteryCharging size={48} />
                <span>Pin & Phụ kiện</span>
              </div>
            </div>
          ) : (
            // Nút để quay lại chọn danh mục
            <>
              <button onClick={() => setCategory(null)} className="back-button">
                &larr; Đổi danh mục
              </button>
              {renderDetailedForm()}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CreateListingPage;
