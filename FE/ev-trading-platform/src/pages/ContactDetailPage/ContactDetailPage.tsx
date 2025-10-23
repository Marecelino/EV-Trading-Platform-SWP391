// src/pages/ContactDetailPage/ContactDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FileText, 
  Download, 
  Calendar, 
  User as UserIcon, 
  DollarSign, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Building2,
  Car,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileCheck,
  Signature,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import contactApi from '../../api/contactApi';
import type { Contact, ITransaction, User, Product } from '../../types';
import './ContactDetailPage.scss';

const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchContact = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("=== FETCHING CONTACT DETAIL ===");
        console.log("Contact ID:", id);
        
        const response = await contactApi.getContactById(id);
        console.log("Contact API Response:", response.data);
        
        // Handle different API response structures
        let contactData: Contact;
        if (response.data.data) {
          contactData = response.data.data;
        } else if (response.data) {
          contactData = response.data;
        } else {
          throw new Error("No contact data found");
        }
        
        setContact(contactData);
        console.log("Contact data set:", contactData);
      } catch (err) {
        console.error("Error fetching contact:", err);
        setError("Không thể tải thông tin hợp đồng");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContact();
  }, [id]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className="status-icon completed" />;
      case 'pending':
        return <Clock size={20} className="status-icon pending" />;
      case 'cancelled':
        return <AlertCircle size={20} className="status-icon cancelled" />;
      default:
        return <Clock size={20} className="status-icon default" />;
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="contact-detail-page container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Đang tải thông tin hợp đồng...</p>
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="contact-detail-page container">
        <div className="error-state">
          <AlertCircle size={48} className="error-icon" />
          <h2>Không tìm thấy hợp đồng</h2>
          <p>{error || "Hợp đồng không tồn tại hoặc đã bị xóa."}</p>
        </div>
      </div>
    );
  }

  // Extract nested data with proper type handling
  const transaction = typeof contact.transaction_id === 'object' 
    ? contact.transaction_id as ITransaction 
    : null;
  
  const buyer = transaction && typeof transaction.buyer_id === 'object' 
    ? transaction.buyer_id as User 
    : null;
    
  const seller = transaction && typeof transaction.seller_id === 'object' 
    ? transaction.seller_id as User 
    : null;
    
  const listing = transaction && typeof transaction.listing_id === 'object' 
    ? transaction.listing_id as Product 
    : null;

  return (
    <div className="contact-detail-page container">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-left">
            <FileText size={32} className="header-icon" />
            <div>
      <h1>Chi tiết hợp đồng</h1>
              <p className="contract-id">ID: {contact._id}</p>
            </div>
          </div>
          <div className="header-right">
            <div className="status-badge">
              {getStatusIcon(contact.status)}
              <span>{getStatusText(contact.status)}</span>
            </div>
            {contact.contract_url && (
              <a 
                href={contact.contract_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="download-btn"
              >
                <Download size={20} />
                Tải PDF
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Transaction Overview */}
        <div className="content-card transaction-overview">
          <h2>
            <Building2 size={24} />
            Thông tin giao dịch
          </h2>
          
          <div className="overview-grid">
            <div className="overview-item">
              <div className="item-label">
                <Car size={20} />
                Sản phẩm
              </div>
              <div className="item-value">
                {listing?.title || 'Không có thông tin'}
              </div>
            </div>
            
            <div className="overview-item">
              <div className="item-label">
                <DollarSign size={20} />
                Giá trị giao dịch
              </div>
              <div className="item-value amount">
                {transaction?.amount ? formatCurrency(transaction.amount) : 'N/A'}
              </div>
            </div>
            
            <div className="overview-item">
              <div className="item-label">
                <CreditCard size={20} />
                Phương thức thanh toán
              </div>
              <div className="item-value">
                {transaction?.payment_method || 'N/A'}
              </div>
            </div>
            
            <div className="overview-item">
              <div className="item-label">
                <Calendar size={20} />
                Ngày giao dịch
              </div>
              <div className="item-value">
                {transaction?.transaction_date ? formatDate(transaction.transaction_date) : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Parties Information */}
        <div className="parties-section">
          {/* Buyer Information */}
          <div className="content-card party-card">
            <h3>
              <UserIcon size={20} />
              Thông tin người mua
            </h3>
            
            <div className="party-info">
              <div className="party-avatar">
                {buyer?.full_name?.charAt(0)?.toUpperCase() || 'B'}
              </div>
              <div className="party-details">
                <h4>{buyer?.full_name || 'Không có thông tin'}</h4>
                <div className="contact-info">
                  {buyer?.email && (
                    <div className="contact-item">
                      <Mail size={16} />
                      <span>{buyer.email}</span>
                    </div>
                  )}
                  {buyer?.phone && (
                    <div className="contact-item">
                      <Phone size={16} />
                      <span>{buyer.phone}</span>
                    </div>
                  )}
                  {buyer?.address && (
                    <div className="contact-item">
                      <MapPin size={16} />
                      <span>{buyer.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Seller Information */}
          <div className="content-card party-card">
            <h3>
              <UserIcon size={20} />
              Thông tin người bán
            </h3>
            
            <div className="party-info">
              <div className="party-avatar">
                {seller?.full_name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div className="party-details">
                <h4>{seller?.full_name || 'Không có thông tin'}</h4>
                <div className="contact-info">
                  {seller?.email && (
                    <div className="contact-item">
                      <Mail size={16} />
                      <span>{seller.email}</span>
                    </div>
                  )}
                  {seller?.phone && (
                    <div className="contact-item">
                      <Phone size={16} />
                      <span>{seller.phone}</span>
                    </div>
                  )}
                  {seller?.address && (
                    <div className="contact-item">
                      <MapPin size={16} />
                      <span>{seller.address}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Content */}
        <div className="content-card contract-content">
          <h2>
            <FileText size={24} />
            Nội dung hợp đồng
          </h2>
          
          <div className="contract-text">
            <pre>{contact.contract_content || 'Không có nội dung hợp đồng'}</pre>
          </div>
        </div>

        {/* Signatures Section */}
        <div className="content-card signatures-section">
          <h2>
            <Signature size={24} />
            Chữ ký điện tử
          </h2>
          
          <div className="signatures-grid">
            {/* Buyer Signature */}
          <div className="signature-block">
              <h3>
                <UserIcon size={20} />
                Người mua
              </h3>
              
              <div className="signature-content">
            {contact.buyer_signature ? (
                  <div className="signature-display">
                    <img 
                      src={contact.buyer_signature} 
                      alt="Chữ ký người mua" 
                      className="signature-image"
                    />
                    <div className="signature-status completed">
                      <CheckCircle size={16} />
                      <span>Đã ký</span>
                    </div>
                  </div>
                ) : (
                  <div className="signature-placeholder">
                    <div className="placeholder-icon">
                      <Signature size={32} />
                    </div>
                    <p>Chưa ký</p>
                  </div>
                )}
              </div>
              
              <div className="signature-meta">
                <div className="meta-item">
                  <Calendar size={16} />
                  <span>
                    {contact.buyer_signed_at 
                      ? formatDate(contact.buyer_signed_at)
                      : 'Chưa ký'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Seller Signature */}
            <div className="signature-block">
              <h3>
                <UserIcon size={20} />
                Người bán
              </h3>
              
              <div className="signature-content">
                {contact.seller_signature ? (
                  <div className="signature-display">
                    <img 
                      src={contact.seller_signature} 
                      alt="Chữ ký người bán" 
                      className="signature-image"
                    />
                    <div className="signature-status completed">
                      <CheckCircle size={16} />
                      <span>Đã ký</span>
                    </div>
                  </div>
                ) : (
                  <div className="signature-placeholder">
                    <div className="placeholder-icon">
                      <Signature size={32} />
                    </div>
                    <p>Chưa ký</p>
                  </div>
                )}
              </div>
              
              <div className="signature-meta">
                <div className="meta-item">
                  <Calendar size={16} />
                  <span>
                    {contact.seller_signed_at 
                      ? formatDate(contact.seller_signed_at)
                      : 'Chưa ký'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Metadata */}
        <div className="content-card metadata-section">
          <h2>
            <FileCheck size={24} />
            Thông tin hợp đồng
          </h2>
          
          <div className="metadata-grid">
            <div className="metadata-item">
              <div className="metadata-label">Trạng thái hợp đồng</div>
              <div className="metadata-value">
                <div className="status-badge">
                  {getStatusIcon(contact.status)}
                  <span>{getStatusText(contact.status)}</span>
                </div>
              </div>
            </div>
            
            <div className="metadata-item">
              <div className="metadata-label">Ngày tạo</div>
              <div className="metadata-value">
                {formatDate(contact.created_at)}
              </div>
            </div>
            
            <div className="metadata-item">
              <div className="metadata-label">Cập nhật lần cuối</div>
              <div className="metadata-value">
                {formatDate(contact.updated_at)}
              </div>
            </div>
            
            {contact.contract_url && (
              <div className="metadata-item">
                <div className="metadata-label">Tệp hợp đồng</div>
                <div className="metadata-value">
                  <a 
                    href={contact.contract_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="file-link"
                  >
                    <Eye size={16} />
                    Xem tệp PDF
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Debug Panel */}
        <div className="debug-panel">
          <h4>🔍 Debug Info:</h4>
          <div className="debug-content">
            <div>
              <strong>Contact ID:</strong> {contact._id}
            </div>
            <div>
              <strong>Transaction ID:</strong> {typeof contact.transaction_id === 'object' ? contact.transaction_id._id : contact.transaction_id}
            </div>
            <div>
              <strong>Status:</strong> {contact.status}
            </div>
            <div>
              <strong>Has Buyer Signature:</strong> {contact.buyer_signature ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Has Seller Signature:</strong> {contact.seller_signature ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetailPage;
