import { api } from '@/lib/api';
import { LoginCredentials, RegisterCredentials, AuthResponse, DoiMatKhau, User } from '@/types/auth';
import Cookies from 'js-cookie';



export const authService = {
  // Đăng nhập
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<AuthResponse>('/Auth/dang-nhap-tai-khoan', credentials);
    const { token } = response.data;
    
    // Lưu token vào cả localStorage và cookie
    localStorage.setItem('token', token);
    Cookies.set('token', token, { expires: 1/24 }); // Cookie hết hạn sau 1 giờ
    
    return response.data;
  },

  // Đăng ký
  register: async (credentials: RegisterCredentials) => {
    const response = await api.post<AuthResponse>('/Auth/dang-ky-tai-khoan', credentials);
    return response.data;
  },

  // Đăng xuất
  logout: () => {
    localStorage.removeItem('token');
    Cookies.remove('token');
  },

  // Lấy thông tin người dùng hiện tại
  getCurrentUser: async () => {
    const response = await api.get<User>('/Auth/me');
    return response.data;
  },

  // Kiểm tra xem người dùng đã đăng nhập chưa
  isAuthenticated: () => {
    return !!localStorage.getItem('token') || !!Cookies.get('token');
  },

  // Đổi mật khẩu
  changePassword: async (credentials: DoiMatKhau) => {
    const response = await api.post<{ message: string }>('/Auth/doi-mat-khau', credentials);
    return response.data;
  }
}; 