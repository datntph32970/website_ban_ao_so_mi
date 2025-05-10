import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { GiamGia } from "@/types/giam-gia";
import { Edit, Trash } from "lucide-react";

interface DetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  discount: GiamGia | null;
  fetchDiscounts: () => void;
}

export function DetailDialog({ isOpen, onClose, discount, fetchDiscounts }: DetailDialogProps) {
  if (!discount) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {discount.ten_giam_gia}
                <Badge className={discount.trang_thai === "HoatDong" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
                  {discount.trang_thai === "HoatDong" ? "Hoạt động" : "Ngừng hoạt động"}
                </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1">
                Thông tin chi tiết chương trình giảm giá
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Mã:</span>
              <code className="px-3 py-1.5 bg-slate-100 rounded-md text-sm font-medium">{discount.ma_giam_gia}</code>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900">Thông tin cơ bản</h3>
                </div>
                <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Mô tả</Label>
                    <p className="text-sm text-slate-600 leading-relaxed">{discount.mo_ta}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500">Kiểu giảm giá</Label>
                      <Badge className={discount.kieu_giam_gia === "PhanTram" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                        {discount.kieu_giam_gia === "PhanTram" ? "Phần trăm" : "Tiền mặt"}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500">Giá trị giảm</Label>
                      <p className="text-base font-medium text-slate-900">
                        {discount.kieu_giam_gia === "PhanTram" 
                          ? `${discount.gia_tri_giam}%` 
                          : `${discount.gia_tri_giam.toLocaleString('vi-VN')}đ`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Thời gian áp dụng</h3>
              <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Thời gian bắt đầu</Label>
                    <p className="text-sm font-medium text-slate-900">
                      {format(new Date(discount.thoi_gian_bat_dau), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Thời gian kết thúc</Label>
                    <p className="text-sm font-medium text-slate-900">
                      {format(new Date(discount.thoi_gian_ket_thuc), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Thông tin sử dụng</h3>
              <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-500">Số lượng</Label>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{discount.so_luong_da_su_dung || 0}</span>
                      <span className="text-slate-500">/ {discount.so_luong_toi_da}</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${((discount.so_luong_da_su_dung || 0) / discount.so_luong_toi_da) * 100}%`,
                          backgroundColor: (discount.so_luong_da_su_dung || 0) >= discount.so_luong_toi_da 
                            ? '#ef4444' 
                            : (discount.so_luong_da_su_dung || 0) >= discount.so_luong_toi_da * 0.8 
                              ? '#f59e0b' 
                              : '#22c55e'
                        }}
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      {Math.round(((discount.so_luong_da_su_dung || 0) / discount.so_luong_toi_da) * 100)}% đã sử dụng
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Tổng giá trị giảm</Label>
                    <p className="text-base font-medium text-slate-900">
                      {(discount?.tong_gia_tri_giam || 0).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Doanh thu tăng thêm</Label>
                    <p className="text-base font-medium text-slate-900">
                      {(discount?.doanh_thu_tang_them || 0).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Tổng số sản phẩm đã bán</Label>
                    <p className="text-base font-medium text-slate-900">
                      {discount?.tong_so_san_pham_da_ban || 0}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Thông tin khác</h3>
              <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Người tạo</Label>
                    <p className="text-sm font-medium text-slate-900">
                      {discount?.nguoiTao?.ten_nhan_vien || "Không có thông tin"}
                    </p>
                    <p className="text-xs text-slate-500">
                      {discount?.nguoiTao?.ma_nhan_vien && (
                        <span className="text-slate-400">Mã: {discount.nguoiTao.ma_nhan_vien}</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-500">
                      {discount?.ngay_tao ? format(new Date(discount.ngay_tao), "dd/MM/yyyy HH:mm", { locale: vi }) : "Không có thông tin"}
                    </p>
                  </div>
                  {discount?.nguoiSua && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500">Người cập nhật cuối</Label>
                      <p className="text-sm font-medium text-slate-900">
                        {discount.nguoiSua.ten_nhan_vien}
                      </p>
                      <p className="text-xs text-slate-500">
                        {discount.nguoiSua.ma_nhan_vien && (
                          <span className="text-slate-400">Mã: {discount.nguoiSua.ma_nhan_vien}</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {discount.ngay_cap_nhat ? format(new Date(discount.ngay_cap_nhat), "dd/MM/yyyy HH:mm", { locale: vi }) : "Không có thông tin"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 