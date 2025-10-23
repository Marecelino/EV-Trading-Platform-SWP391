// src/pages/AdminContactManagementPage/AdminContactManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Calendar, 
  User as UserIcon, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Download,
  RefreshCw,
  Car
} from 'lucide-react';
import contactApi from '../../api/contactApi';
import type { Contact, ITransaction, User, Product } from '../../types';
import Pagination from '../../components/common/Pagination/Pagination';
import './AdminContactManagementPage.scss';

const AdminContactManagementPage: React.FC = () => {
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({ 
    currentPage: 1, 
    totalPages: 1, 
    itemsPerPage: 10 
  });

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("=== FETCHING CONTACTS ===");
      const response = await contactApi.getContacts();
      console.log("Contacts API Response:", response.data);
      
      // Handle different API response structures
      let contactsData: Contact[] = [];
      if (response.data.data) {
        contactsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        contactsData = response.data;
      }
      
      setAllContacts(contactsData);
      console.log(`Loaded ${contactsData.length} contacts`);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filter contacts based on search and status
  useEffect(() => {
    let filtered = allContacts;

    // Search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(contact => {
        const transaction = typeof contact.transaction_id === 'object' 
          ? contact.transaction_id as ITransaction 
          : null;
        
        const listing = transaction && typeof transaction.listing_id === 'object'
          ? transaction.listing_id as Product
          : null;
        
        const searchLower = searchQuery.toLowerCase();
        return (
          contact._id.toLowerCase().includes(searchLower) ||
          contact.status.toLowerCase().includes(searchLower) ||
          (listing?.title && listing.title.toLowerCase().includes(searchLower)) ||
          (contact.contract_content && contact.contract_content.toLowerCase().includes(searchLower))
        );
      });
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(contact => contact.status === statusFilter);
    }

    setFilteredContacts(filtered);
    
    // Update pagination
    const totalPages = Math.ceil(filtered.length / pagination.itemsPerPage);
    setPagination(prev => ({
      ...prev,
      totalPages,
      currentPage: 1 // Reset to first page when filtering
    }));
  }, [allContacts, searchQuery, statusFilter, pagination.itemsPerPage]);

  // Get paginated contacts
  const getPaginatedContacts = () => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filteredContacts.slice(startIndex, endIndex);
  };

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="status-icon completed" />;
      case 'pending':
        return <Clock size={16} className="status-icon pending" />;
      case 'cancelled':
        return <AlertCircle size={16} className="status-icon cancelled" />;
      default:
        return <Clock size={16} className="status-icon default" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Hoàn thành';
      case 'pending':
        return 'Chờ xử lý';
      case 'cancelled':
        return 'Đã hủy';
      case 'draft':
        return 'Bản nháp';
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-contact-management-page">
      {/* Header Section */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <FileText size={32} className="header-icon" />
            <div>
              <h1>Quản lý hợp đồng</h1>
              <p className="page-subtitle">
                Quản lý và theo dõi các hợp đồng giao dịch xe điện
              </p>
            </div>
          </div>
          <div className="header-right">
            <button 
              onClick={fetchContacts}
              className="refresh-btn"
              disabled={isLoading}
            >
              <RefreshCw size={20} className={isLoading ? 'spinning' : ''} />
              Làm mới
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FileText size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{allContacts.length}</div>
            <div className="stat-label">Tổng hợp đồng</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon completed">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {allContacts.filter(c => c.status === 'completed').length}
            </div>
            <div className="stat-label">Hoàn thành</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon pending">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {allContacts.filter(c => c.status === 'pending').length}
            </div>
            <div className="stat-label">Chờ xử lý</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon cancelled">
            <AlertCircle size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">
              {allContacts.filter(c => c.status === 'cancelled').length}
            </div>
            <div className="stat-label">Đã hủy</div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filters-row">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo ID, trạng thái, sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="filter-dropdown">
            <Filter size={20} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="completed">Hoàn thành</option>
              <option value="pending">Chờ xử lý</option>
              <option value="cancelled">Đã hủy</option>
              <option value="draft">Bản nháp</option>
            </select>
          </div>
        </div>
        
        <div className="results-info">
          <span>
            Hiển thị {getPaginatedContacts().length} trong {filteredContacts.length} hợp đồng
            {allContacts.length !== filteredContacts.length && ` (từ ${allContacts.length} tổng)`}
          </span>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="contacts-table-container">
        {isLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Đang tải danh sách hợp đồng...</p>
          </div>
        ) : getPaginatedContacts().length === 0 ? (
          <div className="empty-state">
            <FileText size={48} className="empty-icon" />
            <h3>Không có hợp đồng nào</h3>
            <p>
              {filteredContacts.length === 0 && allContacts.length > 0
                ? 'Không tìm thấy hợp đồng phù hợp với bộ lọc.'
                : 'Chưa có hợp đồng nào được tạo.'}
            </p>
          </div>
        ) : (
          <div className="contacts-table">
            {getPaginatedContacts().map(contact => {
              const transaction = typeof contact.transaction_id === 'object' 
                ? contact.transaction_id as ITransaction 
                : null;
              
              const listing = transaction && typeof transaction.listing_id === 'object'
                ? transaction.listing_id as Product
                : null;
              
              const buyer = transaction && typeof transaction.buyer_id === 'object'
                ? transaction.buyer_id as User
                : null;
              
              const seller = transaction && typeof transaction.seller_id === 'object'
                ? transaction.seller_id as User
                : null;

              return (
                <div key={contact._id} className="contact-card">
                  <div className="contact-header">
                    <div className="contact-id">
                      <FileText size={16} />
                      <span>#{contact._id.slice(-8)}</span>
                    </div>
                    <div className="contact-status">
                      {getStatusIcon(contact.status)}
                      <span>{getStatusText(contact.status)}</span>
                    </div>
                  </div>
                  
                  <div className="contact-content">
                    <div className="contact-info">
                      <div className="info-item">
                        <Car size={16} />
                        <div>
                          <span className="label">Sản phẩm:</span>
                          <span className="value">{listing?.title || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <DollarSign size={16} />
                        <div>
                          <span className="label">Giá trị:</span>
                          <span className="value amount">
                            {transaction?.amount ? formatCurrency(transaction.amount) : 'N/A'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <UserIcon size={16} />
                        <div>
                          <span className="label">Người mua:</span>
                          <span className="value">{buyer?.full_name || 'N/A'}</span>
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <UserIcon size={16} />
                        <div>
                          <span className="label">Người bán:</span>
                          <span className="value">{seller?.full_name || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="contact-meta">
                      <div className="meta-item">
                        <Calendar size={16} />
                        <span>Tạo: {formatDate(contact.created_at)}</span>
                      </div>
                      {contact.updated_at !== contact.created_at && (
                        <div className="meta-item">
                          <Calendar size={16} />
                          <span>Cập nhật: {formatDate(contact.updated_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="contact-actions">
                    <Link 
                      to={`/admin/contacts/${contact._id}`} 
                      className="action-btn primary"
                    >
                      <Eye size={16} />
                      Xem chi tiết
                    </Link>
                    
                    {contact.contract_url && (
                      <a 
                        href={contact.contract_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="action-btn secondary"
                      >
                        <Download size={16} />
                        Tải PDF
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredContacts.length > pagination.itemsPerPage && (
        <div className="pagination-container">
          <Pagination 
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={(page) => setPagination(p => ({...p, currentPage: page}))}
          />
        </div>
      )}

      {/* Debug Panel */}
      <div className="debug-panel">
        <h4>🔍 Debug Info:</h4>
        <div className="debug-content">
          <div>
            <strong>Total Contacts:</strong> {allContacts.length}
          </div>
          <div>
            <strong>Filtered Contacts:</strong> {filteredContacts.length}
          </div>
          <div>
            <strong>Current Page:</strong> {pagination.currentPage} / {pagination.totalPages}
          </div>
          <div>
            <strong>Search Query:</strong> {searchQuery || 'None'}
          </div>
          <div>
            <strong>Status Filter:</strong> {statusFilter || 'None'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminContactManagementPage;
