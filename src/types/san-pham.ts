import { ChatLieu } from "./chat-lieu";
import { KieuDang } from "./kieu-dang";
import { ThuongHieu } from "./thuong-hieu";
import { XuatXu } from "./xuat-xu";
import { DanhMuc } from "./danh-muc";
import { SanPhamChiTiet, ThemSanPhamChiTietAdminDTO } from "./san-pham-chi-tiet";

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
    sanPhamChiTiets: ThemSanPhamChiTietAdminDTO[];
  }
  
  // Định nghĩa interface cho việc thêm sản phẩm chi tiết từ admin
 
