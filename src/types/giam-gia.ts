import { NhanVien } from "./nhan-vien";
import { SanPhamChiTiet } from "./san-pham";

export interface GiamGia {
    id_giam_gia: string;
    ma_giam_gia: string;
    ten_giam_gia: string;
    mo_ta: string;
    kieu_giam_gia: string;
    gia_tri_giam: number;
    thoi_gian_bat_dau: string;
    thoi_gian_ket_thuc: string;
    trang_thai: string;
    ngay_tao: string;
    ngay_cap_nhat: string;
    id_nguoi_tao: string;
    id_nguoi_cap_nhat: string;
    NguoiTao?: NhanVien;
    NguoiSua?: NhanVien;
}