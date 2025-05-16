import { AxiosResponse } from "axios";
import { api } from '@/lib/api';
import { KhachHangAdminDTO, ThemKhachHangMuaTaiQuayAdminDTO, SuaKhachHangAdminDTO, CapNhatTrangThaiKhachHangDTO, KhachHang, DiaChi, DiaChiDTO, CreateDiaChiDTO, UpdateDiaChiDTO } from "@/types/khach-hang";

export interface ThamSoPhanTrangKhachHangDTO {
  trang_hien_tai: number;
  so_phan_tu_tren_trang: number;
  tong_so_trang: number;
  tong_so_phan_tu: number;
  tim_kiem?: string;
}

export interface PhanTrangKhachHangDTO {
  trang_hien_tai: number;
  so_phan_tu_tren_trang: number;
  tong_so_trang: number;
  tong_so_phan_tu: number;
  danh_sach: KhachHangAdminDTO[];
}

export interface UpdateKhachHangDTO {
  ten_khach_hang?: string;
  email?: string;
  so_dien_thoai?: string;
  ngay_sinh?: string;
  gioi_tinh?: string;
}

export interface ProfileResponse {
  message: string;
  profile: KhachHang;
}

export interface AddressResponse {
  message: string;
  addresses: DiaChiDTO[];
}

export interface AddressDetailResponse {
  message: string;
  address: DiaChiDTO;
}

export const khachHangService = {
  // Lấy thông tin cá nhân
  getMyProfile: async (): Promise<ProfileResponse> => {
    const response = await api.get<ProfileResponse>("/khach-hang/profile");
    return response.data;
  },

  // Cập nhật thông tin cá nhân
  capNhatProfile: async (data: UpdateKhachHangDTO): Promise<ProfileResponse> => {
    const response = await api.put<ProfileResponse>("/khach-hang/profile", data);
    return response.data;
  },

  // Lấy danh sách khách hàng
  getDanhSachKhachHang: async (tham_so_phan_trang: ThamSoPhanTrangKhachHangDTO): Promise<PhanTrangKhachHangDTO> => {
    const response = await api.get<PhanTrangKhachHangDTO>("/KhachHang", { params: tham_so_phan_trang });
    return response.data;
  },

  // Tìm kiếm khách hàng
  timKiemKhachHang: async (tuKhoa?: string): Promise<KhachHangAdminDTO[]> => {
    const params = {
      tuKhoa: tuKhoa || undefined,
    };
    const response = await api.get<KhachHangAdminDTO[]>("/KhachHang/tim-kiem", { params });
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

  // Lấy danh sách địa chỉ của khách hàng
  getMyAddresses: async (): Promise<AddressResponse> => {
    const response = await api.get<AddressResponse>("/khach-hang/dia-chi");
    return response.data;
  },

  // Lấy địa chỉ mặc định
  getDefaultAddress: async (): Promise<AddressDetailResponse> => {
    const response = await api.get<AddressDetailResponse>("/khach-hang/dia-chi/mac-dinh");
    return response.data;
  },

  // Thêm địa chỉ mới
  createAddress: async (data: CreateDiaChiDTO): Promise<AddressResponse> => {
    const response = await api.post<AddressResponse>("/khach-hang/dia-chi", data);
    return response.data;
  },

  // Cập nhật địa chỉ
  updateAddress: async (id: string, data: UpdateDiaChiDTO): Promise<AddressResponse> => {
    const response = await api.put<AddressResponse>(`/khach-hang/dia-chi/${id}`, data);
    return response.data;
  },

  // Xóa địa chỉ
  deleteAddress: async (id: string): Promise<AddressResponse> => {
    const response = await api.delete<AddressResponse>(`/khach-hang/dia-chi/${id}`);
    return response.data;
  },

  // Đặt địa chỉ mặc định
  setDefaultAddress: async (id: string): Promise<AddressResponse> => {
    const response = await api.put<AddressResponse>(`/khach-hang/dia-chi/${id}/mac-dinh`);
    return response.data;
  },
}; 