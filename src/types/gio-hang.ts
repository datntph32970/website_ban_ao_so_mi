import { KhachHang } from "./khach-hang";
import { SanPhamChiTiet } from "./san-pham-chi-tiet";

export interface GioHangChiTiet {
    id_gio_hang_chi_tiet: string;
    id_san_pham_chi_tiet: string;
    ma_san_pham_chi_tiet: string;
    ten_san_pham: string;
    ten_mau_sac: string;
    ten_kich_co: string;
    so_luong: number;
    gia_ban: number;
    gia_sau_giam: number | null;
    url_anh: string;
    trang_thai: boolean;
    so_luong_ton: number;

    // Thông tin giảm giá
    id_giam_gia?: string;
    ten_giam_gia?: string;
    kieu_giam_gia?: string;  // "PhanTram" hoặc "SoTien"
    gia_tri_giam?: number;
    thoi_gian_bat_dau?: Date;
    thoi_gian_ket_thuc?: Date;
}

export interface GioHangResponse {
    message: string;
    items: GioHangChiTiet[];
    totalItems: number;
    totalAmount: number;
}

export interface CartActionResponse {
    message: string;
    error?: string;
}

export interface CheckQuantityResponse {
    message: string;
    availableQuantity: number;
}