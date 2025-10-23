// src/pages/CreateListingPage/CreateListingPage.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Car, BatteryCharging } from "lucide-react";
import AuctionFormSection from "../../components/modules/forms/AuctionFormSection";
import Button from "../../components/common/Button/Button";
import ImageUploader from "../../components/common/ImageUploader/ImageUploader";
import PaymentModal from "../../components/modals/PaymentModal/PaymentModal";
import listingApi from "../../api/listingApi";
import brandApi from "../../api/brandApi";
import modelApi from "../../api/modelApi";
import { Brand, Model, Category } from "../../types";
import "./CreateListingPage.scss";

type Category = "ev" | "battery";
type ListingType = "direct_sale" | "auction";
type FormState = Record<string, unknown>;

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
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const navigate = useNavigate();
  const [listingType, setListingType] = useState<ListingType>("direct_sale");
  const [formData, setFormData] = useState<FormState>({});
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [feeInfo, setFeeInfo] = useState<{
    listing_fee_id: string;
    amount_due: number;
  } | null>(null);
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

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Dữ liệu cuối cùng để gửi đi
      const finalData = {
        ...formData,
        listing_type: listingType,
        category: category, // Thêm category để backend dễ xác định loại phí
        images: imageUrls,
      };

      // Luôn gọi API POST /listings để khởi tạo
      const response = await listingsApi.create(finalData);

      if (response.data.success) {
        setFeeInfo(response.data.data);
        setIsPaymentModalOpen(true);
      } else {
        throw new Error(response.data.message || "Có lỗi xảy ra");
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Có lỗi xảy ra";
      alert(`Không thể tạo tin đăng: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };
  const handlePaymentSuccess = () => {
    setIsPaymentModalOpen(false);
    alert(
      "Thanh toán thành công! Tin của bạn sẽ được duyệt trong thời gian sớm nhất."
    );
    navigate("/dashboard/my-listings"); // Chuyển trang đến quản lý tin đăng
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
            <label>Hãng</label>
            <select name="brand_id" onChange={handleInputChange} required>
              <option value="">Chọn hãng</option>
              <option value="brand_vinfast">VinFast</option>
              <option value="brand_tesla">Tesla</option>
              <option value="brand_kia">Kia</option>
              {category === "battery" && (
                <option value="brand_vines">VinES</option>
              )}
            </select>
          </div>
          {/* Bạn có thể thêm dropdown cho Model ở đây */}
          <div className="form-group full-width">
            <label>Tiêu đề tin đăng</label>
            <input
              name="title"
              type="text"
              placeholder="VD: Vinfast VF8 Eco 2023 còn mới"
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group full-width">
            <label>Mô tả chi tiết</label>
            <textarea
              name="description"
              rows={6}
              placeholder="Mô tả tình trạng, lịch sử bảo dưỡng..."
              onChange={handleInputChange}
              required
            ></textarea>
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
                required
              />
            </div>
            <div className="form-group">
              <label>Dung lượng pin (kWh)</label>
              <input
                name="ev_details.battery_capacity"
                type="number"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Quãng đường (km)</label>
              <input
                name="ev_details.range"
                type="number"
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        )}
        {category?.slug === "pin-xe-dien" && (
          <div className="form-grid">
            <div className="form-group">
              <label>Dung lượng (Ah)</label>
              <input
                name="battery_details.capacity"
                type="number"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Sức khỏe pin (%)</label>
              <input
                name="battery_details.state_of_health"
                type="number"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Điện áp (V)</label>
              <input
                name="battery_details.voltage"
                type="number"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Loại hóa chất</label>
              <input
                name="battery_details.chemistry_type"
                type="text"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Ngày sản xuất</label>
              <input
                name="battery_details.manufacturing_date"
                type="date"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Bảo hành còn lại</label>
              <input
                name="battery_details.warranty_remaining"
                type="text"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Các dòng xe tương thích</label>
              <input
                name="battery_details.compatible_models"
                type="text"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Kích thước (dài)</label>
              <input
                name="battery_details.dimensions.length"
                type="number"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Kích thước (rộng)</label>
              <input
                name="battery_details.dimensions.width"
                type="number"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Kích thước (cao)</label>
              <input
                name="battery_details.dimensions.height"
                type="number"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Cân nặng (kg)</label>
              <input
                name="battery_details.weight"
                type="number"
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Chứng nhận</label>
              <input
                name="battery_details.certification"
                type="text"
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
        )}
      </FormSection>

      <FormSection title="Hình ảnh sản phẩm">
        <ImageUploader
          onUploadComplete={(urls) =>
            setImageUrls((prev) => [...prev, ...urls])
          }
        />
      </FormSection>

      <FormSection title="Thông tin bán">
        <div className="form-grid">
          <div className="form-group">
            <label>Tình trạng</label>
            <select name="condition" onChange={handleInputChange} required>
              <option value="like_new">Như mới</option>
              <option value="good">Tốt</option>
              <option value="fair">Khá</option>
            </select>
          </div>
          <div className="form-group">
            <label>Giá bán (VND)</label>
            <input
              name="price"
              type="number"
              onChange={handleInputChange}
              required
            />
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
