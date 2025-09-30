// src/components/common/Pagination/Pagination.tsx
import React from 'react';
import './Pagination.scss';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="pagination">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        &laquo;
      </button>
      {pageNumbers.map(number => (
        <button
          key={number}
          className={currentPage === number ? 'active' : ''}
          onClick={() => onPageChange(number)}
        >
          {number}
        </button>
      ))}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
        &raquo;
      </button>
    </nav>
  );
};
export default Pagination;