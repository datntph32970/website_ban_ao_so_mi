import { HinhAnh } from "./hinh-anh";
import { SanPhamChiTiet } from "./san-pham-chi-tiet";

export interface HinhAnhSanPhamChiTiet {
    id_hinh_anh: string;
    hinh_anh_urls: string;
    mac_dinh: boolean;
    id_hinh_anh_san_pham_chi_tiet: string;
    id_san_pham_chi_tiet: string;
    hinhAnhs?: HinhAnh;
    sanPhamChiTiets?: SanPhamChiTiet;
}
