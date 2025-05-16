import { api } from "@/lib/api";
import { GioHangResponse, CartActionResponse, CheckQuantityResponse } from "@/types/gio-hang";

class GioHangService {
  private readonly baseUrl = '/GioHang';

  async getMyCart(): Promise<GioHangResponse> {
    const response = await api.get(`${this.baseUrl}/my-cart`);
    return response.data;
  }

  async addToCart(idSanPhamChiTiet: string, soLuong: number): Promise<GioHangResponse> {
    const response = await api.post(`${this.baseUrl}/add-item`, null, {
      params: { idSanPhamChiTiet, soLuong }
    });
    return response.data;
  }

  async updateQuantity(idGioHangChiTiet: string, soLuong: number): Promise<GioHangResponse> {
    const response = await api.put(`${this.baseUrl}/update-quantity`, null, {
      params: { idGioHangChiTiet, soLuong }
    });
    return response.data;
  }

  async removeFromCart(idGioHangChiTiet: string): Promise<GioHangResponse> {
    const response = await api.delete(`${this.baseUrl}/remove-item/${idGioHangChiTiet}`);
    return response.data;
  }

  async clearCart(): Promise<GioHangResponse> {
    const response = await api.delete(`${this.baseUrl}/clear`);
    return response.data;
  }

  async checkProductQuantity(idSanPhamChiTiet: string): Promise<CheckQuantityResponse> {
    const response = await api.get(`${this.baseUrl}/check-quantity/${idSanPhamChiTiet}`);
    return response.data;
  }

  async getSelectedItems(): Promise<GioHangResponse> {
    const response = await api.get(`${this.baseUrl}/selected-items`);
    return response.data;
  }

  async updateCartItemStatus(idGioHangChiTiet: string, trangThai: boolean): Promise<GioHangResponse> {
    const response = await api.put(`${this.baseUrl}/update-status/${idGioHangChiTiet}`, null, {
      params: { trangThai }
    });
    return response.data;
  }
}

export const gioHangService = new GioHangService();
