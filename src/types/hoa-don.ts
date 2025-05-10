export interface HoaDonAdminDTO {
    id_hoa_don: string;
    ma_hoa_don: string;
    id_khach_hang?: string;
    ten_khach_hang: string;
    ten_nhan_vien: string;
    sdt_khach_hang?: string;
    dia_chi_nhan_hang?: string;
    ghi_chu?: string;
    loai_hoa_don: string;
    tong_tien_don_hang: number;
    so_tien_khuyen_mai?: number;
    tong_tien_phai_thanh_toan: number;
    trang_thai: string;
    phuong_thuc_thanh_toan: string;
    ngay_tao: string;
    ten_nguoi_tao: string;
    ngay_sua?: string;
    ten_nguoi_sua?: string;
    nguoiTao: NhanVien_HoaDonAdminDTO;
    nguoiSua: NhanVien_HoaDonAdminDTO;
    khachHang: KhachHang_HoaDonAdminDTO;
    hoaDonChiTiets: HoaDonChiTietAdminDTO[];
}
export interface KhachHang_HoaDonAdminDTO {
    id_khach_hang: string;
    ma_khach_hang: string;
    ten_khach_hang: string;
    sdt_khach_hang: string;
}

export interface NhanVien_HoaDonAdminDTO {
    id_nhan_vien: string;
    ma_nhan_vien: string;
    ten_nhan_vien: string;
}
export interface HoaDonChiTietAdminDTO {
    id_hoa_don_chi_tiet: string;
    ma_hoa_don_chi_tiet: string;
    id_hoa_don: string;
    id_san_pham_chi_tiet: string;
    so_luong: number;
    don_gia: number;
    gia_sau_giam_gia: number;
    gia_tri_khuyen_mai_cua_hoa_don_cho_hdct: number;
    thanh_tien: number;
    trang_thai: string;
    ghi_chu: string;
    ngay_sua?: string;
    ten_nguoi_sua: string;
    sanPhamChiTiet: SanPhamChiTiet_HoaDonChiTietAdminDTO;
    hoaDon: HoaDonAdminDTO;
    nhanVien: NhanVien_HoaDonAdminDTO;
}
export interface SanPhamChiTiet_HoaDonChiTietAdminDTO {
    id_san_pham_chi_tiet: string;
    ma_san_pham_chi_tiet: string;
    ten_san_pham: string;
    ten_mau_sac: string;
    ten_kich_co: string;
}

