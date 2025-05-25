import { api } from '@/lib/api';
import { GiamGia, TrangThaiGiamGia } from '@/types/giam-gia';
import { SanPham, PhanTrangSanPhamDTO, ThamSoPhanTrangSanPhamDTO, PhanTrangSanPhamAdminDTO } from '@/types/san-pham';

export interface CreateGiamGiaDTO {
    ten_giam_gia: string;
    mo_ta: string;
    kieu_giam_gia: string;
    gia_tri_giam: number;
    thoi_gian_bat_dau: string;
    thoi_gian_ket_thuc: string;
    trang_thai: TrangThaiGiamGia;
    ma_giam_gia: string;
}

export interface UpdateGiamGiaDTO {
    id_giam_gia: string;
    ten_giam_gia: string;
    mo_ta: string;
    kieu_giam_gia: string;
    gia_tri_giam: number;
    thoi_gian_bat_dau: string;
    thoi_gian_ket_thuc: string;
    ma_giam_gia: string;
}

export interface SanPhamGiamGiaDTO {
    id_san_pham: string;
    ma_san_pham: string;
    ten_san_pham: string;
    mo_ta: string;
    trang_thai: string;
    url_anh_mac_dinh?: string;
    ten_thuong_hieu?: string;
    ten_danh_muc?: string;
    ten_kieu_dang?: string;
    ten_chat_lieu?: string;
    ten_xuat_xu?: string;
    ngay_tao: string;
    ngay_sua: string;
    sanPhamChiTiets: SanPhamChiTietDTO[];
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

export interface HinhAnhSanPhamChiTietAdminDTO {
    hinh_anh_urls: string;
    id_hinh_anh: string;
}

export interface GiamGiaAdminDTO {
    id_giam_gia: string;
    ma_giam_gia: string;
    ten_giam_gia: string;
    kieu_giam_gia: string;
    gia_tri_giam: number;
    thoi_gian_bat_dau: string;
    thoi_gian_ket_thuc: string;
    trang_thai: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    totalItems: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
}

export interface ThemGiamGiaVaoSanPhamChiTietDTO {
    id_giam_gia: string;
    san_pham_chi_tiet_ids: string[];
}

export interface XoaGiamGiaKhoiSanPhamChiTietDTO {
    id_giam_gia: string;
    san_pham_chi_tiet_ids: string[];
}

export interface ThongKeGiamGiaDTO {
    id_giam_gia: string;
    ma_giam_gia: string;
    ten_giam_gia: string;
    trang_thai: string;
    thoi_gian_bat_dau: string;
    thoi_gian_ket_thuc: string;
    con_hieu_luc: boolean;
    so_luong_da_su_dung: number;
    ti_le_su_dung: number;
    tong_bien_the_ap_dung: number;
    bien_the_dang_ap_dung: number;
    danh_sach_bien_the: Array<{
        id_san_pham: string;
        ma_san_pham: string;
        ten_san_pham: string;
        so_luong_bien_the: number;
        bien_the: Array<{
            id_san_pham_chi_tiet: string;
            ma_san_pham_chi_tiet: string;
            so_luong: number;
            trang_thai: string;
        }>;
    }>;
}

export interface ThongKeTongHopGiamGiaDTO {
    tong_so_giam_gia: number;
    dang_hoat_dong: number;
    da_ket_thuc: number;
    chua_bat_dau: number;
    dang_ap_dung: number;
    thong_ke_theo_thang: Array<{
        nam: number;
        thang: number;
        so_luong: number;
        dang_hoat_dong: number;
        da_su_dung: number;
    }>;
}

export const giamGiaService = {
    // Lấy danh sách giảm giá với phân trang và lọc
    getAll: async (params: any): Promise<PaginatedResponse<GiamGia>> => {
        const response = await api.get('/GiamGia', { params });
        return response.data;
    },

    // Lấy danh sách giảm giá đang hoạt động
    getActiveDiscounts: async () => {
        const response = await api.get('/GiamGia/active');
        return response.data;
    },

    // Lấy chi tiết giảm giá theo ID
    getById: async (id: string) => {
        const response = await api.get(`/GiamGia/${id}`);
        return response.data;
    },

    // Tạo giảm giá mới
    create: async (data: CreateGiamGiaDTO) => {
        const response = await api.post('/GiamGia', data);
        return response.data;
    },

    // Cập nhật giảm giá
    update: async (id: string, data: UpdateGiamGiaDTO) => {
        try {
        const response = await api.put(`/GiamGia/${id}`, data);
        return response.data;
        } catch (error: any) {
            if (error.response?.data) {
                const errorData = error.response.data;
                if (typeof errorData === 'object' && errorData !== null) {
                    throw errorData;
                }
            }
            throw error;
        }
    },

    // Xóa giảm giá
    delete: async (id: string) => {
        const response = await api.delete(`/GiamGia/${id}`);
        return response.data;
    },

    // Lấy danh sách sản phẩm có thể áp dụng giảm giá
    getSanPhamCoTheGiamGia: async (id_giam_gia: string, data: ThamSoPhanTrangSanPhamDTO): Promise<PhanTrangSanPhamAdminDTO> => {
        const response = await api.post(`/GiamGia/lay-danh-sach-san-pham-co-the-giam-gia/${id_giam_gia}`, data);
        return response.data;
    },

    // Thêm giảm giá vào sản phẩm chi tiết
    themGiamGiaVaoSanPhamChiTiet: async (data: ThemGiamGiaVaoSanPhamChiTietDTO) => {
        const response = await api.post('/GiamGia/them-giam_gia-vao-san-pham-chi-tiet', data);
        return response.data;
    },

    // Xóa giảm giá khỏi sản phẩm chi tiết
    xoaGiamGiaKhoiSanPhamChiTiet: async (data: XoaGiamGiaKhoiSanPhamChiTietDTO) => {
        const response = await api.delete('/GiamGia/xoa-giam_gia-khoi-san-pham-chi-tiet', { data });
        return response.data;
    },

    // Lấy danh sách sản phẩm đang áp dụng giảm giá
    getSanPhamDangGiamGia: async (id: string, params: ThamSoPhanTrangSanPhamDTO) => {
        const response = await api.post(`/GiamGia/${id}/san-pham`, params);
        return response.data;
    },

    // Lấy chi tiết sản phẩm đang áp dụng giảm giá
    getSanPhamChiTietDangGiamGia: async (id_giam_gia: string, id_san_pham: string) => {
        const response = await api.get(`/GiamGia/${id_giam_gia}/san-pham/${id_san_pham}`);
        return response.data;
    },

    // Lấy thống kê giảm giá theo ID
    getThongKeGiamGia: async (id: string): Promise<ThongKeGiamGiaDTO> => {
        const response = await api.get(`/GiamGia/thong-ke/${id}`);
        return response.data;
    },

    // Lấy thống kê tổng hợp giảm giá
    getThongKeTongHop: async (): Promise<ThongKeTongHopGiamGiaDTO> => {
        const response = await api.get('/GiamGia/thong-ke-tong-hop');
        return response.data;
    },

    // Cập nhật trạng thái giảm giá
    capNhatTrangThaiGiamGia: async () => {
        const response = await api.post('/GiamGia/cap-nhat-trang-thai-giam-gia');
        return response.data;
    }
}; 