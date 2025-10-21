// src/components/modals/ProductSelectorModal/ProductSelectorModal.tsx
import React, { useState, useEffect, useMemo } from "react";
import type { Product } from "../../../types";
import listingsApi from "../../../api/listingsApi";
import { X, Search } from "lucide-react";
import "./ProductSelectorModal.scss";

interface ProductSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: Product) => void;
  currentCategory: "ev" | "battery" | null;
}

const ProductSelectorModal: React.FC<ProductSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  currentCategory,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setSearchQuery(""); // Reset search khi mở modal

      listingsApi
        .getAll()
        .then((res) => {
          if (res.data.success) {
            // Lọc sản phẩm theo danh mục đã chọn (nếu có)
            const filtered = res.data.data.filter((p: Product) => {
              if (!currentCategory) return true;
              return currentCategory === "ev"
                ? !!p.ev_details
                : !!p.battery_details;
            });
            setProducts(filtered);
          }
        })
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, currentCategory]);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;

    const query = searchQuery.toLowerCase().trim();
    return products.filter(
      (product) =>
        product.title.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.price.toString().includes(query)
    );
  }, [products, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Chọn sản phẩm để so sánh</h3>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="modal-search">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm sản phẩm theo tên, mô tả, giá..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              autoFocus
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="clear-search-btn"
                title="Xóa tìm kiếm"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="modal-body">
          {isLoading ? (
            <p className="loading-text">Đang tải...</p>
          ) : filteredProducts.length === 0 ? (
            <div className="no-results">
              {searchQuery ? (
                <>
                  <p>Không tìm thấy sản phẩm nào với từ khóa "{searchQuery}"</p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="reset-search-btn"
                  >
                    Xóa bộ lọc
                  </button>
                </>
              ) : (
                <p>Không có sản phẩm nào để hiển thị</p>
              )}
            </div>
          ) : (
            <>
              {searchQuery && (
                <div className="search-results-info">
                  Tìm thấy {filteredProducts.length} sản phẩm
                </div>
              )}
              <div className="product-selection-list">
                {filteredProducts.map((product) => (
                  <div
                    key={product._id}
                    className="selection-item"
                    onClick={() => onSelect(product)}
                  >
                    <img src={product.images[0]} alt={product.title} />
                    <div className="selection-item-info">
                      <p className="title">{product.title}</p>
                      <p className="price">
                        {product.price.toLocaleString("vi-VN")} ₫
                      </p>
                      {product.description && (
                        <p className="description">
                          {product.description.substring(0, 60)}
                          {product.description.length > 60 ? "..." : ""}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductSelectorModal;
