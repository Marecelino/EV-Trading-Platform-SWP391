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
      case 'signed':
        return <CheckCircle size={20} className="status-icon signed" />;
      case 'draft':
        return <FileText size={20} className="status-icon draft" />;
      case 'cancelled':
        return <AlertCircle size={20} className="status-icon cancelled" />;
      case 'expired':
        return <Clock size={20} className="status-icon expired" />;
      default:
        return <FileText size={20} className="status-icon default" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'signed':
        return 'Đã ký';
      case 'draft':
        return 'Bản nháp';
      case 'cancelled':
        return 'Đã hủy';
      case 'expired':
        return 'Hết hạn';
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
              <h1>
                {contact.contract_no || `Hợp đồng #${contact._id.slice(-8)}`}
              </h1>
              <p className="contract-id">ID: {contact._id}</p>
            </div>
          </div>
          <div className="header-right">
            <div className={`status-badge ${contact.status}`}>
              {getStatusIcon(contact.status)}
              <span>{getStatusText(contact.status)}</span>
            </div>
            <div className="action-buttons">
              {(contact.document_url || contact.contract_url) && (
                <a 
                  href={contact.document_url || contact.contract_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="action-btn download"
                >
                  <Download size={18} />
                  Tải PDF
                </a>
              )}
              <button className="action-btn edit">
                <Edit size={18} />
                Sửa
              </button>
              <button className="action-btn delete">
                <Trash2 size={18} />
                Xóa
              </button>
            </div>
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

        {/* Contract Metadata */}
        <div className="content-card contract-metadata">
          <h2>
            <FileCheck size={24} />
            Thông tin hợp đồng
          </h2>
          
          <div className="metadata-grid">
            <div className="metadata-item">
              <div className="item-label">
                <FileText size={18} />
                Số hợp đồng
              </div>
              <div className="item-value contract-number">
                {contact.contract_no || 'Chưa có'}
              </div>
            </div>
            
            <div className="metadata-item">
              <div className="item-label">
                <Calendar size={18} />
                Ngày tạo
              </div>
              <div className="item-value">
                {formatDate(contact.createdAt || contact.created_at)}
              </div>
            </div>
            
            {contact.signed_at && (
              <div className="metadata-item">
                <div className="item-label">
                  <CheckCircle size={18} />
                  Ngày ký
                </div>
                <div className="item-value">
                  {formatDate(contact.signed_at)}
                </div>
              </div>
            )}
            
            {contact.expires_at && (
              <div className="metadata-item">
                <div className="item-label">
                  <Clock size={18} />
                  Hết hạn
                </div>
                <div className="item-value">
                  {formatDate(contact.expires_at)}
                </div>
              </div>
            )}
            
            <div className="metadata-item">
              <div className="item-label">
                <Calendar size={18} />
                Cập nhật lần cuối
              </div>
              <div className="item-value">
                {formatDate(contact.updatedAt || contact.updated_at)}
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

        {/* Documents Section */}
        <div className="content-card documents-section">
          <h2>
            <FileText size={24} />
            Tài liệu hợp đồng
          </h2>
          
          <div className="documents-grid">
            {(contact.document_url || contact.contract_url) && (
              <div className="document-item">
                <div className="document-icon">
                  <FileText size={32} />
                </div>
                <div className="document-info">
                  <h4>Tài liệu gốc</h4>
                  <p>Hợp đồng ban đầu chưa ký</p>
                </div>
                <a 
                  href={contact.document_url || contact.contract_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="document-btn"
                >
                  <Eye size={18} />
                  Xem
                </a>
                <a 
                  href={contact.document_url || contact.contract_url} 
                  download
                  className="document-btn secondary"
                >
                  <Download size={18} />
                  Tải
                </a>
              </div>
            )}
            
            {contact.signed_document_url && (
              <div className="document-item signed">
                <div className="document-icon signed">
                  <FileCheck size={32} />
                </div>
                <div className="document-info">
                  <h4>Bản đã ký</h4>
                  <p>Hợp đồng đã được ký bởi các bên</p>
                </div>
                <a 
                  href={contact.signed_document_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="document-btn success"
                >
                  <Eye size={18} />
                  Xem
                </a>
                <a 
                  href={contact.signed_document_url} 
                  download
                  className="document-btn secondary"
                >
                  <Download size={18} />
                  Tải
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Terms & Conditions */}
        {(contact.terms_and_conditions || contact.contract_content) && (
          <div className="content-card terms-section">
            <h2>
              <FileText size={24} />
              Điều khoản & Điều kiện
            </h2>
            
            <div className="terms-content">
              <pre>{contact.terms_and_conditions || contact.contract_content || 'Không có nội dung'}</pre>
            </div>
          </div>
        )}

        {/* Signatures Section */}
        <div className="content-card signatures-section">
          <h2>
            <Signature size={24} />
            Chữ ký điện tử
          </h2>
          
          {/* New format: signatures array */}
          {contact.signatures && contact.signatures.length > 0 && (
            <div className="signatures-list">
              <h3>Chữ ký các bên ({contact.signatures.length})</h3>
              <div className="signature-hashes">
                {contact.signatures.map((hash, index) => (
                  <div key={index} className="signature-hash-item">
                    <CheckCircle size={16} className="hash-icon" />
                    <code className="hash-value">{hash}</code>
                    <span className="hash-label">Chữ ký #{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Witness signature */}
          {contact.witness_signature && (
            <div className="witness-signature">
              <h3>
                <UserIcon size={20} />
                Chữ ký nhân chứng
              </h3>
              <div className="witness-content">
                <code className="hash-value">{contact.witness_signature}</code>
              </div>
            </div>
          )}
          
          {/* Backward compatibility: Legacy buyer/seller signatures */}
          {(!contact.signatures || contact.signatures.length === 0) && 
           (contact.buyer_signature || contact.seller_signature) && (
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
                      <Signature size={32} />
                      <p>Chưa ký</p>
                    </div>
                  )}
                </div>
                {contact.buyer_signed_at && (
                  <div className="signature-meta">
                    <Calendar size={16} />
                    <span>{formatDate(contact.buyer_signed_at)}</span>
                  </div>
                )}
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
                      <Signature size={32} />
                      <p>Chưa ký</p>
                    </div>
                  )}
                </div>
                {contact.seller_signed_at && (
                  <div className="signature-meta">
                    <Calendar size={16} />
                    <span>{formatDate(contact.seller_signed_at)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notes Section */}
        {contact.notes && (
          <div className="content-card notes-section">
            <h2>
              <FileText size={24} />
              Ghi chú
            </h2>
            
            <div className="notes-content">
              <p>{contact.notes}</p>
            </div>
          </div>
        )}

        {/* Audit Trail Timeline */}
        {contact.audit_events && contact.audit_events.length > 0 && (
          <div className="content-card audit-trail-section">
            <h2>
              <Clock size={24} />
              Lịch sử thay đổi
            </h2>
            
            <div className="timeline">
              {contact.audit_events.map((event, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="event-name">{event.event}</span>
                      <span className="event-time">
                        {formatDate(event.at)}
                      </span>
                    </div>
                    <div className="timeline-body">
                      <span className="event-by">
                        <UserIcon size={14} />
                        {event.by}
                      </span>
                      {event.meta && (
                        <div className="event-meta">
                          <code>{JSON.stringify(event.meta, null, 2)}</code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
