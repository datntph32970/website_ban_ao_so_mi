import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Combobox from '@/components/ui/combobox';
import { cn } from '@/lib/utils';
import { ThemSanPhamAdminDTO } from '@/types/san-pham';
import { ThuongHieu } from '@/types/thuong-hieu';
import { KieuDang } from '@/types/kieu-dang';
import { ChatLieu } from '@/types/chat-lieu';
import { XuatXu } from '@/types/xuat-xu';
import { DanhMuc } from '@/types/danh-muc';

interface ProductGeneralInfoFormProps {
  product: ThemSanPhamAdminDTO;
  errors: { [key: string]: string };
  brands: ThuongHieu[];
  styles: KieuDang[];
  materials: ChatLieu[];
  origins: XuatXu[];
  categories: DanhMuc[];
  onChange: (field: keyof ThemSanPhamAdminDTO, value: string) => void;
  tenSanPhamRef: React.RefObject<HTMLInputElement>;
}

export default function ProductGeneralInfoForm({
  product,
  errors,
  brands,
  styles,
  materials,
  origins,
  categories,
  onChange,
  tenSanPhamRef,
}: ProductGeneralInfoFormProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
        Thông tin chung
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            Tên sản phẩm <span className="text-red-500">*</span>
          </label>
          <Input
            ref={tenSanPhamRef}
            value={product.ten_san_pham}
            onChange={(e) => onChange('ten_san_pham', e.target.value)}
            placeholder="Nhập tên sản phẩm"
            className={cn(
              "h-12 text-base rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
              errors.ten_san_pham && "border-red-500 focus:border-red-500 focus:ring-red-200"
            )}
          />
          {errors.ten_san_pham && <div className="text-xs text-red-500 mt-1">{errors.ten_san_pham}</div>}
        </div>
        <div></div>
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
          Mô tả sản phẩm <span className="text-red-500">*</span>
        </label>
        <Textarea
          value={product.mo_ta}
          onChange={(e) => onChange('mo_ta', e.target.value)}
          placeholder="Nhập mô tả sản phẩm"
          rows={3}
          className={cn(
            "rounded-lg bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
            errors.mo_ta && "border-red-500 focus:border-red-500 focus:ring-red-200"
          )}
        />
        {errors.mo_ta && <div className="text-xs text-red-500 mt-1">{errors.mo_ta}</div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            Chất liệu <span className="text-red-500">*</span>
          </label>
          <Combobox
            items={materials}
            value={product.id_chat_lieu}
            onValueChange={(value: string) => onChange('id_chat_lieu', value)}
            placeholder="Chọn chất liệu"
            getLabel={(item: ChatLieu) => item.ten_chat_lieu}
            getValue={(item: ChatLieu) => String(item.id_chat_lieu)}
            className={cn(errors.id_chat_lieu ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : '', 'text-base h-10')}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            Kiểu dáng <span className="text-red-500">*</span>
          </label>
          <Combobox
            items={styles}
            value={product.id_kieu_dang}
            onValueChange={(value: string) => onChange('id_kieu_dang', value)}
            placeholder="Chọn kiểu dáng"
            getLabel={(item: KieuDang) => item.ten_kieu_dang}
            getValue={(item: KieuDang) => String(item.id_kieu_dang)}
            className={cn(errors.id_kieu_dang ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : '', 'text-base h-10')}
          />
          {errors.id_kieu_dang && <div className="text-xs text-red-500 mt-1">{errors.id_kieu_dang}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            Thương hiệu <span className="text-red-500">*</span>
          </label>
          <Combobox
            items={brands}
            value={product.id_thuong_hieu}
            onValueChange={(value: string) => onChange('id_thuong_hieu', value)}
            placeholder="Chọn thương hiệu"
            getLabel={(item: ThuongHieu) => item.ten_thuong_hieu}
            getValue={(item: ThuongHieu) => String(item.id_thuong_hieu)}
            className={cn(errors.id_thuong_hieu ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : '', 'text-base h-10')}
          />
          {errors.id_thuong_hieu && <div className="text-xs text-red-500 mt-1">{errors.id_thuong_hieu}</div>}
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            Xuất xứ <span className="text-red-500">*</span>
          </label>
          <Combobox
            items={origins}
            value={product.id_xuat_xu}
            onValueChange={(value: string) => onChange('id_xuat_xu', value)}
            placeholder="Chọn xuất xứ"
            getLabel={(item: XuatXu) => item.ten_xuat_xu}
            getValue={(item: XuatXu) => String(item.id_xuat_xu)}
            className={cn(errors.id_xuat_xu ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : '', 'text-base h-10')}
          />
          {errors.id_xuat_xu && <div className="text-xs text-red-500 mt-1">{errors.id_xuat_xu}</div>}
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            Danh mục <span className="text-red-500">*</span>
          </label>
          <Combobox
            items={categories}
            value={product.id_danh_muc}
            onValueChange={(value: string) => onChange('id_danh_muc', value)}
            placeholder="Chọn danh mục"
            getLabel={(item: DanhMuc) => item.ten_danh_muc}
            getValue={(item: DanhMuc) => item.id_danh_muc}
            className={cn(errors.id_danh_muc ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : '', 'text-base h-10')}
          />
          {errors.id_danh_muc && <div className="text-xs text-red-500 mt-1">{errors.id_danh_muc}</div>}
        </div>
      </div>
    </div>
  );
} 