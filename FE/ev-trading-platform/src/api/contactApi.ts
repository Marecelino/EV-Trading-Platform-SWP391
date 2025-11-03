import axiosClient from './axiosClient';
import { CreateContactDto, UpdateContactDto, AcceptContractDto } from '../types/api';

const contactApi = {
  getContacts: () => {
    return axiosClient.get('/contacts');
  },

  getContactById: (id: string) => {
    return axiosClient.get(`/contacts/${id}`);
  },

  getContactByTransactionId: (transactionId: string) => {
    return axiosClient.get(`/contacts/transaction/${transactionId}`);
  },

  createContact: (data: CreateContactDto) => {
    return axiosClient.post('/contacts', data);
  },

  updateContact: (id: string, data: UpdateContactDto) => {
    return axiosClient.put(`/contacts/${id}`, data);
  },

  deleteContact: (id: string) => {
    return axiosClient.delete(`/contacts/${id}`);
  },

  // Accept/Sign contract with typed consent
  acceptContract: (id: string, data: AcceptContractDto) => {
    return axiosClient.post<{ status: string; signed_document_url: string }>(`/contacts/${id}/accept`, data);
  },

  // Download contract PDF
  downloadContract: (id: string, asUrl: boolean = false) => {
    const headers = asUrl ? { Accept: 'application/json' } : { Accept: 'application/pdf' };
    const url = asUrl ? `/contacts/${id}/download?json=1` : `/contacts/${id}/download`;
    return axiosClient.get(url, { headers, responseType: asUrl ? 'json' : 'blob' });
  },
};

export default contactApi;
