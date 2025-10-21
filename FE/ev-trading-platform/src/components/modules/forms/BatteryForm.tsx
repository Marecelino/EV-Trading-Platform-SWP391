// src/components/modules/forms/BatteryForm.tsx
import React from "react";
import Button from "../../common/Button/Button";
import "./BatteryForm.scss";

const BatteryForm: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  return (
    <form className="battery-form">
      <div className="form-header">
        <h3>Thông tin cơ bản</h3>
      </div>

      <div className="form-section">
        <div className="form-group">
          <label htmlFor="battery-type">Loại pin</label>
          <select id="battery-type" required>
            <option value="">Chọn loại</option>
            <option value="lithium-ion">Lithium-ion</option>
            <option value="lithium-polymer">Lithium Polymer</option>
            <option value="lead-acid">Ắc quy</option>
            <option value="other">Khác</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="battery-title">Tiêu đề tin đăng</label>
          <input
            id="battery-title"
            type="text"
            placeholder="VD: Pin Lithium-ion cho xe máy điện"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="battery-description">Mô tả chi tiết</label>
          <textarea
            id="battery-description"
            placeholder="Mô tả tình trạng pin, khả năng tương thích..."
            rows={5}
            required
          ></textarea>
        </div>
      </div>

      <div className="form-header">
        <h3>Thông số kỹ thuật</h3>
      </div>

      <div className="form-section">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="battery-capacity">Dung lượng (Ah)</label>
            <input
              id="battery-capacity"
              type="number"
              placeholder=""
              min="0"
              step="0.1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="battery-voltage">Điện áp (V)</label>
            <input
              id="battery-voltage"
              type="number"
              placeholder=""
              min="0"
              step="0.1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="battery-health">Tình trạng pin (%)</label>
            <input
              id="battery-health"
              type="number"
              placeholder=""
              min="0"
              max="100"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="battery-cycles">Số lần sạc</label>
            <input id="battery-cycles" type="number" placeholder="" min="0" />
          </div>
        </div>
      </div>

      <div className="form-header">
        <h3>Hình ảnh sản phẩm</h3>
      </div>

      <div className="form-section">
        <div className="image-upload-area">
          <div className="upload-placeholder">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p>Kéo và thả ảnh vào đây, hoặc bấm để chọn ảnh</p>
            <span>Hỗ trợ tối đa 12 ảnh, định dạng JPG, PNG</span>
          </div>
        </div>
      </div>

      <div className="form-header">
        <h3>Thông tin bán</h3>
      </div>

      <div className="form-section">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="battery-condition">Tình trạng</label>
            <select id="battery-condition" required>
              <option value="">Như mới</option>
              <option value="new">Mới</option>
              <option value="like-new">Như mới</option>
              <option value="used">Đã sử dụng</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="battery-price">Giá bán (VND)</label>
            <input
              id="battery-price"
              type="number"
              placeholder=""
              min="0"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="battery-city">Thành phố</label>
            <select id="battery-city" required>
              <option value="">TP Hồ Chí Minh</option>
              <option value="hcm">TP Hồ Chí Minh</option>
              <option value="hanoi">Hà Nội</option>
              <option value="danang">Đà Nẵng</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="battery-district">Quận/Huyện</label>
            <input id="battery-district" type="text" placeholder="" />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Đang xử lý..." : "Hoàn tất"}
        </Button>
      </div>
    </form>
  );
};

export default BatteryForm;
