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
interface EVDetailsFormData {
  year?: number; // Changed from year_of_manufacture to year (matches backend)
  mileage?: number;
  battery_capacity?: number;
  range?: number;
  manufacture_year?: number; // Added for EV Auction (optional, separate from year)
}

interface BatteryDetailsFormData {
  capacity?: number; // maps to capacity_kwh
  state_of_health?: number; // maps to soh_percent
  manufacture_year?: number; // Changed from manufacturing_date (date) to manufacture_year (number)
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
  const [validationWarnings, setValidationWarnings] = useState<ValidationErrors>({});

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

  // Clear validation errors and warnings when category or listingType changes
  useEffect(() => {
    setValidationErrors({});
    setValidationWarnings({});
  }, [category, listingType]);
  // Real-time validation for individual fields
  const validateField = (name: string, value: string | number) => {
    setValidationErrors((prevErrors) => {
      const errors: ValidationErrors = { ...prevErrors };
      // Clear existing error for this field
      delete errors[name];

      // Validate title
      if (name === "title") {
        const title = String(value || "");
        if (title.length > 0 && title.length < 5) {
          errors.title = "Tiêu đề phải có ít nhất 5 ký tự";
        } else if (title.length > 100) {
          errors.title = "Tiêu đề không được vượt quá 100 ký tự";
        }
      }

      // Validate description
      if (name === "description") {
        const description = String(value || "");
        if (description.length > 0 && description.length < 20) {
          errors.description = "Mô tả phải có ít nhất 20 ký tự";
        } else if (description.length > 2000) {
          errors.description = "Mô tả không được vượt quá 2000 ký tự";
        }
      }

      // Validate price (direct sale)
      if (name === "price" && listingType === "direct_sale") {
        const price = Number(value) || 0;
        if (price < 0) {
          errors.price = "Giá phải lớn hơn hoặc bằng 0";
        } else if (price === 0 && String(value).length > 0) {
          errors.price = "Giá phải lớn hơn 0";
        }
      }

      return errors;
    });

    // Update warnings for auction fields
    if (listingType === "auction") {
      setValidationWarnings((prevWarnings) => {
        const warnings: ValidationErrors = { ...prevWarnings };
        
        const auction = formData.auction as { starting_price?: string; min_increment?: string; buy_now_price?: string } | undefined;
        const startingPrice = name === "auction.starting_price" 
          ? Number(value) 
          : Number(auction?.starting_price || 0);
        const minIncrement = name === "auction.min_increment"
          ? Number(value)
          : Number(auction?.min_increment || 0);
        const buyNowPrice = name === "auction.buy_now_price"
          ? (value ? Number(value) : undefined)
          : (auction?.buy_now_price ? Number(auction.buy_now_price) : undefined);

        // Clear warnings when field changes
        if (name === "auction.min_increment" || name === "auction.starting_price") {
          delete warnings.min_increment;
        }
        if (name === "auction.buy_now_price" || name === "auction.starting_price") {
          delete warnings.buy_now_price;
        }

        // Validate auction starting_price and min_increment relationship
        if (startingPrice > 0 && minIncrement > 0) {
          const recommendedMin = startingPrice * 0.01; // 1% of starting price
          if (minIncrement < recommendedMin) {
            warnings.min_increment = `Khuyến nghị: Bước giá nên lớn hơn hoặc bằng ${Math.round(recommendedMin).toLocaleString('vi-VN')} VND (1% của giá khởi điểm)`;
          }
        }

        // Warning: buy_now_price should be >= starting_price
        if (buyNowPrice !== undefined && buyNowPrice > 0 && startingPrice > 0 && buyNowPrice < startingPrice) {
          warnings.buy_now_price = `Khuyến nghị: Giá mua ngay nên lớn hơn hoặc bằng giá khởi điểm (${Math.round(startingPrice).toLocaleString('vi-VN')} VND)`;
        }

        return warnings;
      });
    }
  };

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
      
      // Real-time validation for nested fields
      if (outer === "auction") {
        validateField(name, value);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Real-time validation
      validateField(name, value);
    }
  };

  // Validation function
  const validateForm = (): boolean => {
    const errors: ValidationErrors = {};
    const warnings: ValidationErrors = {};

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

    // Price validation: only for direct sale, not for auction
    if (listingType === "direct_sale") {
      const price = Number(formData.price) || 0;
      if (price <= 0) {
        errors.price = "Giá phải lớn hơn 0";
      }
    }

    // Auction validation: validate starting_price and min_increment
    if (listingType === "auction") {
      const auction = formData.auction as { 
        starting_price?: string; 
        min_increment?: string; 
        buy_now_price?: string;
        start_time?: string; 
        end_time?: string 
      } | undefined;
      const startingPrice = Number(auction?.starting_price || 0);
      const minIncrement = Number(auction?.min_increment || 0);
      const buyNowPrice = auction?.buy_now_price ? Number(auction.buy_now_price) : undefined;
      
      if (startingPrice <= 0) {
        errors.price = "Giá khởi điểm phải lớn hơn 0"; // Reuse price error field for auction
      }
      
      if (minIncrement <= 0) {
        errors.min_increment = "Bước giá tối thiểu phải lớn hơn 0";
      } else {
        // Warning: recommend min_increment >= 1% of starting_price
        const recommendedMin = startingPrice * 0.01;
        if (minIncrement < recommendedMin) {
          warnings.min_increment = `Khuyến nghị: Bước giá nên lớn hơn hoặc bằng ${Math.round(recommendedMin).toLocaleString('vi-VN')} VND (1% của giá khởi điểm)`;
        }
      }

      // Warning: buy_now_price should be >= starting_price
      if (buyNowPrice !== undefined && buyNowPrice > 0 && buyNowPrice < startingPrice) {
        warnings.buy_now_price = `Khuyến nghị: Giá mua ngay nênlớn hơn hoặc bằng giá khởi điểm (${Math.round(startingPrice).toLocaleString('vi-VN')} VND)`;
      }

      if (!auction?.start_time || !auction?.end_time) {
        errors.start_time = "Vui lòng nhập đầy đủ thời gian bắt đầu và kết thúc đấu giá";
      } else {
        const startTime = new Date(auction.start_time);
        const endTime = new Date(auction.end_time);
        const now = new Date();
        
        if (startTime <= now) {
          errors.start_time = "Thời gian bắt đầu phải sau thời điểm hiện tại";
        }
        
        if (endTime <= startTime) {
          errors.end_time = "Thời gian kết thúc phải sau thời gian bắt đầu";
        }
      }
    }

    // Brand validation: must select a brand
    if (!formData.brand_id) {
      errors.brand_name = "Vui lòng chọn hãng";
    }

    // Images validation: max 10 (removed min requirement - will use placeholder if no images)
    if (imageUrls.length > 10) {
      errors.images = "Chỉ được tải lên tối đa 10 hình ảnh";
    }

    // Validate year range for EV
    if (category === "ev") {
      const evDetails = formData.ev_details as EVDetailsFormData | undefined;
      if (evDetails?.year !== undefined) {
        const currentYear = new Date().getFullYear();
        if (evDetails.year < 1990 || evDetails.year > currentYear + 2) {
          errors.ev_year = `Năm sản xuất phải từ 1990 đến ${currentYear + 2}`;
        }
      }
      if (listingType === "auction" && evDetails?.manufacture_year !== undefined) {
        const currentYear = new Date().getFullYear();
        if (evDetails.manufacture_year < 1900 || evDetails.manufacture_year > currentYear + 5) {
          errors.ev_manufacture_year = `Năm sản xuất pin phải từ 1900 đến ${currentYear + 5}`;
        }
      }
    }

    // Validate manufacture_year and soh_percent for Battery
    if (category === "battery") {
      const batteryDetails = formData.battery_details as BatteryDetailsFormData | undefined;
      if (batteryDetails?.manufacture_year !== undefined) {
        const currentYear = new Date().getFullYear();
        if (batteryDetails.manufacture_year < 1900 || batteryDetails.manufacture_year > currentYear + 5) {
          errors.battery_manufacture_year = `Năm sản xuất phải từ 1900 đến ${currentYear + 5}`;
        }
      }
      if (batteryDetails?.state_of_health !== undefined) {
        if (batteryDetails.state_of_health < 0 || batteryDetails.state_of_health > 100) {
          errors.battery_soh = "Tình trạng sức khỏe pin phải từ 0 đến 100%";
        }
      }
    }

    setValidationErrors(errors);
    setValidationWarnings(warnings);
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

      // CRITICAL FIX: Location is now string, not object
      const locationString = formData.location
        ? (typeof formData.location === 'string' ? formData.location : String(formData.location))
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
            year: evDetails?.year, // Fixed: Use year instead of year_of_manufacture
            mileage: evDetails?.mileage,
            battery_capacity: evDetails?.battery_capacity,
            range: evDetails?.range,
            manufacture_year: evDetails?.manufacture_year, // Fixed: Use manufacture_year (optional, separate from year)
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
            manufacture_year: batteryDetails?.manufacture_year, // Fixed: Use manufacture_year (number) directly
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
            year: evDetails?.year, // Fixed: Use year instead of year_of_manufacture
            mileage: evDetails?.mileage,
            battery_capacity: evDetails?.battery_capacity,
            range: evDetails?.range,
          };
          response = await listingApi.createEV(evData);
        } else {
          const batteryDetails = formData.battery_details as BatteryDetailsFormData | undefined;
          // Map Battery-specific fields - FIXED: Use manufacture_year (number) directly
          const batteryData: CreateBatteryListingDto = {
            ...baseListingData,
            capacity_kwh: batteryDetails?.capacity,
            soh_percent: batteryDetails?.state_of_health,
            manufacture_year: batteryDetails?.manufacture_year, // Fixed: Use manufacture_year (number) directly
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

  // Helper function for dynamic placeholders based on category and listingType
  const getTitlePlaceholder = (): string => {
    if (category === "ev") {
      return listingType === "auction"
        ? "VD: Tesla Model 3 2022 - Đấu giá xe điện"
        : "VD: Tesla Model 3 2022 - Xe điện đã qua sử dụng";
    } else {
      return listingType === "auction"
        ? "VD: Tesla Battery Pack 75kWh - Đấu giá pin"
        : "VD: Tesla Battery Pack 75kWh - Đã qua sử dụng";
    }
  };

  // Helper function for description placeholder
  const getDescriptionPlaceholder = (): string => {
    if (category === "ev") {
      return "Mô tả tình trạng xe, lịch sử sử dụng, tính năng nổi bật, lý do bán...";
    } else {
      return "Mô tả dung lượng pin, tình trạng sức khỏe (SOH), số chu kỳ sạc, nguồn gốc, bảo hành...";
    }
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
              <AuctionFormSection 
                handleInputChange={handleInputChange} 
                validationErrors={validationErrors}
                validationWarnings={validationWarnings}
              />
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
            <small className="help-text">
              Chọn thương hiệu {category === "ev" ? "(VD: Tesla, VinFast, BYD)" : "(VD: Tesla, CATL, LG Chem)"}. 
              
            </small>
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
              placeholder={getTitlePlaceholder()}
              onChange={handleInputChange}
              required
              minLength={5}
              maxLength={100}
              className={validationErrors.title ? 'error' : ''}
              aria-invalid={!!validationErrors.title}
              aria-describedby={validationErrors.title ? 'title-error' : undefined}
              value={(formData.title as string) || ""}
            />
            {validationErrors.title && <span id="title-error" className="error-message">{validationErrors.title}</span>}
            <div className="help-text-container">
              <small className="help-text">Nhập tiêu đề (5-100 ký tự)</small>
              <span className="char-counter">
                {((formData.title as string)?.length || 0)}/100 ký tự
              </span>
            </div>
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
              placeholder={getDescriptionPlaceholder()}
              onChange={handleInputChange}
              required
              minLength={20}
              maxLength={2000}
              className={validationErrors.description ? 'error' : ''}
              aria-invalid={!!validationErrors.description}
              aria-describedby={validationErrors.description ? 'description-error' : undefined}
              value={(formData.description as string) || ""}
            ></textarea>
            {validationErrors.description && <span id="description-error" className="error-message">{validationErrors.description}</span>}
            <div className="help-text-container">
              <small className="help-text">
                Mô tả chi tiết về {category === "ev" ? "xe" : "pin"} (20-2000 ký tự)
                {category === "ev" ? (
                  <> - Gợi ý: Tình trạng xe, lịch sử sử dụng, tính năng nổi bật, lý do bán</>
                ) : (
                  <> - Gợi ý: Dung lượng pin, tình trạng sức khỏe (SOH), số chu kỳ sạc, nguồn gốc, bảo hành</>
                )}
              </small>
              <span className="char-counter">
                {((formData.description as string)?.length || 0)}/2000 ký tự
              </span>
            </div>
          </div>
        </div>
      </FormSection>

      <FormSection title="Thông số kỹ thuật">
        {category === "ev" && (
          <div className="form-grid">
            <div className="form-group">
              <label>Năm sản xuất (tùy chọn)</label>
              <input
                name="ev_details.year"
                type="number"
                onChange={handleInputChange}
                min={1990}
                max={new Date().getFullYear() + 2}
                placeholder="VD: 2022"
              />
              <small className="help-text">Năm sản xuất (1990 - {new Date().getFullYear() + 2})</small>
              {validationErrors.ev_year && <span className="error-message">{validationErrors.ev_year}</span>}
            </div>
            <div className="form-group">
              <label>Số km đã đi (tùy chọn)</label>
              <input
                name="ev_details.mileage"
                type="number"
                onChange={handleInputChange}
                min={0}
                step={1}
                placeholder="VD: 15000"
              />
              <small className="help-text">Số kilomet đã đi (VD: 15.000 km - chỉ nhập số, không có dấu phẩy)</small>
              {validationErrors.ev_mileage && <span className="error-message">{validationErrors.ev_mileage}</span>}
            </div>
            <div className="form-group">
              <label>Dung lượng pin (kWh) (tùy chọn)</label>
              <input
                name="ev_details.battery_capacity"
                type="number"
                onChange={handleInputChange}
                min={0}
                step={0.1}
                placeholder="VD: 75"
              />
              <small className="help-text">Dung lượng pin tính bằng kWh (VD: 75 kWh)</small>
              {validationErrors.ev_battery_capacity && <span className="error-message">{validationErrors.ev_battery_capacity}</span>}
            </div>
            <div className="form-group">
              <label>Quãng đường (km) (tùy chọn)</label>
              <input
                name="ev_details.range"
                type="number"
                onChange={handleInputChange}
                min={0}
                step={1}
                placeholder="VD: 450"
              />
              <small className="help-text">Quãng đường di chuyển (km) - Quãng đường có thể đi trên một lần sạc (VD: 450 km)</small>
              {validationErrors.ev_range && <span className="error-message">{validationErrors.ev_range}</span>}
            </div>
            {/* manufacture_year field - only show for EV Auction */}
            {listingType === "auction" && (
              <div className="form-group">
                <label>Năm sản xuất pin (tùy chọn)</label>
                <input
                  name="ev_details.manufacture_year"
                  type="number"
                  onChange={handleInputChange}
                  min={1900}
                  max={new Date().getFullYear() + 5}
                  placeholder="VD: 2022"
                />
                <small className="help-text">Năm sản xuất pin (1900 - {new Date().getFullYear() + 5}) - khác với năm sản xuất xe</small>
                {validationErrors.ev_manufacture_year && <span className="error-message">{validationErrors.ev_manufacture_year}</span>}
              </div>
            )}
          </div>
        )}
        {category === "battery" && (
          <div className="form-grid">
            <div className="form-group">
              <label>Dung lượng (kWh) (tùy chọn)</label>
              <input
                name="battery_details.capacity"
                type="number"
                onChange={handleInputChange}
                min={0}
                step={0.1}
                placeholder="VD: 75"
              />
              <small className="help-text">Dung lượng pin (kWh) - VD: 75 kWh (Giá trị phổ biến: 40, 50, 60, 75, 100 kWh)</small>
              {validationErrors.battery_capacity && <span className="error-message">{validationErrors.battery_capacity}</span>}
            </div>
            <div className="form-group">
              <label>
                Sức khỏe pin (%) (tùy chọn)
                <span className="tooltip-icon" title="SOH (State of Health) - % so với dung lượng ban đầu"> ℹ️</span>
              </label>
              <input
                name="battery_details.state_of_health"
                type="number"
                onChange={handleInputChange}
                min={0}
                max={100}
                step={0.1}
                placeholder="VD: 90"
              />
              <small className="help-text">Tình trạng sức khỏe pin (%) (0-100%) - SOH (State of Health): % so với dung lượng ban đầu (VD: 90%)</small>
              {validationErrors.battery_soh && <span className="error-message">{validationErrors.battery_soh}</span>}
            </div>
            <div className="form-group">
              <label>Năm sản xuất (tùy chọn)</label>
              <input
                name="battery_details.manufacture_year"
                type="number"
                onChange={handleInputChange}
                min={1900}
                max={new Date().getFullYear() + 5}
                placeholder="VD: 2022"
              />
              <small className="help-text">Năm sản xuất pin (1900 - {new Date().getFullYear() + 5})</small>
              {validationErrors.battery_manufacture_year && <span className="error-message">{validationErrors.battery_manufacture_year}</span>}
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
          onRemoveImage={(cloudinaryUrl) => {
            // Xóa Cloudinary URL khỏi state khi user xóa preview
            setImageUrls((prev) => prev.filter(url => url !== cloudinaryUrl));
          }}
        />
        <div className="help-text-container">
          <small className="help-text">
            Upload ảnh (tối thiểu 1, tối đa 10 ảnh) - Ảnh đầu tiên sẽ là ảnh đại diện
            <br />
            <span className="help-text-details">
              • Format: JPG, PNG
              <br />
              • Max size: 5MB mỗi ảnh
              <br />
              • Tỷ lệ khuyến nghị: 16:9
              {imageUrls.length === 0 && (
                <> - Nếu không tải ảnh, hệ thống sẽ sử dụng ảnh mặc định</>
              )}
            </span>
          </small>
          <span className="image-counter">
            {imageUrls.length}/10 ảnh
          </span>
        </div>
      </FormSection>

      <FormSection title="Thông tin bán">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="condition">Tình trạng {category === "ev" ? "xe" : "pin"}</label>
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
            <small className="help-text">Chọn tình trạng {category === "ev" ? "xe" : "pin"}</small>
          </div>
          {/* Price field - only show for direct sale, hide for auction */}
          {listingType === "direct_sale" && (
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
                placeholder="VD: 30000000"
              />
              {validationErrors.price && <span className="error-message">{validationErrors.price}</span>}

            </div>
          )}
          {/* Location field - single string input */}
          <div className="form-group full-width">
            <label htmlFor="location">Địa điểm (tùy chọn)</label>
            <input
              id="location"
              name="location"
              type="text"
              placeholder="VD: TP. Hồ Chí Minh, Quận 1"
              onChange={handleInputChange}
            />
            <small className="help-text">
              Địa chỉ - VD: "District 1 ,Ho Chi Minh City" hoặc "353D , Lã Xuân Oai , Long Trường,TP. Hồ Chí Minh."
              <br />
            </small>
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
