import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { giamGiaService } from "@/services/giam-gia.service";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface UpdateDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  discount: GiamGia | null;
  onSuccess?: () => void;
}

export function UpdateDiscountDialog({
  open,
  onOpenChange,
  discount,
  onSuccess,
}: UpdateDiscountDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    ten_giam_gia: "",
    mo_ta: "",
    kieu_giam_gia: "" as "PhanTram" | "SoTien",
    gia_tri_giam: "",
    so_luong_toi_da: "",
    thoi_gian_bat_dau: "",
    thoi_gian_ket_thuc: "",
    trang_thai: TrangThaiGiamGia.HoatDong,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (discount) {
      setFormData({
        ten_giam_gia: discount.ten_giam_gia,
        mo_ta: discount.mo_ta || "",
        kieu_giam_gia: discount.kieu_giam_gia,
        gia_tri_giam: discount.gia_tri_giam.toString(),
        so_luong_toi_da: discount.so_luong_toi_da.toString(),
        thoi_gian_bat_dau: new Date(discount.thoi_gian_bat_dau).toISOString().slice(0, 16),
        thoi_gian_ket_thuc: new Date(discount.thoi_gian_ket_thuc).toISOString().slice(0, 16),
        trang_thai: discount.trang_thai,
      });
      setErrors({});
    }
  }, [discount]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.ten_giam_gia.trim()) {
      newErrors.ten_giam_gia = "Vui lòng nhập tên giảm giá";
    }

    if (!formData.kieu_giam_gia) {
      newErrors.kieu_giam_gia = "Vui lòng chọn loại giảm giá";
    }

    if (!formData.gia_tri_giam) {
      newErrors.gia_tri_giam = "Vui lòng nhập giá trị giảm";
    } else {
      const giaTriGiam = Number(formData.gia_tri_giam);
      if (isNaN(giaTriGiam) || giaTriGiam <= 0) {
        newErrors.gia_tri_giam = "Giá trị giảm phải lớn hơn 0";
      }
      if (formData.kieu_giam_gia === "PhanTram" && giaTriGiam > 100) {
        newErrors.gia_tri_giam = "Giá trị giảm phần trăm không được vượt quá 100%";
      }
    }

    if (!formData.so_luong_toi_da) {
      newErrors.so_luong_toi_da = "Vui lòng nhập số lượng tối đa";
    } else {
      const soLuong = Number(formData.so_luong_toi_da);
      if (isNaN(soLuong) || soLuong <= 0) {
        newErrors.so_luong_toi_da = "Số lượng tối đa phải lớn hơn 0";
      }
    }

    if (!formData.thoi_gian_bat_dau) {
      newErrors.thoi_gian_bat_dau = "Vui lòng chọn thời gian bắt đầu";
    }

    if (!formData.thoi_gian_ket_thuc) {
      newErrors.thoi_gian_ket_thuc = "Vui lòng chọn thời gian kết thúc";
    } else if (formData.thoi_gian_bat_dau && new Date(formData.thoi_gian_ket_thuc) <= new Date(formData.thoi_gian_bat_dau)) {
      newErrors.thoi_gian_ket_thuc = "Thời gian kết thúc phải sau thời gian bắt đầu";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!discount) return;

    if (!validateForm()) {
      toast.error("Vui lòng kiểm tra lại thông tin");
      return;
    }

    try {
      const data = {
        ...formData,
        ma_giam_gia: discount.ma_giam_gia,
        gia_tri_giam: Number(formData.gia_tri_giam),
        so_luong_toi_da: Number(formData.so_luong_toi_da),
      };

      await giamGiaService.update(discount.id_giam_gia, data);
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success("Cập nhật giảm giá thành công!");
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Lỗi khi cập nhật giảm giá:", error);
      toast.error(error.response?.data || "Có lỗi xảy ra khi cập nhật giảm giá!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Cập nhật giảm giá</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ten_giam_gia">Tên giảm giá</Label>
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
              <Label htmlFor="kieu_giam_gia">Loại giảm giá</Label>
              <Select
                value={formData.kieu_giam_gia}
                onValueChange={(value) => setFormData({ ...formData, kieu_giam_gia: value as "PhanTram" | "SoTien" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại giảm giá" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PhanTram">Phần trăm</SelectItem>
                  <SelectItem value="SoTien">Số tiền cố định</SelectItem>
                </SelectContent>
              </Select>
              {errors.kieu_giam_gia && (
                <p className="text-sm text-red-500">{errors.kieu_giam_gia}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mo_ta">Mô tả</Label>
            <Textarea
              id="mo_ta"
              value={formData.mo_ta}
              onChange={(e) => setFormData({ ...formData, mo_ta: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gia_tri_giam">Giá trị giảm</Label>
              <Input
                id="gia_tri_giam"
                type="number"
                value={formData.gia_tri_giam}
                onChange={(e) => setFormData({ ...formData, gia_tri_giam: e.target.value })}
                required
              />
              {errors.gia_tri_giam && (
                <p className="text-sm text-red-500">{errors.gia_tri_giam}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="so_luong_toi_da">Số lượng tối đa</Label>
              <Input
                id="so_luong_toi_da"
                type="number"
                value={formData.so_luong_toi_da}
                onChange={(e) => setFormData({ ...formData, so_luong_toi_da: e.target.value })}
                required
              />
              {errors.so_luong_toi_da && (
                <p className="text-sm text-red-500">{errors.so_luong_toi_da}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trang_thai">Trạng thái</Label>
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="thoi_gian_bat_dau">Thời gian bắt đầu</Label>
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
              <Label htmlFor="thoi_gian_ket_thuc">Thời gian kết thúc</Label>
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

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit">Cập nhật</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 