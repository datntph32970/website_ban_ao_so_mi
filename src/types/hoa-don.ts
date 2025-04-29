import { KhachHang } from "./khach-hang";
import { KhuyenMai } from "./khuyen-mai";
import { NhanVien } from "./nhan-vien";
import { SanPhamChiTiet } from "./san-pham-chi-tiet";

export interface HoaDon {
    id_hoa_don: string;
    ma_hoa_don: string;
    ngay_tao: string;
    tong_tien_don_hang: number;
    so_tien_khuyen_mai: number;
    ghi_chu: string;
    tong_tien_phai_thanh_toan: number;
    ten_khach_hang: string;
    ten_nhan_vien: string;
    sdt_khach_hang: string;
    dia_chi_nhan_hang: string;
    id_khach_hang: string;
    id_nhan_vien?: string;
    id_khuyen_mai: string;
    id_phuong_thuc_thanh_toan: string;
    id_trang_thai_hoa_don: string;
    KhachHang?: KhachHang;
    NhanVien?: NhanVien;
    KhuyenMai?: KhuyenMai;
    PhuongThucThanhToan?: PhuongThucThanhToan;
    TrangThaiHoaDon?: TrangThaiHoaDon;
    HoaDonChiTiets?: HoaDonChiTiet[];
}
export interface HoaDonChiTiet {
    id_hoa_don_chi_tiet: string;
    ma_hoa_don_chi_tiet: string;
    id_hoa_don: string;
    id_san_pham_chi_tiet: string;
    so_luong: number;
    don_gia: number;
    thanh_tien: number;
    ghi_chu: string;
    trang_thai: boolean;
    HoaDon?: HoaDon;
    SanPhamChiTiets?: SanPhamChiTiet;
}
export interface PhuongThucThanhToan {
    id_phuong_thuc_thanh_toan: string;
    ten_phuong_thuc_thanh_toan: string;
    ma_phuong_thuc_thanh_toan: string;
    mo_ta: string;
    trang_thai: boolean;
    HoaDons?: HoaDon[];
}
export interface TrangThaiHoaDon {
    id_trang_thai_hoa_don: string;
    ten_trang_thai_hoa_don: string;
    ma_trang_thai_hoa_don: string;
    mo_ta: string;
    trang_thai: boolean;
    HoaDons?: HoaDon[];
}
