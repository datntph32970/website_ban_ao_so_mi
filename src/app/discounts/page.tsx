"use client";

import React, { useState, useEffect, useRef } from "react";
import { format, addDays } from "date-fns";
import { vi } from "date-fns/locale";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
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
  DialogTrigger,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, Edit, Plus, Search, Trash, Copy, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { giamGiaService, SanPhamGiamGiaDTO, PaginatedResponse } from "@/services/giam-gia.service";
import { GiamGia, TrangThaiGiamGia } from "@/types/giam-gia";
import { Package, AlertTriangle, TrendingUp, Clock, DollarSign, Download } from "lucide-react";
import { Checkbox } from '@/components/ui/checkbox';
import { attributeService } from '@/services/attribute.service';
import { DanhMuc } from '@/types/danh-muc';
import { ThuongHieu } from '@/types/thuong-hieu';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DetailDialog } from "@/components/discounts/DetailDialog";
import { getImageUrl } from '@/lib/utils';

// Add new imports for charts
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Update date formatting
const formatDate = (date: Date) => {
  return format(date, 'dd/MM/yyyy', { locale: vi });
};

// Update addDays usage
const getDefaultEndDate = (startDate: Date) => {
  return addDays(startDate, 30);
};

interface FormData {
  id_giam_gia?: string;
  ten_giam_gia: string;
  ma_giam_gia: string;
  mo_ta: string;
  kieu_giam_gia: "PhanTram" | "SoTien";
  gia_tri_giam: number;
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
  so_luong_toi_da: number;
  trang_thai: TrangThaiGiamGia;
}

const defaultFormData: FormData = {
  ten_giam_gia: "",
  ma_giam_gia: "",
  mo_ta: "",
  kieu_giam_gia: "PhanTram",
  gia_tri_giam: 0,
  so_luong_toi_da: 0,
  thoi_gian_bat_dau: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  thoi_gian_ket_thuc: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  trang_thai: TrangThaiGiamGia.HoatDong
};
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

// Add Dialog Components
const AddEditDialog = ({ 
  isOpen, 
  onClose, 
  data, 
  onSubmit, 
  isEdit = false,
  activeTab
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  data: any; 
  onSubmit: (data: any) => void; 
  isEdit?: boolean;
  activeTab: 'promotions' | 'vouchers';
}) => {
  const [formData, setFormData] = useState<FormData>(defaultFormData);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const [changeHistory, setChangeHistory] = useState<{field: string; oldValue: any; newValue: any}[]>([]);

  // Hàm tự động sinh mã giảm giá
  const generateDiscountCode = () => {
    const prefix = 'GG';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
  };

  // Hàm kiểm tra thay đổi
  const checkChanges = (newData: FormData) => {
    if (!originalData) return false;
    return Object.keys(newData).some(key => {
      const typedKey = key as keyof FormData;
      return newData[typedKey] !== originalData[typedKey];
    });
  };

  // Hàm ghi lại lịch sử thay đổi
  const recordChange = (field: string, oldValue: any, newValue: any) => {
    if (oldValue !== newValue) {
      setChangeHistory(prev => [...prev, { field, oldValue, newValue }]);
    }
  };

  // Reset form khi dialog mở/đóng
  useEffect(() => {
    if (isOpen) {
      if (isEdit && data) {
        const newFormData = {
          id_giam_gia: data.id_giam_gia,
          ten_giam_gia: data.ten_giam_gia,
          mo_ta: data.mo_ta,
          kieu_giam_gia: data.kieu_giam_gia,
          gia_tri_giam: data.gia_tri_giam,
          so_luong_toi_da: data.so_luong_toi_da,
          thoi_gian_bat_dau: format(new Date(data.thoi_gian_bat_dau), "yyyy-MM-dd'T'HH:mm"),
          thoi_gian_ket_thuc: format(new Date(data.thoi_gian_ket_thuc), "yyyy-MM-dd'T'HH:mm"),
          trang_thai: data.trang_thai || TrangThaiGiamGia.HoatDong,
          ma_giam_gia: data.ma_giam_gia || ""
        };
        setFormData(newFormData);
        setOriginalData(newFormData);
      } else {
        const newFormData = {
          ...defaultFormData,
          ma_giam_gia: generateDiscountCode()
        };
        setFormData(newFormData);
        setOriginalData(newFormData);
      }
      setError("");
      setIsSubmitting(false);
      setShowPreview(false);
      setHasUnsavedChanges(false);
      setChangeHistory([]);
    }
  }, [isOpen, data, isEdit]);

  // Kiểm tra thay đổi khi formData thay đổi
  useEffect(() => {
    if (originalData) {
      setHasUnsavedChanges(checkChanges(formData));
    }
  }, [formData, originalData]);

  // Xử lý thay đổi form
  const handleFormChange = (field: keyof FormData, value: any) => {
    const oldValue = formData[field];
    setFormData(prev => ({ ...prev, [field]: value }));
    recordChange(field, oldValue, value);
  };

  // Xử lý đóng dialog
  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('Bạn có thay đổi chưa lưu. Bạn có chắc chắn muốn đóng?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setError("");
    setIsSubmitting(true);

    try {
    // Validate form data
    if (!formData.ten_giam_gia.trim()) {
      setError("Vui lòng nhập tên giảm giá");
      return;
    }

    if (!formData.mo_ta.trim()) {
      setError("Vui lòng nhập mô tả");
      return;
    }

    if (formData.gia_tri_giam <= 0) {
      setError("Giá trị giảm phải lớn hơn 0");
      return;
    }

    if (formData.kieu_giam_gia === "PhanTram" && formData.gia_tri_giam > 100) {
      setError("Giá trị giảm phần trăm không được vượt quá 100%");
      return;
    }

    if (formData.so_luong_toi_da <= 0) {
      setError("Số lượng tối đa phải lớn hơn 0");
      return;
    }

    const startDate = new Date(formData.thoi_gian_bat_dau);
    const endDate = new Date(formData.thoi_gian_ket_thuc);
    const now = new Date();

    // Kiểm tra thời gian bắt đầu phải sau thời điểm hiện tại
    if (startDate <= now) {
      setError("Thời gian bắt đầu phải sau thời điểm hiện tại");
      return;
    }

    // Kiểm tra thời gian kết thúc phải sau thời gian bắt đầu
    if (endDate <= startDate) {
      setError("Thời gian kết thúc phải sau thời gian bắt đầu");
      return;
    }

      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      setError("Có lỗi xảy ra khi thêm giảm giá");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Component Preview
  const PreviewDiscount = () => {
    const startDate = new Date(formData.thoi_gian_bat_dau);
    const endDate = new Date(formData.thoi_gian_ket_thuc);
    const now = new Date();

    return (
      <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{formData.ten_giam_gia}</h3>
          <Badge className={formData.trang_thai === TrangThaiGiamGia.HoatDong ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {formData.trang_thai === TrangThaiGiamGia.HoatDong ? "Hoạt động" : "Ngừng hoạt động"}
          </Badge>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-slate-600">{formData.mo_ta}</p>
          <div className="flex items-center gap-2">
            <code className="px-2 py-1 bg-slate-100 rounded text-sm">{formData.ma_giam_gia}</code>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                navigator.clipboard.writeText(formData.ma_giam_gia);
                toast.success("Đã sao chép mã giảm giá");
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-800">
              {formData.kieu_giam_gia === "PhanTram" ? `${formData.gia_tri_giam}%` : `${formData.gia_tri_giam.toLocaleString('vi-VN')}đ`}
            </Badge>
            <span className="text-sm text-slate-500">
              Số lượng: {formData.so_luong_toi_da}
            </span>
          </div>
          <div className="text-sm text-slate-500">
            <div>Từ: {format(startDate, "dd/MM/yyyy HH:mm", { locale: vi })}</div>
            <div>Đến: {format(endDate, "dd/MM/yyyy HH:mm", { locale: vi })}</div>
          </div>
        </div>
      </div>
    );
  };

  // Component hiển thị lịch sử thay đổi
  const ChangeHistory = () => {
    if (changeHistory.length === 0) return null;

    return (
      <div className="space-y-2 mt-4">
        <h4 className="text-sm font-medium text-slate-500">Lịch sử thay đổi</h4>
        <div className="space-y-2">
          {changeHistory.map((change, index) => (
            <div key={index} className="text-sm bg-slate-50 p-2 rounded">
              <span className="font-medium">{change.field}:</span>
              <div className="flex items-center gap-2">
                <span className="text-red-500 line-through">{change.oldValue}</span>
                <span>→</span>
                <span className="text-green-500">{change.newValue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEdit ? "Sửa giảm giá" : "Thêm giảm giá mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Cập nhật thông tin giảm giá" : "Nhập thông tin giảm giá mới"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 py-4">
            {error && (
              <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-500">Thông tin cơ bản</h3>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ten_giam_gia" className="text-sm font-medium">
                    Tên giảm giá <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="ten_giam_gia"
                    value={formData.ten_giam_gia}
                    onChange={(e) => handleFormChange('ten_giam_gia', e.target.value)}
                    placeholder="Nhập tên giảm giá"
                    className="w-full"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ma_giam_gia" className="text-sm font-medium">
                    Mã giảm giá
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="ma_giam_gia"
                      value={formData.ma_giam_gia}
                      onChange={(e) => handleFormChange('ma_giam_gia', e.target.value)}
                      placeholder="Nhập mã giảm giá"
                      className="w-full"
                    />
                    {!isEdit && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleFormChange('ma_giam_gia', generateDiscountCode())}
                      >
                        Tạo mã
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="mo_ta" className="text-sm font-medium">
                    Mô tả <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="mo_ta"
                    value={formData.mo_ta}
                    onChange={(e) => handleFormChange('mo_ta', e.target.value)}
                    placeholder="Nhập mô tả giảm giá"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>

            {/* Thông tin giảm giá */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-500">Thông tin giảm giá</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="kieu_giam_gia" className="text-sm font-medium">
                    Kiểu giảm giá <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.kieu_giam_gia}
                    onValueChange={(value) => {
                      handleFormChange('kieu_giam_gia', value as "PhanTram" | "SoTien");
                      handleFormChange('gia_tri_giam', 0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn kiểu giảm giá" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PhanTram">Phần trăm</SelectItem>
                      <SelectItem value="SoTien">Tiền mặt</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="gia_tri_giam" className="text-sm font-medium">
                    Giá trị giảm <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="gia_tri_giam"
                      type="number"
                      value={formData.gia_tri_giam}
                      onChange={(e) => handleFormChange('gia_tri_giam', Number(e.target.value))}
                      className="pr-12"
                      min={0}
                      max={formData.kieu_giam_gia === "PhanTram" ? 100 : undefined}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      {formData.kieu_giam_gia === "PhanTram" ? "%" : "VNĐ"}
                    </div>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="so_luong_toi_da" className="text-sm font-medium">
                    Số lượng tối đa <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="so_luong_toi_da"
                    type="number"
                    value={formData.so_luong_toi_da}
                    onChange={(e) => handleFormChange('so_luong_toi_da', Number(e.target.value))}
                    min={1}
                    placeholder="Nhập số lượng tối đa"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="trang_thai" className="text-sm font-medium">
                    Trạng thái <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.trang_thai}
                    onValueChange={(value) => handleFormChange('trang_thai', value as TrangThaiGiamGia)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={TrangThaiGiamGia.HoatDong}>Hoạt động</SelectItem>
                      <SelectItem value={TrangThaiGiamGia.NgungHoatDong}>Ngừng hoạt động</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Thời gian áp dụng */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-slate-500">Thời gian áp dụng</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="thoi_gian_bat_dau" className="text-sm font-medium">
                    Thời gian bắt đầu <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="thoi_gian_bat_dau"
                    type="datetime-local"
                    value={formData.thoi_gian_bat_dau}
                    onChange={(e) => handleFormChange('thoi_gian_bat_dau', e.target.value)}
                    min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="thoi_gian_ket_thuc" className="text-sm font-medium">
                    Thời gian kết thúc <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="thoi_gian_ket_thuc"
                    type="datetime-local"
                    value={formData.thoi_gian_ket_thuc}
                    onChange={(e) => handleFormChange('thoi_gian_ket_thuc', e.target.value)}
                    min={formData.thoi_gian_bat_dau}
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-500">Xem trước</h3>
                <Switch
                  checked={showPreview}
                  onCheckedChange={setShowPreview}
                />
              </div>
              {showPreview && <PreviewDiscount />}
            </div>

            {/* Change History */}
            {isEdit && <ChangeHistory />}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
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
  );
};

const DeleteDialog = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isInUse = false,
  usageCount = 0
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  isInUse?: boolean;
  usageCount?: number;
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Xác nhận xóa</DialogTitle>
          <DialogDescription>
            {isInUse ? (
              <div className="space-y-2">
                <p className="text-red-500 font-medium">
                  Không thể xóa giảm giá này vì đang được sử dụng!
                </p>
                <p>
                  Giảm giá "{itemName}" đang được áp dụng cho {usageCount} sản phẩm.
                  Vui lòng xóa giảm giá khỏi các sản phẩm trước khi xóa.
                </p>
              </div>
            ) : (
              <p>
                Bạn có chắc chắn muốn xóa {itemName} này không? Hành động này không thể hoàn tác.
              </p>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          {!isInUse && (
            <Button variant="destructive" onClick={onConfirm}>
              Xóa
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Get status badge
const getStatusBadge = (discount: GiamGia) => {
  const now = new Date();
  const startDate = new Date(discount.thoi_gian_bat_dau);
  const endDate = new Date(discount.thoi_gian_ket_thuc);

  // Trạng thái hoạt động
  const activityStatus = discount.trang_thai === TrangThaiGiamGia.HoatDong
    ? { label: "Hoạt động", color: "bg-green-100 text-green-800" }
    : { label: "Ngừng hoạt động", color: "bg-slate-100 text-slate-800" };

  // Trạng thái thời gian
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

  return (
    <div className="flex items-center gap-2">
      <Badge className={timeStatus.color}>
        {timeStatus.label}
      </Badge>
      <Badge className={activityStatus.color}>
        {activityStatus.label}
      </Badge>
    </div>
  );
};

const ProductRow = ({ 
  product, 
  isExpanded, 
  onToggleExpand, 
  selectedProducts,
  onSelectProduct,
  setConfirmIds,
  setConfirmOpen
}: { 
  product: SanPhamGiamGiaDTO;
  isExpanded: boolean;
  onToggleExpand: () => void;
  selectedProducts: string[];
  onSelectProduct: (id: string, isVariant: boolean) => void;
  setConfirmIds: (ids: string[]) => void;
  setConfirmOpen: (open: boolean) => void;
}) => {
  const router = useRouter();
  // Hàm xử lý URL ảnh
  const getImageUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE}/${url}`;
  };

  return (
    <>
      <TableRow 
        className="cursor-pointer hover:bg-slate-50 transition-colors duration-200"
        onClick={onToggleExpand}
      >
        <TableCell onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={
              product.sanPhamChiTiets.length > 0
                ? product.sanPhamChiTiets.every(v => selectedProducts.includes(v.id_san_pham_chi_tiet))
                : selectedProducts.includes(product.id_san_pham)
            }
            onCheckedChange={(checked) => {
              const allIds = [product.id_san_pham, ...product.sanPhamChiTiets.map(v => v.id_san_pham_chi_tiet)];
              if (checked) {
                const idsWithDiscount = product.sanPhamChiTiets
                  .filter(v => v.giamGia && v.giamGia.trang_thai === "HoatDong" && new Date(v.giamGia.thoi_gian_ket_thuc) > new Date())
                  .map(v => v.id_san_pham_chi_tiet);
                if (idsWithDiscount.length > 0) {
                  setConfirmIds(idsWithDiscount);
                  setConfirmOpen(true);
                  return;
                }
                allIds.forEach(id => {
                  if (!selectedProducts.includes(id)) onSelectProduct(id, true);
                });
              } else {
                allIds.forEach(id => {
                  if (selectedProducts.includes(id)) onSelectProduct(id, true);
                });
              }
            }}
            onClick={e => e.stopPropagation()}
            className="h-5 w-5 border-slate-300 text-blue-600 focus:ring-blue-500"
            aria-label={`Chọn sản phẩm ${product.ten_san_pham}`}
          />
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {product.url_anh_mac_dinh && (
              <img 
                src={getImageUrl(product.url_anh_mac_dinh)} 
                alt={product.ten_san_pham}
                className="w-10 h-10 object-cover rounded transition-transform duration-200 hover:scale-105"
              />
            )}
            <span
              className="hover:text-blue-600 hover:underline cursor-pointer transition-colors"
              title="Xem chi tiết sản phẩm"
              onClick={e => {
                e.stopPropagation();
                router.push(`/products/${product.id_san_pham}`);
              }}
            >
              {product.ten_san_pham}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <code className="px-2 py-1 bg-slate-100 rounded text-sm">
            {product.ma_san_pham}
          </code>
        </TableCell>
        <TableCell>{product.ten_danh_muc}</TableCell>
        <TableCell>{product.ten_thuong_hieu}</TableCell>
        <TableCell>
          <Badge className={product.trang_thai === "HoatDong" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            {product.trang_thai === "HoatDong" ? "Hoạt động" : "Ngừng hoạt động"}
          </Badge>
        </TableCell>
      </TableRow>
        <TableRow>
        <TableCell colSpan={6} className="p-0">
          <div 
            className={`grid transition-all duration-300 ease-in-out ${
              isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="bg-slate-50 p-0">
                <div className="p-4 space-y-4 animate-in slide-in-from-top-2 duration-300 ease-out">
                  <div className="flex items-center justify-between pb-2">
                <h4 className="font-medium text-slate-900">Chi tiết sản phẩm</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleExpand();
                  }}
                      className="hover:bg-slate-200 transition-colors duration-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
                  <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                      <div className="animate-in fade-in duration-300 delay-100">
                  <Label className="text-sm font-medium text-slate-500">Mô tả</Label>
                  <p className="text-sm text-slate-600 mt-1">{product.mo_ta}</p>
                </div>
                      <div className="animate-in fade-in duration-300 delay-200">
                  <Label className="text-sm font-medium text-slate-500">Thông tin khác</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1 text-sm text-slate-600">
                    <div>
                      <span className="font-medium">Kiểu dáng:</span> {product.ten_kieu_dang}
                    </div>
                    <div>
                      <span className="font-medium">Chất liệu:</span> {product.ten_chat_lieu}
                    </div>
                    <div>
                      <span className="font-medium">Xuất xứ:</span> {product.ten_xuat_xu}
                    </div>
                  </div>
                </div>
              </div>
                    <div className="animate-in fade-in duration-300 delay-300 mt-4">
                <Label className="text-sm font-medium text-slate-500">Các phiên bản</Label>
                <div className="mt-2 space-y-2">
                        {product.sanPhamChiTiets.map((chiTiet, index) => {
                          const isDiscountActive = chiTiet.giamGia &&
                            chiTiet.giamGia.trang_thai === "HoatDong" &&
                            new Date(chiTiet.giamGia.thoi_gian_ket_thuc) > new Date();
                          return (
                    <div 
                      key={chiTiet.id_san_pham_chi_tiet}
                              className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-200 hover:shadow-sm transition-all duration-200 animate-in fade-in duration-300"
                              style={{ animationDelay: `${(index + 1) * 100}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        {chiTiet.hinhAnhSanPhamChiTiets[0]?.hinh_anh_urls && (
                          <img 
                            src={getImageUrl(chiTiet.hinhAnhSanPhamChiTiets[0].hinh_anh_urls)} 
                            alt={`${product.ten_san_pham} - ${chiTiet.ten_mau_sac} - ${chiTiet.ten_kich_co}`}
                                    className="w-12 h-12 object-cover rounded transition-transform duration-200 hover:scale-105"
                          />
                        )}
                        <div>
                                  <p className="font-medium flex items-center gap-2">
                                    {chiTiet.ten_mau_sac} - {chiTiet.ten_kich_co}
                                    {isDiscountActive && (
                                      <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-semibold">
                                        Đang có giảm giá: {chiTiet.giamGia?.ten_giam_gia}
                                      </span>
                                    )}
                                  </p>
                          <p className="text-sm text-slate-500">Mã: {chiTiet.ma_san_pham_chi_tiet}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-medium">{chiTiet.gia_ban.toLocaleString('vi-VN')}đ</p>
                          <p className="text-sm text-slate-500">Còn {chiTiet.so_luong} sản phẩm</p>
                        </div>
                                <Checkbox
                          checked={selectedProducts.includes(chiTiet.id_san_pham_chi_tiet)}
                                  onCheckedChange={(checked) => {
                                    const isDiscountActive = chiTiet.giamGia &&
                                      chiTiet.giamGia.trang_thai === "HoatDong" &&
                                      new Date(chiTiet.giamGia.thoi_gian_ket_thuc) > new Date();
                                    if (isDiscountActive && checked) {
                                      setConfirmIds([chiTiet.id_san_pham_chi_tiet]);
                                      setConfirmOpen(true);
                                      return;
                                    }
                            onSelectProduct(chiTiet.id_san_pham_chi_tiet, true);
                          }}
                                  onClick={e => e.stopPropagation()}
                                  className="h-5 w-5 border-slate-300 text-blue-600 focus:ring-blue-500"
                          aria-label={`Chọn sản phẩm ${product.ten_san_pham} - ${chiTiet.ten_mau_sac} - ${chiTiet.ten_kich_co}`}
                        />
                      </div>
                    </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </TableCell>
        </TableRow>
    </>
  );
};

const AddProductDialog = ({
  isOpen,
  onClose,
  promotion,
  onAddProducts
}: {
  isOpen: boolean;
  onClose: () => void;
  promotion: GiamGia | null;
  onAddProducts: (productDetailIds: string[]) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [selectedDiscountStatus, setSelectedDiscountStatus] = useState<string>("all");
  const [categories, setCategories] = useState<DanhMuc[]>([]);
  const [brands, setBrands] = useState<ThuongHieu[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [products, setProducts] = useState<SanPhamGiamGiaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [confirmIds, setConfirmIds] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
      setSelectedProducts([]);
      setExpandedProduct(null);
      fetchCategoriesAndBrands();
    }
  }, [isOpen]);

  const fetchCategoriesAndBrands = async () => {
    const [cats, brs] = await Promise.all([
      attributeService.getAttributes('DanhMuc'),
      attributeService.getAttributes('ThuongHieu'),
    ]);
    setCategories(cats);
    setBrands(brs);
  };

  const fetchProducts = async () => {
      setLoading(true);
    try {
      const data = await giamGiaService.getSanPhamCoTheGiamGia({
        timkiem: debouncedSearchTerm,
        id_danh_muc: selectedCategory === "all" ? undefined : selectedCategory,
        id_thuong_hieu: selectedBrand === "all" ? undefined : selectedBrand,
        giam_gia_cua_san_phan_chi_tiet: selectedDiscountStatus === "all" ? undefined : selectedDiscountStatus,
      });
      setProducts(data);
      setError("");
    } catch (error) {
      setError("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearchTerm(value);
    }, 400);
  };

  const handleCategoryChange = (value: string) => setSelectedCategory(value);
  const handleBrandChange = (value: string) => setSelectedBrand(value);
  const handleDiscountStatusChange = (value: string) => setSelectedDiscountStatus(value);

  const handleSelectProduct = (productId: string, isVariant: boolean = false) => {
    console.log('Selecting product:', { productId, isVariant });
    setSelectedProducts(prev => {
      const newSelection = [...prev];
      const index = newSelection.indexOf(productId);
      
      if (index === -1) {
        // Nếu là phiên bản sản phẩm, thêm vào cuối mảng
        if (isVariant) {
          newSelection.push(productId);
        } else {
          // Nếu là sản phẩm chính, thêm vào đầu mảng
          newSelection.unshift(productId);
        }
      } else {
        // Xóa sản phẩm khỏi danh sách đã chọn
        newSelection.splice(index, 1);
      }
      
      console.log('New selection:', newSelection);
      return newSelection;
    });
  };

  const handleToggleExpand = (productId: string) => {
    setExpandedProduct(prev => prev === productId ? null : productId);
  };

  const handleSubmit = async () => {
    if (selectedProducts.length === 0) {
      setError("Vui lòng chọn ít nhất một sản phẩm");
      return;
    }

    try {
      await onAddProducts(selectedProducts);
      onClose();
    } catch (error) {
      setError("Không thể thêm sản phẩm vào giảm giá");
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedBrand, debouncedSearchTerm, selectedDiscountStatus]);

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      if (expandedProduct) {
        const product = products.find(p => p.id_san_pham === expandedProduct);
        if (product) {
          const allChecked = product.sanPhamChiTiets.every(v => selectedProducts.includes(v.id_san_pham_chi_tiet));
          const someChecked = product.sanPhamChiTiets.some(v => selectedProducts.includes(v.id_san_pham_chi_tiet));
          selectAllRef.current.indeterminate = !allChecked && someChecked;
        }
      } else {
        const allChecked = products.length > 0 && products.every(product => product.sanPhamChiTiets.every(v => selectedProducts.includes(v.id_san_pham_chi_tiet)));
        const someChecked = products.some(product => product.sanPhamChiTiets.some(v => selectedProducts.includes(v.id_san_pham_chi_tiet)));
        selectAllRef.current.indeterminate = !allChecked && someChecked;
      }
    }
  }, [expandedProduct, products, selectedProducts]);

  const handleSelectAll = (checked: boolean) => {
    if (expandedProduct) {
      const product = products.find(p => p.id_san_pham === expandedProduct);
      if (!product) return;
      product.sanPhamChiTiets.forEach(v => {
        if (checked) {
          if (!selectedProducts.includes(v.id_san_pham_chi_tiet)) handleSelectProduct(v.id_san_pham_chi_tiet, true);
        } else {
          if (selectedProducts.includes(v.id_san_pham_chi_tiet)) handleSelectProduct(v.id_san_pham_chi_tiet, true);
        }
      });
    } else {
      products.forEach(product => {
        product.sanPhamChiTiets.forEach(v => {
          if (checked) {
            if (!selectedProducts.includes(v.id_san_pham_chi_tiet)) handleSelectProduct(v.id_san_pham_chi_tiet, true);
          } else {
            if (selectedProducts.includes(v.id_san_pham_chi_tiet)) handleSelectProduct(v.id_san_pham_chi_tiet, true);
          }
        });
      });
    }
  };

  // Trong AddProductDialog, thêm hàm xử lý xóa giảm giá khỏi các sản phẩm đã chọn
  const handleRemoveDiscountFromSelected = async () => {
    if (selectedProducts.length === 0) return;
    try {
      await giamGiaService.xoaGiamGiaKhoiSanPhamChiTiet(selectedProducts);
      toast.success("Đã xóa giảm giá khỏi các sản phẩm đã chọn");
      // Sau khi xóa, reload lại danh sách sản phẩm
      fetchProducts();
      setSelectedProducts([]);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Không thể xóa giảm giá khỏi sản phẩm");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            Thêm sản phẩm áp dụng
            <Badge className="text-sm font-normal bg-blue-100 text-blue-800">
              {promotion?.ten_giam_gia} ({promotion?.kieu_giam_gia === 'PhanTram' ? `${promotion?.gia_tri_giam}%` : `${promotion?.gia_tri_giam.toLocaleString('vi-VN')}đ`})
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Chọn sản phẩm để áp dụng giảm giá
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                className="pl-10 pr-10"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button 
              variant="outline"
              onClick={fetchProducts}
            >
              Làm mới
            </Button>
          </div>

          <div className="flex gap-2 mb-2">
            <Select value={selectedCategory} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat.id_danh_muc} value={String(cat.id_danh_muc)}>{cat.ten_danh_muc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedBrand} onValueChange={handleBrandChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Thương hiệu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả thương hiệu</SelectItem>
                {brands.map(brand => (
                  <SelectItem key={brand.id_thuong_hieu} value={String(brand.id_thuong_hieu)}>{brand.ten_thuong_hieu}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDiscountStatus} onValueChange={handleDiscountStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Trạng thái giảm giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái giảm giá</SelectItem>
                <SelectItem value="ChuaCoGiamGia">Chưa có giảm giá</SelectItem>
                <SelectItem value="ConHieuLuc">Đang có giảm giá</SelectItem>
                <SelectItem value="HetHieuLuc">Giảm giá đã hết hiệu lực</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 overflow-hidden flex-1 min-h-0">
              <div className="h-full overflow-y-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="w-[50px]">
                        {/* Checkbox chọn tất cả */}
                        <Checkbox
                          checked={
                            expandedProduct
                              ? products.filter(p => p.id_san_pham === expandedProduct)[0]?.sanPhamChiTiets?.every(v => selectedProducts.includes(v.id_san_pham_chi_tiet))
                              : products.length > 0 && products.every(product => product.sanPhamChiTiets.every(v => selectedProducts.includes(v.id_san_pham_chi_tiet)))
                          }
                          onCheckedChange={handleSelectAll}
                          className="h-5 w-5 border-slate-300 text-blue-600 focus:ring-blue-500"
                          aria-label="Chọn tất cả sản phẩm"
                        />
                      </TableHead>
                    <TableHead className="font-semibold text-slate-700">Tên sản phẩm</TableHead>
                    <TableHead className="font-semibold text-slate-700">Mã sản phẩm</TableHead>
                    <TableHead className="font-semibold text-slate-700">Danh mục</TableHead>
                    <TableHead className="font-semibold text-slate-700">Thương hiệu</TableHead>
                    <TableHead className="font-semibold text-slate-700">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                          <Package className="h-10 w-10" />
                          <p>Không tìm thấy sản phẩm nào</p>
                        </div>
                      </TableCell>
                    </TableRow>
                    ) : (
                      expandedProduct ? (
                        products
                          .filter(product => product.id_san_pham === expandedProduct)
                          .map((product) => (
                            <ProductRow
                              key={product.id_san_pham}
                              product={product}
                              isExpanded={true}
                              onToggleExpand={() => handleToggleExpand(product.id_san_pham)}
                              selectedProducts={selectedProducts}
                              onSelectProduct={handleSelectProduct}
                              setConfirmIds={setConfirmIds}
                              setConfirmOpen={setConfirmOpen}
                            />
                          ))
                  ) : (
                    products.map((product) => (
                      <ProductRow
                        key={product.id_san_pham}
                        product={product}
                            isExpanded={false}
                        onToggleExpand={() => handleToggleExpand(product.id_san_pham)}
                        selectedProducts={selectedProducts}
                        onSelectProduct={handleSelectProduct}
                            setConfirmIds={setConfirmIds}
                            setConfirmOpen={setConfirmOpen}
                      />
                    ))
                      )
                  )}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Đã chọn:</span>
            <Badge className="bg-slate-100 text-slate-800">{selectedProducts.length} sản phẩm</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveDiscountFromSelected}
              disabled={selectedProducts.length === 0}
            >
              Xóa giảm giá
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={selectedProducts.length === 0}
            >
              Thêm đã chọn
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-full">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <AlertDialogTitle className="text-yellow-700">Xác nhận thay thế giảm giá</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-yellow-700">
              Một hoặc nhiều sản phẩm chi tiết đã có giảm giá còn hiệu lực. Bạn có chắc chắn muốn thay thế giảm giá cũ bằng giảm giá mới không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
              onClick={() => {
                confirmIds.forEach(id => handleSelectProduct(id, true));
                setConfirmOpen(false);
              }}
            >
              Đồng ý
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

// Thêm CSS cho thanh cuộn tùy chỉnh vào phần đầu file, sau các import
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

// Thêm component hiển thị danh sách sản phẩm đang áp dụng
const AppliedProductsDialog = ({
  isOpen,
  onClose,
  discount,
  onRemoveProducts
}: {
  isOpen: boolean;
  onClose: () => void;
  discount: GiamGia | null;
  onRemoveProducts: (productIds: string[]) => void;
}) => {
  const [products, setProducts] = useState<SanPhamGiamGiaDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen && discount) {
      fetchAppliedProducts();
    }
  }, [isOpen, discount]);

  const fetchAppliedProducts = async () => {
    if (!discount) return;
    setLoading(true);
    try {
      const data = await giamGiaService.getSanPhamDangGiamGia(discount.id_giam_gia);
      setProducts(data);
      setError("");
    } catch (error) {
      setError("Không thể tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearchTerm(value);
    }, 400);
  };

  const filteredProducts = products.filter(product => 
    product.ten_san_pham.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    product.ma_san_pham.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map(p => p.id_san_pham));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const handleRemoveSelected = async () => {
    if (selectedProducts.length === 0) return;
    try {
      await onRemoveProducts(selectedProducts);
      await fetchAppliedProducts();
      setSelectedProducts([]);
      toast.success("Đã xóa giảm giá khỏi các sản phẩm đã chọn");
    } catch (error) {
      toast.error("Không thể xóa giảm giá khỏi sản phẩm");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            Sản phẩm đang áp dụng
            <Badge className="text-sm font-normal bg-blue-100 text-blue-800">
              {discount?.ten_giam_gia} ({discount?.kieu_giam_gia === 'PhanTram' ? `${discount?.gia_tri_giam}%` : `${discount?.gia_tri_giam.toLocaleString('vi-VN')}đ`})
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Danh sách sản phẩm đang áp dụng giảm giá này
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col space-y-4">
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                className="pl-10 pr-10"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearch("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button 
              variant="outline"
              onClick={fetchAppliedProducts}
            >
              Làm mới
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 overflow-hidden flex-1 min-h-0">
              <div className="h-full overflow-y-auto custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 hover:bg-slate-50">
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length}
                          onCheckedChange={handleSelectAll}
                          aria-label="Chọn tất cả sản phẩm"
                        />
                      </TableHead>
                      <TableHead className="font-semibold text-slate-700">Tên sản phẩm</TableHead>
                      <TableHead className="font-semibold text-slate-700">Mã sản phẩm</TableHead>
                      <TableHead className="font-semibold text-slate-700">Danh mục</TableHead>
                      <TableHead className="font-semibold text-slate-700">Thương hiệu</TableHead>
                      <TableHead className="font-semibold text-slate-700">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                            <Package className="h-10 w-10" />
                            <p>Không tìm thấy sản phẩm nào</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredProducts.map((product) => (
                        <TableRow key={product.id_san_pham}>
                          <TableCell>
                            <Checkbox
                              checked={selectedProducts.includes(product.id_san_pham)}
                              onCheckedChange={() => handleSelectProduct(product.id_san_pham)}
                              aria-label={`Chọn sản phẩm ${product.ten_san_pham}`}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {product.url_anh_mac_dinh && (
                                <img 
                                  src={getImageUrl(product.url_anh_mac_dinh)} 
                                  alt={product.ten_san_pham}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <span>{product.ten_san_pham}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="px-2 py-1 bg-slate-100 rounded text-sm">
                              {product.ma_san_pham}
                            </code>
                          </TableCell>
                          <TableCell>{product.ten_danh_muc}</TableCell>
                          <TableCell>{product.ten_thuong_hieu}</TableCell>
                          <TableCell>
                            <Badge className={product.trang_thai === "HoatDong" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              {product.trang_thai === "HoatDong" ? "Hoạt động" : "Ngừng hoạt động"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span>Đã chọn:</span>
            <Badge className="bg-slate-100 text-slate-800">{selectedProducts.length} sản phẩm</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveSelected}
              disabled={selectedProducts.length === 0}
            >
              Xóa giảm giá
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function DiscountsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterConfig, setFilterConfig] = useState({
    status: 'all',
    discountType: 'all',
    startDate: '',
    endDate: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [showStats, setShowStats] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setShowStats(false);
      } else {
        setShowStats(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentDiscount, setCurrentDiscount] = useState<GiamGia | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<GiamGia | null>(null);
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState<FormData>(defaultFormData);

  // Query để lấy danh sách giảm giá
  const { 
    data: discountsData = { data: [], total: 0 }, 
    isLoading,
    isFetching 
  } = useQuery<PaginatedResponse<GiamGia>>({
    queryKey: ['discounts', filterConfig, searchTerm, currentPage, pageSize, sortConfig],
    queryFn: () => giamGiaService.getAll({
        trang_thai: filterConfig.status !== 'all' ? filterConfig.status : undefined,
        kieu_giam_gia: filterConfig.discountType !== 'all' ? filterConfig.discountType : undefined,
        thoi_gian_bat_dau: filterConfig.startDate || undefined,
        thoi_gian_ket_thuc: filterConfig.endDate || undefined,
        tim_kiem: searchTerm || undefined,
        page: currentPage,
        pageSize: pageSize,
        sortBy: sortConfig?.key || 'ngay_tao',
        ascending: sortConfig?.direction === 'asc'
    }),
    staleTime: 5 * 60 * 1000, // 5 phút
  });

  const discounts = discountsData.data;
  const totalDiscounts = discountsData.total;

  // --- THỐNG KÊ & BÁO CÁO ---
  const now = new Date();
  const activeDiscounts = discounts.filter(d => d.trang_thai === "HoatDong").length;
  const expiringDiscounts = discounts.filter(d => {
    if (d.trang_thai !== "HoatDong") return false;
    const end = new Date(d.thoi_gian_ket_thuc);
    return end > now && (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) <= 3;
  }).length;
  const totalAppliedProducts = discounts.reduce((sum, d) => sum + (d.so_luong_da_su_dung || 0), 0);

  const handleExportReport = () => {
    const headers = [
      "Tên giảm giá",
      "Mã giảm giá",
      "Kiểu giảm giá",
      "Giá trị giảm",
      "Số lượng tối đa",
      "Số lượng đã sử dụng",
      "Thời gian bắt đầu",
      "Thời gian kết thúc",
      "Trạng thái"
    ];
    const rows = discounts.map(d => [
      d.ten_giam_gia,
      d.ma_giam_gia,
      d.kieu_giam_gia,
      d.gia_tri_giam,
      d.so_luong_toi_da,
      d.so_luong_da_su_dung,
      d.thoi_gian_bat_dau,
      d.thoi_gian_ket_thuc,
      d.trang_thai
    ]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "bao_cao_giam_gia.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  // --- HẾT KHỐI THỐNG KÊ ---

  // Mutation để thêm giảm giá mới
  const addMutation = useMutation({
    mutationFn: (data: FormData) => giamGiaService.themGiamGia(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success("Thêm giảm giá thành công");
      setIsAddDialogOpen(false);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Không thể thêm giảm giá";
      toast.error(errorMessage);
    }
  });

  // Mutation để cập nhật giảm giá
  const updateMutation = useMutation({
    mutationFn: (data: FormData) => 
      giamGiaService.capNhatGiamGia(data.id_giam_gia!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success("Cập nhật giảm giá thành công");
      setIsEditDialogOpen(false);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Không thể cập nhật giảm giá";
      toast.error(errorMessage);
    }
  });

  // Mutation để xóa giảm giá
  const deleteMutation = useMutation({
    mutationFn: (id: string) => giamGiaService.xoaGiamGia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success("Xóa giảm giá thành công");
      setIsDeleteDialogOpen(false);
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Không thể xóa giảm giá";
      toast.error(errorMessage);
    }
  });

  // Mutation để xóa nhiều giảm giá
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => 
      Promise.all(ids.map(id => giamGiaService.xoaGiamGia(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
      toast.success('Xóa giảm giá thành công!');
      setSelectedDiscounts([]);
      setIsBulkDeleteDialogOpen(false);
    },
    onError: (error: unknown) => {
      console.error('Lỗi khi xóa giảm giá:', error);
      toast.error('Có lỗi xảy ra khi xóa giảm giá!');
    }
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, queryClient]);

  const handleAdd = async (data: FormData) => {
    addMutation.mutate(data);
  };

  const handleEdit = async (data: FormData) => {
    updateMutation.mutate(data);
  };

  // Thêm state để lưu thông tin sử dụng
  const [discountUsage, setDiscountUsage] = useState<{[key: string]: number}>({});

  // Hàm kiểm tra giảm giá có đang được sử dụng không
  const checkDiscountUsage = async (id: string) => {
    try {
      const products = await giamGiaService.getSanPhamDangGiamGia(id);
      return products.length;
    } catch (error) {
      console.error('Error checking discount usage:', error);
      return 0;
    }
  };

  // Cập nhật hàm xử lý xóa
  const handleDelete = async (id: string) => {
    try {
      const usageCount = await checkDiscountUsage(id);
      if (usageCount > 0) {
        setDiscountUsage(prev => ({ ...prev, [id]: usageCount }));
        setCurrentDiscount(discounts.find(d => d.id_giam_gia === id) || null);
        setIsDeleteDialogOpen(true);
        return;
      }
      deleteMutation.mutate(id);
    } catch (error) {
      toast.error("Không thể kiểm tra trạng thái sử dụng của giảm giá");
    }
  };

  // Cập nhật hàm xử lý xóa hàng loạt
  const handleBulkDelete = async () => {
    try {
      const usageChecks = await Promise.all(
        selectedDiscounts.map(async (id) => {
          const usageCount = await checkDiscountUsage(id);
          return { id, usageCount };
        })
      );

      const discountsInUse = usageChecks.filter(check => check.usageCount > 0);
      
      if (discountsInUse.length > 0) {
        toast.error(
          `${discountsInUse.length} giảm giá đang được sử dụng và không thể xóa. ` +
          "Vui lòng xóa giảm giá khỏi các sản phẩm trước khi xóa."
        );
        return;
      }

      bulkDeleteMutation.mutate(selectedDiscounts);
    } catch (error) {
      toast.error("Không thể kiểm tra trạng thái sử dụng của giảm giá");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDiscounts(discounts.map((d: GiamGia) => String(d.id_giam_gia)));
    } else {
      setSelectedDiscounts([]);
    }
  };

  const handleSelectDiscount = (discountId: string, checked: boolean) => {
    if (checked) {
      setSelectedDiscounts(prev => [...prev, discountId]);
    } else {
      setSelectedDiscounts(prev => prev.filter(id => id !== discountId));
    }
  };

  const handleSelectPromotion = (discount: GiamGia) => {
    setSelectedDiscount(discount);
    setIsDetailDialogOpen(true);
  };

  const handleFormDataChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ma_giam_gia: prev.ma_giam_gia // Ensure ma_giam_gia is always included
    }));
  };

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) return null;
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Thêm state cho dialog xem sản phẩm đang áp dụng
  const [isAppliedProductsDialogOpen, setIsAppliedProductsDialogOpen] = useState(false);

  // Thêm hàm xử lý xem sản phẩm đang áp dụng
  const handleViewAppliedProducts = (discount: GiamGia) => {
    setCurrentDiscount(discount);
    setIsAppliedProductsDialogOpen(true);
  };

  // Thêm hàm xử lý xóa giảm giá khỏi sản phẩm
  const handleRemoveProductsFromDiscount = async (productIds: string[]) => {
    try {
      await giamGiaService.xoaGiamGiaKhoiSanPhamChiTiet(productIds);
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    } catch (error) {
      throw error;
    }
  };

  // Add new statistics data
  const discountTypeData = [
    { name: 'Phần trăm', value: discounts.filter(d => d.kieu_giam_gia === 'PhanTram').length },
    { name: 'Số tiền', value: discounts.filter(d => d.kieu_giam_gia === 'SoTien').length }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  const timeSeriesData = discounts
    .filter(d => d.trang_thai === 'HoatDong')
    .map(d => ({
      name: d.ten_giam_gia,
      startDate: new Date(d.thoi_gian_bat_dau),
      endDate: new Date(d.thoi_gian_ket_thuc)
    }))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());

  // Calculate additional statistics
  const totalDiscountValue = discounts.reduce((sum, d) => {
    if (d.kieu_giam_gia === 'PhanTram') {
      return sum + (d.gia_tri_giam * d.so_luong_da_su_dung) / 100;
    }
    return sum + (d.gia_tri_giam * d.so_luong_da_su_dung);
  }, 0);

  const averageDiscountValue = totalDiscountValue / (discounts.length || 1);

  return (
    <AdminLayout>
      <style>{customScrollbarStyles}</style>
      
      {/* Modern Statistics Section */}
      <div className={`space-y-6 mb-8 transition-all duration-500 ease-in-out transform ${showStats ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full h-0 overflow-hidden'}`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-slate-800">Quản lý giảm giá</h1>
            <p className="text-slate-500">Quản lý và theo dõi các chương trình giảm giá</p>
          </div>
          <Button 
            className="flex items-center gap-2 bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800"
            onClick={handleExportReport}
          >
            <Download className="h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-none shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Đang hoạt động</p>
                  <h3 className="text-3xl font-bold text-slate-700">{activeDiscounts}</h3>
                </div>
                <div className="p-3 bg-slate-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-slate-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-slate-600">
                  <span className="font-medium">Tổng số:</span>
                  <span className="ml-2">{discounts.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-none shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Sắp hết hạn</p>
                  <h3 className="text-3xl font-bold text-slate-700">{expiringDiscounts}</h3>
                </div>
                <div className="p-3 bg-slate-100 rounded-full">
                  <Clock className="h-6 w-6 text-slate-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-slate-600">
                  <span className="font-medium">Trong 3 ngày tới</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-none shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Sản phẩm áp dụng</p>
                  <h3 className="text-3xl font-bold text-slate-700">{totalAppliedProducts}</h3>
                </div>
                <div className="p-3 bg-slate-100 rounded-full">
                  <Package className="h-6 w-6 text-slate-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-slate-600">
                  <span className="font-medium">Tổng giá trị:</span>
                  <span className="ml-2">{totalDiscountValue.toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-none shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 mb-1">Giá trị trung bình</p>
                  <h3 className="text-3xl font-bold text-slate-700">
                    {averageDiscountValue.toLocaleString('vi-VN')}đ
                  </h3>
                </div>
                <div className="p-3 bg-slate-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-slate-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm text-slate-600">
                  <span className="font-medium">Trên mỗi giảm giá</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rest of the content */}
      <div className={`transition-all duration-500 ease-in-out transform ${showStats ? 'mt-0' : 'mt-0'} min-h-[150vh]`}>
        <div className="flex flex-col gap-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Quản lý giảm giá</h1>
              <p className="text-slate-500">Quản lý các chương trình giảm giá cho sản phẩm</p>
            </div>
            <div className="flex gap-2">
              {selectedDiscounts.length > 0 && (
                <Button
                  variant="destructive"
                  className="gap-2"
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                >
                  <Trash className="h-4 w-4" />
                  <span>Xóa ({selectedDiscounts.length})</span>
                </Button>
              )}
            <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700" onClick={() => {
                setFormData({
                  ...defaultFormData,
                  ma_giam_gia: "" // Ensure ma_giam_gia is included when resetting
                });
              setIsAddDialogOpen(true);
            }}>
              <Plus className="h-4 w-4" />
                Thêm mới
            </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                className="pl-10 pr-10"
                placeholder="Tìm kiếm theo tên hoặc mã giảm giá..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  aria-label="Xóa tìm kiếm"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <Select value={filterConfig.status} onValueChange={(value) => setFilterConfig(prev => ({ ...prev, status: value }))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="HoatDong">Đang hoạt động</SelectItem>
                  <SelectItem value="NgungHoatDong">Ngừng hoạt động</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterConfig.discountType} onValueChange={(value) => setFilterConfig(prev => ({ ...prev, discountType: value }))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Loại giảm giá" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  <SelectItem value="PhanTram">Phần trăm</SelectItem>
                  <SelectItem value="SoTien">Số tiền</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={filterConfig.startDate}
                onChange={e => setFilterConfig(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-[180px]"
                placeholder="Từ ngày"
              />
              <Input
                type="date"
                value={filterConfig.endDate}
                onChange={e => setFilterConfig(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-[180px]"
                placeholder="Đến ngày"
              />
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
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedDiscounts.length === discounts.length && discounts.length > 0}
                          onCheckedChange={handleSelectAll}
                          aria-label="Chọn tất cả"
                        />
                      </TableHead>
                      <TableHead 
                        className="w-[300px] cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('ten_giam_gia')}
                      >
                        Thông tin giảm giá {getSortIcon('ten_giam_gia')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('ma_giam_gia')}
                      >
                        Mã {getSortIcon('ma_giam_gia')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('thoi_gian_bat_dau')}
                      >
                        Thời gian {getSortIcon('thoi_gian_bat_dau')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('gia_tri_giam')}
                      >
                        Giá trị {getSortIcon('gia_tri_giam')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('so_luong_da_su_dung')}
                      >
                        Số lượng {getSortIcon('so_luong_da_su_dung')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-slate-50"
                        onClick={() => handleSort('trang_thai')}
                      >
                        Trạng thái {getSortIcon('trang_thai')}
                      </TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {discounts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                            <Package className="h-10 w-10" />
                            <p>Không tìm thấy giảm giá nào</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      discounts.map((discount) => (
                        <TableRow key={discount.id_giam_gia} className="group cursor-pointer" onClick={() => handleSelectPromotion(discount)}>
                          <TableCell onClick={e => e.stopPropagation()}>
                            <Checkbox
                              checked={selectedDiscounts.includes(String(discount.id_giam_gia))}
                              onCheckedChange={(checked) => handleSelectDiscount(String(discount.id_giam_gia), checked as boolean)}
                              aria-label={`Chọn giảm giá ${discount.ten_giam_gia}`}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <p className="font-medium group-hover:text-blue-600 transition-colors">{discount.ten_giam_gia}</p>
                              <p className="text-sm text-slate-500 line-clamp-2">{discount.mo_ta}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <code className="px-2 py-1 bg-slate-100 rounded text-sm">{discount.ma_giam_gia}</code>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(discount.ma_giam_gia);
                                  toast.success("Đã sao chép mã giảm giá");
                                }}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs">
                              <div>
                                <span className="font-medium">Từ:</span> {format(new Date(discount.thoi_gian_bat_dau), "dd/MM/yyyy HH:mm", { locale: vi })}
                              </div>
                              <div>
                                <span className="font-medium">Đến:</span> {format(new Date(discount.thoi_gian_ket_thuc), "dd/MM/yyyy HH:mm", { locale: vi })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {discount.kieu_giam_gia === "PhanTram" ? (
                                <Badge className="bg-blue-100 text-blue-800">
                                  {discount.gia_tri_giam}%
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-800">
                                  {(discount.gia_tri_giam || 0).toLocaleString('vi-VN')}đ
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
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
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(discount)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentDiscount(discount);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Sửa
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentDiscount(discount);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewAppliedProducts(discount);
                                }}
                              >
                                <Package className="h-4 w-4 mr-2" />
                                Sản phẩm
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
          <CardFooter className="flex items-center justify-between px-6 py-4 border-t">
            <div className="flex items-center gap-2">
              <p className="text-sm text-slate-500">
                Hiển thị {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalDiscounts)} của {totalDiscounts} kết quả
              </p>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue placeholder="Số hàng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 hàng</SelectItem>
                  <SelectItem value="10">10 hàng</SelectItem>
                  <SelectItem value="20">20 hàng</SelectItem>
                  <SelectItem value="50">50 hàng</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Trước
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(totalDiscounts / pageSize) }, (_, i) => i + 1)
                  .filter(page => {
                    const totalPages = Math.ceil(totalDiscounts / pageSize);
                    if (totalPages <= 7) return true;
                    if (page === 1 || page === totalPages) return true;
                    if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                    return false;
                  })
                  .map((page, index, array) => {
                    if (index > 0 && array[index - 1] !== page - 1) {
                      return (
                        <React.Fragment key={`ellipsis-${page}`}>
                          <span className="px-2">...</span>
                          <Button
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      );
                    }
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalDiscounts / pageSize)))}
                disabled={currentPage === Math.ceil(totalDiscounts / pageSize)}
              >
                Sau
              </Button>
            </div>
          </CardFooter>
        </Card>

        <AddEditDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          data={null}
          onSubmit={handleAdd}
          activeTab="promotions"
        />

        <AddEditDialog
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          data={currentDiscount}
          onSubmit={handleEdit}
          isEdit
          activeTab="promotions"
        />

        <DeleteDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={() => handleDelete(currentDiscount?.id_giam_gia || "")}
          itemName={currentDiscount?.ten_giam_gia || ""}
          isInUse={currentDiscount ? discountUsage[currentDiscount.id_giam_gia] > 0 : false}
          usageCount={currentDiscount ? discountUsage[currentDiscount.id_giam_gia] : 0}
        />

        <DetailDialog
          isOpen={isDetailDialogOpen}
          onClose={() => setIsDetailDialogOpen(false)}
          discount={selectedDiscount}
          fetchDiscounts={() => queryClient.invalidateQueries({ queryKey: ['discounts'] })}
        />

        <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa giảm giá</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa {selectedDiscounts.length} giảm giá đã chọn? Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsBulkDeleteDialogOpen(false)}
                disabled={bulkDeleteMutation.isPending}
              >
                Hủy
              </Button>
              <Button
                variant="destructive" 
                onClick={handleBulkDelete}
                disabled={bulkDeleteMutation.isPending}
              >
                {bulkDeleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  "Xóa giảm giá"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AppliedProductsDialog
          isOpen={isAppliedProductsDialogOpen}
          onClose={() => setIsAppliedProductsDialogOpen(false)}
          discount={currentDiscount}
          onRemoveProducts={handleRemoveProductsFromDiscount}
        />
      </div>
    </AdminLayout>
  );
}