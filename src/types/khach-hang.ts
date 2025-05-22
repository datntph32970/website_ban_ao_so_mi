import { GioHangChiTiet } from "./gio-hang";
import { HoaDonAdminDTO } from "./hoa-don";
import { TaiKhoan } from "./nhan-vien";

export interface KhachHang {
  id_khach_hang: string;
  ma_khach_hang: string;
  ten_khach_hang: string;
  email: string;
  so_dien_thoai: string;
  ngay_sinh: string;
  gioi_tinh: string;
  trang_thai: string;
  ngay_tao: string;
  tai_khoan: {
    id_tai_khoan: string;
    ten_dang_nhap: string;
    trang_thai: string;
  };
}

export interface UpdateKhachHangDTO {
  ten_khach_hang?: string;
  email?: string;
  so_dien_thoai?: string;
  ngay_sinh?: string;
  gioi_tinh?: string;
}

export interface DiaChiDTO {
    id_dia_chi: string;
    id_khach_hang: string;
    tinh: string;
    huyen: string;
    xa: string;
    dia_chi_mac_dinh: boolean;
  dia_chi_cu_the: string;
  so_dien_thoai: string;
  ten_nguoi_nhan: string;
    ngay_tao: string;
    ngay_sua: string;
}

export interface CreateDiaChiDTO {
  ten_nguoi_nhan: string;
  so_dien_thoai: string;
  dia_chi_cu_the: string;
  tinh: string;
  huyen: string;
  xa: string;
}

export interface UpdateDiaChiDTO extends CreateDiaChiDTO {}

export interface KhachHangAdminDTO {
  id_khach_hang: string;
  ma_khach_hang: string;
  ten_khach_hang?: string;
  ngay_sinh?: string;
  so_dien_thoai?: string;
  email?: string;
  gioi_tinh?: string;
  trang_thai: string;
  gioHangItemsDTOs?: any[];
  hoaDons?: HoaDonAdminDTO[];
  diaChiDTOs?: any[];
}

export interface ThemKhachHangMuaTaiQuayAdminDTO {
  ten_khach_hang: string;
  so_dien_thoai: string;
}

export interface SuaKhachHangAdminDTO {
  ten_khach_hang?: string;
  ngay_sinh?: string;
  gioi_tinh?: "Nam" | "Nu";
  email?: string;
  so_dien_thoai?: string;
  trang_thai?: "HoatDong" | "KhongHoatDong";
}

export interface CapNhatTrangThaiKhachHangDTO {
  trang_thai: "HoatDong" | "KhongHoatDong";
}

export interface DiaChi {
    id_dia_chi: string;
    id_khach_hang: string;
    tinh: string;
    huyen: string;
    xa: string;
    dia_chi_cu_the: string;
    so_dien_thoai: string;
    ten_nguoi_nhan: string;
    dia_chi_mac_dinh: boolean;
    ngay_sua: string;
    KhachHang?: KhachHang;
}
