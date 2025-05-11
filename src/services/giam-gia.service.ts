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

export interface DanhMucDTO {
    id: string;
    ten: string;
}

export interface ThuongHieuDTO {
    id: string;
    ten: string;
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

interface XoaGiamGiaKhoiSanPhamChiTietDTO {
    san_pham_chi_tiet_ids: string[];
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
    getById: async (id: string): Promise<GiamGia> => {
        const response = await api.get<GiamGia>(`/GiamGia/${id}`);
        return response.data;
    },

    // Thêm giảm giá mới
    create: async (data: Partial<GiamGia>): Promise<GiamGia> => {
        const response = await api.post<GiamGia>('/GiamGia', data);
        return response.data;
    },

    // Cập nhật thông tin giảm giá
    update: async (id: string, data: Partial<GiamGia>): Promise<GiamGia> => {
        const response = await api.put<GiamGia>(`/GiamGia/${id}`, data);
        return response.data;
    },

    // Xóa giảm giá
    delete: async (id: string): Promise<GiamGia> => {
        const response = await api.delete<GiamGia>(`/GiamGia/${id}`);
        return response.data;
    },

    // Lấy danh sách giảm giá đang hoạt động
    getActive: async (): Promise<GiamGia[]> => {
        const response = await api.get('/GiamGia/active');
        return response.data;
    },

    // Lấy danh sách sản phẩm có thể áp dụng giảm giá
    getSanPhamCoTheGiamGia: async (params?: {
        timkiem?: string;
        id_danh_muc?: string;
        id_thuong_hieu?: string;
        giam_gia_cua_san_phan_chi_tiet?: string;
    }): Promise<SanPhamGiamGiaDTO[]> => {
        const queryParams = new URLSearchParams();
        if (params?.timkiem) queryParams.append('timkiem', params.timkiem);
        if (params?.id_danh_muc) queryParams.append('id_danh_muc', params.id_danh_muc);
        if (params?.id_thuong_hieu) queryParams.append('id_thuong_hieu', params.id_thuong_hieu);
        if (params?.giam_gia_cua_san_phan_chi_tiet) queryParams.append('giam_gia_cua_san_phan_chi_tiet', params.giam_gia_cua_san_phan_chi_tiet);

        const response = await api.get(`/GiamGia/lay-danh-sach-san-pham-co-the-giam-gia?${queryParams.toString()}`);
        return response.data;
    },

    // Lấy danh sách sản phẩm đang được giảm giá
    getSanPhamDangGiamGia: async (idGiamGia: string): Promise<SanPhamGiamGiaDTO[]> => {
        const response = await api.get<SanPhamGiamGiaDTO[]>(`/GiamGia/${idGiamGia}/san-pham`);
        return response.data;
    },

    // Xóa giảm giá khỏi sản phẩm chi tiết
    xoaGiamGiaKhoiSanPhamChiTiet: async (dto: XoaGiamGiaKhoiSanPhamChiTietDTO): Promise<void> => {
        await api.delete(`/GiamGia/xoa-giam_gia-khoi-san-pham-chi-tiet`, {
            data: dto
        });
    },


    // Thêm giảm giá vào sản phẩm chi tiết
    themGiamGiaVaoSanPhamChiTiet: async (dto: ThemGiamGiaVaoSanPhamChiTietDTO): Promise<void> => {
        await api.post('/GiamGia/them-giam_gia-vao-san-pham-chi-tiet', dto);
    }
}; 