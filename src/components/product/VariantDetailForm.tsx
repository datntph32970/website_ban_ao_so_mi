import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tag, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MauSac } from '@/types/mau-sac';
import { KichCo } from '@/types/kich-co';
import { GiamGia } from '@/types/giam-gia';
import { giamGiaService } from '@/services/giam-gia.service';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface VariantDetailFormProps {
  color: MauSac | undefined;
  size: KichCo | undefined;
  values: { stock: number; importPrice: number; price: number; discount: string[] };
  errors?: { [key: string]: string };
  onChange: (field: 'stock' | 'importPrice' | 'price' | 'discount', value: number | string[]) => void;
}

export default function VariantDetailForm({ color, size, values, errors = {}, onChange }: VariantDetailFormProps) {
  const [discounts, setDiscounts] = useState<GiamGia[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDiscount, setSelectedDiscount] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchDiscounts = async () => {
      try {
        const activeDiscounts = await giamGiaService.getActiveDiscounts();
        setDiscounts(activeDiscounts);
      } catch (error) {
        toast.error('Không thể tải danh sách giảm giá');
      } finally {
        setLoading(false);
      }
    };

    fetchDiscounts();
  }, []);

  const handleAddDiscount = (discountId: string) => {
    if (!discountId || values.discount.includes(discountId)) return;
    onChange('discount', [...values.discount, discountId]);
    setSelectedDiscount('');
  };

  const handleRemoveDiscount = (discountId: string) => {
    onChange('discount', values.discount.filter(id => id !== discountId));
  };

  const getDiscountInfo = (discountId: string) => {
    return discounts.find(d => d.id_giam_gia === discountId);
  };

  const filteredDiscounts = discounts.filter(d => {
    const searchLower = searchQuery.toLowerCase();
    return !values.discount.includes(d.id_giam_gia) && 
      (d.ten_giam_gia.toLowerCase().includes(searchLower) || 
       d.ma_giam_gia.toLowerCase().includes(searchLower));
  });

  return (
    <div className={cn(
      "rounded-xl border border-slate-200 shadow-sm p-4",
      size?.trang_thai === 'HoatDong' ? 'bg-slate-50' : 'bg-slate-100'
    )}>
      <div className="flex items-center gap-3 mb-3">
        <span className="w-5 h-5 rounded-full border border-slate-200" style={{background: '#f3f4f6'}}></span>
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700">{color?.ten_mau_sac} / {size?.ten_kich_co}</span>
          {color?.trang_thai !== 'HoatDong' && (
            <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
              Màu không hoạt động
            </span>
          )}
          {size?.trang_thai !== 'HoatDong' && (
            <span className="text-xs bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">
              Kích cỡ không hoạt động
            </span>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
            Số lượng <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            placeholder="Số lượng"
            value={values.stock ?? ''}
            onChange={e => onChange('stock', parseInt(e.target.value) || 0)}
            className={cn(
              "h-10 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base",
              errors.stock && "border-red-500 focus:border-red-500 focus:ring-red-200",
              size?.trang_thai !== 'HoatDong' && "bg-slate-50"
            )}
          />
          {errors.stock && <div className="text-xs text-red-500 mt-1">{errors.stock}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
            Giá nhập <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            placeholder="Giá nhập"
            value={values.importPrice ?? ''}
            onChange={e => onChange('importPrice', parseInt(e.target.value) || 0)}
            className={cn(
              "h-10 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base",
              errors.importPrice && "border-red-500 focus:border-red-500 focus:ring-red-200",
              size?.trang_thai !== 'HoatDong' && "bg-slate-50"
            )}
          />
          {errors.importPrice && <div className="text-xs text-red-500 mt-1">{errors.importPrice}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
            Giá bán <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            placeholder="Giá bán"
            value={values.price ?? ''}
            onChange={e => onChange('price', parseInt(e.target.value) || 0)}
            className={cn(
              "h-10 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base",
              errors.price && "border-red-500 focus:border-red-500 focus:ring-red-200",
              size?.trang_thai !== 'HoatDong' && "bg-slate-50"
            )}
          />
          {errors.price && <div className="text-xs text-red-500 mt-1">{errors.price}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
            <Tag className="h-4 w-4 text-orange-500" /> Chương trình giảm giá
          </label>
          <div className="space-y-2">
            <Select
              value={selectedDiscount}
              onValueChange={handleAddDiscount}
              disabled={loading}
            >
              <SelectTrigger className={cn(
                "h-10 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-base",
                errors.discount && "border-red-500 focus:border-red-500 focus:ring-red-200",
                loading && "opacity-50 cursor-not-allowed",
                (size?.trang_thai !== 'HoatDong' || color?.trang_thai !== 'HoatDong') && "bg-slate-50"
              )}>
                <SelectValue placeholder={
                  loading ? "Đang tải..." : "Chọn chương trình giảm giá"
                } />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 pb-2">
                  <Input
                    placeholder="Tìm theo tên hoặc mã..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                {filteredDiscounts.length === 0 ? (
                  <div className="px-2 py-2 text-sm text-slate-500 text-center">
                    Không tìm thấy chương trình giảm giá
                  </div>
                ) : (
                  filteredDiscounts.map(discount => (
                    <SelectItem key={discount.id_giam_gia} value={discount.id_giam_gia}>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{discount.ten_giam_gia}</span>
                          <Badge className="text-xs font-mono bg-white border border-slate-200 text-slate-700">
                          {discount.ma_giam_gia}
                          </Badge>
                          <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded">
                            {discount.kieu_giam_gia === 'PhanTram' 
                              ? `${discount.gia_tri_giam}%`
                              : formatCurrency(discount.gia_tri_giam)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {format(new Date(discount.thoi_gian_bat_dau), 'dd/MM/yyyy HH:mm')} - {format(new Date(discount.thoi_gian_ket_thuc), 'dd/MM/yyyy HH:mm')}
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            {/* Selected discounts */}
            <div className="flex flex-wrap gap-2 mt-2">
              {values.discount.map(discountId => {
                const discount = getDiscountInfo(discountId);
                if (!discount) return null;
                
                return (
                  <Badge 
                    key={discountId}
                    className={cn(
                      "flex items-center gap-1 px-2 py-1",
                      (size?.trang_thai === 'HoatDong' && color?.trang_thai === 'HoatDong')
                        ? "bg-slate-100 text-slate-700"
                        : "bg-slate-200 text-slate-500"
                    )}
                  >
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-1">
                        <span>{discount.ten_giam_gia}</span>
                        <Badge className="text-xs font-mono bg-white border border-slate-200 text-slate-700">
                          {discount.ma_giam_gia}
                        </Badge>
                        <span className="text-xs bg-orange-100 text-orange-600 px-1 rounded">
                          {discount.kieu_giam_gia === 'PhanTram' 
                            ? `${discount.gia_tri_giam}%`
                            : formatCurrency(discount.gia_tri_giam)}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {format(new Date(discount.thoi_gian_bat_dau), 'dd/MM/yyyy HH:mm')} - {format(new Date(discount.thoi_gian_ket_thuc), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDiscount(discountId)}
                      className="ml-1 hover:text-red-500"
                      title="Xóa giảm giá"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          </div>
          {errors.discount && <div className="text-xs text-red-500 mt-1">{errors.discount}</div>}
        </div>
      </div>
    </div>
  );
} 