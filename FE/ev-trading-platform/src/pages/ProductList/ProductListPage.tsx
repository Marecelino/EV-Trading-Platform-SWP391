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
        // Fetch only active listings from API
        const response = await listingApi.getListings({ status: 'active' });
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
            const titleMatch = p.title.toLowerCase().includes(searchTerm);
            const descMatch = p.description.toLowerCase().includes(searchTerm);
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
        filtered = filtered.filter(p => {
          const brand = typeof p.brand_id === 'object' ? p.brand_id : null;
          return brand?._id === filters.brand || p.brand_id === filters.brand;
        });
      }

      // Filter by model
      if (filters.model) {
        filtered = filtered.filter(p => {
          const model = typeof p.model_id === 'object' ? p.model_id : null;
          return model?._id === filters.model || p.model_id === filters.model;
        });
      }

      // Condition filter
      if (filters.condition) {
        filtered = filtered.filter(p => p.condition === filters.condition);
      }

      // Price range filter
      if (filters.minPrice !== undefined) {
        filtered = filtered.filter(p => p.price >= filters.minPrice!);
      }
      if (filters.maxPrice !== undefined) {
        filtered = filtered.filter(p => p.price <= filters.maxPrice!);
      }

      // Location filter
      if (filters.location) {
        filtered = filtered.filter(p => {
          if (typeof p.location === 'string') {
            return p.location.includes(filters.location!);
          }
          if (p.location && typeof p.location === 'object') {
            return p.location.city === filters.location || 
                   p.location.district?.includes(filters.location!);
          }
          return false;
        });
      }

      // EV-specific filters
      if (filters.category === 'xe-dien') {
        // Year range
        if (filters.minYear !== undefined) {
          filtered = filtered.filter(p => 
            (p.evDetail?.year || p.ev_details?.year || p.year || 0) >= filters.minYear!
          );
        }
        if (filters.maxYear !== undefined) {
          filtered = filtered.filter(p => 
            (p.evDetail?.year || p.ev_details?.year || p.year || 9999) <= filters.maxYear!
          );
        }

        // Mileage range
        if (filters.minMileage !== undefined) {
          filtered = filtered.filter(p => 
            (p.evDetail?.mileage_km || p.ev_details?.mileage_km || p.mileage || 0) >= filters.minMileage!
          );
        }
        if (filters.maxMileage !== undefined) {
          filtered = filtered.filter(p => 
            (p.evDetail?.mileage_km || p.ev_details?.mileage_km || p.mileage || 0) <= filters.maxMileage!
          );
        }

        // Battery capacity range
        if (filters.minCapacity !== undefined) {
          filtered = filtered.filter(p => 
            (p.evDetail?.battery_capacity_kwh || p.ev_details?.battery_capacity_kwh || p.battery_capacity || 0) >= filters.minCapacity!
          );
        }
        if (filters.maxCapacity !== undefined) {
          filtered = filtered.filter(p => 
            (p.evDetail?.battery_capacity_kwh || p.ev_details?.battery_capacity_kwh || p.battery_capacity || 0) <= filters.maxCapacity!
          );
        }

        // Range filter
        if (filters.minRange !== undefined) {
          filtered = filtered.filter(p => 
            (p.evDetail?.range_km || p.ev_details?.range_km || p.range || 0) >= filters.minRange!
          );
        }
        if (filters.maxRange !== undefined) {
          filtered = filtered.filter(p => 
            (p.evDetail?.range_km || p.ev_details?.range_km || p.range || 0) <= filters.maxRange!
          );
        }
      }

      // Battery-specific filters
      if (filters.category === 'pin-xe-dien') {
        // SOH filter
        if (filters.minSoh !== undefined) {
          filtered = filtered.filter(p => 
            (p.batteryDetail?.soh_percent || p.battery_details?.soh_percent || p.soh_percent || 0) >= filters.minSoh!
          );
        }
        if (filters.maxSoh !== undefined) {
          filtered = filtered.filter(p => 
            (p.batteryDetail?.soh_percent || p.battery_details?.soh_percent || p.soh_percent || 100) <= filters.maxSoh!
          );
        }
      }

      // Special filters
      if (filters.is_verified) {
        filtered = filtered.filter(p => p.is_verified === true);
      }
      if (filters.is_featured) {
        filtered = filtered.filter(p => p.is_featured === true);
      }

      // Active status filter
      filtered = filtered.filter(p => p.status === 'active');

      // SORTING
      if (filters.sortBy) {
        filtered = [...filtered].sort((a, b) => {
          switch (filters.sortBy) {
            case 'createdAt_desc':
              return new Date(b.createdAt || b.created_at || 0).getTime() - 
                     new Date(a.createdAt || a.created_at || 0).getTime();
            case 'createdAt_asc':
              return new Date(a.createdAt || a.created_at || 0).getTime() - 
                     new Date(b.createdAt || b.created_at || 0).getTime();
            case 'price_asc':
              return (a.price || 0) - (b.price || 0);
            case 'price_desc':
              return (b.price || 0) - (a.price || 0);
            case 'mileage_asc':
              return (a.evDetail?.mileage_km || a.mileage || 0) - 
                     (b.evDetail?.mileage_km || b.mileage || 0);
            case 'year_desc':
              return (b.evDetail?.year || b.year || 0) - 
                     (a.evDetail?.year || a.year || 0);
            case 'range_desc':
              return (b.evDetail?.range_km || b.range || 0) - 
                     (a.evDetail?.range_km || a.range || 0);
            case 'featured':
              return (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0);
            default:
              return 0;
          }
        });
      }

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

      <div className="page-content">
        {/* SIDEBAR BÊN TRÁI */}
        <SidebarFilter filters={filters} onFilterChange={handleFilterChange} />
        
        {/* MAIN CONTENT BÊN PHẢI */}
        <div className="main-content">
          <div className="page-header">
            <h1>Danh sách sản phẩm</h1>
            <div className="header-actions">
              <p className="results-count">
                Hiển thị {filteredProducts.length} sản phẩm
                {pagination.total > 0 && ` (tổng ${pagination.total} sản phẩm)`}
                {pagination.pages > 1 && ` - Trang ${pagination.page}/${pagination.pages}`}
              </p>
            </div>
          </div>

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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="pagination-container">
              <button 
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="pagination-btn"
              >
                Trước
              </button>
              <span className="pagination-info">
                Trang {pagination.page} / {pagination.pages}
              </span>
              <button 
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="pagination-btn"
              >
                Sau
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductListPage;
