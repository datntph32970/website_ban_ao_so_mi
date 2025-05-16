import { api } from "@/lib/api";

interface CuaHang {
  id_cua_hang: string;
  ten_cua_hang: string;
  website: string;
  email: string;
  sdt: string;
  dia_chi: string;
  mo_ta: string;
  hinh_anh_url: string | null;
}

// Thêm interface cho response upload logo
interface UploadLogoResponse {
  message: string;
  url: string | null;
}

export const cuaHangService = {
  // Lấy thông tin cửa hàng
  getThongTinCuaHang: async () => {
    const response = await api.get<CuaHang>("/CuaHang/get-thong-tin-cua-hang");
    return response.data;
  },

  // Cập nhật thông tin cửa hàng
  capNhatThongTinCuaHang: async (data: Omit<CuaHang, 'hinh_anh_url'>) => {
    const response = await api.put<CuaHang>("/CuaHang/update-thong-tin-cua-hang", data);
    return response.data;
  },

  // Upload logo cửa hàng
  uploadLogo: async (file: File): Promise<UploadLogoResponse> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          // Kiểm tra kích thước file (max 5MB)
          if (file.size > 5 * 1024 * 1024) {
            throw new Error('Kích thước file không được vượt quá 5MB');
          }

          // Kiểm tra loại file
          if (!file.type.startsWith('image/')) {
            throw new Error('File phải là hình ảnh');
          }

          const base64Image = reader.result as string;
          
          const response = await api.post<UploadLogoResponse>(
            "/CuaHang/upload-logo",
            JSON.stringify(base64Image),
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );

          resolve(response.data);
        } catch (error: any) {
          reject(error.response?.data || error.message);
        }
      };
      reader.onerror = () => {
        reject('Không thể đọc file');
      };
    });
  }
};
