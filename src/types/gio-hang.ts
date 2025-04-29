import { KhachHang } from "./khach-hang";
import { SanPhamChiTiet } from "./san-pham-chi-tiet";
export interface GioHangChiTiet {
    id_gio_hang_chi_tiet: string;
    so_luong: number;
    trang_thai: boolean;
    id_khach_hang: string;
    id_san_pham_chi_tiet: string;
    SanPhamChiTiet?: SanPhamChiTiet;
    KhachHang?: KhachHang;
}