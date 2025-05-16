import { api } from "@/lib/api";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
}

interface ThongKeDoanhThuResponse {
  thang?: number;
  nam: number;
  tuan?: number;
  ngay?: string;
  doanh_thu: number;
  tu_ngay?: string;
  den_ngay?: string;
}

interface SanPhamBanChay {
  id_san_pham: string;
  ma_san_pham: string;
  ten_san_pham: string;
  mo_ta: string;
  so_luong_ban: number;
}

interface ThongKeSanPhamResponse {
  thang: number;
  nam: number;
  tuan?: number;
  ngay?: string;
  san_pham_ban_chay: SanPhamBanChay[];
  tong_san_pham: number;
  message: string;
}

interface ThongKeDonHangResponse {
  thang?: number;
  nam: number;
  tuan?: number;
  ngay?: string;
  so_don_hang: number;
}

interface ThongKeNhanVienResponse {
  thang?: number;
  nam: number;
  so_nhan_vien_moi: number;
}

interface NhanVienDoanhThu {
  nhan_vien: {
    id: string;
    ma_nhan_vien: string;
    ten_nhan_vien: string;
    email: string;
    so_dien_thoai: string;
  };
  doanh_thu: number;
}

interface ThongKeNhanVienDoanhThuResponse {
  thang: number;
  nam: number;
  danh_sach: NhanVienDoanhThu[];
  tong_nhan_vien: number;
  message: string;
}

export const thongKeService = {
  // Thống kê doanh thu
  getDoanhThuTheoNgay: async (ngay: string) => {
    const response = await api.get<ApiResponse<ThongKeDoanhThuResponse>>(`/ThongKe/doanh-thu/theo-ngay?ngay=${ngay}`);
    return response.data;
  },

  getDoanhThuTheoTuan: async (tuan: number, nam: number) => {
    const response = await api.get<ApiResponse<ThongKeDoanhThuResponse>>(`/ThongKe/doanh-thu/theo-tuan?tuan=${tuan}&nam=${nam}`);
    return response.data;
  },

  getDoanhThuTheoThang: async (thang: number, nam: number) => {
    const response = await api.get<ApiResponse<ThongKeDoanhThuResponse>>(`/ThongKe/doanh-thu/theo-thang?thang=${thang}&nam=${nam}`);
    return response.data;
  },

  getDoanhThuTheoNam: async (nam: number) => {
    const response = await api.get<ApiResponse<ThongKeDoanhThuResponse>>(`/ThongKe/doanh-thu/theo-nam?nam=${nam}`);
    return response.data;
  },

  // Thống kê sản phẩm bán chạy
  getSanPhamBanChayTheoNgay: async (ngay: string) => {
    const response = await api.get<ApiResponse<ThongKeSanPhamResponse>>(`/ThongKe/san-pham-ban-chay/theo-ngay?ngay=${ngay}`);
    return response.data;
  },

  getSanPhamBanChayTheoTuan: async (tuan: number, nam: number) => {
    const response = await api.get<ApiResponse<ThongKeSanPhamResponse>>(`/ThongKe/san-pham-ban-chay/theo-tuan?tuan=${tuan}&nam=${nam}`);
    return response.data;
  },

  getSanPhamBanChayTheoThang: async (thang: number, nam: number) => {
    const response = await api.get<ApiResponse<ThongKeSanPhamResponse>>(`/ThongKe/san-pham-ban-chay/theo-thang?thang=${thang}&nam=${nam}`);
    return response.data;
  },

  getSanPhamBanChayTheoNam: async (nam: number) => {
    const response = await api.get<ApiResponse<ThongKeSanPhamResponse>>(`/ThongKe/san-pham-ban-chay/theo-nam?nam=${nam}`);
    return response.data;
  },

  // Thống kê đơn hàng
  getDonHangTheoNgay: async (ngay: string) => {
    const response = await api.get<ApiResponse<ThongKeDonHangResponse>>(`/ThongKe/don-hang/theo-ngay?ngay=${ngay}`);
    return response.data;
  },

  getDonHangTheoTuan: async (tuan: number, nam: number) => {
    const response = await api.get<ApiResponse<ThongKeDonHangResponse>>(`/ThongKe/don-hang/theo-tuan?tuan=${tuan}&nam=${nam}`);
    return response.data;
  },

  getDonHangTheoThang: async (thang: number, nam: number) => {
    const response = await api.get<ApiResponse<ThongKeDonHangResponse>>(`/ThongKe/don-hang/theo-thang?thang=${thang}&nam=${nam}`);
    return response.data;
  },

  getDonHangTheoNam: async (nam: number) => {
    const response = await api.get<ApiResponse<ThongKeDonHangResponse>>(`/ThongKe/don-hang/theo-nam?nam=${nam}`);
    return response.data;
  },

  // Thống kê sản phẩm mới
  getSanPhamMoiTheoThang: async (thang: number, nam: number) => {
    const response = await api.get<{ thang: number; nam: number; so_san_pham_moi: number }>(`/ThongKe/san-pham-moi/theo-thang?thang=${thang}&nam=${nam}`);
    return response.data;
  },

  getSanPhamMoiTheoNam: async (nam: number) => {
    const response = await api.get<{ nam: number; so_san_pham_moi: number }>(`/ThongKe/san-pham-moi/theo-nam?nam=${nam}`);
    return response.data;
  },

  getSanPhamMoiTheoTuan: async (tuan: number, nam: number) => {
    const response = await api.get<{ tuan: number; nam: number; so_san_pham_moi: number }>(`/ThongKe/san-pham-moi/theo-tuan?tuan=${tuan}&nam=${nam}`);
    return response.data;
  },

  // Thống kê nhân viên
  getNhanVienTheoThang: async (thang: number, nam: number) => {
    const response = await api.get<ThongKeNhanVienResponse>(`/ThongKe/nhan-vien/theo-thang?thang=${thang}&nam=${nam}`);
    return response.data;
  },

  getNhanVienTheoNam: async (nam: number) => {
    const response = await api.get<ThongKeNhanVienResponse>(`/ThongKe/nhan-vien/theo-nam?nam=${nam}`);
    return response.data;
  },

  getNhanVienDoanhThuCaoNhatTheoThang: async (thang: number, nam: number) => {
    const response = await api.get<ApiResponse<ThongKeNhanVienDoanhThuResponse>>(`/ThongKe/nhan-vien/doanh-thu-cao-nhat/theo-thang?thang=${thang}&nam=${nam}`);
    return response.data;
  },

  getNhanVienDoanhThuCaoNhatTheoNam: async (nam: number) => {
    const response = await api.get<ApiResponse<ThongKeNhanVienDoanhThuResponse>>(`/ThongKe/nhan-vien/doanh-thu-cao-nhat/theo-nam?nam=${nam}`);
    return response.data;
  }
};
