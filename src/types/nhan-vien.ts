export interface NhanVien {
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
  ngay_sua?: string;
  taiKhoanNhanVien?: TaiKhoan;
  nguoiTao?: TaiKhoan;
  
}

export interface TaiKhoan {
  id_tai_khoan: string;
  ten_dang_nhap: string;
  mat_khau: string;
  chuc_vu: string;
  trang_thai: string;
}

export interface CreateNhanVienDTO {
  ten_dang_nhap: string;
  chuc_vu: ChucVu;
  ho_ten: string;
  email: string;
  so_dien_thoai: string;
  ngay_sinh: string;
  dia_chi: string;
  cccd: string;
  gioi_tinh: string;
  trang_thai: string;
}
export interface UpdateRoleAndStatus {
  id_nhan_vien: string;
  chuc_vu?: string;
  trang_thai?: string;
}
export interface DeleteNhanVien {
  id_nhan_vien: string;
}

export enum ChucVu {
  ADMIN = 'Admin',
  NHAN_VIEN = 'NhanVien'
}

export interface UpdateNhanVienDTO extends Partial<CreateNhanVienDTO> {
  trang_thai: string;
} 