import { HoaDon } from "./hoa-don";
import { NhanVien } from "./nhan-vien";

export interface KhuyenMai {
    id_khuyen_mai: string;
    ma_khuyen_mai: string;
    ten_khuyen_mai: string;
    mo_ta: string;
    kieu_giam_gia: string;
    gia_tri_giam_toi_thieu: number;
    gia_tri_giam_toi_da: number;
    so_luong_toi_da: number;
    so_luong_da_su_dung: number;
    thoi_gian_bat_dau: string;
    thoi_gian_ket_thuc: string;
    trang_thai: string;
    ngay_tao: string;
    id_nguoi_tao: string;
    id_nguoi_sua?: string;
    ngay_sua?: string;
    NguoiTao?: NhanVien;
    NguoiSua?: NhanVien;
    HoaDons?: HoaDon[];
}

export interface CreateKhuyenMaiDTO {
    ma_khuyen_mai: string;
    ten_khuyen_mai: string;
    mo_ta: string;
    kieu_giam_gia: string;
    gia_tri_giam_toi_thieu: number;
    gia_tri_giam_toi_da: number;
    so_luong_toi_da: number;
    so_luong_da_su_dung: number;
    thoi_gian_bat_dau: string;
    thoi_gian_ket_thuc: string;
}

export interface UpdateKhuyenMaiDTO extends Partial<CreateKhuyenMaiDTO> {
    trang_thai: string;
}
