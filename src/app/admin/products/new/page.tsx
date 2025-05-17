"use client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Tag, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { ThemSanPhamChiTietAdminDTO } from "@/types/san-pham-chi-tiet";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { attributeService } from '@/services/attribute.service';
import ProductGeneralInfoForm from '@/components/product/ProductGeneralInfoForm';
import ColorTabs from '@/components/product/ColorTabs';
import { useProductForm } from '@/hooks/useProductForm';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "react-hot-toast";


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
  const [isQuickAddColorOpen, setIsQuickAddColorOpen] = useState(false);
  const [isQuickAddSizeOpen, setIsQuickAddSizeOpen] = useState(false);
  const [newQuickColor, setNewQuickColor] = useState({ ten_mau_sac: "", mo_ta: "" });
  const [newQuickSize, setNewQuickSize] = useState({ ten_kich_co: "", mo_ta: "" });

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

  const handleQuickAddColor = async () => {
    try {
      await attributeService.createAttribute('MauSac', {
        ten_mau_sac: newQuickColor.ten_mau_sac,
        mo_ta: newQuickColor.mo_ta,
        trang_thai: "HoatDong"
      });
      
      // Refresh colors list
      const updatedColors = await attributeService.getAttributes('MauSac');
      form.setColors(updatedColors);
      
      // Reset form and close dialog
      setNewQuickColor({ ten_mau_sac: "", mo_ta: "" });
      setIsQuickAddColorOpen(false);
      
      toast.success("Thêm màu sắc thành công");
    } catch (error: any) {
      toast.error(error.response?.data || "Không thể thêm màu sắc");
    }
  };

  const handleQuickAddSize = async () => {
    try {
      await attributeService.createAttribute('KichCo', {
        ten_kich_co: newQuickSize.ten_kich_co,
        mo_ta: newQuickSize.mo_ta,
        trang_thai: "HoatDong"
      });
      
      // Refresh sizes list
      const updatedSizes = await attributeService.getAttributes('KichCo');
      form.setSizes(updatedSizes);
      
      // Reset form and close dialog
      setNewQuickSize({ ten_kich_co: "", mo_ta: "" });
      setIsQuickAddSizeOpen(false);
      
      toast.success("Thêm kích cỡ thành công");
    } catch (error: any) {
      toast.error(error.response?.data || "Không thể thêm kích cỡ");
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
                  addColorButton={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsQuickAddColorOpen(true)}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm màu mới
                    </Button>
                  }
                  addSizeButton={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsQuickAddSizeOpen(true)}
                      className="gap-1"
                    >
                      <Plus className="h-4 w-4" />
                      Thêm cỡ mới
                    </Button>
                  }
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

      {/* Quick Add Color Dialog */}
      <Dialog open={isQuickAddColorOpen} onOpenChange={setIsQuickAddColorOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Thêm màu sắc mới</DialogTitle>
            <DialogDescription>
              Thêm nhanh màu sắc mới cho sản phẩm
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quick-color-name">Tên màu sắc <span className="text-red-500">*</span></Label>
              <Input
                id="quick-color-name"
                placeholder="Nhập tên màu sắc"
                value={newQuickColor.ten_mau_sac}
                onChange={(e) => setNewQuickColor(prev => ({ ...prev, ten_mau_sac: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-color-desc">Mô tả</Label>
              <Input
                id="quick-color-desc"
                placeholder="Nhập mô tả"
                value={newQuickColor.mo_ta}
                onChange={(e) => setNewQuickColor(prev => ({ ...prev, mo_ta: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickAddColorOpen(false)}>Hủy</Button>
            <Button onClick={handleQuickAddColor} disabled={!newQuickColor.ten_mau_sac}>Thêm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Add Size Dialog */}
      <Dialog open={isQuickAddSizeOpen} onOpenChange={setIsQuickAddSizeOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Thêm kích cỡ mới</DialogTitle>
            <DialogDescription>
              Thêm nhanh kích cỡ mới cho sản phẩm
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="quick-size-name">Tên kích cỡ <span className="text-red-500">*</span></Label>
              <Input
                id="quick-size-name"
                placeholder="Nhập tên kích cỡ"
                value={newQuickSize.ten_kich_co}
                onChange={(e) => setNewQuickSize(prev => ({ ...prev, ten_kich_co: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quick-size-desc">Mô tả</Label>
              <Input
                id="quick-size-desc"
                placeholder="Nhập mô tả"
                value={newQuickSize.mo_ta}
                onChange={(e) => setNewQuickSize(prev => ({ ...prev, mo_ta: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuickAddSizeOpen(false)}>Hủy</Button>
            <Button onClick={handleQuickAddSize} disabled={!newQuickSize.ten_kich_co}>Thêm</Button>
          </DialogFooter>
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