import { format, differenceInMilliseconds, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Edit, Package, Trash, ArrowUp, ArrowDown, BarChart2, ShoppingBag, TrendingUp, Clock, Plus } from "lucide-react";
import { GiamGia, TrangThaiGiamGia } from "@/types/giam-gia";
import { toast } from "react-hot-toast";
import { useState } from "react";
import { UpdateDiscountDialog } from "./UpdateDiscountDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { giamGiaService, ThongKeGiamGiaDTO } from "@/services/giam-gia.service";
import { useQuery } from "@tanstack/react-query";
import { DiscountProducts } from "./DiscountProducts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { queryClient } from "@/lib/react-query";
import { cn } from "@/lib/utils";

interface DiscountTableProps {
  discounts: GiamGia[];
  selectedDiscounts: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectDiscount: (id: string, checked: boolean) => void;
  onEdit: (discount: GiamGia) => void;
  onDelete: (id: string) => void;
  isLoading: boolean;
  isFetching: boolean;
  sortBy: string;
  ascending: boolean;
  onSort: (column: string) => void;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('vi-VN', {
    style: 'currency',
    currency: 'VND'
  });
};

export function DiscountTable({
  discounts,
  selectedDiscounts,
  onSelectAll,
  onSelectDiscount,
  onEdit,
  onDelete,
  isLoading,
  isFetching,
  sortBy,
  ascending,
  onSort,
}: DiscountTableProps) {
  const [selectedDiscount, setSelectedDiscount] = useState<GiamGia | null>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");

  // Query để lấy chi tiết giảm giá
  const { data: discountDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ['discount-details', selectedDiscount?.id_giam_gia],
    queryFn: () => giamGiaService.getById(selectedDiscount!.id_giam_gia),
    enabled: !!selectedDiscount?.id_giam_gia && isDetailsDialogOpen,
  });

  // Query for statistics data
  const { data: statisticsData, isLoading: isLoadingStats } = useQuery<ThongKeGiamGiaDTO>({
    queryKey: ['discount-statistics', selectedDiscount?.id_giam_gia],
    queryFn: () => giamGiaService.getThongKeGiamGia(selectedDiscount?.id_giam_gia || ''),
    enabled: !!selectedDiscount?.id_giam_gia && activeTab === 'statistics',
  });

  const handleEdit = (e: React.MouseEvent, discount: GiamGia) => {
    e.stopPropagation();
    setSelectedDiscount(discount);
    setIsUpdateDialogOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDiscountToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (discountToDelete) {
      onDelete(discountToDelete);
      toast.success("Đã xóa giảm giá thành công");
      setIsDeleteDialogOpen(false);
      setDiscountToDelete(null);
    }
  };

  const handleRowClick = (discount: GiamGia) => {
    setSelectedDiscount(discount);
    setIsDetailsDialogOpen(true);
  };

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    toast.success("Đã sao chép mã giảm giá");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="fixed top-0 right-0 p-4">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-50">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={selectedDiscounts.length === discounts.length && discounts.length > 0}
                  onCheckedChange={onSelectAll}
                  aria-label="Chọn tất cả"
                />
              </TableHead>
              <TableHead className="w-[50px]">STT</TableHead>
              <TableHead 
                className="w-[300px] font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                onClick={() => onSort('ten_giam_gia')}
              >
                <div className="flex items-center gap-2">
                  Thông tin tên khuyến mại
                  {sortBy === 'ten_giam_gia' ? (
                    ascending ? (
                      <ArrowUp className="h-4 w-4 text-blue-500" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-blue-500" />
                    )
                  ) : (
                    <ArrowUp className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </TableHead>
              <TableHead 
                className="font-semibold text-slate-700 cursor-pointer hover:bg-slate-100"
                onClick={() => onSort('ma_giam_gia')}
              >
                <div className="flex items-center gap-2">
                  Mã
                  {sortBy === 'ma_giam_gia' ? (
                    ascending ? (
                      <ArrowUp className="h-4 w-4 text-blue-500" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-blue-500" />
                    )
                  ) : (
                    <ArrowUp className="h-4 w-4 text-slate-400" />
                  )}
                </div>
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  Thời gian
                </div>
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  Giá trị
                </div>
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  Số lượng
                </div>
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  Còn lại
                </div>
              </TableHead>
              <TableHead className="font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  Trạng thái
                </div>
              </TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <Package className="h-10 w-10" />
                    <p>Không tìm thấy giảm giá nào</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              discounts.map((discount, idx) => (
                <TableRow 
                  key={discount.id_giam_gia} 
                  className="group cursor-pointer hover:bg-slate-50 transition-colors"
                  onClick={() => handleRowClick(discount)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedDiscounts.includes(String(discount.id_giam_gia))}
                      onCheckedChange={(checked) => onSelectDiscount(String(discount.id_giam_gia), checked as boolean)}
                      aria-label={`Chọn giảm giá ${discount.ten_giam_gia}`}
                    />
                  </TableCell>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium group-hover:text-blue-600 transition-colors">{discount.ten_giam_gia}</p>
                      <p className="text-sm text-slate-500 line-clamp-2">{discount.mo_ta}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-slate-100 rounded text-sm font-medium">{discount.ma_giam_gia}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-200"
                        onClick={(e) => handleCopyCode(e, discount.ma_giam_gia)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs">
                      <div>
                        <span className="font-medium">Từ:</span>{" "}
                        {format(new Date(discount.thoi_gian_bat_dau), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </div>
                      <div>
                        <span className="font-medium">Đến:</span>{" "}
                        {format(new Date(discount.thoi_gian_ket_thuc), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {discount.kieu_giam_gia === 'PhanTram' ? (
                      <div className="flex items-center gap-1">
                        <Badge className="bg-blue-100 text-blue-800">
                          {discount.gia_tri_giam}%
                        </Badge>
                        {discount.gia_toi_da && (
                          <span className="text-sm text-slate-500">
                            (Tối đa: {formatCurrency(discount.gia_toi_da)})
                          </span>
                        )}
                      </div>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">
                        {formatCurrency(discount.gia_tri_giam)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{discount.so_luong_da_su_dung || 0}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: '100%',
                            backgroundColor: '#22c55e'
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Đã sử dụng
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {discount.trang_thai === TrangThaiGiamGia.HoatDong ? (
                      <div className="space-y-1">
                        {new Date() < new Date(discount.thoi_gian_bat_dau) ? (
                          <div className="text-sm font-medium text-blue-600">
                            Bắt đầu sau: {formatDistanceToNow(new Date(discount.thoi_gian_bat_dau), { 
                              locale: vi,
                              addSuffix: false 
                            })}
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-red-600">
                            Kết thúc sau: {formatDistanceToNow(new Date(discount.thoi_gian_ket_thuc), { 
                              locale: vi,
                              addSuffix: false 
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-slate-500 bg-slate-50 px-2 py-1 rounded">
                        Đã kết thúc
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={discount.trang_thai === TrangThaiGiamGia.HoatDong ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {discount.trang_thai === TrangThaiGiamGia.HoatDong ? "Đang hoạt động" : "Đã kết thúc"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100"
                        onClick={(e) => handleEdit(e, discount)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Sửa
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                        onClick={(e) => handleDelete(e, discount.id_giam_gia)}
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

      <UpdateDiscountDialog
        open={isUpdateDialogOpen}
        onOpenChange={setIsUpdateDialogOpen}
        discount={selectedDiscount}
        onSuccess={() => {
          setIsUpdateDialogOpen(false);
        }}
      />

      <Dialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa giảm giá này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={isDetailsDialogOpen} 
        onOpenChange={setIsDetailsDialogOpen}
      >
        <DialogContent className={cn(
          "max-h-[90vh] overflow-y-auto",
          activeTab === "statistics" ? "sm:max-w-[1200px]" : "sm:max-w-[600px]"
        )}>
          <DialogHeader>
            <DialogTitle>Chi tiết giảm giá</DialogTitle>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : discountDetails ? (
            <Tabs 
              defaultValue="details" 
              className="w-full"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Chi tiết giảm giá
                </TabsTrigger>
                <TabsTrigger value="statistics" className="flex items-center gap-2">
                  <BarChart2 className="h-4 w-4" />
                  Thống kê & Sản phẩm
                </TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Tên giảm giá</Label>
                    <p className="font-medium">{discountDetails.ten_giam_gia}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Mã giảm giá</Label>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-slate-100 rounded text-sm font-medium">{discountDetails.ma_giam_gia}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-slate-200"
                        onClick={(e) => handleCopyCode(e, discountDetails.ma_giam_gia)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-500">Mô tả</Label>
                  <p className="text-sm text-slate-600">{discountDetails.mo_ta || "Không có mô tả"}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Loại giảm giá</Label>
                    <Badge className={discountDetails.kieu_giam_gia === 'PhanTram' ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                      {discountDetails.kieu_giam_gia === 'PhanTram' ? 'Phần trăm' : 'Số tiền cố định'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Giá trị giảm</Label>
                    {discountDetails.kieu_giam_gia === 'PhanTram' ? (
                      <div className="flex items-center gap-1">
                        <Badge className="bg-blue-100 text-blue-800">
                          {discountDetails.gia_tri_giam}%
                        </Badge>
                        {discountDetails.gia_toi_da && (
                          <span className="text-sm text-slate-500">
                            (Tối đa: {formatCurrency(discountDetails.gia_toi_da)})
                          </span>
                        )}
                      </div>
                    ) : (
                      <Badge className="bg-green-100 text-green-800">
                        {formatCurrency(discountDetails.gia_tri_giam)}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Số lượng</Label>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{discountDetails.so_luong_da_su_dung || 0}</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: '100%',
                            backgroundColor: '#22c55e'
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        Đã sử dụng
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Trạng thái</Label>
                    <Badge className={discountDetails.trang_thai === TrangThaiGiamGia.HoatDong ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                      {discountDetails.trang_thai === TrangThaiGiamGia.HoatDong ? "Đang hoạt động" : "Đã kết thúc"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Thời gian bắt đầu</Label>
                    <p className="text-sm">
                      {format(new Date(discountDetails.thoi_gian_bat_dau), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Thời gian kết thúc</Label>
                    <p className="text-sm">
                      {format(new Date(discountDetails.thoi_gian_ket_thuc), "dd/MM/yyyy HH:mm", { locale: vi })}
                    </p>
                  </div>
                </div>

                {discountDetails.trang_thai === TrangThaiGiamGia.HoatDong && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-500">Thời gian còn lại</Label>
                    {new Date() < new Date(discountDetails.thoi_gian_bat_dau) ? (
                      <p className="text-sm font-medium text-blue-600">
                        Bắt đầu sau: {formatDistanceToNow(new Date(discountDetails.thoi_gian_bat_dau), { 
                          locale: vi,
                          addSuffix: false 
                        })}
                      </p>
                    ) : (
                      <p className="text-sm font-medium text-red-600">
                        Kết thúc sau: {formatDistanceToNow(new Date(discountDetails.thoi_gian_ket_thuc), { 
                          locale: vi,
                          addSuffix: false 
                        })}
                      </p>
                    )}
                  </div>
                )}

                <div className="border-t pt-4 mt-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-4">Thông tin người tạo và cập nhật</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500">Người tạo</Label>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{discountDetails.nguoiTao?.ten_nhan_vien}</p>
                        <p className="text-xs text-slate-500">{discountDetails.nguoiTao?.ma_nhan_vien}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(discountDetails.ngay_tao), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-500">Người cập nhật</Label>
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{discountDetails.nguoiSua?.ten_nhan_vien}</p>
                        <p className="text-xs text-slate-500">{discountDetails.nguoiSua?.email}</p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(discountDetails.ngay_cap_nhat), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="statistics" className="space-y-4 mt-4">
                {isLoadingStats ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                  </div>
                ) : statisticsData ? (
                  <div className="space-y-6">
                    {/* Thống kê tổng quan */}
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-slate-500">
                            Tổng biến thể áp dụng
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-2xl font-bold">
                                {statisticsData.tong_bien_the_ap_dung}
                              </p>
                              <p className="text-sm text-slate-500">
                                Đang áp dụng: {statisticsData.bien_the_dang_ap_dung}
                              </p>
                            </div>
                            <Package className="h-8 w-8 text-slate-400" />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-slate-500">
                            Số lượng sử dụng
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-2xl font-bold">
                                {statisticsData.so_luong_da_su_dung}
                              </p>
                              <p className="text-sm text-slate-500">
                              </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-slate-400" />
                          </div>
                          <div className="mt-4">
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, statisticsData.ti_le_su_dung * 100)}%` }}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-medium text-slate-500">
                            Trạng thái
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-end justify-between">
                            <div>
                              <Badge className={statisticsData.con_hieu_luc ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                {statisticsData.con_hieu_luc ? "Còn hiệu lực" : "Hết hiệu lực"}
                              </Badge>
                              <p className="text-sm text-slate-500 mt-2">
                                {format(new Date(statisticsData.thoi_gian_ket_thuc), "dd/MM/yyyy HH:mm", { locale: vi })}
                              </p>
                            </div>
                            <Clock className="h-8 w-8 text-slate-400" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Danh sách sản phẩm áp dụng */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Danh sách sản phẩm áp dụng</h3>
                       
                      </div>
                      
                      {selectedDiscount && (
                        <DiscountProducts
                          discountId={selectedDiscount.id_giam_gia}
                          fetchProducts={(params) => giamGiaService.getSanPhamDangGiamGia(selectedDiscount.id_giam_gia, params)}
                          onSuccess={() => {
                            // Refresh statistics data
                            queryClient.invalidateQueries({ 
                              queryKey: ['discount-statistics', selectedDiscount.id_giam_gia] 
                            });
                          }}
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    Không có dữ liệu thống kê
                  </div>
                )}
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}