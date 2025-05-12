import { GioHangChiTiet } from "./gio-hang";
import { HoaDonAdminDTO } from "./hoa-don";
import { TaiKhoan } from "./nhan-vien";

export interface KhachHang {
  id_khach_hang: string;
  id_tai_khoan: string;
  ma_khach_hang: string;
  ten_khach_hang?: string;
  ngay_sinh?: Date;
  so_dien_thoai?: string;
  email?: string;
  gioi_tinh?: string;
  trang_thai: string;
  TaiKhoan?: TaiKhoan;
  GioHangChiTiets?: GioHangChiTiet[];
  HoaDons?: HoaDonAdminDTO[];
  DiaChis?: DiaChi[];
}

export interface DiaChi {
    id_dia_chi: string;
    id_khach_hang: string;
    tinh: string;
    huyen: string;
    xa: string;
    dia_chi_mac_dinh: boolean;
    ngay_tao: string;
    ngay_sua: string;
    KhachHang?: KhachHang;
}

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
  hoaDonDTOs?: any[];
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

