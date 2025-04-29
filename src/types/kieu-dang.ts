export interface KieuDang {
  id_kieu_dang: number;
  ma_kieu_dang: string;
  ten_kieu_dang: string;
  mo_ta: string;
  trang_thai: string;
  id_nguoi_tao: string;
  ngay_tao: string;
  id_nguoi_sua?: string;
  ngay_sua?: string;
}

export interface CreateKieuDangDTO {
  ma_kieu_dang: string;
  ten_kieu_dang: string;
  mo_ta: string;
  trang_thai: string;
}

export interface UpdateKieuDangDTO extends Partial<CreateKieuDangDTO> {
    trang_thai: string;
}
