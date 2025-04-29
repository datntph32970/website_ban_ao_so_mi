import { NhanVien } from "./nhan-vien";
import { SanPham } from "./san-pham";

export interface DanhMuc {
    id_danh_muc: string;
    ma_danh_muc: string;
    ten_danh_muc: string;
    mo_ta: string;
    trang_thai: string;
    id_nguoi_tao: string;
    ngay_tao: string;
    id_nguoi_sua?: string;
    ngay_sua?: string;
    SanPhams?: SanPham[];
    NguoiTao?: NhanVien;
    NguoiSua?: NhanVien;
}
export interface ThemDanhMucAdminDTO {
    ten_danh_muc: string;
    mo_ta: string;
}
export interface SuaDanhMucAdminDTO {
    ten_danh_muc: string;
    mo_ta: string;
    trang_thai: string;
}
