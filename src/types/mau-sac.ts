export interface MauSac {
    id_mau_sac: number;
    ma_mau_sac: string;
    ten_mau_sac: string;
    mo_ta: string;
    trang_thai: string;
    id_nguoi_tao: string;
    ngay_tao: string;
    id_nguoi_sua?: string;
    ngay_sua?: string;
}

export interface CreateMauSacDTO {
    ten_mau_sac: string;
    mo_ta: string;
    trang_thai: string;
}

export interface UpdateMauSacDTO extends Partial<CreateMauSacDTO> {
    trang_thai: string;
}

