import axiosClient from './axiosClient';
import { CreateContactDto, UpdateContactDto } from '../types/api';

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
};

export default contactApi;
