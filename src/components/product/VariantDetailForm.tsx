import React from 'react';
import { Input } from '@/components/ui/input';
import Combobox from '@/components/ui/combobox';
import { Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MauSac } from '@/types/mau-sac';
import { KichCo } from '@/types/kich-co';
import { GiamGia } from '@/types/giam-gia';

interface VariantDetailFormProps {
  color: MauSac | undefined;
  size: KichCo | undefined;
  values: { stock: number; importPrice: number; price: number; discount: string };
  discounts: GiamGia[];
  errors?: { [key: string]: string };
  onChange: (field: 'stock' | 'importPrice' | 'price' | 'discount', value: number | string) => void;
}

export default function VariantDetailForm({ color, size, values, discounts, errors = {}, onChange }: VariantDetailFormProps) {
  return (
    <div className="rounded-xl border border-slate-200 shadow-sm p-4 bg-slate-50">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-5 h-5 rounded-full border border-slate-200" style={{background: '#f3f4f6'}}></span>
        <span className="font-medium text-slate-700">{color?.ten_mau_sac} / {size?.ten_kich_co}</span>
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
              errors.stock && "border-red-500 focus:border-red-500 focus:ring-red-200"
            )}
            data-error-field={errors.stock}
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
              errors.importPrice && "border-red-500 focus:border-red-500 focus:ring-red-200"
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
              errors.price && "border-red-500 focus:border-red-500 focus:ring-red-200"
            )}
          />
          {errors.price && <div className="text-xs text-red-500 mt-1">{errors.price}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1 flex items-center gap-1">
            <Tag className="h-4 w-4 text-orange-500" /> Chương trình giảm giá
          </label>
          <Combobox
            items={discounts}
            value={values.discount}
            onValueChange={value => onChange('discount', value)}
            placeholder="Chọn chương trình giảm giá"
            getLabel={(item: GiamGia) => item.ten_giam_gia}
            getValue={(item: GiamGia) => item.id_giam_gia}
            className={cn(errors.discount ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : '', 'text-base h-10')}
          />
          {errors.discount && <div className="text-xs text-red-500 mt-1">{errors.discount}</div>}
        </div>
      </div>
    </div>
  );
} 