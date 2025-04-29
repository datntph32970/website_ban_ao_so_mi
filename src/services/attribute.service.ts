import { api } from '@/lib/api';
import { ChatLieu, CreateChatLieuDTO, UpdateChatLieuDTO } from '@/types/chat-lieu';
import { ThuongHieu, CreateThuongHieuDTO, UpdateThuongHieuDTO } from '@/types/thuong-hieu';
import { KieuDang, CreateKieuDangDTO, UpdateKieuDangDTO } from '@/types/kieu-dang';
import { XuatXu, CreateXuatXuDTO, UpdateXuatXuDTO } from '@/types/xuat-xu';
import { MauSac, CreateMauSacDTO, UpdateMauSacDTO } from '@/types/mau-sac';
import { KichCo, CreateKichCoDTO, UpdateKichCoDTO } from '@/types/kich-co';
import { HinhAnh, CreateHinhAnhDTO, UpdateHinhAnhDTO } from '@/types/hinh-anh';
import { DanhMuc, ThemDanhMucAdminDTO, SuaDanhMucAdminDTO } from '@/types/danh-muc';

// Định nghĩa interface cho các thuộc tính
export interface Attribute {
  id: number;
  name: string;
  code: string;
  description: string;
  status: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

// Định nghĩa interface cho việc tạo thuộc tính mới
export interface CreateAttributeDTO {
  name: string;
  code: string;
  description: string;
  status: string;
}

// Định nghĩa interface cho việc cập nhật thuộc tính
export interface UpdateAttributeDTO {
  name?: string;
  code?: string;
  description?: string;
  status?: string;
}

type AttributeType = 'ThuongHieu' | 'KieuDang' | 'ChatLieu' | 'XuatXu' | 'MauSac' | 'KichCo' | 'HinhAnh' | 'DanhMuc';
type AttributeMap = {
  'ThuongHieu': { type: ThuongHieu; create: CreateThuongHieuDTO; update: UpdateThuongHieuDTO };
  'KieuDang': { type: KieuDang; create: CreateKieuDangDTO; update: UpdateKieuDangDTO };
  'ChatLieu': { type: ChatLieu; create: CreateChatLieuDTO; update: UpdateChatLieuDTO };
  'XuatXu': { type: XuatXu; create: CreateXuatXuDTO; update: UpdateXuatXuDTO };
  'MauSac': { type: MauSac; create: CreateMauSacDTO; update: UpdateMauSacDTO };
  'KichCo': { type: KichCo; create: CreateKichCoDTO; update: UpdateKichCoDTO };
  'HinhAnh': { type: HinhAnh; create: CreateHinhAnhDTO; update: UpdateHinhAnhDTO };
  'DanhMuc': { type: DanhMuc; create: ThemDanhMucAdminDTO; update: SuaDanhMucAdminDTO };
};

export const attributeService = {
  // Lấy danh sách thuộc tính theo loại
  getAttributes: async <T extends AttributeType>(type: T) => {
    const response = await api.get<AttributeMap[T]['type'][]>(`/${type}`);
    return response.data;
  },

  // Lấy chi tiết thuộc tính
  getAttribute: async (type: string, id: number) => {
    const response = await api.get<Attribute>(`/${type}/${id}`); 
    return response.data;
  },

  // Tạo thuộc tính mới
  createAttribute: async <T extends AttributeType>(type: T, attribute: AttributeMap[T]['create']) => {
    const response = await api.post<AttributeMap[T]['type']>(`/${type}`, attribute);
    return response.data;
  },

  // Cập nhật thuộc tính
  updateAttribute: async <T extends AttributeType>(type: T, id: number, attribute: AttributeMap[T]['update']) => {
    const response = await api.put<AttributeMap[T]['type']>(`/${type}?id=${id}`, attribute);
    return response.data;
  },

  // Xóa thuộc tính
  deleteAttribute: async (type: AttributeType, id: number) => {
    await api.delete(`/${type}?id=${id}`);
  }
}; 