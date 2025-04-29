export interface KichCo {
    id_kich_co: number;
    ma_kich_co: string;
    ten_kich_co: string;
    mo_ta: string;
    trang_thai: string;
    id_nguoi_tao: string;
    ngay_tao: string;
    id_nguoi_sua?: string;
    ngay_sua?: string;
}

export interface CreateKichCoDTO {
    ma_kich_co: string;
    ten_kich_co: string;
    mo_ta: string;
    trang_thai: string;
}

export interface UpdateKichCoDTO extends Partial<CreateKichCoDTO> {
    trang_thai: string;
}
