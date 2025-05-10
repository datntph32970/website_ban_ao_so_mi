import { api } from '@/lib/api';
import { GiamGia, TrangThaiGiamGia } from '@/types/giam-gia';

export interface CreateGiamGiaDTO {
    ten_giam_gia: string;
    mo_ta: string;
    kieu_giam_gia: string;
    gia_tri_giam: number;
    so_luong_toi_da: number;
    thoi_gian_bat_dau: string;
    thoi_gian_ket_thuc: string;
    trang_thai: TrangThaiGiamGia;
}

export interface UpdateGiamGiaDTO extends Partial<CreateGiamGiaDTO> {
    id_giam_gia: string;
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
    sanPhamChiTiets: {
        id_san_pham_chi_tiet: string;
        ma_san_pham_chi_tiet: string;
        so_luong: number;
        gia_ban: number;
        gia_nhap: number;
        trang_thai: string;
        ngay_tao: string;
        ngay_sua: string;
        hinhAnhSanPhamChiTiets: {
            hinh_anh_urls: string;
            id_hinh_anh: string;
        }[];
        ten_mau_sac: string;
        ten_kich_co: string;
        giamGia: {
            id_giam_gia: string;
            ma_giam_gia: string;
            ten_giam_gia: string;
            kieu_giam_gia: string;
            gia_tri_giam: number;
            thoi_gian_bat_dau: string;
            thoi_gian_ket_thuc: string;
            trang_thai: string;
        } | null;
    }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export const giamGiaService = {
    // Lấy danh sách giảm giá (có filter)
    getAll: async (params?: {
        trang_thai?: string;
        tim_kiem?: string;
        thoi_gian_bat_dau?: string;
        thoi_gian_ket_thuc?: string;
        kieu_giam_gia?: string;
        page?: number;
        pageSize?: number;
        sortBy?: string;
        ascending?: boolean;
    }): Promise<PaginatedResponse<GiamGia>> => {
        const response = await api.get<PaginatedResponse<GiamGia>>('/GiamGia', {
            params,
        });
        return response.data;
    },

    // Lấy chi tiết giảm giá theo ID
    getChiTietGiamGia: async (id: string) => {
        const response = await api.get<GiamGia>(`/GiamGia/${id}`);
        return response.data;
    },

    // Thêm giảm giá mới
    themGiamGia: async (giamGia: Partial<GiamGia>) => {
        const response = await api.post<GiamGia>('/GiamGia', giamGia);
        return response.data;
    },

    // Cập nhật thông tin giảm giá
    capNhatGiamGia: async (id: string, giamGia: Partial<GiamGia>) => {
        const response = await api.put<GiamGia>(`/GiamGia/${id}`, giamGia);
        return response.data;
    },

    // Xóa giảm giá
    xoaGiamGia: async (id: string) => {
        const response = await api.delete<GiamGia>(`/GiamGia/${id}`);
        return response.data;
    },

    // Lấy danh sách giảm giá đang hoạt động
    getActive: async (): Promise<GiamGia[]> => {
        const response = await api.get('/GiamGia/active');
        return response.data;
    },

    // Lấy danh sách giảm giá theo trạng thái
    getByStatus: async (status: TrangThaiGiamGia): Promise<GiamGia[]> => {
        const response = await api.get(`/GiamGia/status/${status}`);
        return response.data;
    },

    // Lấy danh sách giảm giá theo thời gian
    getByDateRange: async (startDate: string, endDate: string): Promise<GiamGia[]> => {
        const response = await api.get(`/GiamGia/date-range`, {
            params: { startDate, endDate }
        });
        return response.data;
    },

    // Kiểm tra giảm giá có hợp lệ không
    validateDiscount: async (id: string): Promise<{ isValid: boolean; message: string }> => {
        const response = await api.get(`/GiamGia/${id}/validate`);
        return response.data;
    },

    // Cập nhật số lượng đã sử dụng
    updateUsageCount: async (id: string, count: number): Promise<GiamGia> => {
        const response = await api.put(`/GiamGia/${id}/usage`, { count });
        return response.data;
    },

    // Kiểm tra giảm giá có còn hạn sử dụng không
    checkAvailability: async (id: string): Promise<{ 
        isAvailable: boolean; 
        remainingCount: number;
        message: string;
    }> => {
        const response = await api.get(`/GiamGia/${id}/availability`);
        return response.data;
    },

    // Lấy danh sách sản phẩm có thể áp dụng giảm giá (có filter)
    getSanPhamCoTheGiamGia: async (params?: { timkiem?: string; id_danh_muc?: string; id_thuong_hieu?: string; giam_gia_cua_san_phan_chi_tiet?: string }): Promise<SanPhamGiamGiaDTO[]> => {
        const response = await api.get<SanPhamGiamGiaDTO[]>('/GiamGia/lay-danh-sach-san-pham-co-the-giam-gia', {
            params,
        });
        return response.data;
    },

    // Lấy danh sách sản phẩm đang được áp dụng giảm giá
    getSanPhamDangGiamGia: async (idGiamGia: string): Promise<SanPhamGiamGiaDTO[]> => {
        const response = await api.get<SanPhamGiamGiaDTO[]>(`/GiamGia/${idGiamGia}/san-pham`);
        return response.data;
    },

    // Thêm giảm giá vào sản phẩm chi tiết
    themGiamGiaVaoSanPhamChiTiet: async (idGiamGia: string, sanPhamChiTietIds: string[]): Promise<void> => {
        await api.post('/GiamGia/them-giam_gia-vao-san-pham-chi-tiet', {
            id_giam_gia: idGiamGia,
            san_pham_chi_tiet_ids: sanPhamChiTietIds,
        });
    },

    // Xóa giảm giá khỏi sản phẩm chi tiết
    xoaGiamGiaKhoiSanPhamChiTiet: async (san_pham_chi_tiet_ids: string[]): Promise<any> => {
        const res = await api.delete('/GiamGia/xoa-giam_gia-khoi-san-pham-chi-tiet', {
            data: { san_pham_chi_tiet_ids },
        });
        if (res.status !== 200 && res.status !== 204) {
            throw new Error(res.data?.message || 'Lỗi khi xóa giảm giá khỏi sản phẩm');
        }
        return res.data;
    },
}; 