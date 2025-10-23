// src/pages/ContactDetailPage/ContactDetailPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import contactApi from '../../api/contactApi';
import type { Contact, ITransaction, User } from '../../types';
import './ContactDetailPage.scss';

const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contact, setContact] = useState<Contact | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      contactApi.getContactById(id).then(response => {
        if (response.data) {
          setContact(response.data);
        }
      }).finally(() => setIsLoading(false));
    }
  }, [id]);

  if (isLoading) return <div>Đang tải...</div>;
  if (!contact) return <div>Không tìm thấy hợp đồng.</div>;

  const transaction = contact.transaction_id as ITransaction;
  const buyer = transaction.buyer_id as User;
  const seller = transaction.seller_id as User;

  return (
    <div className="contact-detail-page container">
      <h1>Chi tiết hợp đồng</h1>
      <div className="content-card">
        <p><strong>Sản phẩm:</strong> {transaction.listing_id.title}</p>
        <p><strong>Bên bán:</strong> {seller.full_name}</p>
        <p><strong>Bên mua:</strong> {buyer.full_name}</p>
        <p><strong>Giá trị:</strong> {transaction.amount.toLocaleString('vi-VN')} ₫</p>
        <p><strong>Trạng thái:</strong> {contact.status}</p>
        <hr />
        <h3>Nội dung hợp đồng</h3>
        <pre>{contact.contract_content}</pre>
        <hr />
        <div className="signatures">
          <div className="signature-block">
            <h4>Bên bán</h4>
            {contact.seller_signature ? (
              <img src={contact.seller_signature} alt="Chữ ký bên bán" />
            ) : (
              <button>Ký tên</button>
            )}
            <p>Ngày ký: {contact.seller_signed_at ? new Date(contact.seller_signed_at).toLocaleDateString('vi-VN') : 'Chưa ký'}</p>
          </div>
          <div className="signature-block">
            <h4>Bên mua</h4>
            {contact.buyer_signature ? (
              <img src={contact.buyer_signature} alt="Chữ ký bên mua" />
            ) : (
              <button>Ký tên</button>
            )}
            <p>Ngày ký: {contact.buyer_signed_at ? new Date(contact.buyer_signed_at).toLocaleDateString('vi-VN') : 'Chưa ký'}</p>
          </div>
        </div>
        {contact.contract_url && <a href={contact.contract_url} target="_blank" rel="noopener noreferrer">Tải hợp đồng</a>}
      </div>
    </div>
  );
};

export default ContactDetailPage;
