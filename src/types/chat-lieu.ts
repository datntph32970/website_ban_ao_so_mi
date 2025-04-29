export interface ChatLieu {
  id_chat_lieu: number;
  ma_chat_lieu: string;
  ten_chat_lieu: string;
  mo_ta: string;
  trang_thai: string;
  id_nguoi_tao: string;
  ngay_tao: string;
  id_nguoi_sua?: string;
  ngay_sua?: string;
}

export interface CreateChatLieuDTO {
  ten_chat_lieu: string;
  mo_ta: string;
}

export interface UpdateChatLieuDTO extends Partial<CreateChatLieuDTO> {
  trang_thai: string;
} 