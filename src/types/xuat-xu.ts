export interface XuatXu {
    id_xuat_xu: number;
    ma_xuat_xu: string;
    ten_xuat_xu: string;
    mo_ta: string;
    trang_thai: string;
    id_nguoi_tao: string;
    ngay_tao: string;
    id_nguoi_sua?: string;
    ngay_sua?: string;
}

export interface CreateXuatXuDTO {
    ma_xuat_xu: string;
    ten_xuat_xu: string;
    mo_ta: string;
    trang_thai: string;
}

export interface UpdateXuatXuDTO extends Partial<CreateXuatXuDTO> {
    trang_thai: string;
}


