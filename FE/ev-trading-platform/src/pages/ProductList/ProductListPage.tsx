// src/pages/ProductListPage/ProductListPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import ProductCard from "../../components/modules/ProductCard/ProductCard";
import SidebarFilter from "../../components/modules/SidebarFilter/SidebarFilter";
import TopFilterBar, {
  type Filters,
} from "../../components/modules/TopFilterBar/TopFilterBar";
import listingApi from "../../api/listingApi";
import type { Product, Brand, Model } from "../../types";
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
        console.log("API Response:", response.data);
        if (response.data.data) {
          console.log("Products data:", response.data.data);
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
    console.log("=== FILTERING PRODUCTS ===");
    console.log("Total products:", allProducts.length);
    console.log("Current filters:", filters);
    
    const filtered = allProducts.filter((product) => {
      console.log("Checking product:", product.title, "ID:", product._id);
      
      // 1. Lọc theo Từ khóa tìm kiếm
      if (filters.searchTerm && filters.searchTerm.trim()) {
        const searchLower = filters.searchTerm.toLowerCase();
        const titleMatch = product.title?.toLowerCase().includes(searchLower);
        const descriptionMatch = product.description?.toLowerCase().includes(searchLower);
        
        if (!titleMatch && !descriptionMatch) {
          console.log("❌ Search term filter failed:", filters.searchTerm);
          return false;
        }
        console.log("✅ Search term filter passed");
      }

      // 2. Lọc theo Hãng
      if (filters.brand) {
        let brandMatch = false;
        
        if (typeof product.brand_id === 'object' && product.brand_id) {
          brandMatch = (product.brand_id as Brand)._id === filters.brand;
        } else if (typeof product.brand_id === 'string') {
          brandMatch = product.brand_id === filters.brand;
        }
        
        if (!brandMatch) {
          console.log("❌ Brand filter failed:", filters.brand);
          return false;
        }
        console.log("✅ Brand filter passed");
      }

      // 3. Lọc theo Model
      if (filters.model) {
        let modelMatch = false;
        
        if (typeof product.model_id === 'object' && product.model_id) {
          modelMatch = (product.model_id as Model)._id === filters.model;
        } else if (typeof product.model_id === 'string') {
          modelMatch = product.model_id === filters.model;
        }
        
        if (!modelMatch) {
          console.log("❌ Model filter failed:", filters.model);
          return false;
        }
        console.log("✅ Model filter passed");
      }

      // 4. Lọc theo Năm sản xuất (chỉ cho xe điện)
      if (filters.category === "xe-dien" && filters.year_of_manufacture) {
        // Try to get year from ev_details if available
        let yearMatch = false;
        
        if (product.ev_details?.year_of_manufacture) {
          yearMatch = product.ev_details.year_of_manufacture === filters.year_of_manufacture;
        } else {
          // If no ev_details, try to extract year from title or description
          const yearRegex = new RegExp(filters.year_of_manufacture.toString());
          yearMatch = yearRegex.test(product.title) || yearRegex.test(product.description);
        }
        
        if (!yearMatch) {
          console.log("❌ Year filter failed:", filters.year_of_manufacture);
          return false;
        }
        console.log("✅ Year filter passed");
      }

      // 5. Lọc theo Category (if we have category-specific logic)
      if (filters.category) {
        // For now, we'll assume all products match category filter
        // In the future, this could be enhanced based on product type or other criteria
        console.log("✅ Category filter passed (default)");
      }

      console.log("✅ All filters passed for product:", product.title);
      return true;
    });
    
    console.log("=== FILTERING RESULT ===");
    console.log("Filtered products:", filtered.length, "out of", allProducts.length);
    return filtered;
  }, [allProducts, filters]);

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
        <h1>Danh sách sản phẩm</h1>
        <p className="results-count">
          Hiển thị {filteredProducts.length} sản phẩm
          {allProducts.length !== filteredProducts.length && ` (từ ${allProducts.length} sản phẩm)`}
        </p>
      </div>

      {/* Debug Panel */}
      <div className="debug-panel" style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h4>🔍 Debug Info:</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div>
            <strong>Current Filters:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>Category: {filters.category || 'None'}</li>
              <li>Search: {filters.searchTerm || 'None'}</li>
              <li>Brand: {filters.brand || 'None'}</li>
              <li>Model: {filters.model || 'None'}</li>
              <li>Year: {filters.year_of_manufacture || 'None'}</li>
            </ul>
          </div>
          <div>
            <strong>Results:</strong>
            <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
              <li>Total Products: {allProducts.length}</li>
              <li>Filtered: {filteredProducts.length}</li>
              <li>Loading: {isLoading ? 'Yes' : 'No'}</li>
            </ul>
          </div>
        </div>
        <p style={{ marginTop: '10px', fontSize: '12px', color: '#6c757d' }}>
          <strong>Note:</strong> Check browser console for detailed filtering logs.
        </p>
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
