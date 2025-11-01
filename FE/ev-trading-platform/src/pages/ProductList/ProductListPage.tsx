// src/pages/ProductListPage/ProductListPage.tsx
import React, { useState, useEffect } from "react";
import ProductCard from "../../components/modules/ProductCard/ProductCard";
import SidebarFilter from "../../components/modules/SidebarFilter/SidebarFilter";
import TopFilterBar, {
  type Filters,
} from "../../components/modules/TopFilterBar/TopFilterBar";
import listingApi from "../../api/listingApi";
import type { Product } from "../../types";
import "./ProductListPage.scss";

const ProductListPage: React.FC = () => {
  const [allProducts, setAllProducts] = useState<Product[]>([]); // Store all fetched products
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]); // Filtered products for display
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  // State trung tâm cho tất cả bộ lọc
  const [filters, setFilters] = useState<Filters>({
    category: "xe-dien", // Mặc định là xe điện
  });

  // CRITICAL FIX: Use getListings() to fetch all data once, then filter client-side
  useEffect(() => {
    const fetchAllProducts = async () => {
      setIsLoading(true);
      try {
        // Fetch all listings without filters
        const response = await listingApi.getListings();
        console.log("GetListings API Response:", response.data);

        // Parse response - can be array or { data: [], meta: {} } or PaginatedResponse { data: [], pagination: {} }
        let productsData: Product[] = [];
        const responseData = response.data;
        
        if (Array.isArray(responseData)) {
          productsData = responseData;
        } else if (responseData && typeof responseData === 'object' && 'data' in responseData) {
          // Handle { data: [], meta: {} } or { data: [], pagination: {} } structure
          const dataField = (responseData as { data: unknown }).data;
          if (Array.isArray(dataField)) {
            productsData = dataField;
          }
        }

        console.log("Parsed productsData:", productsData);
        console.log("Products count:", productsData.length);
        setAllProducts(productsData);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        setAllProducts([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllProducts();
  }, []); // Only fetch once on mount

  // Client-side filtering and pagination
  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...allProducts];
      
      console.log("=== APPLYING FILTERS ===");
      console.log("allProducts count:", allProducts.length);
      console.log("filters:", filters);

      // Filter by category (map frontend category to backend category)
      if (filters.category) {
        const categoryMap: Record<string, 'ev' | 'battery' | undefined> = {
          'xe-dien': 'ev',
          'pin-xe-dien': 'battery',
        };
        const backendCategory = categoryMap[filters.category];
        if (backendCategory) {
          filtered = filtered.filter(p => p.category === backendCategory);
          console.log("After category filter:", filtered.length);
        }
      }

      // Filter by keyword/searchTerm (enhanced search)
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase().trim();
        if (searchTerm) {
          filtered = filtered.filter(p => {
            // Search in title
            const titleMatch = p.title.toLowerCase().includes(searchTerm);
            // Search in description
            const descMatch = p.description.toLowerCase().includes(searchTerm);
            // Search in brand name (if populated)
            let brandMatch = false;
            if (typeof p.brand_id === 'object' && p.brand_id) {
              brandMatch = (p.brand_id as { name?: string }).name?.toLowerCase().includes(searchTerm) || false;
            }
            return titleMatch || descMatch || brandMatch;
          });
          console.log("After search filter:", filtered.length);
        }
      }

      // Filter by brand
      if (filters.brand) {
        const brandId = filters.brand;
        filtered = filtered.filter(p => {
          const brand = typeof p.brand_id === 'object' ? p.brand_id : null;
          return brand?._id === brandId || p.brand_id === brandId;
        });
      }

      // Filter by model
      if (filters.model) {
        const modelId = filters.model;
        filtered = filtered.filter(p => {
          const model = typeof p.model_id === 'object' ? p.model_id : null;
          return model?._id === modelId || p.model_id === modelId;
        });
      }

      // Filter by status - show all active/sellable listings (exclude draft, rejected)
      // Show: active, pending_payment, payment_completed, sold (for display)
      // Hide: draft, rejected
      filtered = filtered.filter(p => {
        const hideStatuses = ['draft', 'rejected'];
        return !hideStatuses.includes(p.status);
      });

      // Filter by condition if available in filters (for future use)
      // if (filters.condition) {
      //   filtered = filtered.filter(p => p.condition === filters.condition);
      // }

      // Update pagination based on filtered results
      const total = filtered.length;
      const pages = Math.ceil(total / pagination.limit);
      setPagination(prev => ({
        ...prev,
        total,
        pages
      }));

      // Apply pagination
      const startIndex = (pagination.page - 1) * pagination.limit;
      const endIndex = startIndex + pagination.limit;
      const paginatedResults = filtered.slice(startIndex, endIndex);

      console.log("Final filtered count:", filtered.length);
      console.log("Paginated results count:", paginatedResults.length);
      setFilteredProducts(paginatedResults);
    };

    if (allProducts.length > 0) {
      applyFilters();
    }
  }, [allProducts, filters, pagination.page, pagination.limit]);

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
          Hiển thị {filteredProducts.length} sản phẩm
          {pagination.total > 0 && ` (tổng ${pagination.total} sản phẩm)`}
          {pagination.pages > 1 && ` - Trang ${pagination.page}/${pagination.pages}`}
        </p>
      </div>

      <div className="page-content">
        <div className="product-grid">
          {isLoading ? (
            <p>Đang tải...</p>
          ) : filteredProducts.length === 0 ? (
            <p>Không tìm thấy sản phẩm nào phù hợp với bộ lọc của bạn.</p>
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
