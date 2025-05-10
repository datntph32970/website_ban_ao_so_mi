import { api } from '@/lib/api';
import { HoaDonAdminDTO } from '@/types/hoa-don';

export const hoaDonService = {
    getHoaDon: async (): Promise<HoaDonAdminDTO[]> => {
        const response = await api.get('/HoaDon');
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
    themHoacSuaHoaDonChiTiet: async ( data: {
        id_hoa_don: string;
        id_san_pham_chi_tiet: string;
        so_luong: number;
        ghi_chu?: string;
    }) => {
        const response = await api.post(`/HoaDon/them-hoac-sua-hoa-don-chi-tiet`, data);
        return response.data;
    }
}