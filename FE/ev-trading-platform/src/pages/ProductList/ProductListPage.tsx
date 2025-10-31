// src/pages/ProductListPage/ProductListPage.tsx
import React, { useState, useEffect } from "react";
import ProductCard from "../../components/modules/ProductCard/ProductCard";
import SidebarFilter from "../../components/modules/SidebarFilter/SidebarFilter";
import TopFilterBar, {
  type Filters,
} from "../../components/modules/TopFilterBar/TopFilterBar";
import listingApi from "../../api/listingApi";
import brandApi from "../../api/brandApi";
import type { Product, Brand } from "../../types";
import { SearchListingsParams, PaginatedResponse } from "../../types/api";
import "./ProductListPage.scss";

const ProductListPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  const [brands, setBrands] = useState<Brand[]>([]);

  // State trung tâm cho tất cả bộ lọc
  const [filters, setFilters] = useState<Filters>({
    category: "xe-dien", // Mặc định là xe điện
  });

  // Fetch brands for brand name mapping
  useEffect(() => {
    brandApi.getActiveBrands().then(res => {
      const brandsData = res.data?.data || res.data || [];
      setBrands(Array.isArray(brandsData) ? brandsData : []);
    }).catch(error => {
      console.error("Failed to fetch brands:", error);
    });
  }, []);

  // CRITICAL FIX: Use searchListings API instead of getListings
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        // Map frontend filters to SearchListingsParams
        const selectedBrand = filters.brand ? brands.find(b => b._id === filters.brand) : null;
        
        const searchParams: SearchListingsParams = {
          keyword: filters.searchTerm,
          brandName: selectedBrand?.name,
          category: filters.category === 'xe-dien' ? 'ev' : filters.category === 'pin-xe-dien' ? 'battery' : undefined,
          page: pagination.page,
          limit: pagination.limit,
        };

        const response = await listingApi.searchListings(searchParams);
        console.log("Search API Response:", response.data);

        // Handle both direct array and PaginatedResponse
        if (Array.isArray(response.data)) {
          setProducts(response.data);
        } else if ((response.data as PaginatedResponse<Product>).data) {
          const paginatedData = response.data as PaginatedResponse<Product>;
          setProducts(paginatedData.data);
          if (paginatedData.pagination) {
            setPagination(prev => ({
              ...prev,
              ...paginatedData.pagination!,
            }));
          }
        } else if (response.data?.data) {
          setProducts(response.data.data);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [filters, pagination.page, brands]); // Re-fetch when filters or page change

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      ...newFilters,
    }));
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  return (
    <div className="product-list-page container">
      <TopFilterBar filters={filters} onFilterChange={handleFilterChange} />

      <div className="page-header">
        <h1>Danh sách sản phẩm</h1>
        <p className="results-count">
          Hiển thị {products.length} sản phẩm
          {pagination.total > 0 && ` (tổng ${pagination.total} sản phẩm)`}
          {pagination.pages > 1 && ` - Trang ${pagination.page}/${pagination.pages}`}
        </p>
      </div>

      <div className="page-content">
        <div className="product-grid">
          {isLoading ? (
            <p>Đang tải...</p>
          ) : products.length === 0 ? (
            <p>Không tìm thấy sản phẩm nào phù hợp với bộ lọc của bạn.</p>
          ) : (
            products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                variant="detailed"
              />
            ))
          )}
        </div>
        <SidebarFilter filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination-container" style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
            style={{ marginRight: '10px', padding: '8px 16px' }}
          >
            Trước
          </button>
          <span style={{ padding: '8px 16px', alignSelf: 'center' }}>
            Trang {pagination.page} / {pagination.pages}
          </span>
          <button 
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            style={{ marginLeft: '10px', padding: '8px 16px' }}
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductListPage;
