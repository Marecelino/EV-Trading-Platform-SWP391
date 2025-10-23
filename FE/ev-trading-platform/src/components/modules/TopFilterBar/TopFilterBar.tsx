// src/components/modules/TopFilterBar/TopFilterBar.tsx
import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import './TopFilterBar.scss';
import brandApi from '../../../api/brandApi';
import categoryApi from '../../../api/categoryApi';
import modelApi from '../../../api/modelApi';
import { Brand, Category, Model } from '../../../types';

export interface Filters {
  category: string;
  searchTerm?: string;
  brand?: string;
  model?: string;
  year_of_manufacture?: number;
}

interface TopFilterBarProps {
  filters: Filters;
  onFilterChange: (newFilters: Partial<Filters>) => void;
}

const TopFilterBar: React.FC<TopFilterBarProps> = ({ filters, onFilterChange }) => {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        console.log("=== FETCHING INITIAL DATA ===");
        const [brandsResponse, categoriesResponse] = await Promise.all([
          brandApi.getActiveBrands(),
          categoryApi.getActiveCategories(),
        ]);
        
        console.log("Brands response:", brandsResponse.data);
        console.log("Categories response:", categoriesResponse.data);
        
        // Handle different API response structures
        if (brandsResponse.data) {
          const brandsData = brandsResponse.data.data || brandsResponse.data;
          setBrands(Array.isArray(brandsData) ? brandsData : []);
        }
        
        if (categoriesResponse.data) {
          const categoriesData = categoriesResponse.data.data || categoriesResponse.data;
          setCategories(Array.isArray(categoriesData) ? categoriesData : []);
        }
      } catch (error) {
        console.error("Failed to fetch initial data", error);
      }
    };
    fetchInitialData();
  }, []);

  // Fetch models when brand changes
  useEffect(() => {
    const fetchModelsByBrand = async () => {
      if (!filters.brand) {
        setModels([]);
        return;
      }

      setIsLoadingModels(true);
      try {
        console.log("=== FETCHING MODELS FOR BRAND ===", filters.brand);
        const modelsResponse = await modelApi.getModelsByBrand(filters.brand);
        console.log("Models response:", modelsResponse.data);
        
        const modelsData = modelsResponse.data.data || modelsResponse.data;
        setModels(Array.isArray(modelsData) ? modelsData : []);
      } catch (error) {
        console.error("Failed to fetch models", error);
        setModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    };

    fetchModelsByBrand();
  }, [filters.brand]);

  // Reset model when brand changes
  const handleBrandChange = (brandId: string) => {
    onFilterChange({ brand: brandId, model: undefined });
  };

  return (
    <div className="top-filter-bar content-card">
      
      <div className="filter-row">
        <div className="category-selector">
          {categories.map(cat => (
            <button
              key={cat._id}
              className={filters.category === cat.slug ? 'active' : ''}
              onClick={() => onFilterChange({ category: cat.slug })}
            >
              {cat.name}
            </button>
          ))}
        </div>
        <div className="search-input">
          <Search size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm theo từ khóa..."
            value={filters.searchTerm || ''}
            onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
          />
        </div>
      </div>

      {/* === HÀNG 2: CÁC BỘ LỌC CHI TIẾT (THAY ĐỔI ĐỘNG) === */}
      <div className="filter-row detailed-filters">
        
        {/* Brand Dropdown */}
        <select 
          value={filters.brand || ''} 
          onChange={(e) => handleBrandChange(e.target.value)}
        >
          <option value="">Tất cả các hãng</option>
          {brands.map(brand => (
            <option key={brand._id} value={brand._id}>{brand.name}</option>
          ))}
        </select>

        {/* Model Dropdown - Only show when brand is selected */}
        {filters.brand && (
          <select 
            value={filters.model || ''} 
            onChange={(e) => onFilterChange({ model: e.target.value })}
            disabled={isLoadingModels}
          >
            <option value="">Tất cả các mẫu</option>
            {isLoadingModels ? (
              <option value="">Đang tải...</option>
            ) : (
              models.map(model => (
                <option key={model._id} value={model._id}>{model.name}</option>
              ))
            )}
          </select>
        )}

        {/* Year Filter - Only for EV category */}
        {filters.category === 'xe-dien' && (
          <select 
            value={filters.year_of_manufacture || ''} 
            onChange={(e) => onFilterChange({ year_of_manufacture: parseInt(e.target.value) || undefined })}
          >
            <option value="">Năm sản xuất</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
            <option value="2021">2021</option>
            <option value="2020">2020</option>
          </select>
        )}

        {/* Battery Health Filter - Only for Battery category */}
        {filters.category === 'pin-xe-dien' && (
          <select>
            <option value="">Tình trạng pin</option>
            <option value="95">Trên 95%</option>
            <option value="90">Trên 90%</option>
            <option value="85">Trên 85%</option>
            <option value="80">Trên 80%</option>
          </select>
        )}
      </div>
    </div>
  );
};

export default TopFilterBar;