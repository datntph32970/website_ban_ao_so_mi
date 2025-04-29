import { SanPham } from '@/types/san-pham';
import { SanPhamChiTiet } from '@/types/san-pham-chi-tiet';
import { HinhAnhSanPhamChiTiet } from '@/types/hinh-anh-san-pham-chi-tiet';
import { HinhAnh } from '@/types/hinh-anh';

export function mapSanPhamList(data: SanPham[], apiBase: string) {
  return data.map((sp: SanPham) => {
    const chiTiets: SanPhamChiTiet[] = sp.sanPhamChiTiets || [];
    const prices = chiTiets.map((ct: SanPhamChiTiet) => Number(ct.gia_ban));
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const stock = chiTiets.reduce((sum: number, ct: SanPhamChiTiet) => sum + Number(ct.so_luong || 0), 0);
    let imageUrl = '';
    for (const ct of chiTiets) {
      if (ct.hinhAnhSanPhamChiTiets && ct.hinhAnhSanPhamChiTiets.length > 0) {
        // Ưu tiên ảnh mặc định
        const macDinh = ct.hinhAnhSanPhamChiTiets.find((img: HinhAnhSanPhamChiTiet) => img.mac_dinh && img.hinh_anh_urls);
        if (macDinh) {
          imageUrl = macDinh.hinh_anh_urls;
          break;
        }
        // Nếu không có ảnh mặc định, lấy ảnh đầu tiên
        if (!imageUrl && ct.hinhAnhSanPhamChiTiets[0]?.hinh_anh_urls) {
          imageUrl = ct.hinhAnhSanPhamChiTiets[0].hinh_anh_urls;
        }
      }
    }
    if (imageUrl && imageUrl.startsWith('/')) {
      imageUrl = apiBase + imageUrl;
    }
    return {
      id: sp.id_san_pham,
      code: sp.ma_san_pham,
      name: sp.ten_san_pham,
      brand: sp.thuongHieu?.ten_thuong_hieu || '',
      category: sp.danhMuc?.ten_danh_muc || '',
      price: Number(minPrice),
      minPrice: Number(minPrice),
      maxPrice: Number(maxPrice),
      stock: Number(stock),
      sold: 0,
      imageUrl,
      created_at: sp.ngay_tao,
      updated_at: sp.ngay_tao,
      promotionId: undefined
    };
  });
} 