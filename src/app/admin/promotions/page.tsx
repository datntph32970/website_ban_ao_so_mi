"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Edit, Plus, Search, Trash, Copy, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { khuyenMaiService } from "@/services/khuyen-mai.service";
import { KhuyenMai, KieuKhuyenMai, TrangThaiKhuyenMai, ThemKhuyenMaiDTO, SuaKhuyenMaiDTO } from "@/types/khuyen-mai";
import { Package } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateDialog } from "@/components/promotions/CreateDialog";
import { useDebounce } from "@/hooks/useDebounce";

interface FormData {
  id_khuyen_mai?: string;
  ten_khuyen_mai: string;
  mo_ta: string;
  kieu_khuyen_mai: KieuKhuyenMai;
  gia_tri_giam: number;
  gia_tri_don_hang_toi_thieu: number;
  gia_tri_giam_toi_da: number;
  so_luong_toi_da: number;
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
  trang_thai?: TrangThaiKhuyenMai;
  ma_khuyen_mai: string;
}

const defaultFormData: FormData = {
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

const AddEditDialog = ({ 
  isOpen, 
  onClose, 
  data, 
  onSubmit, 
  isEdit = false,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  data: any; 
  onSubmit: (data: any) => void; 
  isEdit?: boolean;
}) => {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && data) {
        setFormData({
          id_khuyen_mai: data.id_khuyen_mai,
          ten_khuyen_mai: data.ten_khuyen_mai,
          mo_ta: data.mo_ta,
          kieu_khuyen_mai: data.kieu_khuyen_mai || '',
          gia_tri_giam: data.gia_tri_giam,
          gia_tri_don_hang_toi_thieu: data.gia_tri_don_hang_toi_thieu,
          gia_tri_giam_toi_da: data.gia_tri_giam_toi_da,
          so_luong_toi_da: data.so_luong_toi_da,
          thoi_gian_bat_dau: format(new Date(data.thoi_gian_bat_dau), "yyyy-MM-dd'T'HH:mm"),
          thoi_gian_ket_thuc: format(new Date(data.thoi_gian_ket_thuc), "yyyy-MM-dd'T'HH:mm"),
          trang_thai: data.trang_thai || '',
          ma_khuyen_mai: data.ma_khuyen_mai || '',
        });
      } else {
        setFormData(defaultFormData);
      }
      setErrors({});
      setIsSubmitting(false);
    }
  }, [isOpen, data, isEdit]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.ten_khuyen_mai.trim()) {
      newErrors.ten_khuyen_mai = "Vui lòng nhập tên khuyến mãi";
      isValid = false;
    }

    if (!formData.ma_khuyen_mai.trim()) {
      newErrors.ma_khuyen_mai = "Vui lòng nhập mã khuyến mãi";
      isValid = false;
    }

    if (formData.ma_khuyen_mai.length > 20) {
      newErrors.ma_khuyen_mai = "Mã khuyến mãi không được vượt quá 20 ký tự";
      isValid = false;
    }

    if (!formData.mo_ta.trim()) {
      newErrors.mo_ta = "Vui lòng nhập mô tả khuyến mãi";
      isValid = false;
    }

    if (formData.gia_tri_giam <= 0) {
      newErrors.gia_tri_giam = "Giá trị giảm phải lớn hơn 0";
      isValid = false;
    }

    if (formData.kieu_khuyen_mai === 'PhanTram' && formData.gia_tri_giam > 100) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (validateForm()) {
      setIsConfirmDialogOpen(true);
    }
  };

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(formData);
    setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            {isEdit ? "Cập nhật khuyến mãi" : "Thêm khuyến mãi mới"}
          </DialogTitle>
          <DialogDescription className="text-center text-slate-500">
            {isEdit ? "Cập nhật thông tin khuyến mãi" : "Nhập thông tin khuyến mãi mới"}
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
                      Mã khuyến mãi <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ma_khuyen_mai"
                      value={formData.ma_khuyen_mai}
                      onChange={(e) => setFormData({ ...formData, ma_khuyen_mai: e.target.value.toUpperCase() })}
                      placeholder="Nhập mã khuyến mãi"
                      className={`w-full ${errors.ma_khuyen_mai ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                      required
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
                isEdit ? "Cập nhật" : "Thêm mới"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận {isEdit ? "cập nhật" : "thêm mới"}</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn {isEdit ? "cập nhật" : "thêm mới"} khuyến mãi này không?
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
};

const DeleteDialog = ({
  isOpen,
  onClose,
  onConfirm,
  itemName
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa {itemName} này không? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const getPromotionStatus = (promotion: KhuyenMai) => {
  const now = new Date();
  const startDate = new Date(promotion.thoi_gian_bat_dau);
  const endDate = new Date(promotion.thoi_gian_ket_thuc);

  const activityStatus = promotion.trang_thai === TrangThaiKhuyenMai.HoatDong
    ? { label: "Hoạt động", color: "bg-green-100 text-green-800" }
    : { label: "Ngừng hoạt động", color: "bg-slate-100 text-slate-800" };

  let timeStatus;
  if (now < startDate) {
    const timeLeft = startDate.getTime() - now.getTime();
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    timeStatus = { 
      label: `Bắt đầu sau ${daysLeft} ngày ${hoursLeft} giờ ${minutesLeft} phút`, 
      color: "bg-blue-100 text-blue-800" 
    };
  } else if (now > endDate) {
    timeStatus = { label: "Đã kết thúc", color: "bg-red-100 text-red-800" };
  } else {
    const timeLeft = endDate.getTime() - now.getTime();
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    timeStatus = { 
      label: `Còn ${daysLeft} ngày ${hoursLeft} giờ ${minutesLeft} phút`, 
      color: "bg-yellow-100 text-yellow-800" 
    };
  }

  return {
    activityStatus,
    timeStatus
  };
};

const getStatusBadge = (status: ReturnType<typeof getPromotionStatus>) => {
  return (
    <div className="flex items-center gap-2">
      <Badge className={status.timeStatus.color}>
        {status.timeStatus.label}
      </Badge>
      <Badge className={status.activityStatus.color}>
        {status.activityStatus.label}
      </Badge>
    </div>
  );
};

const DetailDialog = ({
  isOpen,
  onClose,
  promotion,
  fetchPromotions
}: {
  isOpen: boolean;
  onClose: () => void;
  promotion: KhuyenMai | null;
  fetchPromotions?: () => void;
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  if (!promotion) return null;

  const status = getPromotionStatus(promotion);

  const handleStatusUpdate = async () => {
    try {
      setIsUpdating(true);
      const newStatus = promotion.trang_thai === TrangThaiKhuyenMai.HoatDong 
        ? TrangThaiKhuyenMai.KhongHoatDong 
        : TrangThaiKhuyenMai.HoatDong;
      
      await khuyenMaiService.capNhatTrangThai(promotion.id_khuyen_mai, {
        trang_thai: newStatus
      });
      
      toast.success("Cập nhật trạng thái thành công");
      onClose();
      fetchPromotions?.();
    } catch (error: any) {
      toast.error(error.response?.data || "Không thể cập nhật trạng thái");
    } finally {
      setIsUpdating(false);
      setIsConfirmDialogOpen(false);
    }
  };

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Chi tiết khuyến mãi
          </DialogTitle>
          <DialogDescription className="text-center text-slate-500">
            Thông tin chi tiết về khuyến mãi
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-8 py-6">
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Thông tin cơ bản</h3>
                  <div className="flex items-center gap-2">
                <Badge className={promotion.trang_thai === TrangThaiKhuyenMai.HoatDong ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
                  {promotion.trang_thai === TrangThaiKhuyenMai.HoatDong ? "Hoạt động" : "Ngừng hoạt động"}
                </Badge>
                    <Button
                      variant={promotion.trang_thai === TrangThaiKhuyenMai.HoatDong ? "destructive" : "default"}
                      size="sm"
                      className={cn(
                        "transition-colors",
                        promotion.trang_thai === TrangThaiKhuyenMai.HoatDong
                          ? "bg-red-600 hover:bg-red-700"
                          : "bg-green-600 hover:bg-green-700"
                      )}
                      onClick={() => setIsConfirmDialogOpen(true)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        promotion.trang_thai === TrangThaiKhuyenMai.HoatDong
                          ? "Ngừng hoạt động"
                          : "Kích hoạt"
                      )}
                    </Button>
                  </div>
              </div>
              <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-500">Mã khuyến mãi</Label>
                  <div className="flex items-center gap-2">
                    <code className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm font-medium">
                      {promotion.ma_khuyen_mai}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-slate-200"
                      onClick={() => {
                        navigator.clipboard.writeText(promotion.ma_khuyen_mai);
                        toast.success("Đã sao chép mã khuyến mãi");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-500">Tên khuyến mãi</Label>
                  <p className="text-base font-medium text-slate-900">{promotion.ten_khuyen_mai}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-500">Mô tả</Label>
                  <p className="text-sm text-slate-600 leading-relaxed">{promotion.mo_ta}</p>
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
                      {format(new Date(promotion.thoi_gian_bat_dau), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Thời gian kết thúc</Label>
                    <p className="text-sm font-medium text-slate-900">
                      {format(new Date(promotion.thoi_gian_ket_thuc), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </p>
                  </div>
                </div>
                <div className="pt-2">
                  <Badge className={status.timeStatus.color}>
                    {status.timeStatus.label}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Thông tin giảm giá</h3>
              <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Kiểu giảm giá</Label>
                      <Badge className={(promotion.kieu_khuyen_mai as string) === 'PhanTram' ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                        {(promotion.kieu_khuyen_mai as string) === 'PhanTram' ? "Phần trăm" : "Tiền mặt"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Giá trị giảm</Label>
                    <p className="text-base font-medium text-slate-900">
                        {(promotion.kieu_khuyen_mai as string) === 'PhanTram' 
                        ? `${promotion.gia_tri_giam}%` 
                        : `${(promotion.gia_tri_giam || 0).toLocaleString('vi-VN')}đ`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Giá trị đơn hàng tối thiểu</Label>
                    <p className="text-base font-medium text-slate-900">
                      {(promotion.gia_tri_don_hang_toi_thieu || 0).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Giá trị giảm tối đa</Label>
                    <p className="text-base font-medium text-slate-900">
                      {(promotion.gia_tri_giam_toi_da || 0).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Số lượng tối đa</Label>
                    <p className="text-base font-medium text-slate-900">{promotion.so_luong_toi_da}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Số lượng đã sử dụng</Label>
                    <div className="space-y-1">
                      <p className="text-base font-medium text-slate-900">{promotion.so_luong_da_su_dung}</p>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(promotion.so_luong_da_su_dung / promotion.so_luong_toi_da) * 100}%`,
                            backgroundColor: promotion.so_luong_da_su_dung >= promotion.so_luong_toi_da 
                              ? '#ef4444' 
                              : promotion.so_luong_da_su_dung >= promotion.so_luong_toi_da * 0.8 
                                ? '#f59e0b' 
                                : '#22c55e'
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        {Math.round((promotion.so_luong_da_su_dung / promotion.so_luong_toi_da) * 100)}% đã sử dụng
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Thông tin khác</h3>
              <div className="space-y-4 bg-slate-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Ngày tạo</Label>
                    <p className="text-sm font-medium text-slate-900">
                      {format(new Date(promotion.ngay_tao), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Người tạo</Label>
                    <p className="text-sm font-medium text-slate-900">
                      {promotion.nguoiTao?.ten_nhan_vien || "N/A"}
                    </p>
                  </div>
                </div>
                {promotion.ngay_sua && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500">Ngày sửa</Label>
                      <p className="text-sm font-medium text-slate-900">
                        {format(new Date(promotion.ngay_sua), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500">Người sửa</Label>
                      <p className="text-sm font-medium text-slate-900">
                        {promotion.nguoiSua?.ten_nhan_vien || "N/A"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full sm:w-auto">
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận thay đổi trạng thái</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn {promotion.trang_thai === TrangThaiKhuyenMai.HoatDong ? "ngừng hoạt động" : "kích hoạt"} khuyến mãi này không?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              variant={promotion.trang_thai === TrangThaiKhuyenMai.HoatDong ? "destructive" : "default"}
              className={promotion.trang_thai === TrangThaiKhuyenMai.HoatDong ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
              onClick={handleStatusUpdate}
            >
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default function PromotionsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [filterConfig, setFilterConfig] = useState({
    status: 'all',
    discountType: 'all',
    startDate: '',
    endDate: ''
  });

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPromotion, setCurrentPromotion] = useState<KhuyenMai | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<KhuyenMai | null>(null);
  const [selectedPromotions, setSelectedPromotions] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);

  // Query để lấy danh sách khuyến mãi
  const { 
    data: promotions = [], 
    isLoading,
    isFetching 
  } = useQuery({
    queryKey: ['promotions', filterConfig, debouncedSearchTerm],
    queryFn: () => {
      const params: any = {};
      
      if (filterConfig.status !== 'all') {
        params.trang_thai = filterConfig.status;
      }
      
      if (filterConfig.discountType !== 'all') {
        params.kieu_khuyen_mai = filterConfig.discountType;
      }
      
      if (debouncedSearchTerm) {
        params.tim_kiem = debouncedSearchTerm;
      }
      
      if (filterConfig.startDate) {
        params.thoi_gian_bat_dau = filterConfig.startDate;
      }
      
      if (filterConfig.endDate) {
        params.thoi_gian_ket_thuc = filterConfig.endDate;
      }

      return khuyenMaiService.getAll(params);
    },
    staleTime: 30 * 1000, // 30 giây
  });

  // Mutation để thêm khuyến mãi mới
  const addMutation = useMutation({
    mutationFn: (data: FormData) => khuyenMaiService.themKhuyenMai({
        ten_khuyen_mai: data.ten_khuyen_mai,
        mo_ta: data.mo_ta,
        kieu_khuyen_mai: data.kieu_khuyen_mai as KieuKhuyenMai,
        gia_tri_giam: data.gia_tri_giam,
        ma_khuyen_mai: data.ma_khuyen_mai,
        gia_tri_don_hang_toi_thieu: data.gia_tri_don_hang_toi_thieu,
        gia_tri_giam_toi_da: data.gia_tri_giam_toi_da,
        so_luong_toi_da: data.so_luong_toi_da,
        thoi_gian_bat_dau: data.thoi_gian_bat_dau,
        thoi_gian_ket_thuc: data.thoi_gian_ket_thuc
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success("Thêm khuyến mãi thành công");
      setIsAddDialogOpen(false);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Không thể thêm khuyến mãi";
      toast.error(errorMessage);
    }
  });

  // Mutation để cập nhật khuyến mãi
  const updateMutation = useMutation({
    mutationFn: (data: FormData) => khuyenMaiService.suaKhuyenMai(data.id_khuyen_mai!, {
        ten_khuyen_mai: data.ten_khuyen_mai,
        mo_ta: data.mo_ta,
        ma_khuyen_mai: data.ma_khuyen_mai,
        kieu_khuyen_mai: data.kieu_khuyen_mai as KieuKhuyenMai,
        gia_tri_giam: data.gia_tri_giam,
        gia_tri_don_hang_toi_thieu: data.gia_tri_don_hang_toi_thieu,
        gia_tri_giam_toi_da: data.gia_tri_giam_toi_da,
        so_luong_toi_da: data.so_luong_toi_da,
        thoi_gian_bat_dau: data.thoi_gian_bat_dau,
        thoi_gian_ket_thuc: data.thoi_gian_ket_thuc
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success("Cập nhật khuyến mãi thành công");
      setIsEditDialogOpen(false);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật khuyến mãi";
      toast.error(errorMessage);
    }
  });

  // Mutation để xóa khuyến mãi
  const deleteMutation = useMutation({
    mutationFn: (id: string) => khuyenMaiService.xoaKhuyenMai(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success("Xóa khuyến mãi thành công");
      setIsDeleteDialogOpen(false);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Không thể xóa khuyến mãi";
      toast.error(errorMessage);
    }
  });

  // Mutation để xóa nhiều khuyến mãi
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map(id => khuyenMaiService.xoaKhuyenMai(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Xóa khuyến mãi thành công!');
      setSelectedPromotions([]);
      setIsBulkDeleteDialogOpen(false);
    },
    onError: (error: unknown) => {
      console.error('Lỗi khi xóa khuyến mãi:', error);
      toast.error('Có lỗi xảy ra khi xóa khuyến mãi!');
    }
  });

  const handleAdd = async (data: FormData) => {
    addMutation.mutate(data);
  };

  const handleEdit = async (data: FormData) => {
    updateMutation.mutate(data);
  };

  const handleDelete = async (id: string) => {
    deleteMutation.mutate(id);
  };

  const handleBulkDelete = async () => {
    bulkDeleteMutation.mutate(selectedPromotions);
  };

  const handleRowClick = async (promotion: KhuyenMai) => {
    try {
      const detail = await khuyenMaiService.getById(promotion.id_khuyen_mai);
      setSelectedPromotion(detail);
      setIsDetailDialogOpen(true);
    } catch (error) {
      toast.error("Không thể tải thông tin chi tiết khuyến mãi");
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quản lý khuyến mãi</h1>
            <p className="text-slate-500">Quản lý các chương trình khuyến mãi cho sản phẩm</p>
          </div>
          <div className="flex gap-2">
            {selectedPromotions.length > 0 && (
              <Button 
                variant="destructive" 
                className="gap-2"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
              >
                <Trash className="h-4 w-4" />
                <span>Xóa ({selectedPromotions.length})</span>
              </Button>
            )}
            <Button 
              className="gap-2"
              onClick={() => setIsAddDialogOpen(true)}
            >
            <Plus className="h-4 w-4" />
            <span>Thêm khuyến mãi</span>
          </Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              className="pl-10 pr-10"
              placeholder="Tìm kiếm theo tên hoặc mã khuyến mãi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 hover:bg-slate-100"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4 text-slate-500" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Select value={filterConfig.status} onValueChange={(value) => setFilterConfig(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value={TrangThaiKhuyenMai.HoatDong.toString()}>Đang hoạt động</SelectItem>
                <SelectItem value={TrangThaiKhuyenMai.KhongHoatDong.toString()}>Ngừng hoạt động</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterConfig.discountType} onValueChange={(value) => setFilterConfig(prev => ({ ...prev, discountType: value }))}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Loại giảm giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value={KieuKhuyenMai.PhanTram.toString()}>Phần trăm</SelectItem>
                <SelectItem value={KieuKhuyenMai.TienMat.toString()}>Tiền mặt</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                type="date"
                value={filterConfig.startDate}
                onChange={(e) => setFilterConfig(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-[180px]"
              />
              <Input
                type="date"
                value={filterConfig.endDate}
                onChange={(e) => setFilterConfig(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-[180px]"
              />
            </div>
          </div>
        </div>
      </div>

      <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              {isFetching && (
                <div className="fixed top-0 right-0 p-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedPromotions.length === promotions.length && promotions.length > 0}
                        onCheckedChange={() => {
                          if (selectedPromotions.length === promotions.length) {
                            setSelectedPromotions([]);
                          } else {
                            setSelectedPromotions(promotions.map(p => String(p.id_khuyen_mai)));
                          }
                        }}
                        aria-label="Chọn tất cả"
                      />
                    </TableHead>
                    <TableHead className="w-[50px]">STT</TableHead>
                    <TableHead className="w-[300px] font-semibold text-slate-700">Thông tin khuyến mãi</TableHead>
                    <TableHead className="font-semibold text-slate-700">Mã</TableHead>
                    <TableHead className="font-semibold text-slate-700">Thời gian</TableHead>
                    <TableHead className="font-semibold text-slate-700">Giá trị</TableHead>
                    <TableHead className="font-semibold text-slate-700">Số lượng</TableHead>
                    <TableHead className="font-semibold text-slate-700">Trạng thái</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promotions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-10">
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                          <Package className="h-10 w-10" />
                          <p>Không tìm thấy khuyến mãi nào</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    promotions.map((promotion, idx) => (
                      <TableRow 
                        key={promotion.id_khuyen_mai} 
                        className="group cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => handleRowClick(promotion)}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedPromotions.includes(String(promotion.id_khuyen_mai))}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedPromotions(prev => [...prev, String(promotion.id_khuyen_mai)]);
                              } else {
                                setSelectedPromotions(prev => prev.filter(id => id !== String(promotion.id_khuyen_mai)));
                              }
                            }}
                            aria-label={`Chọn khuyến mãi ${promotion.ten_khuyen_mai}`}
                          />
                        </TableCell>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium group-hover:text-blue-600 transition-colors">{promotion.ten_khuyen_mai}</p>
                            <p className="text-sm text-slate-500 line-clamp-2">{promotion.mo_ta}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <code className="px-2 py-1 bg-slate-100 rounded text-sm font-medium">{promotion.ma_khuyen_mai}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-slate-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(promotion.ma_khuyen_mai);
                                toast.success("Đã sao chép mã khuyến mãi");
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs">
                            <div>
                              <span className="font-medium">Từ:</span>{" "}
                              {format(new Date(promotion.thoi_gian_bat_dau), "dd/MM/yyyy HH:mm", { locale: vi })}
                            </div>
                            <div>
                              <span className="font-medium">Đến:</span>{" "}
                              {format(new Date(promotion.thoi_gian_ket_thuc), "dd/MM/yyyy HH:mm", { locale: vi })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(promotion.kieu_khuyen_mai as string) === 'PhanTram' ? (
                              <div className="flex items-center gap-2">
                                <Badge className="bg-blue-100 text-blue-800">
                                  {promotion.gia_tri_giam}%
                                </Badge>
                                <span className="text-sm text-slate-500">
                                  (Tối đa: {(promotion.gia_tri_giam_toi_da || 0).toLocaleString('vi-VN')}đ)
                                </span>
                              </div>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">
                                {(promotion.gia_tri_giam || 0).toLocaleString('vi-VN')}đ
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{promotion.so_luong_da_su_dung || 0}</span>
                              <span className="text-slate-500">/ {promotion.so_luong_toi_da}</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2">
                              <div 
                                className="h-2 rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${((promotion.so_luong_da_su_dung || 0) / promotion.so_luong_toi_da) * 100}%`,
                                  backgroundColor: (promotion.so_luong_da_su_dung || 0) >= promotion.so_luong_toi_da 
                                    ? '#ef4444' 
                                    : (promotion.so_luong_da_su_dung || 0) >= promotion.so_luong_toi_da * 0.8 
                                      ? '#f59e0b' 
                                      : '#22c55e'
                                }}
                              />
                            </div>
                            <p className="text-xs text-slate-500">
                              {Math.round(((promotion.so_luong_da_su_dung || 0) / promotion.so_luong_toi_da) * 100)}% đã sử dụng
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(getPromotionStatus(promotion))}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPromotion(promotion);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Sửa
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setCurrentPromotion(promotion);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['promotions'] });
        }}
      />

      <AddEditDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        data={currentPromotion}
        onSubmit={handleEdit}
        isEdit
      />

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => handleDelete(currentPromotion?.id_khuyen_mai || "")}
        itemName="khuyến mãi"
      />

      <DetailDialog
        isOpen={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        promotion={selectedPromotion}
        fetchPromotions={() => {
          queryClient.invalidateQueries({ queryKey: ['promotions'] });
        }}
      />

      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa khuyến mãi</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa {selectedPromotions.length} khuyến mãi đã chọn? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>Hủy</Button>
            <Button variant="destructive" onClick={handleBulkDelete}>Xóa khuyến mãi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 