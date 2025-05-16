import { NhanVien } from "./nhan-vien";

export enum KieuKhuyenMai {
    PhanTram = 'PhanTram',
    TienMat = 'TienMat'
}

export enum TrangThaiKhuyenMai {
    HoatDong = 'HoatDong',
    KhongHoatDong = 'KhongHoatDong'
}

export interface KhuyenMai {
    id_khuyen_mai: string;
    ma_khuyen_mai: string;
    ten_khuyen_mai: string;
    mo_ta: string;
    kieu_khuyen_mai: KieuKhuyenMai;
    gia_tri_giam: number;
    gia_tri_don_hang_toi_thieu: number;
    gia_tri_giam_toi_da: number;
    so_luong_toi_da: number;
    so_luong_da_su_dung: number;
    thoi_gian_bat_dau: string;
    thoi_gian_ket_thuc: string;
    trang_thai: TrangThaiKhuyenMai;
    ngay_tao: string;
    id_nguoi_tao: string;
    nguoiTao?: NhanVien;
    ngay_sua?: string;
    nguoiSua?: NhanVien;
    hoaDons?: any[];
}

export interface ThemKhuyenMaiDTO {
    ma_khuyen_mai: string;
    ten_khuyen_mai: string;
    mo_ta: string;
    kieu_khuyen_mai: KieuKhuyenMai;
    gia_tri_giam: number;
    gia_tri_don_hang_toi_thieu: number;
    gia_tri_giam_toi_da: number;
    so_luong_toi_da: number;
    thoi_gian_bat_dau: string;
    thoi_gian_ket_thuc: string;
}

export interface SuaKhuyenMaiDTO {
    ma_khuyen_mai: string;
    ten_khuyen_mai: string;
    mo_ta: string;
    kieu_khuyen_mai: KieuKhuyenMai;
    gia_tri_giam: number;
    gia_tri_don_hang_toi_thieu: number;
    gia_tri_giam_toi_da: number;
    so_luong_toi_da: number;
    thoi_gian_bat_dau: string;
    thoi_gian_ket_thuc: string;
}

export interface CapNhatTrangThaiKhuyenMaiDTO {
    trang_thai: TrangThaiKhuyenMai;
}
