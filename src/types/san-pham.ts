import { ChatLieu } from "./chat-lieu";
import { KieuDang } from "./kieu-dang";
import { ThuongHieu } from "./thuong-hieu";
import { XuatXu } from "./xuat-xu";
import { DanhMuc } from "./danh-muc";
import { SanPhamChiTiet, ThemSanPhamChiTietAdminDTO, HinhAnhSanPhamChiTietAdminDTO, GiamGiaAdminDTO } from "./san-pham-chi-tiet";
import { KichCo } from "./kich-co";
import { MauSac } from "./mau-sac";

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
    ten_thuong_hieu?: string;
    ten_danh_muc?: string;
    thuongHieu?: ThuongHieu;
    danhMuc?: DanhMuc;
    kieuDang?: KieuDang;
    chatLieu?: ChatLieu;
    xuatXu?: XuatXu;
    sanPhamChiTiets?: SanPhamChiTiet[];
    gia_ban_thap_nhat?: number;
    gia_ban_cao_nhat?: number;
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
  gia_lon_nhat?: number;
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
  giamGias: GiamGiaAdminDTO[];
}

export interface ThuongHieuAdminDTO {
  id_thuong_hieu: string;
  ma_thuong_hieu: string;
  ten_thuong_hieu: string;
}

export interface DanhMucAdminDTO {
  id_danh_muc: string;
  ma_danh_muc: string;
  ten_danh_muc: string;
}

export interface KieuDangAdminDTO {
  id_kieu_dang: string;
  ma_kieu_dang: string;
  ten_kieu_dang: string;
}

export interface ChatLieuAdminDTO {
  id_chat_lieu: string;
  ma_chat_lieu: string;
  ten_chat_lieu: string;
}

export interface XuatXuAdminDTO {
  id_xuat_xu: string;
  ma_xuat_xu: string;
  ten_xuat_xu: string;
}

export interface SanPhamChiTietAdminDTO {
  id_san_pham_chi_tiet: string;
  ma_san_pham_chi_tiet: string;
  so_luong: number;
  so_luong_da_ban: number;
  gia_ban: number;
  gia_nhap: number;
  trang_thai: string;
  ngay_tao: string;
  mauSac: MauSac;
  kichCo: KichCo;
  hinhAnhSanPhamChiTiets: HinhAnhSanPhamChiTietAdminDTO[];
  giamGias: GiamGiaAdminDTO[];
}

export interface SanPhamAdminDTO {
  id_san_pham: string;
  ma_san_pham: string;
  ten_san_pham: string;
  mo_ta: string;
  trang_thai: string;
  ngay_tao: string;
  ngay_sua: string;
  url_anh_mac_dinh: string;
  thuongHieu: ThuongHieuAdminDTO | null;
  danhMuc: DanhMucAdminDTO | null;
  kieuDang: KieuDangAdminDTO | null;
  chatLieu: ChatLieuAdminDTO | null;
  xuatXu: XuatXuAdminDTO | null;
  sanPhamChiTiets: SanPhamChiTietAdminDTO[];
}

export interface PhanTrangSanPhamAdminDTO {
  trang_hien_tai: number;
  so_phan_tu_tren_trang: number;
  tong_so_trang: number;
  tong_so_phan_tu: number;
  gia_lon_nhat?: number;
  danh_sach: SanPhamAdminDTO[];
}

