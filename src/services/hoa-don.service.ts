import { api } from '@/lib/api';
import { HoaDonAdminDTO } from '@/types/hoa-don';

interface ThamSoPhanTrangHoaDonAdminDTO {
    trang_hien_tai: number;
    so_phan_tu_tren_trang: number;
    tim_kiem?: string;
    trang_thai?: string;
    loai_hoa_don?: string;
    id_phuong_thuc_thanh_toan?: string;
    ngay_tao_tu?: string;
    ngay_tao_den?: string;
}

interface PhanTrangHoaDonAdminDTO {
    trang_hien_tai: number;
    so_phan_tu_tren_trang: number;
    tong_so_trang: number;
    tong_so_phan_tu: number;
    danh_sach: HoaDonAdminDTO[];
}

interface TaoHoaDonOnlineResponse {
    message: string;
    hoa_don: HoaDonAdminDTO;
}

interface CapNhatHoaDonOnlineDTO {
    id_dia_chi_nhan_hang?: string;
    phi_van_chuyen?: number;
    ghi_chu?: string;
    id_khuyen_mai?: string;
    id_phuong_thuc_thanh_toan?: string;
}

interface XacNhanDatHangResponse {
    redirect_url?: string;
    message: string;
    hoa_don?: HoaDonAdminDTO;
}

export const hoaDonService = {
    getHoaDon: async (tham_so: ThamSoPhanTrangHoaDonAdminDTO): Promise<PhanTrangHoaDonAdminDTO> => {
        const response = await api.get('/HoaDon/lay-danh-sach-hoa-don', { params: tham_so });
        return response.data;
    },
    getHoaDonById: async (id: string): Promise<HoaDonAdminDTO> => {
        const response = await api.get(`/HoaDon/${id}`);
        return response.data;
    },
    getAllHoaDonTaiQuayCho: async (): Promise<HoaDonAdminDTO[]> => {
        const response = await api.get('/HoaDon/lay-danh-sach-hoa-don-ban-tai-quay-co-trang-thai-cho-tai-quay');
        return response.data;
    },
    getHoaDonTaiQuayChoById: async (id: string): Promise<HoaDonAdminDTO> => {
        const response = await api.get(`/HoaDon/lay-hoa-don-ban-tai-quay-theo-id/${id}`);
        return response.data;
    },
    themHoaDonTaiQuay: async () => {
        const response = await api.post('/HoaDon/them-hoa-don-ban-tai-quay-moi');
        return response.data;
    },
    xoaHoaDonTaiQuay: async (id_hoa_don: string) => {
        return api.delete(`/HoaDon/xoa-hoa-don-ban-tai-quay?id_hoa_don=${id_hoa_don}`);
    },
    xoaHoaDonChiTiet: async (id_hoa_don_chi_tiet: string) => {
        return api.delete(`/HoaDon/xoa-hoa-don-chi-tiet?id_hoa_don_chi_tiet=${id_hoa_don_chi_tiet}`);
    },
    themaHoaDonChiTiet: async ( data: {
        id_hoa_don: string;
        id_san_pham_chi_tiet: string;
        so_luong: number;
        ghi_chu?: string;
    }) => {
        const response = await api.post(`/HoaDon/them-hoa-don-chi-tiet`, data);
        return response.data;
    },
    suaHoaDonChiTiet: async ( data: {
        id_hoa_don: string;
        id_san_pham_chi_tiet: string;
        so_luong: number;
        ghi_chu?: string;
    }) => {
        const response = await api.post(`/HoaDon/sua-hoa-don-chi-tiet`, data);
        return response.data;
    },
    
    updateHoaDon: async (data: {
        id_hoa_don: string;
        id_khach_hang?: string;
        id_khuyen_mai?: string;
        ghi_chu?: string;
        so_tien_khach_tra?: number;
        id_phuong_thuc_thanh_toan?: string;
    }) => {
        const response = await api.put('/HoaDon/cap-nhat-hoa-don-ban-tai-quay', data);
        return response.data;
    },
    hoanTatThanhToan: async (id_hoa_don: string) => {
        const response = await api.put(`/HoaDon/thanh-toan-hoa-don-cho-tai-quay/${id_hoa_don}`);
        return response.data;
    },
    async inHoaDon(id_hoa_don: string) {
        try {
            const response = await api.get(`/HoaDon/in-hoa-don/${id_hoa_don}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    taoHoaDonOnline: async (phi_van_chuyen: number): Promise<TaoHoaDonOnlineResponse> => {
        const response = await api.post('/HoaDon/tao-hoa-don-online', { phi_van_chuyen });
        return response.data;
    },
    getHoaDonByIdCuaKhachHang: async (id_hoa_don: string): Promise<HoaDonAdminDTO> => {
        const response = await api.get(`/HoaDon/lay-hoa-don-cua-khach-hang/${id_hoa_don}`);
        return response.data;
    },
    capNhatHoaDonOnline: async (id_hoa_don: string, data: CapNhatHoaDonOnlineDTO) => {
        const response = await api.put(`/HoaDon/cap-nhat-hoa-don-online/${id_hoa_don}`, data);
        return response.data;
    },
    apDungKhuyenMai: async (id_hoa_don: string, ma_khuyen_mai: string) => {
        const response = await api.post(`/HoaDon/ap-dung-khuyen-mai/${id_hoa_don}`, {
            ma_khuyen_mai
        });
        return response.data;
    },
    xacNhanDatHang: async (id_hoa_don: string): Promise<XacNhanDatHangResponse> => {
        const response = await api.post(`/HoaDon/xac-nhan-dat-hang/${id_hoa_don}`);
        return response.data;
    },
    getHoaDonTheoMa: async (ma_hoa_don: string): Promise<HoaDonAdminDTO> => {
        const response = await api.get(`/HoaDon/lay-hoa-don-theo-ma/${ma_hoa_don}`);
        return response.data;
    },
    getHoaDonCuaKhachHang: async (tham_so: ThamSoPhanTrangHoaDonAdminDTO): Promise<PhanTrangHoaDonAdminDTO> => {
        const response = await api.get('/HoaDon/lay-danh-sach-hoa-don-cua-khach-hang', {
            params: tham_so
        });
        return response.data;
    },
    huyDonHangChuaThanhToan: async (id_hoa_don: string): Promise<{
        message: string;
        hoa_don: HoaDonAdminDTO;
    }> => {
        const response = await api.put(`/HoaDon/huy-don-hang-chua-thanh-toan/${id_hoa_don}`);
        return response.data;
    },

    // Trạng thái đơn hàng
    xacNhanDonHang: async (id_hoa_don: string): Promise<{
        message: string;
    }> => {
        const response = await api.put(`/HoaDon/xac-nhan-don-hang/${id_hoa_don}`);
        return response.data;
    },

    danhDauHetHang: async (id_hoa_don: string): Promise<{
        message: string;
    }> => {
        const response = await api.put(`/HoaDon/danh-dau-het-hang/${id_hoa_don}`);
        return response.data;
    },

    capNhatTrangThaiGiaoHang: async (id_hoa_don: string, trang_thai: 'DangChuanBi' | 'DangGiaoHang' | 'DaNhanHang' | 'DaHoanThanh'): Promise<{
        message: string;
    }> => {
        const response = await api.put(`/HoaDon/cap-nhat-trang-thai-giao-hang/${id_hoa_don}`, { trang_thai });
        return response.data;
    },

    huyDonHangAdmin: async (id_hoa_don: string, ly_do: string): Promise<{
        message: string;
    }> => {
        const response = await api.put(`/HoaDon/huy-don-hang-admin/${id_hoa_don}`, { ly_do });
        return response.data;
    },

    huyDonHangKhachHang: async (id_hoa_don: string, ly_do: string): Promise<{
        message: string;
    }> => {
        const response = await api.put(`/HoaDon/huy-don-hang-khach-hang/${id_hoa_don}`, { ly_do });
        return response.data;
    },

    hoanTienVNPay: async (id_hoa_don: string): Promise<{
        message: string;
    }> => {
        const response = await api.post(`/HoaDon/hoan-tien-vnpay/${id_hoa_don}`);
        return response.data;
    },

    traHangTaiQuay: async (id_hoa_don: string, ly_do: string): Promise<{
        message: string;
        hoa_don: HoaDonAdminDTO;
    }> => {
        const response = await api.post(`/HoaDon/tra-hang-tai-quay/${id_hoa_don}`, { ly_do });
        return response.data;
    },

}