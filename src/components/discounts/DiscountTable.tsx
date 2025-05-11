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
import { Copy, Edit, Package, Trash, ArrowUp, ArrowDown } from "lucide-react";
import { GiamGia, TrangThaiGiamGia } from "@/types/giam-gia";
import { toast } from "sonner";

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
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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
                  Thông tin giảm giá
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
                >
                  <TableCell>
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
                        onClick={() => onEdit(discount)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Sửa
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                        onClick={() => onDelete(discount.id_giam_gia)}
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
    </div>
  );
}