import { SanPham } from '@/types/san-pham';
import { SanPhamChiTiet } from '@/types/san-pham-chi-tiet';
import { HinhAnhSanPhamChiTiet } from '@/types/hinh-anh-san-pham-chi-tiet';
import { HinhAnh } from '@/types/hinh-anh';

export function mapSanPhamList(data: SanPham[], apiBase: string) {
  return data.map((sp: SanPham) => {
    const chiTiets: SanPhamChiTiet[] = sp.sanPhamChiTiets || [];
    const prices = chiTiets.map((ct: SanPhamChiTiet) => {
      let price = Number(ct.gia_ban);
      let originPrice = Number(ct.gia_ban);
      let discountInfo = null;
      if (ct.giamGia) {
        discountInfo = ct.giamGia;
        if (ct.giamGia.kieu_giam_gia === 'PhanTram') {
          price = price * (1 - ct.giamGia.gia_tri_giam / 100);
        } else {
          price = Math.max(0, price - ct.giamGia.gia_tri_giam);
        }
      }
      return { price, originPrice, discountInfo };
    });
    let min = prices[0], max = prices[0];
    for (const p of prices) {
      if (p.price < min.price) min = p;
      if (p.price > max.price) max = p;
    }
    let defaultImageUrl = sp.url_anh_mac_dinh || '';
    if (defaultImageUrl && defaultImageUrl.startsWith('/')) {
      defaultImageUrl = apiBase + defaultImageUrl;
    }
    return {
      id: sp.id_san_pham,
      code: sp.ma_san_pham,
      name: sp.ten_san_pham,
      brand: sp.thuongHieu?.ten_thuong_hieu || '',
      category: sp.danhMuc?.ten_danh_muc || '',
      price: min?.price ?? 0,
      minPrice: min?.price ?? 0,
      maxPrice: max?.price ?? 0,
      minOriginPrice: min?.originPrice ?? 0,
      maxOriginPrice: max?.originPrice ?? 0,
      discountInfo: min?.discountInfo ?? null,
      stock: chiTiets.reduce((sum: number, ct: SanPhamChiTiet) => sum + Number(ct.so_luong || 0), 0),
      sold: 0,
      imageUrl: defaultImageUrl,
      created_at: sp.ngay_tao,
      updated_at: sp.ngay_tao,
    };
  });
} 