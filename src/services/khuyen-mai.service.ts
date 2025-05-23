import { KhuyenMai, ThemKhuyenMaiDTO, SuaKhuyenMaiDTO, CapNhatTrangThaiKhuyenMaiDTO, TrangThaiKhuyenMai, KieuKhuyenMai } from "@/types/khuyen-mai";
import { api } from "@/lib/api";

interface GetAllParams {
  trang_thai?: TrangThaiKhuyenMai;
  tim_kiem?: string;
  kieu_khuyen_mai?: KieuKhuyenMai;
  thoi_gian_bat_dau?: string;
  thoi_gian_ket_thuc?: string;
}

class KhuyenMaiService {
  async getAll(params?: GetAllParams): Promise<KhuyenMai[]> {
    const response = await api.get("/khuyenmai", { params });
    return response.data;
  }

  async getById(id: string): Promise<KhuyenMai> {
    const response = await api.get(`/khuyenmai/${id}`);
    return response.data;
  }

  async themKhuyenMai(data: ThemKhuyenMaiDTO): Promise<KhuyenMai> {
    const response = await api.post("/khuyenmai", data);
    return response.data;
  }

  async suaKhuyenMai(id: string, data: SuaKhuyenMaiDTO): Promise<KhuyenMai> {
    const response = await api.put(`/khuyenmai/${id}`, data);
    return response.data;
  }

  async xoaKhuyenMai(id: string): Promise<void> {
    await api.delete(`/khuyenmai/${id}`);
  }

  async capNhatTrangThai(id: string, data: CapNhatTrangThaiKhuyenMaiDTO): Promise<KhuyenMai> {
    const response = await api.patch(`/khuyenmai/${id}/trangthai`, data);
    return response.data;
  }
  async getActivePromotions(params?: { search?: string, id_hoa_don?: string }): Promise<{ tong_tien_hoa_don: number, khuyen_mais: { khuyenMai: KhuyenMai, giaTriThucTe: number, giaTriHienThi: string }[] }> {
    const response = await api.get("/khuyenmai/khuyen-mai-hoat-dong", { params });
    return response.data;
  }
}

export const khuyenMaiService = new KhuyenMaiService(); 