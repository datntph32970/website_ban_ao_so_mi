import { api } from '@/lib/api';
import { SanPham, ThemSanPhamAdminDTO } from '@/types/san-pham';
import { AxiosResponse } from 'axios';
import { SanPhamChiTiet } from '@/types/san-pham-chi-tiet';


// Định nghĩa interface cho việc cập nhật sản phẩm
export interface UpdateSanPhamDTO {
  ma_san_pham?: string;
  ten_san_pham?: string;
  mo_ta?: string;
  trang_thai?: string;
  id_chat_lieu?: string;
  id_kieu_dang?: string;
  id_thuong_hieu?: string;
  id_xuat_xu?: string;
}

// Định nghĩa interface cho việc tạo sản phẩm chi tiết mới
export interface CreateSanPhamChiTietDTO {
  ma_san_pham_chi_tiet: string;
  so_luong: number;
  gia_ban: number;
  gia_nhap: number;
  trang_thai: string;
  id_san_pham: string;
  id_kich_co: string;
  id_mau_sac: string;
}

// Định nghĩa interface cho việc cập nhật sản phẩm chi tiết
export interface UpdateSanPhamChiTietDTO {
  ma_san_pham_chi_tiet?: string;
  so_luong?: number;
  gia_ban?: number;
  gia_nhap?: number;
  trang_thai?: string;
  id_san_pham?: string;
  id_kich_co?: string;
  id_mau_sac?: string;
}

export const sanPhamService = {
  // Lấy danh sách sản phẩm
  getDanhSachSanPham: async () => {
    const response = await api.get<SanPham[]>('/SanPham/lay-danh-sach-san-pham-admin-dto');
    return response.data;
  },

  // Lấy chi tiết sản phẩm theo ID
  getChiTietSanPham: async (id: string) => {
    const response = await api.get<SanPham>(`/SanPham/lay-san-pham-admin-dto-theo-id?id=${id}`);
    return response.data;
  },

  // Thêm sản phẩm mới
  themSanPham: async (sanPham: ThemSanPhamAdminDTO) => {
    const response = await api.post<SanPham>('/SanPham/them-san-pham', sanPham);
    return response.data;
  },

  // Cập nhật thông tin sản phẩm
  capNhatSanPham: async (id: string, sanPham: UpdateSanPhamDTO) => {
    const response = await api.put<SanPham>(`/SanPham/sua-san-pham?id=${id}`, sanPham);
    return response.data;
  },

  // Xóa sản phẩm
  xoaSanPham: async (id: string) => {
    const response = await api.delete<SanPham>(`/SanPham/xoa-san-pham/${id}`);
    return response.data;
  },

  // Cập nhật trạng thái sản phẩm
  capNhatTrangThaiSanPham: async (id: string, trangThai: string): Promise<AxiosResponse> => {
    const response = await api.put<SanPham>(`/SanPham/update-trang-thai-san-pham/${id}`, { trang_thai: trangThai });
    return response;
  },

  // Tìm kiếm sản phẩm
  timKiemSanPham: async (keyword: string) => {
    const response = await api.get<SanPham[]>(`/SanPham/search-san-pham?keyword=${keyword}`);
    return response.data;
  },

  // Lọc sản phẩm theo các tiêu chí
  locSanPham: async (params: {
    id_chat_lieu?: string;
    id_kieu_dang?: string;
    id_thuong_hieu?: string;
    id_xuat_xu?: string;
    trang_thai?: string;
  }) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await api.get<SanPham[]>(`/SanPham/filter-san-pham?${queryParams.toString()}`);
    return response.data;
  },

  // Sản phẩm chi tiết
  // Lấy danh sách sản phẩm chi tiết
  getDanhSachSanPhamChiTiet: async () => {
    const response = await api.get<SanPhamChiTiet[]>('/SanPhamChiTiet/lay-danh-sach-san-pham-chi-tiet');
    return response.data;
  },

  // Lấy chi tiết sản phẩm chi tiết theo ID
  getChiTietSanPhamChiTiet: async (id: string) => {
    const response = await api.get<SanPhamChiTiet>(`/SanPhamChiTiet/lay-san-pham-chi-tiet-theo-id?id=${id}`);
    return response.data;
  },

  // Lấy danh sách sản phẩm chi tiết theo ID sản phẩm
//   getSanPhamChiTietBySanPhamId: async (idSanPham: string) => {
//     const response = await api.get<SanPhamChiTiet[]>(`/SanPhamChiTiet/get-san-pham-chi-tiet-by-san-pham-id/${idSanPham}`);
//     return response.data;
//   },

  // Thêm sản phẩm chi tiết mới
  themSanPhamChiTiet: async (sanPhamChiTiet: CreateSanPhamChiTietDTO) => {
    const response = await api.post<SanPhamChiTiet>('/SanPhamChiTiet/them-san-pham-chi-tiet', sanPhamChiTiet);
    return response.data;
  },

  // Cập nhật thông tin sản phẩm chi tiết
  capNhatSanPhamChiTiet: async (id: string, sanPhamChiTiet: UpdateSanPhamChiTietDTO) => {
    const response = await api.put<SanPhamChiTiet>(`/SanPhamChiTiet/sua-san-pham-chi-tiet?id=${id}`, sanPhamChiTiet);
    return response.data;
  },

  // Xóa sản phẩm chi tiết
  xoaSanPhamChiTiet: async (id: string) => {
    const response = await api.delete<SanPhamChiTiet>(`/SanPhamChiTiet/xoa-san-pham-chi-tiet?id=${id}`);
    return response.data;
  },

  // Cập nhật trạng thái sản phẩm chi tiết
  capNhatTrangThaiSanPhamChiTiet: async (id: string, trangThai: string): Promise<AxiosResponse> => {
    const response = await api.put<SanPhamChiTiet>(`/SanPhamChiTiet/update-trang-thai-san-pham-chi-tiet/${id}`, { trang_thai: trangThai });
    return response;
  },

  // Cập nhật số lượng sản phẩm chi tiết
  capNhatSoLuongSanPhamChiTiet: async (id: string, soLuong: number): Promise<AxiosResponse> => {
    const response = await api.put<SanPhamChiTiet>(`/SanPhamChiTiet/update-so-luong-san-pham-chi-tiet/${id}`, { so_luong: soLuong });
    return response;
  },

  // Tìm kiếm sản phẩm chi tiết
  timKiemSanPhamChiTiet: async (keyword: string) => {
    const response = await api.get<SanPhamChiTiet[]>(`/SanPhamChiTiet/search-san-pham-chi-tiet?keyword=${keyword}`);
    return response.data;
  },

  // Lọc sản phẩm chi tiết theo các tiêu chí
  locSanPhamChiTiet: async (params: {
    id_san_pham?: string;
    id_kich_co?: string;
    id_mau_sac?: string;
    trang_thai?: string;
  }) => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) queryParams.append(key, value);
    });
    
    const response = await api.get<SanPhamChiTiet[]>(`/SanPhamChiTiet/filter-san-pham-chi-tiet?${queryParams.toString()}`);
    return response.data;
  }
}; 