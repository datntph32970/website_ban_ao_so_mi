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
import { Image as ImageIcon, Star, Trash2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

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
  defaultProductImage: File | null;
  setDefaultProductImage: (file: File | null) => void;
  onPreview: (url: string) => void;
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
  defaultProductImage,
  setDefaultProductImage,
  onPreview,
}: ProductGeneralInfoFormProps) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      console.log('onDrop - acceptedFiles:', acceptedFiles);
      if (acceptedFiles.length > 0) {
        console.log('Setting default image:', acceptedFiles[0]);
        setDefaultProductImage(acceptedFiles[0]);
        onPreview(URL.createObjectURL(acceptedFiles[0]));
      }
    },
    accept: { 'image/*': [] },
    multiple: false
  });

  console.log('Current defaultProductImage:', defaultProductImage);
  console.log('Current errors:', errors);

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
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            Ảnh mặc định sản phẩm <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col gap-4">
            {defaultProductImage ? (
              <div className="relative">
                <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-slate-200 bg-white flex items-center justify-center shadow-sm">
                  <div className="relative w-full h-full group">
                    <img
                      src={URL.createObjectURL(defaultProductImage)}
                      alt="Ảnh mặc định"
                      className="object-cover w-full h-full cursor-pointer"
                      onClick={() => onPreview(URL.createObjectURL(defaultProductImage))}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
                        onClick={() => onPreview(URL.createObjectURL(defaultProductImage))}
                        title="Xem ảnh lớn"
                      >
                        <ImageIcon className="w-5 h-5 text-slate-700" />
                      </button>
                      <button
                        type="button"
                        className="p-2 rounded-full bg-white/90 hover:bg-white transition-colors"
                        onClick={() => setDefaultProductImage(null)}
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={cn(
                  "w-40 h-40 rounded-xl flex flex-col items-center justify-center border-2 border-dashed cursor-pointer transition-all",
                  "bg-slate-50 border-slate-200 hover:border-blue-500 hover:bg-blue-50",
                  isDragActive ? "border-blue-500 bg-blue-50" : ""
                )}
              >
                <ImageIcon className="w-10 h-10 text-slate-400 mb-2" />
                <span className="text-sm text-slate-500 text-center px-4">
                  Kéo thả ảnh hoặc bấm để chọn
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  {...getInputProps()}
                />
              </div>
            )}
            <div className="text-xs text-slate-500">
              Ảnh mặc định sẽ hiển thị ở trang danh sách sản phẩm và là ảnh đại diện cho sản phẩm
            </div>
          </div>
          {errors.defaultImage && <div className="text-xs text-red-500 mt-1">{errors.defaultImage}</div>}
        </div>
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
            onValueChange={(val: string) => onChange('id_chat_lieu', val)}
            getLabel={(item) => {
              const i = item as ChatLieu;
              return i.ten_chat_lieu;
            }}
            getValue={(item) => String((item as ChatLieu).id_chat_lieu)}
            renderOption={(item) => {
              const i = item as ChatLieu;
              return (
                <span className="flex items-center gap-2">
                  <span>{i.ten_chat_lieu}</span>
                  <span className="text-xs text-slate-400">{i.ma_chat_lieu}</span>
                </span>
              );
            }}
            placeholder="Chọn chất liệu hoặc tìm theo tên/mã"
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
            onValueChange={(val: string) => onChange('id_kieu_dang', val)}
            getLabel={(item) => {
              const i = item as KieuDang;
              return i.ten_kieu_dang;
            }}
            getValue={(item) => String((item as KieuDang).id_kieu_dang)}
            renderOption={(item) => {
              const i = item as KieuDang;
              return (
                <span className="flex items-center gap-2">
                  <span>{i.ten_kieu_dang}</span>
                  <span className="text-xs text-slate-400">{i.ma_kieu_dang}</span>
                </span>
              );
            }}
            placeholder="Chọn kiểu dáng hoặc tìm theo tên/mã"
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
            onValueChange={(val: string) => onChange('id_thuong_hieu', val)}
            getLabel={(item) => {
              const i = item as ThuongHieu;
              return i.ten_thuong_hieu;
            }}
            getValue={(item) => String((item as ThuongHieu).id_thuong_hieu)}
            renderOption={(item) => {
              const i = item as ThuongHieu;
              return (
                <span className="flex items-center gap-2">
                  <span>{i.ten_thuong_hieu}</span>
                  <span className="text-xs text-slate-400">{i.ma_thuong_hieu}</span>
                </span>
              );
            }}
            placeholder="Chọn thương hiệu hoặc tìm theo tên/mã"
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
            onValueChange={(val: string) => onChange('id_xuat_xu', val)}
            getLabel={(item) => {
              const i = item as XuatXu;
              return i.ten_xuat_xu;
            }}
            getValue={(item) => String((item as XuatXu).id_xuat_xu)}
            renderOption={(item) => {
              const i = item as XuatXu;
              return (
                <span className="flex items-center gap-2">
                  <span>{i.ten_xuat_xu}</span>
                  <span className="text-xs text-slate-400">{i.ma_xuat_xu}</span>
                </span>
              );
            }}
            placeholder="Chọn xuất xứ hoặc tìm theo tên/mã"
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
            onValueChange={(val: string) => onChange('id_danh_muc', val)}
            getLabel={(item) => {
              const i = item as DanhMuc;
              return i.ten_danh_muc;
            }}
            getValue={(item) => String((item as DanhMuc).id_danh_muc)}
            renderOption={(item) => {
              const i = item as DanhMuc;
              return (
                <span className="flex items-center gap-2">
                  <span>{i.ten_danh_muc}</span>
                  <span className="text-xs text-slate-400">{i.ma_danh_muc}</span>
                </span>
              );
            }}
            placeholder="Chọn danh mục hoặc tìm theo tên/mã"
            className={cn(errors.id_danh_muc ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : '', 'text-base h-10')}
          />
          {errors.id_danh_muc && <div className="text-xs text-red-500 mt-1">{errors.id_danh_muc}</div>}
        </div>
      </div>
    </div>
  );
} 