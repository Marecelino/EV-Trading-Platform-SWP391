// src/pages/ComparePage/ComparePage.tsx
import React, { useState, useEffect } from "react";
import type { Attribute, AttributeGroup, Product, EVDetail, BatteryDetail } from "../../types";
import { PlusCircle, X } from "lucide-react";
import ProductSelectorModal from "../../components/modals/ProductSelectorModal/ProductSelectorModal";
import listingApi from "../../api/listingApi";
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

// Helper: Extract detail object from product (support both camelCase and snake_case)
const getDetailFromProduct = (product: Product): EVDetail | BatteryDetail | null => {
  if (!product) return null;
  
  // Check camelCase first (backend response), then snake_case (backward compatibility)
  if (product.evDetail) return product.evDetail;
  if (product.ev_details) return product.ev_details;
  if (product.batteryDetail) return product.batteryDetail;
  if (product.battery_details) return product.battery_details;
  
  return null;
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
  
  // Use selected products directly for comparison (no need for compareListings API)
  const displayProducts = items;

  const renderAttributeValue = (
    product: Product | null,
    attr: Attribute
  ): string => {
    if (!product) {
      return "";
    }

    // Handle detail fields (evDetail/ev_details or batteryDetail/battery_details)
    // Check if key starts with "detail." to access nested detail fields
    if (attr.key.startsWith("detail.")) {
      const detailPath = attr.key.replace("detail.", "");
      const detail = getDetailFromProduct(product);
      if (detail) {
        const rawValue = getNestedValue(detail, detailPath);
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
        
        if (Array.isArray(processed)) {
          return processed.join(", ");
        }
        
        return "-";
      }
      return "-";
    }

    // Regular product fields
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

    if (Array.isArray(processed)) {
      return processed.join(", ");
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
  
      ],
    };

    if (compareCategory === "ev") {
      return [
        commonGroup,
        {
          title: "Thông tin cơ bản xe điện",
          attributes: [
            { 
              key: "brand_id.name", 
              label: "Hãng xe",
              format: (val) => (val ? String(val) : "-")
            },
            { key: "title", label: "Tiêu đề" },
            { key: "location", label: "Địa chỉ" },
          ],
        },
        {
          title: "Thông số kỹ thuật xe điện",
          attributes: [
            {
              key: "detail.year",
              label: "Năm sản xuất",
              format: (val) => (val ? String(val) : "-")
            },
            {
              key: "detail.mileage_km",
              label: "Số KM đã đi",
              format: (val) => (val !== undefined && val !== null ? `${Number(val).toLocaleString("vi-VN")} km` : "-")
            },
            {
              key: "detail.battery_capacity_kwh",
              label: "Dung lượng pin",
              format: (val) => (val !== undefined && val !== null ? `${Number(val)} kWh` : "-")
            },
            {
              key: "detail.range_km",
              label: "Quãng đường",
              format: (val) => (val !== undefined && val !== null ? `${Number(val).toLocaleString("vi-VN")} km` : "-")
            }
            
          ],
        },
      ];
    }

    if (compareCategory === "battery") {
      return [
        commonGroup,
        {
          title: "Thông tin cơ bản Pin",
          attributes: [
            { 
              key: "brand_id.name", 
              label: "Hãng sản xuất",
              format: (val) => (val ? String(val) : "-")
            },
            { key: "title", label: "Tiêu đề" },
           
            { key: "location", label: "Địa chỉ" },
          ],
        },
        {
          title: "Thông số kỹ thuật Pin",
          attributes: [
            {
              key: "detail.capacity_kwh",
              label: "Dung lượng",
              format: (val) => (val !== undefined && val !== null ? `${Number(val)} kWh` : "-")
            },
            {
              key: "detail.soh_percent",
              label: "Sức khỏe pin (SOH)",
              format: (val) => (val !== undefined && val !== null ? `${Number(val)}%` : "-")
            },
            {
              key: "detail.manufacture_year",
              label: "Năm sản xuất",
              format: (val) => (val !== undefined && val !== null ? String(val) : "-")
            }
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
                  {/* Use selectedProducts directly for display */}
                  {selectedProducts.map((selectedProduct, index) => {
                    return (
                      <div key={index} className="product-cell">
                        {renderAttributeValue(selectedProduct, attr)}
                      </div>
                    );
                  })}
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
