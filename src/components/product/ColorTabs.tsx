import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Image as ImageIcon, Package, Star } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import VariantImageDropzone from './VariantImageDropzone';
import VariantDetailForm from './VariantDetailForm';
import { cn } from '@/lib/utils';
import { MauSac } from '@/types/mau-sac';
import { KichCo } from '@/types/kich-co';
import { GiamGia } from '@/types/giam-gia';
import { Button } from '@/components/ui/button';

interface ColorTabsProps {
  selectedColors: string[];
  colors: MauSac[];
  selectedColorTab: string;
  onTabChange: (colorId: string) => void;
  onAddColor: (colorId: string) => void;
  onRemoveColor: (colorId: string) => void;
  addColorOpen: boolean;
  setAddColorOpen: (open: boolean) => void;
  selectedSizesByColor: Record<string, string[]>;
  sizes: KichCo[];
  variantImages: Record<string, File[]>;
  errors: { [key: string]: string };
  setVariantImages: (images: Record<string, File[]>) => void;
  updateVariantImages?: (colorId: string, images: File[]) => Promise<void>;
  setPreviewImageUrl: (url: string) => void;
  handleToggleSizeForColor: (colorId: string, sizeId: string) => void;
  discounts: GiamGia[];
  variantValues: Record<string, Record<string, { stock: number; importPrice: number; price: number; discount: string; images: File[] }>>;
  handleVariantValueChange: (colorId: string, sizeId: string, field: 'stock' | 'importPrice' | 'price' | 'discount', value: any) => void;
  onDeleteColor: (colorId: string) => void;
  onDeleteSize: (colorId: string, sizeId: string) => void;
}

export default function ColorTabs({
  selectedColors,
  colors,
  selectedColorTab,
  onTabChange,
  onAddColor,
  onRemoveColor,
  addColorOpen,
  setAddColorOpen,
  selectedSizesByColor,
  sizes,
  variantImages,
  errors,
  setVariantImages,
  updateVariantImages,
  setPreviewImageUrl,
  handleToggleSizeForColor,
  discounts,
  variantValues,
  handleVariantValueChange,
  onDeleteColor,
  onDeleteSize,
}: ColorTabsProps) {
  
  return (
    <Tabs value={selectedColorTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="mb-6 flex gap-2">
        {selectedColors.map(colorId => {
          const color = colors.find(c => String(c.id_mau_sac) === colorId);
          return (
            <TabsTrigger key={colorId} value={colorId} className="flex items-center gap-2 min-w-[120px] h-10 px-5 py-2 rounded-xl border-2 text-base font-medium shadow-sm transition-all data-[state=active]:bg-blue-50 data-[state=active]:border-blue-500">
              <span className="w-5 h-5 rounded-full border border-slate-200" style={{background: '#f3f4f6'}}></span>
              {color?.ten_mau_sac}
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                {variantImages[colorId]?.length || 0} ảnh
              </span>
              <span
                className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                onClick={e => { e.stopPropagation(); onRemoveColor(colorId); }}
                tabIndex={0}
                role="button"
                aria-label="Xóa màu"
              >
                ×
              </span>
            </TabsTrigger>
          );
        })}
        {/* Add color button with popover */}
        <Popover open={addColorOpen} onOpenChange={setAddColorOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 min-w-[120px] h-10 px-5 py-2 rounded-xl border-2 text-base font-medium shadow-sm transition-all bg-white border-slate-200 hover:bg-slate-100"
              onClick={() => setAddColorOpen(true)}
            >
              <Plus className="w-5 h-5 text-green-500" /> Thêm màu
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-2 w-48">
            <div className="flex flex-col gap-1">
              {colors.filter(c => !selectedColors.includes(String(c.id_mau_sac))).length === 0 ? (
                <span className="text-slate-400 text-sm">Đã chọn hết màu</span>
              ) : (
                colors.filter(c => !selectedColors.includes(String(c.id_mau_sac))).map((color, idx) => (
                  <button
                    key={`${color.id_mau_sac}_${idx}`}
                    type="button"
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-blue-50 text-base font-medium"
                    onClick={() => {
                      onAddColor(String(color.id_mau_sac));
                      setAddColorOpen(false);
                    }}
                  >
                    <span className="w-5 h-5 rounded-full border border-slate-200" style={{background: '#f3f4f6'}}></span>
                    {color.ten_mau_sac}
                  </button>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </TabsList>
      {errors.SanPhamChiTiets && (
        <div className="text-xs text-red-500 mt-2 mb-2">
          {typeof errors.SanPhamChiTiets === 'string' ? errors.SanPhamChiTiets : 'Có lỗi xảy ra'}
        </div>
      )}
      {selectedColors.map(colorId => {
        const color = colors.find(c => String(c.id_mau_sac) === colorId);
        const selectedSizes = selectedSizesByColor[colorId] || [];
        const images = variantImages[colorId] || [];
        return (
          <TabsContent key={colorId} value={colorId} className="mt-4">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Package className="h-6 w-6 text-blue-500" /> Chọn màu (phân loại) <span className="text-red-500">*</span>
              </h2>
              <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                <ImageIcon className="h-4 w-4 text-blue-400" /> Hình ảnh cho sản phẩm màu {color?.ten_mau_sac} <span className="text-red-500">*</span>
              </label>
              <VariantImageDropzone
                colorId={colorId}
                images={images}
                setImages={(files: File[]) => {
                  if (files.length > 0 && Object.values(variantImages).every(imgs => !imgs || imgs.length === 0)) {
                    setPreviewImageUrl(URL.createObjectURL(files[0]));
                  }
                  const newImages = { ...variantImages };
                  newImages[colorId] = files;
                  setVariantImages(newImages);
                }}
                onPreview={url => setPreviewImageUrl(url)}
                variantImages={variantImages}
              />
              {errors[`${colorId}_images`] && (
                <div className="text-xs text-red-500 mt-1">
                  {typeof errors[`${colorId}_images`] === 'string' ? errors[`${colorId}_images`] : 'Có lỗi xảy ra'}
                </div>
              )}
            </div>
            <div className="mb-6">
              <label className="block text-base font-medium text-slate-700 mb-3 flex items-center gap-1">
                Chọn kích cỡ cho màu {color?.ten_mau_sac} <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {sizes.filter(size => size.id_kich_co).map((size: KichCo, idx) => (
                  <div key={`${colorId}_${size.id_kich_co || 'none'}_${idx}`} className="flex flex-col items-center">
                    <button
                      type="button"
                      className={`px-5 py-3 rounded-xl border-2 text-base font-medium shadow-sm transition-all
                        ${selectedSizes.includes(String(size.id_kich_co)) ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'}`}
                      onClick={() => handleToggleSizeForColor(colorId, String(size.id_kich_co))}
                    >
                      {size.ten_kich_co}
                    </button>
                    {errors[`${colorId}_${size.id_kich_co}_size`] && (
                      <div className="text-xs text-red-500 mt-1">
                        {typeof errors[`${colorId}_${size.id_kich_co}_size`] === 'string' 
                          ? errors[`${colorId}_${size.id_kich_co}_size`] 
                          : 'Có lỗi xảy ra'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-8">
              <h3 className="text-base font-semibold mb-4 text-slate-700">Chi tiết biến thể</h3>
              <div className="space-y-4">
                {selectedSizes.filter(sizeId => !!sizeId).map(sizeId => {
                  const key = `${colorId}_${sizeId}`;
                  const values = variantValues[colorId]?.[sizeId] || { stock: 0, importPrice: 0, price: 0, discount: 'none' };
                  return (
                    <VariantDetailForm
                      key={key}
                      color={color}
                      size={sizes.find(s => String(s.id_kich_co) === sizeId)}
                      values={values}
                      errors={{
                        stock: errors[`${colorId}_${sizeId}_stock`],
                        importPrice: errors[`${colorId}_${sizeId}_importPrice`],
                        price: errors[`${colorId}_${sizeId}_price`],
                        discount: errors[`${colorId}_${sizeId}_discount`],
                      }}
                      onChange={(field, value) => handleVariantValueChange(colorId, sizeId, field, value)}
                    />
                  );
                })}
              </div>
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}