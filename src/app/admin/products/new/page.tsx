"use client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Tag } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { ThemSanPhamChiTietAdminDTO } from "@/types/san-pham-chi-tiet";
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { attributeService } from '@/services/attribute.service';
import ProductGeneralInfoForm from '@/components/product/ProductGeneralInfoForm';
import ColorTabs from '@/components/product/ColorTabs';
import { useProductForm } from '@/hooks/useProductForm';


// Thêm hàm chuyển File sang base64
const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function NewProductPage() {
  const router = useRouter();
  const [defaultProductImage, setDefaultProductImage] = useState<File | null>(null);
  const form = useProductForm(router, defaultProductImage, setDefaultProductImage);
  const [loading, setLoading] = useState(false);
  const [attrLoading, setAttrLoading] = useState(false);


  useEffect(() => {
    // TODO: Gọi API chương trình giảm giá nếu có, hoặc để mock
  }, []);

  useEffect(() => {
    setAttrLoading(true);
    Promise.all([
      // Giả sử các hàm này trả về promise
      attributeService.getAttributes('ThuongHieu'),
      attributeService.getAttributes('KieuDang'),
      attributeService.getAttributes('ChatLieu'),
      attributeService.getAttributes('XuatXu'),
      attributeService.getAttributes('DanhMuc'),
      attributeService.getAttributes('MauSac'),
      attributeService.getAttributes('KichCo'),
    ]).finally(() => setAttrLoading(false));
  }, []);

  useEffect(() => {
    const processVariants = async () => {
      const chiTiets: ThemSanPhamChiTietAdminDTO[] = [];
      
      // Process all images first
      const imagePromises = Object.entries(form.variantImages).map(async ([colorId, files]) => {
        const processedImages = await Promise.all(
          (files as File[]).map(async (file) => ({
            hinh_anh_urls: await readFileAsBase64(file),
            mac_dinh: false
          }))
        );
        return { colorId, processedImages };
      });
      
      const processedImagesMap = new Map(
        (await Promise.all(imagePromises)).map(({ colorId, processedImages }) => [colorId, processedImages])
      );

      // Create chiTiets with processed images
      for (const colorId of form.selectedColors) {
        const sizes = form.selectedSizesByColor[colorId] || [];
        for (const sizeId of sizes) {
          if (!sizeId) continue;
          const values = form.variantValues[colorId]?.[sizeId] || {};
          chiTiets.push({
            id_mau_sac: colorId,
            id_kich_co: sizeId,
            so_luong: values.stock || 0,
            gia_nhap: values.importPrice || 0,
            gia_ban: values.price || 0,
            id_giam_gia: values.discount || '',
            them_hinh_anh_spcts: processedImagesMap.get(colorId) || []
          });
        }
      }
      
      form.setProduct(prev => ({ ...prev, SanPhamChiTiets: chiTiets }));
    };
    
    processVariants();
  }, [form.selectedColors, form.selectedSizesByColor, form.variantValues, form.variantImages]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await form.handleSubmit();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      {(loading || attrLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
            <p className="mt-4 text-white text-lg font-semibold">Đang xử lý...</p>
          </div>
        </div>
      )}
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => form.originalPush('/admin/products')} disabled={loading || attrLoading}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-bold text-slate-800">Thêm sản phẩm mới</h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="h-12 rounded-lg font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-base" disabled={loading || attrLoading}>Lưu nháp</Button>
              <Button onClick={handleSubmit} className="h-12 rounded-lg font-medium bg-blue-500 text-white hover:bg-blue-600 transition text-base" disabled={loading || attrLoading}>Thêm sản phẩm</Button>
            </div>
          </div>
          {/* Main content */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 space-y-6">
              <ProductGeneralInfoForm
                product={form.product}
                errors={form.errors}
                brands={form.brands}
                styles={form.styles}
                materials={form.materials}
                origins={form.origins}
                categories={form.categories}
                onChange={form.handleProductChange}
                tenSanPhamRef={form.tenSanPhamRef}
                defaultProductImage={defaultProductImage}
                setDefaultProductImage={setDefaultProductImage}
                onPreview={form.setPreviewImageUrl}
              />
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Package className="h-6 w-6 text-blue-500" /> Chọn màu (phân loại)
                </h2>
                <ColorTabs
                  selectedColors={form.selectedColors}
                  colors={form.colors}
                  selectedColorTab={form.selectedColorTab}
                  onTabChange={form.setSelectedColorTab}
                  onAddColor={form.handleAddColorTab}
                  onRemoveColor={form.handleRemoveColorTab}
                  addColorOpen={form.addColorOpen}
                  setAddColorOpen={form.setAddColorOpen}
                  selectedSizesByColor={form.selectedSizesByColor}
                  sizes={form.sizes}
                  variantImages={form.variantImages}
                  errors={form.errors}
                  setVariantImages={form.setVariantImages}
                  updateVariantImages={form.updateVariantImages}
                  setPreviewImageUrl={form.setPreviewImageUrl}
                  handleToggleSizeForColor={form.handleToggleSizeForColor}
                  discounts={form.discounts}
                  variantValues={form.variantValues}
                  handleVariantValueChange={form.handleVariantValueChange}
                  onDeleteColor={form.handleRemoveColorTab}
                  onDeleteSize={form.handleToggleSizeForColor}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Dialog preview ảnh lớn */}
      <Dialog open={!!form.previewImageUrl} onOpenChange={open => !open && form.setPreviewImageUrl(null)}>
        <DialogContent className="z-50 bg-transparent p-0 border-none">
          <DialogTitle className="sr-only">Xem ảnh lớn</DialogTitle>
          {form.previewImageUrl && (
            <img
              src={form.previewImageUrl}
              alt="Preview lớn"
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-lg"
              style={{ margin: "auto" }}
            />
          )}
        </DialogContent>
      </Dialog>
      {/* AlertDialog xác nhận reload/rời trang */}
      <AlertDialog open={form.showLeaveAlert} onOpenChange={form.setShowLeaveAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn rời khỏi trang?</AlertDialogTitle>
            <AlertDialogDescription>
              Mọi thay đổi chưa lưu sẽ bị mất. Bạn có muốn tiếp tục không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              form.setShowLeaveAlert(false);
              form.setPendingUnloadEvent(null);
            }}>Ở lại</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              form.setShowLeaveAlert(false);
              if (form.pendingRoute) {
                form.originalPush(form.pendingRoute);
                form.setPendingRoute(null);
              } else {
                setTimeout(() => {
                  if (form.pendingUnloadEvent) {
                    window.removeEventListener('beforeunload', () => {});
                    window.location.reload();
                  }
                }, 100);
              }
            }}>Rời đi</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
} 