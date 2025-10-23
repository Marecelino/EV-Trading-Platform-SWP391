import axiosClient from './axiosClient';

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

  createContact: (data: any) => {
    return axiosClient.post('/contacts', data);
  },

  updateContact: (id: string, data: any) => {
    return axiosClient.put(`/contacts/${id}`, data);
  },

  deleteContact: (id: string) => {
    return axiosClient.delete(`/contacts/${id}`);
  },
};

export default contactApi;
