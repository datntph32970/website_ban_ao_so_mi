import { AxiosResponse } from "axios";
import { api } from '@/lib/api';
import { KhachHangAdminDTO, ThemKhachHangMuaTaiQuayAdminDTO, SuaKhachHangAdminDTO, CapNhatTrangThaiKhachHangDTO } from "@/types/khach-hang";

export const khachHangService = {
  // Lấy danh sách khách hàng
  getDanhSachKhachHang: async (): Promise<KhachHangAdminDTO[]> => {
    const response = await api.get<KhachHangAdminDTO[]>("/KhachHang");
    return response.data;
  },

  // Lấy chi tiết khách hàng theo ID
  getChiTietKhachHang: async (id: string): Promise<KhachHangAdminDTO> => {
    const response = await api.get<KhachHangAdminDTO>(`/KhachHang/${id}`);
    return response.data;
  },

  // Lấy thông tin khách hàng theo ID tài khoản
  getKhachHangByTaiKhoanId: async (idTaiKhoan: string): Promise<KhachHangAdminDTO> => {
    const response = await api.get<KhachHangAdminDTO>(`/KhachHang/taikhoan/${idTaiKhoan}`);
    return response.data;
  },

  // Thêm khách hàng mua tại quầy
  themKhachHangMuaTaiQuay: async (data: ThemKhachHangMuaTaiQuayAdminDTO): Promise<string> => {
    const response = await api.post<string>("/KhachHang/them-khach-hang-mua-tai-quay", data);
    return response.data;
  },

  // Cập nhật thông tin khách hàng
  capNhatKhachHang: async (id: string, data: SuaKhachHangAdminDTO): Promise<string> => {
    const response = await api.put<string>(`/KhachHang/${id}`, data);
    return response.data;
  },

  // Xóa khách hàng
  xoaKhachHang: async (id: string): Promise<string> => {
    const response = await api.delete<string>(`/KhachHang/${id}`);
    return response.data;
  },

  // Cập nhật trạng thái khách hàng
  capNhatTrangThaiKhachHang: async (id: string, data: CapNhatTrangThaiKhachHangDTO): Promise<string> => {
    const response = await api.patch<string>(`/KhachHang/${id}/trangthai`, data);
    return response.data;
  },
}; 