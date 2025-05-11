import { NhanVien } from "./nhan-vien";
import { SanPhamChiTiet } from "./san-pham-chi-tiet";
import { SanPhamGiamGiaDTO } from "@/services/giam-gia.service";

export enum TrangThaiGiamGia {
    HoatDong = "HoatDong",
    NgungHoatDong = "KhongHoatDong", 
}

export interface GiamGia {
    id_giam_gia: string;
    ma_giam_gia: string;
    ten_giam_gia: string;
    mo_ta: string;
    hinh_anh?: string;
    kieu_giam_gia: "PhanTram" | "SoTien";
    gia_tri_giam: number;
    gia_toi_da?: number;
    so_luong_toi_da: number;
    so_luong_da_su_dung: number;
    thoi_gian_bat_dau: string;
    thoi_gian_ket_thuc: string;
    ngay_ket_thuc_hanh_chinh?: string;
    trang_thai: TrangThaiGiamGia;
    dieu_kien_ap_dung?: string;
    uu_dai_kem?: string;
    ghi_chu?: string;
    tong_so_san_pham_da_ban?: number;
    tong_gia_tri_giam?: number;
    doanh_thu_tang_them?: number;
    danh_sach_san_pham?: string[];
    danh_muc_ap_dung?: string[];
    thuong_hieu_ap_dung?: string[];
    sanPhamChiTiets?: SanPhamGiamGiaDTO[];
    ngay_tao: string;
    ngay_cap_nhat: string;
    id_nguoi_tao: string;
    id_nguoi_cap_nhat: string;
    nguoiTao: {
        id_nhan_vien: string;
        id_tai_khoan: string;
        ma_nhan_vien: string;
        ten_nhan_vien: string;
        email: string;
        so_dien_thoai: string;
        ngay_sinh: string;
        dia_chi: string;
        cccd: string;
        gioi_tinh: string;
        trang_thai: string;
        id_nguoi_tao: string;
        ngay_tao: string;
        taoGiamGias: any[];
    };
    nguoiSua?: {
        id_nhan_vien: string;
        id_tai_khoan: string;
        ma_nhan_vien: string;
        ten_nhan_vien: string;
        email: string;
        so_dien_thoai: string;
        ngay_sinh: string;
        dia_chi: string;
        cccd: string;
        gioi_tinh: string;
        trang_thai: string;
        id_nguoi_tao: string;
        ngay_tao: string;
        taoGiamGias: any[];
    };
}