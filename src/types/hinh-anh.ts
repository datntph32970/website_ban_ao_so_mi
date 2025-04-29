import { HinhAnhSanPhamChiTiet } from "./hinh-anh-san-pham-chi-tiet";

export interface HinhAnh {
    id_hinh_anh: number;
    ma_hinh_anh: string;
    url: string;
    id_nguoi_tao: string;
    ngay_tao: string;
    id_nguoi_sua?: string;
    ngay_sua?: string;
    HinhAnhSanPhamChiTiets?: HinhAnhSanPhamChiTiet[];
}

export interface CreateHinhAnhDTO {
    url: string;
    id_san_pham_chi_tiet: string;
}

export interface UpdateHinhAnhDTO {
    url?: string;
}
