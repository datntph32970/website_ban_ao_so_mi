import { api } from "@/lib/api";

interface PhuongThucThanhToan {
  id_phuong_thuc_thanh_toan: string;
  ten_phuong_thuc_thanh_toan: string;
  ma_phuong_thuc_thanh_toan: string;
  mo_ta: string;
  trang_thai: boolean;
  ngay_tao?: string;
  ngay_cap_nhat?: string;
  id_nguoi_tao?: string;
  id_nguoi_sua?: string;
}

interface ThemPhuongThucThanhToanDTO {
  ten_phuong_thuc_thanh_toan: string;
  ma_phuong_thuc_thanh_toan?: string;
  mo_ta: string;
}

interface SuaPhuongThucThanhToanDTO {
  ten_phuong_thuc_thanh_toan: string;
  mo_ta: string;
}

interface CapNhatTrangThaiResponse {
  message: string;
  trang_thai: boolean;
}

export const phuongThucThanhToanService = {
  // Lấy tất cả phương thức thanh toán
  getDanhSachPhuongThucThanhToan: async () => {
    const response = await api.get<PhuongThucThanhToan[]>("/PhuongThucThanhToan");
    return response.data;
  },

  // Lấy danh sách phương thức thanh toán đang hoạt động
  getDanhSachPhuongThucThanhToanHoatDong: async () => {
    const response = await api.get<PhuongThucThanhToan[]>("/PhuongThucThanhToan/lay-danh-sach-phuong-thuc-thanh-toan-hoat-dong");
    return response.data;
  },

  // Lấy chi tiết phương thức thanh toán theo ID
  getChiTietPhuongThucThanhToan: async (id: string) => {
    const response = await api.get<PhuongThucThanhToan>(`/PhuongThucThanhToan/${id}`);
    return response.data;
  },

  // Thêm phương thức thanh toán mới
  themPhuongThucThanhToan: async (data: ThemPhuongThucThanhToanDTO) => {
    const response = await api.post<string>("/PhuongThucThanhToan", data);
    return response.data;
  },

  // Cập nhật phương thức thanh toán
  capNhatPhuongThucThanhToan: async (id: string, data: SuaPhuongThucThanhToanDTO) => {
    const response = await api.put<string>(`/PhuongThucThanhToan/${id}`, data);
    return response.data;
  },

  // Cập nhật trạng thái phương thức thanh toán
  capNhatTrangThaiPhuongThucThanhToan: async (id: string) => {
    if (!id) {
      throw new Error('ID phương thức thanh toán không được để trống');
    }
    const response = await api.put<CapNhatTrangThaiResponse>(
      `/PhuongThucThanhToan/cap-nhat-trang-thai/${id}`
    );
    return response.data;
  },

  // Xóa phương thức thanh toán
  xoaPhuongThucThanhToan: async (id: string) => {
    const response = await api.delete<boolean>(`/PhuongThucThanhToan/${id}`);
    return response.data;
  }
  ,

  // Lấy danh sách phương thức thanh toán online đang hoạt động
  getDanhSachPhuongThucThanhToanOnlineHoatDong: async () => {
    const response = await api.get<PhuongThucThanhToan[]>("/PhuongThucThanhToan/lay-danh-sach-phuong-thuc-thanh-toan-online-hoat-dong");
    return response.data;
  }
};
