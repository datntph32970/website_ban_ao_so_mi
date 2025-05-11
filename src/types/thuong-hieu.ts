export interface ThuongHieu {
    id_thuong_hieu: string;
    ma_thuong_hieu: string;
    ten_thuong_hieu: string;
    mo_ta: string;
    trang_thai: string;
    id_nguoi_tao: string;
    ngay_tao: string;
    id_nguoi_sua?: string;
    ngay_sua?: string;
}

export interface CreateThuongHieuDTO {
    ma_thuong_hieu: string;
    ten_thuong_hieu: string;
    mo_ta: string;
    trang_thai: string;
}

export interface UpdateThuongHieuDTO extends Partial<CreateThuongHieuDTO> {
    trang_thai: string;
}

