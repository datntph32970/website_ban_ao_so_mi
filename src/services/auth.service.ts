import { api } from '@/lib/api';
import { LoginCredentials, RegisterCredentials, AuthResponse, DoiMatKhau, User } from '@/types/auth';
import Cookies from 'js-cookie';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

interface TaiKhoanNhanVien {
  id_tai_khoan: string;
  ma_tai_khoan: string;
  ten_dang_nhap: string;
  trang_thai: string;
  da_doi_mat_khau: boolean;
  chuc_vu: string;
}

interface NhanVienDangDangNhap {
  id_nhan_vien: string;
  id_tai_khoan: string;
  ma_nhan_vien: string;
  ten_nhan_vien: string;
  email: string;
  so_dien_thoai: string;
  ngay_sinh: string;
  dia_chi: string;
  cccd: string;
  gioi_tinh: string;
  trang_thai: string;
  id_nguoi_tao: string;
  ngay_tao: string;
  taiKhoanNhanVien: TaiKhoanNhanVien;
  nguoiTao: TaiKhoanNhanVien;
}

export const authService = {
  // Đăng nhập
  login: async (credentials: LoginCredentials) => {
    const response = await api.post<AuthResponse>('/Auth/dang-nhap-tai-khoan', credentials);
    const { token } = response.data;
    
    // Lưu token vào cookie
    Cookies.set('token', token, { 
      expires: 1/24, // Cookie hết hạn sau 1 giờ
      path: '/', // Cookie có hiệu lực cho toàn bộ website
      secure: process.env.NODE_ENV === 'production', // Chỉ gửi cookie qua HTTPS trong môi trường production
      sameSite: 'lax' // Cho phép gửi cookie trong các request cross-site
    });

    // Lấy thông tin user và lưu role vào cookie
    const userResponse = await api.get<User>('/Auth/me');
    Cookies.set('userRole', userResponse.data.chuc_vu, {
      expires: 1/24,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });
    
    // Thêm token vào header mặc định của axios
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    return response.data;
  },

  // Đăng ký
  register: async (credentials: RegisterCredentials) => {
    const response = await api.post<AuthResponse>('/Auth/dang-ky-tai-khoan', credentials);
    return response.data;
  },

  // Đăng xuất
  logout: () => {
    Cookies.remove('token', { path: '/' });
    Cookies.remove('userRole', { path: '/' });
    delete api.defaults.headers.common['Authorization'];
  },

  // Lấy thông tin người dùng hiện tại
  getCurrentUser: async () => {
    const response = await api.get<User>('/Auth/me');
    return response.data;
  },

  // Kiểm tra xem người dùng đã đăng nhập chưa
  isAuthenticated: () => {
    return !!Cookies.get('token');
  },

  // Đổi mật khẩu
  changePassword: async (credentials: DoiMatKhau) => {
    const response = await api.post<{ message: string }>('/Auth/doi-mat-khau', credentials);
    return response.data;
  },

  // Lấy thông tin nhân viên đang đăng nhập
  getNhanVienDangDangNhap: async () => {
        const response = await api.get<NhanVienDangDangNhap[]>('/NhanVien/get-nhan-vien-dang-dang-nhap');    return response.data;
  },
}; 