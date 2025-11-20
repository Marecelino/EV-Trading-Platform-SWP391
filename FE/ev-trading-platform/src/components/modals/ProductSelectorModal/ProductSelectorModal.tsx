// src/components/modals/ProductSelectorModal/ProductSelectorModal.tsx
import React, { useState, useEffect, useMemo } from "react";
import type { Product } from "../../../types";
import listingApi from "../../../api/listingApi";
import { PaginatedResponse } from "../../../types/api";
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

      // Use getListings() with status filter and filter client-side by category
      listingApi
        .getListings({ status: 'active' })
        .then((res) => {
          console.log("ProductSelectorModal API Response:", res.data);
          
          // Handle both direct array and PaginatedResponse
          let allProducts: Product[] = [];
          if (Array.isArray(res.data)) {
            allProducts = res.data;
          } else if ((res.data as PaginatedResponse<Product>).data) {
            allProducts = (res.data as PaginatedResponse<Product>).data;
          } else if (res.data && typeof res.data === 'object' && 'data' in res.data && Array.isArray((res.data as { data: unknown }).data)) {
            allProducts = (res.data as { data: Product[] }).data;
          }
          
          // Filter by status "active" (double check client-side) and category
          const filteredProducts = allProducts.filter((product: Product) => {
            // Ensure status is active
            const isActive = product.status === "active";
            
            // Filter by category
            let matchesCategory = true;
            if (currentCategory === "ev") {
              matchesCategory = product.category === "ev";
            } else if (currentCategory === "battery") {
              matchesCategory = product.category === "battery";
            }
            
            return isActive && matchesCategory;
          });
          
          console.log(`Loaded ${filteredProducts.length} active products for category ${currentCategory} (from ${allProducts.length} total)`);
          setProducts(filteredProducts);
        })
        .catch((error) => {
          console.error("Failed to fetch products:", error);
          setProducts([]);
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
