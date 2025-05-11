import { ChatLieu } from "./chat-lieu";
import { KieuDang } from "./kieu-dang";
import { ThuongHieu } from "./thuong-hieu";
import { XuatXu } from "./xuat-xu";
import { DanhMuc } from "./danh-muc";
import { SanPhamChiTiet, ThemSanPhamChiTietAdminDTO, HinhAnhSanPhamChiTietAdminDTO, GiamGiaAdminDTO } from "./san-pham-chi-tiet";

export interface SanPham {
    id_san_pham: string;
    ma_san_pham: string;
    ten_san_pham: string;
    mo_ta: string;
    trang_thai: string;
    ngay_tao: string;
    ma_nguoi_tao?: string;
    ma_nguoi_sua?: string;
    ten_nguoi_tao?: string;
    ten_nguoi_sua?: string;
    ngay_sua?: string;
    url_anh_mac_dinh: string;
    thuongHieu?: ThuongHieu;
    danhMuc?: DanhMuc;
    kieuDang?: KieuDang;
    chatLieu?: ChatLieu;
    xuatXu?: XuatXu;
    sanPhamChiTiets?: SanPhamChiTiet[];
}

export interface ThemSanPhamAdminDTO {
    ten_san_pham: string;
    mo_ta: string;
    id_thuong_hieu: string;
    id_kieu_dang: string;
    id_chat_lieu: string;
    id_xuat_xu: string;
    id_danh_muc: string;
    url_anh_mac_dinh: string;
    sanPhamChiTiets: ThemSanPhamChiTietAdminDTO[];
}
export interface ThamSoPhanTrangSanPhamDTO {
  trang_hien_tai?: number;
  so_phan_tu_tren_trang?: number;
  tim_kiem?: string;
  sap_xep_theo?: string;
  sap_xep_tang?: boolean;
  id_thuong_hieu?: string[];
  id_danh_muc?: string[];
  id_kieu_dang?: string[];
  id_chat_lieu?: string[];
  id_xuat_xu?: string[];
  gia_tu?: number;
  gia_den?: number;
}
export interface PhanTrangSanPhamDTO {
  trang_hien_tai: number;
  so_phan_tu_tren_trang: number;
  tong_so_trang: number;
  tong_so_phan_tu: number;
  gia_lon_nhat: number;
  danh_sach: SanPham[];
}

export interface SanPhamChiTietDTO {
  id_san_pham_chi_tiet: string;
  ma_san_pham_chi_tiet: string;
  so_luong: number;
  gia_ban: number;
  gia_nhap: number;
  trang_thai: string;
  ngay_tao: string;
  ngay_sua: string;
  hinhAnhSanPhamChiTiets: HinhAnhSanPhamChiTietAdminDTO[];
  ten_mau_sac: string;
  ten_kich_co: string;
  giamGia: GiamGiaAdminDTO | null;
}

export interface SanPhamGiamGiaDTO {
  id_san_pham: string;
  ma_san_pham: string;
  ten_san_pham: string;
  mo_ta: string;
  trang_thai: string;
  url_anh_mac_dinh: string;
  ten_thuong_hieu: string;
  ten_danh_muc: string;
  ten_kieu_dang: string;
  ten_chat_lieu: string;
  ten_xuat_xu: string;
  ngay_tao: string;
  ngay_sua: string;
  sanPhamChiTiets: SanPhamChiTietDTO[];
}

// Định nghĩa interface cho việc thêm sản phẩm chi tiết từ admin
 
