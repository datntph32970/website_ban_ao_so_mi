import { SanPham } from "./san-pham";

import { KichCo } from "./kich-co";

import { HinhAnh } from "./hinh-anh";

import { MauSac } from "./mau-sac";
import { GioHangChiTiet } from "./gio-hang";
import { GiamGia } from "./giam-gia";
import { HoaDonChiTiet } from "./hoa-don";
import { HinhAnhSanPhamChiTiet } from "./hinh-anh-san-pham-chi-tiet";

export interface SanPhamChiTiet {
    id_san_pham_chi_tiet: string;
    ma_san_pham_chi_tiet: string;
    so_luong: number;
    gia_ban: number;
    gia_nhap: number;
    trang_thai: string;
    ngay_tao: string;
    ma_nguoi_tao?: string;
    ma_nguoi_sua?: string;
    ten_nguoi_tao?: string;
    ten_nguoi_sua?: string;
    sanPham?: SanPham;
    kichCo?: KichCo;
    mauSac?: MauSac;
    hinhAnhSanPhamChiTiets?: HinhAnhSanPhamChiTiet[];
    hoaDonChiTiets?: HoaDonChiTiet[];
    gioHangChiTiets?: GioHangChiTiet[];
    giamGia?: GiamGia;
}
export interface ThemSanPhamChiTietAdminDTO {
    id_san_pham?: string;
    id_mau_sac: string; 
    id_kich_co: string;
    id_giam_gia: string;
    so_luong: number;
    gia_nhap: number;
    gia_ban: number;
    them_hinh_anh_spcts: ThemHinhAnhSanPhamChiTietAdminDTO[];
  }
    // Định nghĩa interface cho việc thêm hình ảnh sản phẩm chi tiết từ admin
    export interface ThemHinhAnhSanPhamChiTietAdminDTO {
        id_san_pham_chi_tiet?: string;
        hinh_anh_urls: string;
        mac_dinh: boolean;
    }
    export interface SuaHinhAnhSanPhamChiTietAdminDTO {
      hinh_anh_urls: string;
      mac_dinh: boolean;
    }
  