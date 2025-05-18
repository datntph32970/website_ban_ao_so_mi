import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GiamGia, TrangThaiGiamGia } from "@/types/giam-gia";
import { toast } from "react-hot-toast";
import { giamGiaService } from "@/services/giam-gia.service";
import { useQueryClient } from "@tanstack/react-query";

interface CreateDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormErrors {
  ten_giam_gia?: string;
  mo_ta?: string;
  gia_tri_giam?: string;
  so_luong_toi_da?: string;
  thoi_gian_bat_dau?: string;
  thoi_gian_ket_thuc?: string;
  ma_giam_gia?: string;
}

export function CreateDiscountDialog({ open, onOpenChange }: CreateDiscountDialogProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState({
    ten_giam_gia: "",
    mo_ta: "",
    kieu_giam_gia: "PhanTram" as "PhanTram" | "SoTien",
    gia_tri_giam: 0,
    so_luong_toi_da: 100,
    thoi_gian_bat_dau: "",
    thoi_gian_ket_thuc: "",
    trang_thai: TrangThaiGiamGia.HoatDong,
    ma_giam_gia: "",
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate mã giảm giá
    if (formData.ma_giam_gia && formData.ma_giam_gia.length > 20) {
      newErrors.ma_giam_gia = "Mã giảm giá không được vượt quá 20 ký tự";
      toast.error("Mã giảm giá không được vượt quá 20 ký tự");
    }

    // Validate tên giảm giá
    if (!formData.ten_giam_gia.trim()) {
      newErrors.ten_giam_gia = "Tên giảm giá không được để trống";
      toast.error("Tên giảm giá không được để trống");
    } else if (formData.ten_giam_gia.length > 100) {
      newErrors.ten_giam_gia = "Tên giảm giá không được vượt quá 100 ký tự";
      toast.error("Tên giảm giá không được vượt quá 100 ký tự");
    }

    // Validate mô tả
    if (!formData.mo_ta.trim()) {
      newErrors.mo_ta = "Mô tả không được để trống";
      toast.error("Mô tả không được để trống");
    }
    if (formData.mo_ta.length > 500) {
      newErrors.mo_ta = "Mô tả không được vượt quá 500 ký tự";
      toast.error("Mô tả không được vượt quá 500 ký tự");
    }

    // Validate giá trị giảm
    if (formData.gia_tri_giam <= 0) {
      newErrors.gia_tri_giam = "Giá trị giảm phải lớn hơn 0";
      toast.error("Giá trị giảm phải lớn hơn 0");
    } else if (formData.kieu_giam_gia === "PhanTram" && formData.gia_tri_giam > 100) {
      newErrors.gia_tri_giam = "Giá trị giảm phần trăm không được vượt quá 100%";
      toast.error("Giá trị giảm phần trăm không được vượt quá 100%");
    }

    // Validate số lượng tối đa
    if (formData.so_luong_toi_da <= 0) {
      newErrors.so_luong_toi_da = "Số lượng tối đa phải lớn hơn 0";
      toast.error("Số lượng tối đa phải lớn hơn 0");
    }

    // Validate thời gian
    const now = new Date();
    const startDate = formData.thoi_gian_bat_dau ? new Date(formData.thoi_gian_bat_dau) : null;
    const endDate = formData.thoi_gian_ket_thuc ? new Date(formData.thoi_gian_ket_thuc) : null;

    if (!startDate) {
      newErrors.thoi_gian_bat_dau = "Vui lòng chọn thời gian bắt đầu";
      toast.error("Vui lòng chọn thời gian bắt đầu");
    } else if (startDate < now) {
      newErrors.thoi_gian_bat_dau = "Thời gian bắt đầu phải lớn hơn thời gian hiện tại";
      toast.error("Thời gian bắt đầu phải lớn hơn thời gian hiện tại");
    }

    if (!endDate) {
      newErrors.thoi_gian_ket_thuc = "Vui lòng chọn thời gian kết thúc";
      toast.error("Vui lòng chọn thời gian kết thúc");
    } else if (startDate && endDate <= startDate) {
      newErrors.thoi_gian_ket_thuc = "Thời gian kết thúc phải lớn hơn thời gian bắt đầu";
      toast.error("Thời gian kết thúc phải lớn hơn thời gian bắt đầu");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      await giamGiaService.create(formData);
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success("Thêm khuyến mại thành công!");
      onOpenChange(false);
      // Reset form
      setFormData({
        ten_giam_gia: "",
        mo_ta: "",
        kieu_giam_gia: "PhanTram" as "PhanTram" | "SoTien",
        gia_tri_giam: 0,
        so_luong_toi_da: 100,
        thoi_gian_bat_dau: "",
        thoi_gian_ket_thuc: "",
        trang_thai: TrangThaiGiamGia.HoatDong,
        ma_giam_gia: "",
      });
      setErrors({});
    } catch (error: any) {
      console.error("Lỗi khi thêm khuyến mại:", error);
      toast.error(error.response.data || "Có lỗi xảy ra khi thêm khuyến mại!")
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Thêm khuyến mại mới</DialogTitle>
          <DialogDescription>
            Thêm chương trình khuyến mại mới cho sản phẩm
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ma_giam_gia">Mã khuyến mại</Label>
              <Input
                id="ma_giam_gia"
                value={formData.ma_giam_gia}
                onChange={(e) => setFormData({ ...formData, ma_giam_gia: e.target.value.toUpperCase() })}
                placeholder="Nhập mã khuyến mại (không bắt buộc)"
              />
              {errors.ma_giam_gia && (
                <p className="text-sm text-red-500">{errors.ma_giam_gia}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="ten_giam_gia">Tên khuyến mại <span className="text-red-500">*</span></Label>
              <Input
                id="ten_giam_gia"
                value={formData.ten_giam_gia}
                onChange={(e) => setFormData({ ...formData, ten_giam_gia: e.target.value })}
                required
              />
              {errors.ten_giam_gia && (
                <p className="text-sm text-red-500">{errors.ten_giam_gia}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="kieu_giam_gia">Loại khuyến mại <span className="text-red-500">*</span></Label>
              <Select
                value={formData.kieu_giam_gia}
                onValueChange={(value) => setFormData({ ...formData, kieu_giam_gia: value as "PhanTram" | "SoTien" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại khuyến mại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PhanTram">Phần trăm</SelectItem>
                  <SelectItem value="SoTien">Số tiền cố định</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mo_ta">Mô tả <span className="text-red-500">*</span></Label>
            <Textarea
              id="mo_ta"
              value={formData.mo_ta}
              onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
              rows={3}
            />
            {errors.mo_ta && (
              <p className="text-sm text-red-500">{errors.mo_ta}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gia_tri_giam">Giá trị khuyến mại <span className="text-red-500">*</span></Label>
              <Input
                id="gia_tri_giam"
                type="number"
                min={0}
                value={formData.gia_tri_giam}
                onChange={(e) => setFormData({ ...formData, gia_tri_giam: Number(e.target.value) })}
                required
              />
              {errors.gia_tri_giam && (
                <p className="text-sm text-red-500">{errors.gia_tri_giam}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="so_luong_toi_da">Số lượng tối đa <span className="text-red-500">*</span></Label>
              <Input
                id="so_luong_toi_da"
                type="number"
                min={1}
                value={formData.so_luong_toi_da}
                onChange={(e) => setFormData({ ...formData, so_luong_toi_da: Number(e.target.value) })}
                required
              />
              {errors.so_luong_toi_da && (
                <p className="text-sm text-red-500">{errors.so_luong_toi_da}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thoi_gian_bat_dau">Thời gian bắt đầu <span className="text-red-500">*</span></Label>
              <Input
                id="thoi_gian_bat_dau"
                type="datetime-local"
                value={formData.thoi_gian_bat_dau}
                onChange={(e) => setFormData({ ...formData, thoi_gian_bat_dau: e.target.value })}
                required
              />
              {errors.thoi_gian_bat_dau && (
                <p className="text-sm text-red-500">{errors.thoi_gian_bat_dau}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="thoi_gian_ket_thuc">Thời gian kết thúc <span className="text-red-500">*</span></Label>
              <Input
                id="thoi_gian_ket_thuc"
                type="datetime-local"
                value={formData.thoi_gian_ket_thuc}
                onChange={(e) => setFormData({ ...formData, thoi_gian_ket_thuc: e.target.value })}
                required
              />
              {errors.thoi_gian_ket_thuc && (
                <p className="text-sm text-red-500">{errors.thoi_gian_ket_thuc}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trang_thai">Trạng thái <span className="text-red-500">*</span></Label>
            <Select
              value={formData.trang_thai}
              onValueChange={(value) => setFormData({ ...formData, trang_thai: value as TrangThaiGiamGia })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TrangThaiGiamGia.HoatDong}>Đang hoạt động</SelectItem>
                <SelectItem value={TrangThaiGiamGia.NgungHoatDong}>Ngừng hoạt động</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang thêm..." : "Thêm khuyến mại"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 