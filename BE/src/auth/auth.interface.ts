export interface User {
  _id?: string;
  googleId?: string;
  email: string;
  full_name: string;
  picture?: string;
  role: 'member' | 'admin';
  accessToken?: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}
