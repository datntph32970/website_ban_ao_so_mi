import { useQuery, useQueryClient } from "@tanstack/react-query";
import { giamGiaService } from "@/services/giam-gia.service";
import { ThamSoPhanTrangSanPhamDTO, PhanTrangSanPhamAdminDTO, SanPhamAdminDTO } from "@/types/san-pham";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect } from "react";
import { formatCurrency, getImageUrl, cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { attributeService } from "@/services/attribute.service";
import { DanhMuc } from "@/types/danh-muc";
import { ThuongHieu } from "@/types/thuong-hieu";
import { Checkbox } from "@/components/ui/checkbox";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { sanPhamService } from "@/services/san-pham.service";
import Link from "next/link";
import { Tag, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

interface AddProductsDialogProps {
  discountId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  fetchProducts: (id_giam_gia: string, params: ThamSoPhanTrangSanPhamDTO) => Promise<PhanTrangSanPhamAdminDTO>;
}

// Add CountdownDisplay component
const CountdownDisplay = ({ date, type }: { date: string, type: 'start' | 'end' }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const now = new Date().getTime();
    const target = new Date(date).getTime();
    return Math.max(0, target - now);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(date).getTime();
      setTimeLeft(Math.max(0, target - now));
    }, 1000);

    return () => clearInterval(interval);
  }, [date]);

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div className={cn(
      "text-xs inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium",
      type === 'end' ? (
        days === 0 && hours < 24 ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
      ) : "bg-blue-100 text-blue-700"
    )}>
      <span className="w-3 h-3 rounded-full animate-pulse bg-current opacity-75" />
      {type === 'end' ? "Kết thúc sau: " : "Bắt đầu sau: "}
      {days > 0 && `${days}d `}
      {hours.toString().padStart(2, '0')}:
      {minutes.toString().padStart(2, '0')}:
      {seconds.toString().padStart(2, '0')}
    </div>
  );
};

export function AddProductsDialog({ 
  discountId, 
  open, 
  onOpenChange,
  onSuccess,
  fetchProducts
}: AddProductsDialogProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageConfig, setPageConfig] = useState<ThamSoPhanTrangSanPhamDTO>({
    trang_hien_tai: 1,
    so_phan_tu_tren_trang: 10,
    tim_kiem: "",
    sap_xep_theo: "",
    sap_xep_tang: false,
    id_thuong_hieu: [],
    id_danh_muc: [],
    id_kieu_dang: [],
    id_chat_lieu: [],
    id_xuat_xu: [],
    gia_tu: undefined,
    gia_den: undefined
  });
  const [discountStatus, setDiscountStatus] = useState<"ChuaCoGiamGia" | "CoGiamGia" | "all">("all");
  const [selectedVariantForDiscounts, setSelectedVariantForDiscounts] = useState<any | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    giamGia: any;
  }>({
    open: false,
    giamGia: null
  });
  const [resultDialog, setResultDialog] = useState<{
    open: boolean;
    type: 'success' | 'warning' | 'error';
    title: string;
    message: string;
    skippedProducts?: string;
  }>({
    open: false,
    type: 'success',
    title: '',
    message: '',
  });

  // Query để lấy danh sách danh mục
  const { data: categories = [] } = useQuery<DanhMuc[]>({
    queryKey: ['categories'],
    queryFn: () => attributeService.getAttributes('DanhMuc')
  });

  // Query để lấy danh sách thương hiệu
  const { data: brands = [] } = useQuery<ThuongHieu[]>({
    queryKey: ['brands'],
    queryFn: () => attributeService.getAttributes('ThuongHieu')
  });

  // Query để lấy danh sách sản phẩm có thể áp dụng giảm giá
  const { data: productsData, isLoading } = useQuery<PhanTrangSanPhamAdminDTO>({
    queryKey: ['available-products-for-discount', discountId, pageConfig],
    queryFn: () => fetchProducts(discountId, pageConfig),
    enabled: open, // Only fetch when dialog is open
    gcTime: 0, // Don't keep the cache
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Query để lấy chi tiết sản phẩm khi mở rộng
  const { data: expandedProductDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['product-detail', expandedProductId],
    queryFn: () => {
      if (!expandedProductId) return null;
      return sanPhamService.getChiTietSanPham(expandedProductId);
    },
    enabled: !!expandedProductId && open,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Effect để cập nhật trạng thái checkbox sản phẩm dựa trên trạng thái checkbox sản phẩm chi tiết
  useEffect(() => {
    if (!productsData?.danh_sach || !Array.isArray(productsData.danh_sach)) return;

    const newSelectedProducts = productsData.danh_sach
      .filter((product: SanPhamAdminDTO) => {
        // Nếu sản phẩm đang được mở rộng, sử dụng dữ liệu từ expandedProductDetail
        if (expandedProductId === product.id_san_pham && expandedProductDetail) {
          const productVariants = expandedProductDetail.sanPhamChiTiets || [];
          return productVariants.length > 0 && 
            productVariants.every((variant: any) => selectedVariants.includes(variant.id_san_pham_chi_tiet));
        }
        // Nếu không, sử dụng dữ liệu từ productsData
        const productVariants = product.sanPhamChiTiets || [];
        return productVariants.length > 0 && 
          productVariants.every((variant: any) => selectedVariants.includes(variant.id_san_pham_chi_tiet));
      })
      .map((product: SanPhamAdminDTO) => product.id_san_pham);

    setSelectedProducts(newSelectedProducts);
  }, [selectedVariants, productsData, expandedProductId, expandedProductDetail]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      // Clear cache for these queries when dialog opens
      queryClient.removeQueries({ queryKey: ['available-products-for-discount'] });
      queryClient.removeQueries({ queryKey: ['product-detail'] });
      
      // Reset all states
      setSearchTerm("");
      setPageConfig({
        trang_hien_tai: 1,
        so_phan_tu_tren_trang: 10,
        tim_kiem: "",
        sap_xep_theo: "",
        sap_xep_tang: false,
        id_thuong_hieu: [],
        id_danh_muc: [],
        id_kieu_dang: [],
        id_chat_lieu: [],
        id_xuat_xu: [],
        gia_tu: undefined,
        gia_den: undefined
      });
      setSelectedProducts([]);
      setSelectedVariants([]);
      setExpandedProductId(null);
      setDiscountStatus("all");
      
      // Force refetch
      queryClient.refetchQueries({ queryKey: ['available-products-for-discount', discountId] });
    }
  }, [open, queryClient, discountId]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPageConfig(prev => ({
      ...prev,
      trang_hien_tai: 1,
      tim_kiem: value
    }));
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setPageConfig(prev => ({
      ...prev,
      trang_hien_tai: 1,
      tim_kiem: ""
    }));
  };

  const handleCategoryChange = (value: string) => {
    setPageConfig(prev => ({
      ...prev,
      trang_hien_tai: 1,
      id_danh_muc: value === "all" ? [] : [value]
    }));
  };

  const handleBrandChange = (value: string) => {
    setPageConfig(prev => ({
      ...prev,
      trang_hien_tai: 1,
      id_thuong_hieu: value === "all" ? [] : [value]
    }));
  };

  const handlePageChange = (newPage: number) => {
    setPageConfig(prev => ({
      ...prev,
      trang_hien_tai: newPage
    }));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageConfig(prev => ({
      ...prev,
      trang_hien_tai: 1,
      so_phan_tu_tren_trang: newSize
    }));
  };

  const handleSort = (column: string) => {
    setPageConfig(prev => ({
      ...prev,
      sap_xep_theo: column,
      sap_xep_tang: prev.sap_xep_theo === column ? !prev.sap_xep_tang : true
    }));
  };

  const handleProductClick = (productId: string) => {
    if (expandedProductId === productId) {
      setExpandedProductId(null);
    } else {
      setExpandedProductId(productId);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allProductIds = productsData?.danh_sach?.map((p: SanPhamAdminDTO) => p.id_san_pham) || [];
      setSelectedProducts(allProductIds);
      const allVariantIds = productsData?.danh_sach?.flatMap((p: SanPhamAdminDTO) => 
        p.sanPhamChiTiets?.map((v: any) => v.id_san_pham_chi_tiet) || []
      ) || [];
      setSelectedVariants(allVariantIds);
    } else {
      setSelectedProducts([]);
      setSelectedVariants([]);
    }
  };

  const handleSelectProduct = (product: SanPhamAdminDTO, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, product.id_san_pham]);
      // Select all variants of this product from expandedProductDetail if available
      const productDetail = expandedProductId === product.id_san_pham ? expandedProductDetail : product;
      const variantIds = productDetail?.sanPhamChiTiets?.map((v: any) => v.id_san_pham_chi_tiet) || [];
      setSelectedVariants(prev => {
        const newVariants = [...prev];
        variantIds.forEach((id: string) => {
          if (!newVariants.includes(id)) {
            newVariants.push(id);
          }
        });
        return newVariants;
      });
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== product.id_san_pham));
      // Unselect all variants of this product from expandedProductDetail if available
      const productDetail = expandedProductId === product.id_san_pham ? expandedProductDetail : product;
      const variantIds = productDetail?.sanPhamChiTiets?.map((v: any) => v.id_san_pham_chi_tiet) || [];
      setSelectedVariants(prev => prev.filter(id => !variantIds.includes(id)));
    }
  };

  const handleSelectVariant = (variantId: string, checked: boolean) => {
    setSelectedVariants(prev => {
      if (checked) {
        if (!prev.includes(variantId)) {
          return [...prev, variantId];
        }
        return prev;
      } else {
        return prev.filter(id => id !== variantId);
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      const response = await giamGiaService.themGiamGiaVaoSanPhamChiTiet({
        id_giam_gia: discountId,
        san_pham_chi_tiet_ids: selectedVariants
      });
      
      // Reset selections
      setSelectedProducts([]);
      setSelectedVariants([]);
      
      // Close dialog
      onOpenChange(false);
      toast.success(`Đã thêm ${selectedVariants.length} biến thể sản phẩm vào giảm giá thành công!`); 
      // Handle different response cases
      if (response.errors) {
        // Case: Some products already have discounts in the time period
        setResultDialog({
          open: true,
          type: 'error',
          title: 'Không thể thêm giảm giá',
          message: response.errors[0],
        });
      } else if (response.skipped) {
        // Case: Some products were skipped but others were added successfully
        setResultDialog({
          open: true,
          type: 'warning',
          title: 'Thêm giảm giá thành công (một phần)',
          message: response.message,
          skippedProducts: response.skipped,
        });
      } else {
        // Case: All products were added successfully
        setResultDialog({
          open: true,
          type: 'success',
          title: 'Thêm giảm giá thành công',
          message: `Đã thêm ${selectedVariants.length} biến thể sản phẩm vào giảm giá thành công!`,
        });
      }
      
      // Call onSuccess callback
      onSuccess?.();
    } catch (error: any) {
      console.error('Error adding products to discount:', error);
      if (error.response?.data?.errors?.[0]) {
        toast.error(error.response.data.errors[0]);
      } else {
        toast.error('Có lỗi xảy ra khi thêm sản phẩm vào giảm giá!');
      }
      setResultDialog({
        open: true,
        type: 'error',
        title: 'Lỗi',
        message: error.response?.data?.errors?.[0] || 
                error.response?.data?.message || 
                'Có lỗi xảy ra khi thêm sản phẩm vào giảm giá!',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDiscountStatusChange = (value: string) => {
    setDiscountStatus(value as "ChuaCoGiamGia" | "CoGiamGia" | "all");
    setPageConfig(prev => ({
      ...prev,
      trang_hien_tai: 1
    }));
  };

  const handleDeleteDiscount = async (giamGia: any) => {
    try {
      await giamGiaService.xoaGiamGiaKhoiSanPhamChiTiet({
        id_giam_gia: giamGia.id_giam_gia,
        san_pham_chi_tiet_ids: [selectedVariantForDiscounts.id_san_pham_chi_tiet]
      });
      
      // Show success message
      toast.success('Đã xóa giảm giá thành công!');
      
      // Invalidate and refetch all related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['available-products-for-discount'] }),
        queryClient.invalidateQueries({ queryKey: ['products'] }),
        queryClient.invalidateQueries({ queryKey: ['product-detail'] })
      ]);

      // Reset states
      setSelectedProducts([]);
      setSelectedVariants([]);
      setExpandedProductId(null);
      
      // Reset search and filters
      setSearchTerm("");
      setPageConfig({
        trang_hien_tai: 1,
        so_phan_tu_tren_trang: 10,
        tim_kiem: "",
        sap_xep_theo: "",
        sap_xep_tang: false,
        id_thuong_hieu: [],
        id_danh_muc: [],
        id_kieu_dang: [],
        id_chat_lieu: [],
        id_xuat_xu: [],
        gia_tu: undefined,
        gia_den: undefined
      });

      // Close both dialogs
      setDeleteConfirmation({ open: false, giamGia: null });
      setSelectedVariantForDiscounts(null);

      // Call onSuccess to trigger parent component update
      onSuccess?.();

    } catch (error) {
      console.error('Error removing discount:', error);
      toast.error('Có lỗi xảy ra khi xóa giảm giá!');
    }
  };

  const renderProductDetails = (product: SanPhamAdminDTO) => {
    if (isLoadingDetail) {
      return (
        <div className="p-4 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    const productDetail = expandedProductDetail || product;
    const productVariants = productDetail.sanPhamChiTiets || [];

    return (
      <div className="p-4 space-y-4 animate-in fade-in-50 slide-in-from-top-2 duration-200">
        {/* Thông tin sản phẩm */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p><span className="font-medium">Mã:</span> {productDetail.ma_san_pham}</p>
            <p><span className="font-medium">Tên:</span> {productDetail.ten_san_pham}</p>
            <p><span className="font-medium">Thương hiệu:</span> {productDetail.thuongHieu?.ten_thuong_hieu}</p>
          </div>
          <div className="space-y-1">
            <p><span className="font-medium">Danh mục:</span> {productDetail.danhMuc?.ten_danh_muc}</p>
            <div className="flex items-center gap-2">
              <span className="font-medium">Trạng thái:</span>
              <Badge className={productDetail.trang_thai === 'HoatDong' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                {productDetail.trang_thai === 'HoatDong' ? "Đang bán" : "Ngừng bán"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Danh sách sản phẩm chi tiết */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Danh sách biến thể</h3>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">Ảnh</TableHead>
                  <TableHead>Mã</TableHead>
                  <TableHead>Màu sắc</TableHead>
                  <TableHead>Kích cỡ</TableHead>
                  <TableHead className="text-right w-[80px]">Số lượng</TableHead>
                  <TableHead className="text-right w-[150px]">Giá</TableHead>
                  <TableHead>Giảm giá</TableHead>
                  <TableHead className="w-[30px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productVariants.map((variant: any) => {
                  const firstImage = variant.hinhAnhSanPhamChiTiets?.[0]?.hinh_anh_urls;
                  const now = new Date();
                  const activeDiscount = variant.giamGias?.find(
                    (discount: any) => 
                      new Date(discount.thoi_gian_bat_dau) <= now && 
                      new Date(discount.thoi_gian_ket_thuc) >= now
                  );

                  const upcomingDiscount = !activeDiscount && variant.giamGias?.find(
                    (discount: any) => new Date(discount.thoi_gian_bat_dau) > now
                  );

                  return (
                    <TableRow 
                      key={variant.id_san_pham_chi_tiet}
                      className={cn(
                        "transition-colors duration-200 cursor-pointer",
                        selectedVariants.includes(variant.id_san_pham_chi_tiet)
                          ? 'bg-blue-50 hover:bg-blue-100 shadow-sm'
                          : 'hover:bg-slate-50'
                      )}
                      onClick={() => handleSelectVariant(variant.id_san_pham_chi_tiet, !selectedVariants.includes(variant.id_san_pham_chi_tiet))}
                    >
                      <TableCell>
                        <div className="w-8 h-8 relative">
                          <img
                            src={getImageUrl(firstImage)}
                            alt={variant.ma_san_pham_chi_tiet}
                            className="w-full h-full object-cover rounded transition-transform duration-200 hover:scale-110"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs transition-colors duration-200">
                          {variant.ma_san_pham_chi_tiet}
                        </code>
                      </TableCell>
                      <TableCell>{variant.mauSac?.ten_mau_sac}</TableCell>
                      <TableCell>{variant.kichCo?.ten_kich_co}</TableCell>
                      <TableCell className="text-right">{variant.so_luong}</TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-0.5">
                          {activeDiscount ? (
                            <>
                              <p className="text-sm line-through text-slate-500">
                                {formatCurrency(variant.gia_ban)}
                              </p>
                              <div className="flex items-center justify-end gap-2">
                                <p className="text-sm font-medium text-red-600">
                                  {formatCurrency(activeDiscount.gia_tri_giam)}
                                </p>
                                <Badge className="text-xs bg-red-100 text-red-700">
                                  {activeDiscount.kieu_giam_gia === 'PhanTram' 
                                    ? `-${activeDiscount.gia_tri_giam}%` 
                                    : `-${formatCurrency(activeDiscount.gia_tri_giam || 0)}`}
                                </Badge>
                              </div>
                            </>
                          ) : (
                            <p className="text-sm font-medium">
                              {formatCurrency(variant.gia_ban)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {variant.giamGias && variant.giamGias.length > 0 ? (
                          <div className="flex flex-col gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="h-auto px-0 hover:bg-transparent hover:opacity-70 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVariantForDiscounts(variant);
                              }}
                            >
                              {(() => {
                                if (activeDiscount) {
                                  return (
                                    <div className="flex flex-col gap-2 items-start">
                                      <div className="flex items-center gap-2">
                                        <div className="flex -space-x-3">
                                          <Badge className={cn(
                                            "shadow-sm border-2 border-white font-medium",
                                            activeDiscount.kieu_giam_gia === 'PhanTram' 
                                              ? "bg-violet-500 text-white hover:bg-violet-600" 
                                              : "bg-teal-500 text-white hover:bg-teal-600"
                                          )}>
                                            {activeDiscount.kieu_giam_gia === 'PhanTram' 
                                              ? `-${activeDiscount.gia_tri_giam}%`
                                              : `-${formatCurrency(activeDiscount.gia_tri_giam)}`}
                                          </Badge>
                                        </div>
                                        {variant.giamGias.length > 1 && (
                                          <span className="text-xs text-slate-600 group-hover:text-violet-600 transition-colors">
                                            +{variant.giamGias.length - 1} khác
                                          </span>
                                        )}
                                      </div>
                                      <CountdownDisplay 
                                        date={activeDiscount.thoi_gian_ket_thuc} 
                                        type="end" 
                                      />
                                    </div>
                                  );
                                }

                                if (upcomingDiscount) {
                                  return (
                                    <div className="flex flex-col gap-2 items-start">
                                      <div className="flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-slate-400 group-hover:text-violet-500 transition-colors" />
                                        <span className="text-xs text-slate-600">
                                          Sắp giảm giá
                                        </span>
                                      </div>
                                      <CountdownDisplay 
                                        date={upcomingDiscount.thoi_gian_bat_dau} 
                                        type="start" 
                                      />
                                    </div>
                                  );
                                }

                                return (
                                  <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-slate-400 group-hover:text-violet-500 transition-colors" />
                                    <span className="text-xs text-slate-600">
                                      Xem lịch sử ({variant.giamGias.length})
                                    </span>
                                  </div>
                                );
                              })()}
                            </Button>
                          </div>
                        ) : (
                          <span className="text-muted-foreground transition-colors duration-300">
                            Không giảm giá
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={selectedVariants.includes(variant.id_san_pham_chi_tiet)}
                          onCheckedChange={(checked) => handleSelectVariant(variant.id_san_pham_chi_tiet, checked as boolean)}
                          className="transition-all duration-200"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[800px] max-h-[90vh] flex flex-col animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
          <DialogHeader className="animate-in fade-in-50 duration-300">
            <DialogTitle>Thêm sản phẩm vào giảm giá</DialogTitle>
            <DialogDescription>
              Chọn các sản phẩm và biến thể sản phẩm để áp dụng giảm giá
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="pt-1 grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in-50 duration-300 delay-100">
              <div className="relative ">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  className="pl-10 pr-10"
                  placeholder="Tìm kiếm sản phẩm..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700"
                    title="Xóa tìm kiếm"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Select
                value={pageConfig.id_danh_muc?.[0] || "all"}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả danh mục</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category.id_danh_muc} value={category.id_danh_muc}>
                      {category.ten_danh_muc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={pageConfig.id_thuong_hieu?.[0] || "all"}
                onValueChange={handleBrandChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn thương hiệu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thương hiệu</SelectItem>
                  {brands.map(brand => (
                    <SelectItem key={brand.id_thuong_hieu} value={brand.id_thuong_hieu}>
                      {brand.ten_thuong_hieu}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Đã chọn {selectedProducts.length} sản phẩm
                </div>
                <div className="text-sm text-gray-500">
                  Đã chọn {selectedVariants.length} biến thể
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 overflow-hidden flex-1 flex flex-col animate-in fade-in-50 duration-300 delay-200">
              <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <Table>
                  <TableHeader className="sticky top-0 bg-slate-50 z-10">
                    <TableRow className="hover:bg-slate-50">
                      <TableHead className="w-[30px]">
                        <Checkbox
                          checked={selectedProducts.length === (productsData?.danh_sach?.length || 0)}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-[40px]">STT</TableHead>
                      <TableHead className="w-[200px]">Thông tin sản phẩm</TableHead>
                      <TableHead>Mã</TableHead>
                      <TableHead>Thương hiệu</TableHead>
                      <TableHead>Danh mục</TableHead>
                      <TableHead>Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!productsData?.danh_sach?.length ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                            <p>Không tìm thấy sản phẩm nào</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      productsData.danh_sach
                        .filter((product: SanPhamAdminDTO) => !expandedProductId || product.id_san_pham === expandedProductId)
                        .map((product: SanPhamAdminDTO, idx: number) => (
                          <React.Fragment key={product.id_san_pham}>
                            <TableRow 
                              className={cn(
                                "cursor-pointer hover:bg-slate-50 transition-all duration-200",
                                expandedProductId === product.id_san_pham && "bg-slate-50"
                              )}
                              onClick={() => handleProductClick(product.id_san_pham)}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedProducts.includes(product.id_san_pham)}
                                  onCheckedChange={(checked) => handleSelectProduct(product, checked as boolean)}
                                  className="transition-all duration-200"
                                />
                              </TableCell>
                              <TableCell>{(pageConfig.trang_hien_tai! - 1) * pageConfig.so_phan_tu_tren_trang! + idx + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <img
                                    src={getImageUrl(product.url_anh_mac_dinh)}
                                    alt={product.ten_san_pham}
                                    className="w-8 h-8 object-cover rounded transition-all duration-200 hover:scale-110"
                                  />
                                  <Link 
                                    href={`/admin/products/${product.id_san_pham}`}
                                    className="font-medium line-clamp-1 hover:text-blue-600 transition-colors duration-200"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    {product.ten_san_pham}
                                  </Link>
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs transition-colors duration-200">
                                  {product.ma_san_pham}
                                </code>
                              </TableCell>
                              <TableCell>{product.thuongHieu?.ten_thuong_hieu}</TableCell>
                              <TableCell>{product.danhMuc?.ten_danh_muc}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    className={cn(
                                      "transition-all duration-200",
                                      product.trang_thai === 'HoatDong' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                    )}
                                  >
                                    {product.trang_thai === 'HoatDong' ? "Đang bán" : "Ngừng bán"}
                                  </Badge>
                                  <div className="transition-transform duration-200">
                                    {expandedProductId === product.id_san_pham ? (
                                      <ChevronUp className="h-4 w-4 text-slate-500" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4 text-slate-500" />
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                            {expandedProductId === product.id_san_pham && (
                              <TableRow>
                                <TableCell colSpan={7} className="p-0">
                                  <div className="max-h-[400px] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] transition-all duration-300 ease-in-out">
                                    {renderProductDetails(product)}
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4 animate-in fade-in-50 duration-300 delay-300">
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-500">
                  Hiển thị {productsData?.danh_sach?.length || 0} kết quả
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Hiển thị</span>
                  <Select
                    value={String(pageConfig.so_phan_tu_tren_trang)}
                    onValueChange={(value) => handlePageSizeChange(Number(value))}
                  >
                    <SelectTrigger className="h-8 w-[70px] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-gray-500">dòng</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="animate-in fade-in-50 duration-300 delay-300 mt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="transition-all duration-200 hover:bg-slate-100"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || selectedVariants.length === 0}
              className="transition-all duration-200 hover:bg-primary/90"
            >
              {isSubmitting ? 'Đang xử lý...' : 'Thêm sản phẩm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog hiển thị timeline giảm giá */}
      <Dialog open={!!selectedVariantForDiscounts} onOpenChange={() => setSelectedVariantForDiscounts(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader className="flex-none">
            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
              <Tag className="w-6 h-6 text-violet-500" />
              Lịch sử giảm giá
            </DialogTitle>
            <DialogDescription className="text-base">
              Chi tiết các đợt giảm giá của sản phẩm{" "}
              <span className="font-medium text-foreground">
                {selectedVariantForDiscounts?.ma_san_pham_chi_tiet}
              </span>
            </DialogDescription>
          </DialogHeader>

          {selectedVariantForDiscounts && selectedVariantForDiscounts.giamGias && (
            <div className="flex-1 overflow-y-auto pr-2 space-y-8 py-4">
              {/* Thống kê nhanh */}
              <div className="grid grid-cols-3 gap-4 sticky top-0 bg-white pb-4 z-10">
                {(() => {
                  const now = new Date();
                  const activeDiscounts = selectedVariantForDiscounts.giamGias.filter(
                    (discount: any) => 
                      new Date(discount.thoi_gian_bat_dau) <= now && 
                      new Date(discount.thoi_gian_ket_thuc) >= now
                  );

                  const upcomingDiscounts = selectedVariantForDiscounts.giamGias.filter(
                    (discount: any) => new Date(discount.thoi_gian_bat_dau) > now
                  );

                  const expiredDiscounts = selectedVariantForDiscounts.giamGias.filter(
                    (discount: any) => new Date(discount.thoi_gian_ket_thuc) < now
                  );

                  return (
                    <>
                      <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium opacity-80">Đang áp dụng</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{activeDiscounts.length}</div>
                          <p className="text-xs opacity-80">giảm giá</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium opacity-80">Sắp tới</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{upcomingDiscounts.length}</div>
                          <p className="text-xs opacity-80">giảm giá</p>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-slate-500 to-slate-600 text-white">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium opacity-80">Đã kết thúc</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="text-3xl font-bold">{expiredDiscounts.length}</div>
                          <p className="text-xs opacity-80">giảm giá</p>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className="h-6 w-1 bg-violet-500 rounded-full"></div>
                  Timeline giảm giá
                </h3>
                <div className="space-y-4">
                  {selectedVariantForDiscounts.giamGias.map((giamGia: any, index: number) => {
                    const now = new Date();
                    const isActive = 
                      new Date(giamGia.thoi_gian_bat_dau) <= now && 
                      new Date(giamGia.thoi_gian_ket_thuc) >= now;
                    const isUpcoming = new Date(giamGia.thoi_gian_bat_dau) > now;

                    return (
                      <div 
                        key={giamGia.id_giam_gia}
                        className={cn(
                          "relative flex items-center gap-4 p-6 rounded-xl border shadow-sm transition-all duration-200 hover:shadow-md",
                          isActive 
                            ? "bg-gradient-to-r from-emerald-500/10 to-transparent border-emerald-200" 
                            : isUpcoming 
                              ? "bg-gradient-to-r from-blue-500/10 to-transparent border-blue-200"
                              : "bg-gradient-to-r from-slate-500/10 to-transparent border-slate-200"
                        )}
                      >
                        {/* Dot and line */}
                        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-slate-200 mx-6"></div>
                        <div 
                          className={cn(
                            "w-4 h-4 rounded-full z-10 ring-4 ring-white",
                            isActive 
                              ? "bg-emerald-500" 
                              : isUpcoming 
                                ? "bg-blue-500"
                                : "bg-slate-500"
                          )}
                        ></div>

                        {/* Content */}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-lg">{giamGia.ten_giam_gia}</h4>
                                <Badge className="h-5 text-xs border border-current">
                                  {giamGia.ma_giam_gia}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {format(new Date(giamGia.thoi_gian_bat_dau), "dd/MM/yyyy HH:mm", { locale: vi })} 
                                {" - "} 
                                {format(new Date(giamGia.thoi_gian_ket_thuc), "dd/MM/yyyy HH:mm", { locale: vi })}
                              </p>
                              {isActive && (
                                <div className="mt-1">
                                  <CountdownDisplay date={giamGia.thoi_gian_ket_thuc} type="end" />
                                </div>
                              )}
                              {isUpcoming && (
                                <div className="mt-1">
                                  <CountdownDisplay date={giamGia.thoi_gian_bat_dau} type="start" />
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                className={cn(
                                  "font-medium",
                                  isActive 
                                    ? "bg-emerald-500 text-white" 
                                    : isUpcoming 
                                      ? "bg-blue-500 text-white"
                                      : "bg-slate-500 text-white"
                                )}
                              >
                                {isActive ? 'Đang áp dụng' :
                                 isUpcoming ? 'Sắp tới' :
                                 'Đã kết thúc'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteConfirmation({
                                    open: true,
                                    giamGia: giamGia
                                  });
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center gap-6">
                            <Badge 
                              className={cn(
                                "font-medium text-base px-3 py-1",
                                giamGia.kieu_giam_gia === 'PhanTram' 
                                  ? "bg-violet-500 text-white" 
                                  : "bg-teal-500 text-white"
                              )}
                            >
                              {giamGia.kieu_giam_gia === 'PhanTram' 
                                ? `-${giamGia.gia_tri_giam}%`
                                : `-${formatCurrency(giamGia.gia_tri_giam)}`}
                            </Badge>
                            <div className="flex items-center gap-2 text-base">
                              <span className="line-through text-slate-500">
                                {formatCurrency(selectedVariantForDiscounts.gia_ban)}
                              </span>
                              <ArrowRight className="w-4 h-4 text-muted-foreground" />
                              <span className="font-medium text-emerald-600">
                                {formatCurrency(
                                  giamGia.kieu_giam_gia === 'PhanTram'
                                    ? selectedVariantForDiscounts.gia_ban * (1 - giamGia.gia_tri_giam / 100)
                                    : selectedVariantForDiscounts.gia_ban - giamGia.gia_tri_giam
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteConfirmation.open} 
        onOpenChange={(open) => setDeleteConfirmation({ open, giamGia: open ? deleteConfirmation.giamGia : null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa giảm giá</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa giảm giá này khỏi biến thể sản phẩm? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          
          {deleteConfirmation.giamGia && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-slate-50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{deleteConfirmation.giamGia.ten_giam_gia}</span>
                      <Badge className="border border-slate-200">{deleteConfirmation.giamGia.ma_giam_gia}</Badge>
                    </div>
                    <Badge 
                      className={cn(
                        "font-medium",
                        deleteConfirmation.giamGia.kieu_giam_gia === 'PhanTram' 
                          ? "bg-violet-500 text-white" 
                          : "bg-teal-500 text-white"
                      )}
                    >
                      {deleteConfirmation.giamGia.kieu_giam_gia === 'PhanTram' 
                        ? `-${deleteConfirmation.giamGia.gia_tri_giam}%`
                        : `-${formatCurrency(deleteConfirmation.giamGia.gia_tri_giam)}`}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {format(new Date(deleteConfirmation.giamGia.thoi_gian_bat_dau), "dd/MM/yyyy HH:mm", { locale: vi })} 
                    {" - "} 
                    {format(new Date(deleteConfirmation.giamGia.thoi_gian_ket_thuc), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmation({ open: false, giamGia: null })}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleDeleteDiscount(deleteConfirmation.giamGia)}
            >
              Xác nhận xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Result Dialog */}
      <Dialog open={resultDialog.open} onOpenChange={(open) => setResultDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className={cn(
              "flex items-center gap-2",
              {
                "text-green-600": resultDialog.type === "success",
                "text-amber-600": resultDialog.type === "warning",
                "text-red-600": resultDialog.type === "error",
              }
            )}>
              {resultDialog.type === "success" && (
                <div className="h-2 w-2 rounded-full bg-green-500 ring-2 ring-green-500 ring-offset-2" />
              )}
              {resultDialog.type === "warning" && (
                <div className="h-2 w-2 rounded-full bg-amber-500 ring-2 ring-amber-500 ring-offset-2" />
              )}
              {resultDialog.type === "error" && (
                <div className="h-2 w-2 rounded-full bg-red-500 ring-2 ring-red-500 ring-offset-2" />
              )}
              {resultDialog.title}
            </DialogTitle>
            <DialogDescription>
              {resultDialog.message}
            </DialogDescription>
          </DialogHeader>

          {resultDialog.skippedProducts && (
            <div className="space-y-3">
              <div className="h-px bg-slate-200" />
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Các sản phẩm bị bỏ qua:</h4>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {resultDialog.skippedProducts}
                  </p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              onClick={() => setResultDialog(prev => ({ ...prev, open: false }))}
              className={cn({
                "bg-green-600 hover:bg-green-700": resultDialog.type === "success",
                "bg-amber-600 hover:bg-amber-700": resultDialog.type === "warning",
                "bg-red-600 hover:bg-red-700": resultDialog.type === "error",
              })}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 