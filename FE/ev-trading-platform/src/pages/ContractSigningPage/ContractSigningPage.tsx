// src/pages/ContractSigningPage/ContractSigningPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Download, User as UserIcon, CheckCircle, Loader, AlertCircle } from 'lucide-react';
import contactApi from '../../api/contactApi';
import { useAuth } from '../../contexts/AuthContext';
import type { Contact, ITransaction, User } from '../../types';
import Button from '../../components/common/Button/Button';
import './ContractSigningPage.scss';

const ContractSigningPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contract, setContract] = useState<Contact | null>(null);
  const [transaction, setTransaction] = useState<ITransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [signedDocumentUrl, setSignedDocumentUrl] = useState<string | null>(null);
  
  // Form state
  const [signerName, setSignerName] = useState('');
  const [signerEmail, setSignerEmail] = useState('');

  useEffect(() => {
    if (user?.full_name) {
      setSignerName(user.full_name);
    }
    if (user?.email) {
      setSignerEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const fetchContract = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await contactApi.getContactById(id);
        console.log("Contract API Response:", response.data);
        
        // Handle different API response structures
        let contractData: Contact;
        if (response.data.data) {
          contractData = response.data.data;
        } else if (response.data) {
          contractData = response.data;
        } else {
          throw new Error("No contract data found");
        }
        
        setContract(contractData);
        
        // Fetch transaction if available
        if (contractData.transaction_id) {
          // Note: We don't have a direct getTransactionById in the API, but we can extract from contract
          if (typeof contractData.transaction_id === 'object') {
            setTransaction(contractData.transaction_id as ITransaction);
          }
        }
      } catch (err: unknown) {
        console.error("Error fetching contract:", err);
        const errorMessage = err && typeof err === 'object' && 'response' in err
          ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message)
          : err instanceof Error ? err.message : "Không thể tải thông tin hợp đồng";
        setError(errorMessage || "Không thể tải thông tin hợp đồng");
      } finally {
        setIsLoading(false);
      }
    };

    fetchContract();
  }, [id]);

  const handleSignContract = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    if (!signerName.trim()) {
      setError('Vui lòng nhập tên người ký');
      return;
    }
    
    if (!signerEmail.trim() || !signerEmail.includes('@')) {
      setError('Vui lòng nhập email hợp lệ');
      return;
    }
    
    setIsSigning(true);
    setError(null);
    
    try {
      const response = await contactApi.acceptContract(id, {
        name: signerName.trim(),
        email: signerEmail.trim(),
      });
      
      const responseData = response.data;
      const signedUrl = (typeof responseData === 'object' && 'signed_document_url' in responseData)
        ? (responseData as { signed_document_url?: string }).signed_document_url || null
        : null;
      
      setSignedDocumentUrl(signedUrl);
      setSuccess(true);
      
      // Automatically download PDF
      if (id) {
        downloadContractPDF(id);
      }
    } catch (err: unknown) {
      console.error("Error signing contract:", err);
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? ((err as { response?: { data?: { message?: string } } }).response?.data?.message)
        : err instanceof Error ? err.message : "Không thể ký hợp đồng. Vui lòng thử lại";
      setError(errorMessage || "Không thể ký hợp đồng. Vui lòng thử lại");
    } finally {
      setIsSigning(false);
    }
  };

  const downloadContractPDF = async (contractId: string) => {
    try {
      const response = await contactApi.downloadContract(contractId, false);
      
      // Create blob and download
      const blob = response.data as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-${contractId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: unknown) {
      console.error("Error downloading contract:", err);
      // Don't show error to user, PDF might still be available via URL
    }
  };

  if (isLoading) {
    return (
      <div className="contract-signing-page">
        <div className="loading-container">
          <Loader className="spinner" size={48} />
          <p>Đang tải thông tin hợp đồng...</p>
        </div>
      </div>
    );
  }

  if (error && !contract) {
    return (
      <div className="contract-signing-page">
        <div className="error-container">
          <AlertCircle size={48} className="error-icon" />
          <h2>Lỗi</h2>
          <p>{error}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Quay về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="contract-signing-page">
        <div className="error-container">
          <AlertCircle size={48} className="error-icon" />
          <h2>Không tìm thấy hợp đồng</h2>
          <p>Hợp đồng không tồn tại hoặc đã bị xóa.</p>
          <Button onClick={() => navigate('/dashboard')}>
            Quay về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  // Check if already signed
  const isAlreadySigned = contract.status === 'completed' || 
    (contract.buyer_signature && contract.seller_signature);

  if (isAlreadySigned && !success) {
    return (
      <div className="contract-signing-page">
        <div className="content-card">
          <div className="success-message">
            <CheckCircle size={48} className="success-icon" />
            <h2>Hợp đồng đã được ký</h2>
            <p>Hợp đồng này đã được ký bởi cả hai bên.</p>
            <div className="actions">
              <Button onClick={() => downloadContractPDF(id!)}>
                <Download size={18} /> Tải xuống PDF
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Quay về trang chủ
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="contract-signing-page">
        <div className="content-card">
          <div className="success-message">
            <CheckCircle size={48} className="success-icon" />
            <h2>Ký hợp đồng thành công!</h2>
            <p>Hợp đồng đã được ký thành công. File PDF đã được tải xuống tự động.</p>
            {signedDocumentUrl && (
              <p className="document-url">
                <a href={signedDocumentUrl} target="_blank" rel="noopener noreferrer">
                  Xem hợp đồng đã ký
                </a>
              </p>
            )}
            <div className="actions">
              <Button onClick={() => downloadContractPDF(id!)}>
                <Download size={18} /> Tải lại PDF
              </Button>
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Quay về trang chủ
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contract-signing-page">
      <div className="container">
        <div className="header">
          <h1>
            <FileText size={24} /> Ký hợp đồng
          </h1>
        </div>

        {/* Contract Information */}
        <div className="content-card contract-info">
          <h2>Thông tin hợp đồng</h2>
          
          {transaction && (
            <div className="info-section">
              <div className="info-item">
                <span className="label">Mã giao dịch:</span>
                <span className="value">{transaction._id}</span>
              </div>
              <div className="info-item">
                <span className="label">Giá trị:</span>
                <span className="value">
                  {transaction.price?.toLocaleString('vi-VN') || transaction.amount?.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              {transaction.payment_method && (
                <div className="info-item">
                  <span className="label">Phương thức thanh toán:</span>
                  <span className="value">{transaction.payment_method}</span>
                </div>
              )}
            </div>
          )}

          <div className="info-section">
            <h3>
              <UserIcon size={18} /> Bên mua (Buyer)
            </h3>
            {transaction?.buyer_id && (
              <div className="info-item">
                <span className="label">Người mua:</span>
                <span className="value">
                  {typeof transaction.buyer_id === 'string' 
                    ? transaction.buyer_id 
                    : (transaction.buyer_id as User).full_name || (transaction.buyer_id as User).email}
                </span>
              </div>
            )}
          </div>

          <div className="info-section">
            <h3>
              <UserIcon size={18} /> Bên bán (Seller)
            </h3>
            {transaction?.seller_id && (
              <div className="info-item">
                <span className="label">Người bán:</span>
                <span className="value">
                  {typeof transaction.seller_id === 'string' 
                    ? transaction.seller_id 
                    : (transaction.seller_id as User).full_name || (transaction.seller_id as User).email}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Signing Form */}
        <div className="content-card signing-form">
          <h2>Ký hợp đồng</h2>
          <p className="form-description">
            Vui lòng điền thông tin của bạn để ký hợp đồng. Sau khi ký, hợp đồng PDF sẽ được tạo tự động.
          </p>

          {error && (
            <div className="error-alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSignContract}>
            <div className="form-group">
              <label htmlFor="signerName">
                Tên người ký <span className="required">*</span>
              </label>
              <input
                type="text"
                id="signerName"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Nhập tên của bạn"
                required
                disabled={isSigning}
              />
            </div>

            <div className="form-group">
              <label htmlFor="signerEmail">
                Email <span className="required">*</span>
              </label>
              <input
                type="email"
                id="signerEmail"
                value={signerEmail}
                onChange={(e) => setSignerEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                disabled={isSigning}
              />
            </div>

            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                disabled={isSigning || !signerName.trim() || !signerEmail.trim()}
              >
                {isSigning ? (
                  <>
                    <Loader size={18} className="spinner" /> Đang xử lý...
                  </>
                ) : (
                  <>
                    <FileText size={18} /> Ký hợp đồng
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                disabled={isSigning}
              >
                Hủy
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContractSigningPage;

