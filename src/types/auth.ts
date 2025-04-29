export interface User {
  id_tai_khoan: string;
  ma_tai_khoan: string;
  ten_dang_nhap: string;
  chuc_vu: 'Admin' | 'NhanVien' | 'KhachHang';
  da_doi_mat_khau: boolean;
}

export interface LoginCredentials {
    ten_dang_nhap: string;
    mat_khau: string;
}

export interface RegisterCredentials {
  ten_dang_nhap: string;
  mat_khau: string;
  xac_nhan_mat_khau: string;
}

export interface DoiMatKhau {
  ten_dang_nhap: string;
  mat_khau_cu: string;
  mat_khau_moi: string;
  xac_nhan_mat_khau_moi: string;
}

export interface AuthResponse {
  token: string;
}
