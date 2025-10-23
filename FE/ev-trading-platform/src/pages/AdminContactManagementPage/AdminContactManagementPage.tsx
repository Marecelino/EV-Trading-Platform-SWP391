// src/pages/AdminContactManagementPage/AdminContactManagementPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import contactApi from '../../api/contactApi';
import type { Contact, ITransaction } from '../../types';
import Pagination from '../../components/common/Pagination/Pagination';
import './AdminContactManagementPage.scss';

const AdminContactManagementPage: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1 });

  const fetchContacts = useCallback((page: number) => {
    setIsLoading(true);
    contactApi.getContacts().then(response => {
      if (response.data.data) {
        setContacts(response.data.data);
        setPagination({
            currentPage: response.data.meta.page,
            totalPages: response.data.meta.totalPages,
        });
      }
    }).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetchContacts(pagination.currentPage);
  }, [pagination.currentPage, fetchContacts]);

  return (
    <div className="admin-page">
      <h1>Quản lý hợp đồng</h1>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Giao dịch</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center' }}>Đang tải...</td></tr>
            ) : (
              contacts.map(contact => (
                <tr key={contact._id}>
                  <td>{(contact.transaction_id as ITransaction).listing_id.title}</td>
                  <td>
                    <span className={`status-badge status--${contact.status}`}>
                      {contact.status}
                    </span>
                  </td>
                  <td>{new Date(contact.created_at).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <a href={`/admin/contacts/${contact._id}`}>Xem chi tiết</a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination 
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={(page) => setPagination(p => ({...p, currentPage: page}))}
      />
    </div>
  );
};

export default AdminContactManagementPage;
