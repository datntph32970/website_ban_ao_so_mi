import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { khuyenMaiService } from "@/services/khuyen-mai.service";
import { KieuKhuyenMai, ThemKhuyenMaiDTO } from "@/types/khuyen-mai";

interface CreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const defaultFormData = {
  ten_khuyen_mai: "",
  mo_ta: "",
  kieu_khuyen_mai: KieuKhuyenMai.PhanTram,
  gia_tri_giam: 0,
  gia_tri_don_hang_toi_thieu: 0,
  gia_tri_giam_toi_da: 0,
  so_luong_toi_da: 0,
  thoi_gian_bat_dau: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  thoi_gian_ket_thuc: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  ma_khuyen_mai: "",
};

export function CreateDialog({ isOpen, onClose, onSuccess }: CreateDialogProps) {
  const [formData, setFormData] = useState<ThemKhuyenMaiDTO>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(defaultFormData);
      setErrors({});
      setIsConfirmDialogOpen(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.ten_khuyen_mai.trim()) {
      newErrors.ten_khuyen_mai = "Vui lòng nhập tên khuyến mãi";
      isValid = false;
    }

    if (formData.ma_khuyen_mai && formData.ma_khuyen_mai.length > 20) {
      newErrors.ma_khuyen_mai = "Mã khuyến mãi không được vượt quá 20 ký tự";
      isValid = false;
    }

    if (!formData.mo_ta.trim()) {
      newErrors.mo_ta = "Vui lòng nhập mô tả";
      isValid = false;
    }

    if (formData.gia_tri_giam <= 0) {
      newErrors.gia_tri_giam = "Giá trị giảm phải lớn hơn 0";
      isValid = false;
    }

    if (formData.kieu_khuyen_mai === KieuKhuyenMai.PhanTram && formData.gia_tri_giam > 100) {
      newErrors.gia_tri_giam = "Giá trị giảm phần trăm không được vượt quá 100%";
      isValid = false;
    }

    if (formData.gia_tri_giam_toi_da < formData.gia_tri_giam) {
      newErrors.gia_tri_giam_toi_da = "Giá trị giảm tối đa phải lớn hơn giá trị giảm";
      isValid = false;
    }

    if (formData.gia_tri_don_hang_toi_thieu < 0) {
      newErrors.gia_tri_don_hang_toi_thieu = "Giá trị đơn hàng tối thiểu không được âm";
      isValid = false;
    }

    if (formData.so_luong_toi_da <= 0) {
      newErrors.so_luong_toi_da = "Số lượng tối đa phải lớn hơn 0";
      isValid = false;
    }

    const startDate = new Date(formData.thoi_gian_bat_dau);
    const endDate = new Date(formData.thoi_gian_ket_thuc);
    const now = new Date();

    if (startDate <= now) {
      newErrors.thoi_gian_bat_dau = "Thời gian bắt đầu phải sau thời điểm hiện tại";
      isValid = false;
    }

    if (endDate <= startDate) {
      newErrors.thoi_gian_ket_thuc = "Thời gian kết thúc phải sau thời gian bắt đầu";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (validateForm()) {
      setIsConfirmDialogOpen(true);
    }
  };

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await khuyenMaiService.themKhuyenMai(formData);
      toast.success("Thêm khuyến mãi thành công");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data || "Không thể thêm khuyến mãi");
    } finally {
      setIsSubmitting(false);
      setIsConfirmDialogOpen(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              Thêm khuyến mãi mới
            </DialogTitle>
            <DialogDescription className="text-center text-slate-500">
              Nhập thông tin khuyến mãi mới
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Thông tin cơ bản</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ma_khuyen_mai" className="text-sm font-medium text-slate-700">
                        Mã khuyến mãi
                      </Label>
                      <Input
                        id="ma_khuyen_mai"
                        value={formData.ma_khuyen_mai}
                        onChange={(e) => setFormData({ ...formData, ma_khuyen_mai: e.target.value.toUpperCase() })}
                        placeholder="Nhập mã khuyến mãi (không bắt buộc)"
                        className={`w-full ${errors.ma_khuyen_mai ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      />
                      {errors.ma_khuyen_mai && (
                        <p className="text-sm text-red-500">{errors.ma_khuyen_mai}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ten_khuyen_mai" className="text-sm font-medium text-slate-700">
                        Tên khuyến mãi <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="ten_khuyen_mai"
                        value={formData.ten_khuyen_mai}
                        onChange={(e) => setFormData({ ...formData, ten_khuyen_mai: e.target.value })}
                        placeholder="Nhập tên khuyến mãi"
                        className={`w-full ${errors.ten_khuyen_mai ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      />
                      {errors.ten_khuyen_mai && (
                        <p className="text-sm text-red-500">{errors.ten_khuyen_mai}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mo_ta" className="text-sm font-medium text-slate-700">
                        Mô tả <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="mo_ta"
                        value={formData.mo_ta}
                        onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
                        placeholder="Nhập mô tả khuyến mãi"
                        className={`min-h-[100px] resize-none ${errors.mo_ta ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      />
                      {errors.mo_ta && (
                        <p className="text-sm text-red-500">{errors.mo_ta}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Thời gian áp dụng</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="thoi_gian_bat_dau" className="text-sm font-medium text-slate-700">
                        Thời gian bắt đầu <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="thoi_gian_bat_dau"
                        type="datetime-local"
                        value={formData.thoi_gian_bat_dau}
                        onChange={(e) => setFormData({ ...formData, thoi_gian_bat_dau: e.target.value })}
                        min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                        className={`w-full ${errors.thoi_gian_bat_dau ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      />
                      {errors.thoi_gian_bat_dau && (
                        <p className="text-sm text-red-500">{errors.thoi_gian_bat_dau}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="thoi_gian_ket_thuc" className="text-sm font-medium text-slate-700">
                        Thời gian kết thúc <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="thoi_gian_ket_thuc"
                        type="datetime-local"
                        value={formData.thoi_gian_ket_thuc}
                        onChange={(e) => setFormData({ ...formData, thoi_gian_ket_thuc: e.target.value })}
                        min={formData.thoi_gian_bat_dau}
                        className={`w-full ${errors.thoi_gian_ket_thuc ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      />
                      {errors.thoi_gian_ket_thuc && (
                        <p className="text-sm text-red-500">{errors.thoi_gian_ket_thuc}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-slate-900">Thông tin giảm giá</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="kieu_khuyen_mai" className="text-sm font-medium text-slate-700">
                        Kiểu giảm giá <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.kieu_khuyen_mai}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, kieu_khuyen_mai: value as KieuKhuyenMai }))}
                      >
                        <SelectTrigger className={`w-full ${errors.kieu_khuyen_mai ? "border-red-500 focus-visible:ring-red-500" : ""}`}>
                          <SelectValue placeholder="Chọn kiểu giảm giá" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={KieuKhuyenMai.PhanTram}>Phần trăm</SelectItem>
                          <SelectItem value={KieuKhuyenMai.TienMat}>Tiền mặt</SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.kieu_khuyen_mai && (
                        <p className="text-sm text-red-500">{errors.kieu_khuyen_mai}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gia_tri_giam" className="text-sm font-medium text-slate-700">
                        Giá trị giảm <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="gia_tri_giam"
                          type="number"
                          value={formData.gia_tri_giam}
                          onChange={(e) => {
                            const value = Number(e.target.value);
                            setFormData(prev => ({
                              ...prev,
                              gia_tri_giam: value,
                              gia_tri_giam_toi_da: prev.kieu_khuyen_mai === KieuKhuyenMai.TienMat ? value : prev.gia_tri_giam_toi_da
                            }));
                          }}
                          className={`pr-12 ${errors.gia_tri_giam ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          min={0}
                          max={formData.kieu_khuyen_mai === KieuKhuyenMai.PhanTram ? 100 : undefined}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                          {formData.kieu_khuyen_mai === KieuKhuyenMai.PhanTram ? "%" : "VNĐ"}
                        </div>
                      </div>
                      {errors.gia_tri_giam && (
                        <p className="text-sm text-red-500">{errors.gia_tri_giam}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gia_tri_don_hang_toi_thieu" className="text-sm font-medium text-slate-700">
                        Giá trị đơn hàng tối thiểu <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="gia_tri_don_hang_toi_thieu"
                          type="number"
                          value={formData.gia_tri_don_hang_toi_thieu}
                          onChange={(e) => setFormData({ ...formData, gia_tri_don_hang_toi_thieu: Number(e.target.value) })}
                          className={`pr-12 ${errors.gia_tri_don_hang_toi_thieu ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          min={0}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                          VNĐ
                        </div>
                      </div>
                      {errors.gia_tri_don_hang_toi_thieu && (
                        <p className="text-sm text-red-500">{errors.gia_tri_don_hang_toi_thieu}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gia_tri_giam_toi_da" className="text-sm font-medium text-slate-700">
                        Giá trị giảm tối đa <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="gia_tri_giam_toi_da"
                          type="number"
                          value={formData.gia_tri_giam_toi_da}
                          onChange={(e) => {
                            if (formData.kieu_khuyen_mai === KieuKhuyenMai.TienMat) {
                              return;
                            }
                            setFormData({ ...formData, gia_tri_giam_toi_da: Number(e.target.value) });
                          }}
                          className={`pr-12 ${formData.kieu_khuyen_mai === KieuKhuyenMai.TienMat ? "bg-slate-100 cursor-not-allowed" : ""} ${errors.gia_tri_giam_toi_da ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                          min={0}
                          disabled={formData.kieu_khuyen_mai === KieuKhuyenMai.TienMat}
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                          VNĐ
                        </div>
                      </div>
                      {errors.gia_tri_giam_toi_da && (
                        <p className="text-sm text-red-500">{errors.gia_tri_giam_toi_da}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="so_luong_toi_da" className="text-sm font-medium text-slate-700">
                        Số lượng tối đa <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="so_luong_toi_da"
                        type="number"
                        value={formData.so_luong_toi_da}
                        onChange={(e) => setFormData({ ...formData, so_luong_toi_da: Number(e.target.value) })}
                        min={1}
                        placeholder="Nhập số lượng tối đa"
                        className={errors.so_luong_toi_da ? "border-red-500 focus-visible:ring-red-500" : ""}
                      />
                      {errors.so_luong_toi_da && (
                        <p className="text-sm text-red-500">{errors.so_luong_toi_da}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Thêm mới"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận thêm khuyến mãi</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn thêm khuyến mãi mới này không? Hãy kiểm tra kỹ thông tin trước khi xác nhận.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xác nhận"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 