// src/pages/ProductListPage/ProductListPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import ProductCard from "../../components/modules/ProductCard/ProductCard";
import SidebarFilter from "../../components/modules/SidebarFilter/SidebarFilter";
import TopFilterBar, {
  type Filters,
} from "../../components/modules/TopFilterBar/TopFilterBar";
import listingApi from "../../api/listingApi";
import type { Product, Brand } from "../../types";
import "./ProductListPage.scss";

const ProductListPage: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State trung tâm cho tất cả bộ lọc
  const [filters, setFilters] = useState<Filters>({
    category: "xe-dien", // Mặc định là xe điện
  });

  useEffect(() => {
    const fetchAllProducts = async () => {
      setIsLoading(true);
      try {
        const response = await listingApi.getListings();
        if (response.data.data) {
          setAllProducts(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
      setIsLoading(false);
    };
    fetchAllProducts();
  }, []); // Chỉ chạy 1 lần khi trang được tải

  // Lọc danh sách sản phẩm trên frontend dựa vào state `filters`
  const filteredProducts = useMemo(() => {
    return allProducts.filter((product) => {
      // 1. Lọc theo Danh mục
      const categoryMatch =
        filters.category === "xe-dien"
          ? !!product.ev_details
          : !!product.battery_details;
      if (!categoryMatch) return false;

      // 2. Lọc theo Từ khóa tìm kiếm (ví dụ đơn giản)
      if (
        filters.searchTerm &&
        !product.title.toLowerCase().includes(filters.searchTerm.toLowerCase())
      ) {
        return false;
      }

      // 3. Lọc theo Hãng
      if (filters.brand && typeof product.brand_id === 'object' && (product.brand_id as Brand)._id !== filters.brand) {
        return false;
      }

      // 4. Lọc theo Năm sản xuất (chỉ cho xe điện)
      if (
        filters.category === "xe-dien" &&
        filters.year_of_manufacture &&
        product.ev_details?.year_of_manufacture !== filters.year_of_manufacture
      ) {
        return false;
      }

      // Nếu qua hết các điều kiện thì giữ lại sản phẩm
      return true;
    });
  }, [allProducts, filters]); // Tính toán lại mỗi khi `allProducts` hoặc `filters` thay đổi

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
    }));
  };

  return (
    <div className="product-list-page container">
      <TopFilterBar filters={filters} onFilterChange={handleFilterChange} />

      <div className="page-header">
        <h1>
          {filters.category === "ev" ? "Danh sách xe điện" : "Danh sách Pin"}
        </h1>
      </div>

      <div className="page-content">
        <div className="product-grid">
          {isLoading ? (
            <p>Đang tải...</p>
          ) : (
            filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                variant="detailed"
              />
            ))
          )}
        </div>
        <SidebarFilter />
      </div>
    </div>
  );
};

export default ProductListPage;
