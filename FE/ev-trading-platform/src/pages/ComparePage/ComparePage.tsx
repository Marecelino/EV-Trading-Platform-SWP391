// src/pages/ComparePage/ComparePage.tsx
import React, { useState } from "react";
import type { Attribute, AttributeGroup, Product } from "../../types";
import { PlusCircle, X } from "lucide-react";
import ProductSelectorModal from "../../components/modals/ProductSelectorModal/ProductSelectorModal";
import "./ComparePage.scss";

const getNestedValue = (obj: unknown, path: string): unknown => {
  if (!obj) return undefined;
  return path.split(".").reduce<unknown>((current, segment) => {
    if (current && typeof current === "object" && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, obj);
};

const ComparePage: React.FC = () => {
  const [selectedProducts, setSelectedProducts] = useState<(Product | null)[]>([
    null,
    null,
    null,
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectingForSlot, setSelectingForSlot] = useState<number | null>(null);
  const [compareCategory, setCompareCategory] = useState<"ev" | "battery">(
    "ev"
  );

  const openModal = (slotIndex: number) => {
    setSelectingForSlot(slotIndex);
    setIsModalOpen(true);
  };

  const handleProductSelect = (product: Product) => {
    if (selectingForSlot !== null) {
      const newSelectedProducts = [...selectedProducts];
      newSelectedProducts[selectingForSlot] = product;
      setSelectedProducts(newSelectedProducts);
    }
    setIsModalOpen(false);
  };

  const removeItem = (slotIndex: number) => {
    const newSelectedProducts = [...selectedProducts];
    newSelectedProducts[slotIndex] = null;
    setSelectedProducts(newSelectedProducts);
  };

  const handleCategoryChange = (category: "ev" | "battery") => {
    setCompareCategory(category);
    setSelectedProducts([null, null, null]);
  };

  const items = selectedProducts.filter((p): p is Product => p !== null);

  const renderAttributeValue = (
    product: Product | null,
    attr: Attribute
  ): string => {
    if (!product) {
      return "";
    }

    const rawValue = getNestedValue(product, attr.key);
    const processed = attr.format ? attr.format(rawValue) : rawValue;

    if (processed === undefined || processed === null || processed === "") {
      return "-";
    }

    if (typeof processed === "string") {
      return processed;
    }

    if (typeof processed === "number" || typeof processed === "boolean") {
      return String(processed);
    }

    if (processed instanceof Date) {
      return processed.toLocaleDateString("vi-VN");
    }

    return "-";
  };

  const getAttributeGroups = (): AttributeGroup[] => {
    const commonGroup: AttributeGroup = {
      title: "Thông tin cơ bản",
      attributes: [
        {
          key: "price",
          label: "Giá bán",
          format: (val) =>
            typeof val === "number" ? `${val.toLocaleString("vi-VN")} ₫` : "-",
        },
        { key: "condition", label: "Tình trạng" },
        { key: "location.city", label: "Thành phố" },
        { key: "views", label: "Lượt xem" },
        { key: "is_verified", label: "Đã kiểm định", format: (val) => val ? "Có" : "Không" },
        { key: "is_featured", label: "Nổi bật", format: (val) => val ? "Có" : "Không" },
      ],
    };

    if (compareCategory === "ev") {
      return [
        commonGroup,
        {
          title: "Thông tin xe điện",
          attributes: [
            { 
              key: "brand_id.name", 
              label: "Hãng xe",
              format: (val) => val || "-"
            },
            { 
              key: "model_id.name", 
              label: "Model",
              format: (val) => val || "-"
            },
            { key: "title", label: "Tiêu đề" },
            { key: "description", label: "Mô tả" },
            { key: "location.district", label: "Quận/Huyện" },
            { key: "location.address", label: "Địa chỉ" },
          ],
        },
      ];
    }

    if (compareCategory === "battery") {
      return [
        commonGroup,
        {
          title: "Thông tin Pin & Phụ kiện",
          attributes: [
            { 
              key: "brand_id.name", 
              label: "Hãng sản xuất",
              format: (val) => val || "-"
            },
            { 
              key: "model_id.name", 
              label: "Model",
              format: (val) => val || "-"
            },
            { key: "title", label: "Tiêu đề" },
            { key: "description", label: "Mô tả" },
            { key: "location.district", label: "Quận/Huyện" },
            { key: "location.address", label: "Địa chỉ" },
          ],
        },
      ];
    }
    return [];
  };

  const attributeGroups = getAttributeGroups();

  return (
    <div className="compare-page container">
      <ProductSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleProductSelect}
        currentCategory={compareCategory}
      />

      <h1>So sánh sản phẩm</h1>
      <p className="subtitle">
        Chọn danh mục và thêm tối đa 3 sản phẩm để so sánh chi tiết.
      </p>

      <div className="category-switch">
        <button
          className={compareCategory === "ev" ? "active" : ""}
          onClick={() => handleCategoryChange("ev")}
        >
          So sánh Xe điện
        </button>
        <button
          className={compareCategory === "battery" ? "active" : ""}
          onClick={() => handleCategoryChange("battery")}
        >
          So sánh Pin
        </button>
      </div>

      <div className="compare-grid">
        {selectedProducts.map((product, index) => (
          <div key={index} className="compare-slot">
            {product ? (
              <div className="product-cell-selected">
                <button
                  className="remove-item-btn"
                  onClick={() => removeItem(index)}
                >
                  <X size={18} />
                </button>
                <img src={product.images[0]} alt={product.title} />
                <h4>{product.title}</h4>
                <p>{product.price.toLocaleString("vi-VN")} ₫</p>
              </div>
            ) : (
              <div
                className="product-slot-empty"
                onClick={() => openModal(index)}
              >
                <PlusCircle size={40} />
                <span>Thêm sản phẩm</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {items.length > 0 && (
        <div className="compare-details-table">
          {/* SỬA LỖI: Thêm lớp bảo vệ (attributeGroups || []) để tránh lỗi map */}
          {(attributeGroups || []).map((group) => (
            <React.Fragment key={group.title}>
              <div className="attribute-group-title">{group.title}</div>
              {/* SỬA LỖI: Thêm lớp bảo vệ (group.attributes || []) */}
              {(group.attributes || []).map((attr) => (
                <div key={attr.key} className="compare-row">
                  <div className="attribute-cell">{attr.label}</div>
                  {selectedProducts.map((product, index) => (
                    <div key={index} className="product-cell">
                      {renderAttributeValue(product, attr)}
                    </div>
                  ))}
                </div>
              ))}
            </React.Fragment>
          ))}
        </div>
      )}

      {items.length === 0 && (
        <div className="empty-state">
          <p>
            Hãy bấm vào dấu "+" ở trên để bắt đầu thêm sản phẩm vào so sánh.
          </p>
        </div>
      )}
    </div>
  );
};
export default ComparePage;
