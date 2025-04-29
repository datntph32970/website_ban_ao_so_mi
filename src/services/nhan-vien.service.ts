import { NhanVien, CreateNhanVienDTO, UpdateNhanVienDTO, UpdateRoleAndStatus, ChucVu, DeleteNhanVien } from "@/types/nhan-vien";
import { api } from "@/lib/api";
import { AxiosResponse } from "axios";

export const nhanVienService = {
  // Lấy danh sách nhân viên
  getDanhSachNhanVien: async () => {
    const response = await api.get<NhanVien[]>("/NhanVien/get-all-nhan-vien");
    return response.data;
  },

  // Lấy chi tiết nhân viên theo ID
  getChiTietNhanVien: async (id: string) => {
    const response = await api.get<NhanVien>(`/NhanVien/get-nhan-vien-by-id/${id}`);
    return response.data;
  },

  // Thêm nhân viên mới
  themNhanVien: async (nhanVien: CreateNhanVienDTO) => {
    const response = await api.post<NhanVien>("/NhanVien/create-nhan-vien", nhanVien);
    return response.data;
  },

  // Cập nhật thông tin nhân viên
  capNhatNhanVien: async (id: string, nhanVien: UpdateNhanVienDTO) => {
    const response = await api.put<NhanVien>(`/NhanVien/update-nhan-vien/${id}`, nhanVien);
    return response.data;
  },

  // Xóa nhân viên
  xoaNhanVien: async (deleteData: DeleteNhanVien) => {
    const response = await api.delete<NhanVien>(`/NhanVien/delete-nhan-vien`, { data: deleteData });
    return response;
  },

  // Cập nhật chức vụ và trạng thái nhân viên
  capNhatChucVuVaTrangThai: async (updateData: UpdateRoleAndStatus): Promise<AxiosResponse> => {
    const response = await api.put<NhanVien>(`/NhanVien/update-quyen-hoac-trang-thai-nhan-vien`, updateData);
    return response;
  },

  // Cập nhật chức vụ
  capNhatChucVu: async (id: string, chucVu: ChucVu): Promise<AxiosResponse> => {
    const response = await api.put<NhanVien>(`/NhanVien/update-quyen-hoac-trang-thai-nhan-vien`, {
      id_nhan_vien: id,
      chuc_vu: chucVu
    });
    return response;
  },

  // Cập nhật trạng thái
  capNhatTrangThai: async (id: string, trangThai: string): Promise<AxiosResponse> => {
    const response = await api.put<NhanVien>(`/NhanVien/update-quyen-hoac-trang-thai-nhan-vien`, {
      id_nhan_vien: id,
      trang_thai: trangThai
    });
    return response;
  },

  // Tìm kiếm nhân viên
  timKiemNhanVien: async (keyword: string) => {
    const response = await api.get<NhanVien[]>(`/NhanVien/search-nhan-vien?keyword=${keyword}`);
    return response.data;
  }
}; 