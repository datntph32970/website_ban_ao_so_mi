export interface HoaDonAdminDTO {
    id_hoa_don: string;
    ma_hoa_don: string;
    id_khach_hang?: string;
    ten_khach_hang: string;
    ten_nguoi_xu_ly: string;
    sdt_khach_hang?: string;
    dia_chi_nhan_hang?: string;
    phi_van_chuyen?: number;
    ghi_chu?: string;
    loai_hoa_don: string;
    tong_tien_don_hang: number;
    so_tien_khuyen_mai: number;
    tong_tien_phai_thanh_toan: number;
    trang_thai: string;
    so_tien_khach_tra: number;
    so_tien_thua_tra_khach: number;
    ten_phuong_thuc_thanh_toan: string;
    id_phuong_thuc_thanh_toan: string;
    ngay_tao: string;
    ten_nguoi_tao: string;
    ngay_sua?: Date;
    ten_nguoi_sua?: string;
    nhanVienXuLy: {
        id_nhan_vien: string;
        ma_nhan_vien: string;
        ten_nhan_vien: string;
    };
    khachHang?: KhachHang_HoaDonAdminDTO;
    khuyenMai?: {
        id_khuyen_mai: string;
        ten_khuyen_mai: string;
        ma_khuyen_mai: string;
        loai_khuyen_mai: string;
        gia_tri_khuyen_mai: number;
        gia_tri_giam_toi_da?: number;
    };
    hoaDonChiTiets?: HoaDonChiTietAdminDTO[];
    cuaHang?: {
        id_cua_hang: string;
        ten_cua_hang: string;
        website: string;
        email: string;
        sdt: string;
        dia_chi: string;
        mo_ta: string;
    };
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
    id_hoa_don_chi_tiet: string; // Guid
    ma_hoa_don_chi_tiet: string;
    id_hoa_don: string; // Guid
    id_san_pham_chi_tiet: string; // Guid
    so_luong: number; // int
    don_gia: number; // decimal
    gia_sau_giam_gia: number; // decimal
    gia_tri_khuyen_mai_cua_hoa_don_cho_hdct: number; // decimal
    thanh_tien: number; // decimal
    trang_thai: string;
    ghi_chu: string;
    ngay_sua?: Date; // DateTime?
    ten_nhan_vien_xu_ly: string;
    sanPhamChiTiet: SanPhamChiTiet_HoaDonChiTietAdminDTO;
    hoaDon: HoaDonAdminDTO;
    nhanVien: NhanVien_HoaDonAdminDTO;
}
export interface SanPhamChiTiet_HoaDonChiTietAdminDTO {
    id_san_pham_chi_tiet: string;
    ma_san_pham_chi_tiet: string;
    ten_san_pham: string;
    url_anh_san_pham_chi_tiet: string;
    ten_mau_sac: string;
    ten_kich_co: string;
}

