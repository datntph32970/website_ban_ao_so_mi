export interface PhuongThucThanhToanDTO {
    id_phuong_thuc_thanh_toan: string; // "12345678-9012-3456-7890-123456789012"
    ten_phuong_thuc_thanh_toan: string; // "Tiền mặt"
    ma_phuong_thuc_thanh_toan: string; // "PTTIENMAT"
    mo_ta: string; // "Trả tiền mặt trực tiếp"
    trang_thai: boolean; // true
    id_nguoi_tao?: string; // "00000000-0000-0000-0000-000000000001"
    ngay_tao?: Date; // "2025-04-21T00:00:00"
    id_nguoi_sua?: string; // "00000000-0000-0000-0000-000000000001"
    ngay_cap_nhat?: Date; // "2025-05-14T00:33:51.3093723"
}
