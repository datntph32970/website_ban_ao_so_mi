"use client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Tag, Info, Image as ImageIcon, Edit, Trash2, Copy, Share2, Eye, EyeOff, AlertCircle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Search, ArrowUpDown, ShoppingCart, ArrowRight, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { SanPham } from "@/types/san-pham";
import { SanPhamChiTiet } from "@/types/san-pham-chi-tiet";
import { GiamGia } from "@/types/giam-gia";
import { sanPhamService } from "@/services/san-pham.service";
import { giamGiaService } from "@/services/giam-gia.service";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import useEmblaCarousel from 'embla-carousel-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface ExtendedSanPhamChiTiet extends SanPhamChiTiet {
  giamGias?: GiamGia[];
}

interface GiamGiaWithDates extends GiamGia {
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
}

// Add useCountdown hook
const useCountdown = (targetDate: string) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    return Math.max(0, target - now);
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      setTimeLeft(Math.max(0, target - now));
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds };
};

// Add CountdownDisplay component
const CountdownDisplay = ({ date, type }: { date: string, type: 'start' | 'end' }) => {
  const { days, hours, minutes, seconds } = useCountdown(date);
  const isNearEnd = days === 0 && hours < 24;

  return (
    <div className={cn(
      "text-xs inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium",
      type === 'end' ? (
        isNearEnd ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
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

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const productId = unwrappedParams.id;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  // All useState hooks
  const [product, setProduct] = useState<(SanPham & { sanPhamChiTiets?: ExtendedSanPhamChiTiet[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("general");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof ExtendedSanPhamChiTiet | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [filterSize, setFilterSize] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'HoatDong' | 'KhongHoatDong'>('HoatDong');
  const [selectedVariantForDiscounts, setSelectedVariantForDiscounts] = useState<ExtendedSanPhamChiTiet | null>(null);
  const [isRemovingDiscount, setIsRemovingDiscount] = useState(false);
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false);
  const [discountToRemove, setDiscountToRemove] = useState<GiamGiaWithDates | null>(null);

  // All useRef hooks
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });

  // All useCallback hooks
  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - imagePosition.x, y: e.clientY - imagePosition.y });
    }
  }, [zoomLevel, imagePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setImagePosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, zoomLevel, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleImageClick = useCallback((imageUrl: string, index: number) => {
    setIsImageLoading(true);
    setCurrentImageIndex(index);
    setSelectedImage(imageUrl);
    setZoomLevel(1);
    setImagePosition({ x: 0, y: 0 });
  }, []);

  const handleImageLoad = useCallback(() => {
    setIsImageLoading(false);
  }, []);

  const handleSort = useCallback((field: keyof SanPhamChiTiet) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }, [sortField, sortDirection]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVariants(filteredAndSortedVariants.map(v => v.id_san_pham_chi_tiet));
    } else {
      setSelectedVariants([]);
    }
  };

  const handleSelectVariant = (variantId: string, checked: boolean) => {
    if (checked) {
      setSelectedVariants(prev => [...prev, variantId]);
    } else {
      setSelectedVariants(prev => prev.filter(id => id !== variantId));
    }
  };

  // Add handler for updating status
  const handleUpdateStatus = async () => {
    try {
      setIsUpdatingStatus(true);
      await sanPhamService.capNhatTrangThaiNhieuSanPhamChiTiet(selectedVariants, selectedStatus);
      
      toast.success('Cập nhật trạng thái thành công');
      setIsUpdateStatusDialogOpen(false);
      setSelectedVariants([]);
      
      // Refresh product data
      const updatedProduct = await sanPhamService.getChiTietSanPham(productId);
      setProduct(updatedProduct);
    } catch (error: any) {
      toast.error(error.response?.data || 'Không thể cập nhật trạng thái');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Modify the handleRemoveDiscount function
  const handleRemoveDiscount = (giamGia: GiamGiaWithDates) => {
    setDiscountToRemove(giamGia);
    setIsConfirmRemoveOpen(true);
  };

  const confirmRemoveDiscount = async () => {
    if (!discountToRemove || !selectedVariantForDiscounts) return;

    try {
      setIsRemovingDiscount(true);
      await giamGiaService.xoaGiamGiaKhoiSanPhamChiTiet({
        id_giam_gia: discountToRemove.id_giam_gia,
        san_pham_chi_tiet_ids: [selectedVariantForDiscounts.id_san_pham_chi_tiet]
      });
      
      toast.success('Đã xóa giảm giá khỏi sản phẩm');
      
      // Refresh product data
      const updatedProduct = await sanPhamService.getChiTietSanPham(productId);
      setProduct(updatedProduct);
      
      // Close both dialogs
      setIsConfirmRemoveOpen(false);
      setDiscountToRemove(null);
      setSelectedVariantForDiscounts(null);
    } catch (error: any) {
      console.error('Error removing discount:', error);
      toast.error(error.response?.data || 'Không thể xóa giảm giá');
    } finally {
      setIsRemovingDiscount(false);
    }
  };

  // All useEffect hooks
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await sanPhamService.getChiTietSanPham(productId);
        setProduct(data);
      } catch (error) {
        toast.error("Không thể tải thông tin sản phẩm");
        router.push("/admin/products");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, router]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // All useMemo hooks
  const filteredAndSortedVariants = React.useMemo(() => {
    if (!product?.sanPhamChiTiets) return [];
    
    let filtered = [...product.sanPhamChiTiets];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(variant =>
        variant.ma_san_pham_chi_tiet.toLowerCase().includes(query) ||
        variant.kichCo?.ten_kich_co.toLowerCase().includes(query)
      );
    }

    // Apply color filter
    if (filterColor) {
      filtered = filtered.filter(variant => String(variant.mauSac?.id_mau_sac) === filterColor);
    }

    // Apply size filter
    if (filterSize) {
      filtered = filtered.filter(variant => String(variant.kichCo?.id_kich_co) === filterSize);
    }

    // Apply status filter
    if (filterStatus) {
      filtered = filtered.filter(variant => variant.trang_thai === filterStatus);
    }

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: string | number | undefined;
        let bValue: string | number | undefined;

        switch (sortField) {
          case 'ma_san_pham_chi_tiet':
            aValue = a.ma_san_pham_chi_tiet;
            bValue = b.ma_san_pham_chi_tiet;
            break;
          case 'so_luong':
            aValue = a.so_luong;
            bValue = b.so_luong;
            break;
          case 'gia_nhap':
            aValue = a.gia_nhap;
            bValue = b.gia_nhap;
            break;
          case 'gia_ban':
            aValue = a.gia_ban;
            bValue = b.gia_ban;
            break;
          default:
            return 0;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' 
            ? aValue - bValue
            : bValue - aValue;
        }

        return 0;
      });
    }

    return filtered;
  }, [product?.sanPhamChiTiets, searchQuery, filterColor, filterSize, filterStatus, sortField, sortDirection]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen bg-slate-50 py-8">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-8">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <Skeleton className="aspect-square rounded-xl" />
              </div>
              <div className="lg:col-span-2">
                <Skeleton className="h-96 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!product) {
    return null;
  }

  // Calculate total stock and average price
  const totalStock = product.sanPhamChiTiets ? product.sanPhamChiTiets.reduce((sum, variant) => sum + (variant.so_luong || 0), 0) : 0;
  const averagePrice = product.sanPhamChiTiets ? product.sanPhamChiTiets.reduce((sum, variant) => {
    const activeDiscount = variant.giamGias?.find(
      (discount: GiamGia) => 
        new Date(discount.thoi_gian_bat_dau) <= new Date() && 
        new Date(discount.thoi_gian_ket_thuc) >= new Date()
    );

    if (!activeDiscount) return sum + variant.gia_ban;

    const discountedPrice = activeDiscount.kieu_giam_gia === 'PhanTram'
      ? variant.gia_ban * (1 - activeDiscount.gia_tri_giam / 100)
      : variant.gia_ban - activeDiscount.gia_tri_giam;

    return sum + discountedPrice;
  }, 0) / product.sanPhamChiTiets.length : 0;
  const totalSold = product.sanPhamChiTiets ? product.sanPhamChiTiets.reduce((sum, variant) => sum + (variant.so_luong_da_ban || 0), 0) : 0;

  // Get unique colors
  const uniqueColors = product.sanPhamChiTiets ?
    Array.from(new Set(product.sanPhamChiTiets.map(variant => String(variant.mauSac?.id_mau_sac))))
      .map(colorId => product.sanPhamChiTiets?.find(v => String(v.mauSac?.id_mau_sac) === colorId)?.mauSac)
      .filter(Boolean) : [];

  // Get variants for selected color
  const variantsForSelectedColor = selectedColor ?
    product.sanPhamChiTiets?.filter(v => String(v.mauSac?.id_mau_sac) === selectedColor) :
    product.sanPhamChiTiets;

  // Get all images including default image
  const getAllImages = () => {
    interface ProductImage {
      id_hinh_anh: string;
      hinh_anh_urls: string;
      mac_dinh: boolean;
    }

    const images: ProductImage[] = [];

    // Add default product image first
    if (product?.url_anh_mac_dinh) {
      images.push({
        id_hinh_anh: 'default',
        hinh_anh_urls: product.url_anh_mac_dinh,
        mac_dinh: true
      });
    }

    // Add variant images
    if (selectedColor) {
      // If color is selected, only show images for that color
      const colorImages = product.sanPhamChiTiets?.find(v => String(v.mauSac?.id_mau_sac) === selectedColor)?.hinhAnhSanPhamChiTiets || [];
      images.push(...colorImages.map(img => ({ ...img, mac_dinh: false })));
    } else {
      // If no color selected, show all variant images
      product.sanPhamChiTiets?.forEach(variant => {
        variant.hinhAnhSanPhamChiTiets?.forEach(image => {
          if (!images.some(img => img.hinh_anh_urls === image.hinh_anh_urls)) {
            images.push({ ...image, mac_dinh: false });
          }
        });
      });
    }

    return images;
  };

  const imagesForDisplay = getAllImages();

  // Get unique sizes
  const uniqueSizes = product.sanPhamChiTiets ?
    Array.from(new Set(product.sanPhamChiTiets.map(variant => String(variant.kichCo?.id_kich_co))))
      .map(sizeId => product.sanPhamChiTiets?.find(v => String(v.kichCo?.id_kich_co) === sizeId)?.kichCo)
      .filter(Boolean) : [];

  const getPromotionStatus = (variant: ExtendedSanPhamChiTiet) => {
    const now = new Date();
    const activeDiscount = variant.giamGias?.find(
      (discount: GiamGia) => 
        new Date(discount.thoi_gian_bat_dau) <= now && 
        new Date(discount.thoi_gian_ket_thuc) >= now
    );

    if (!activeDiscount) {
      const upcomingDiscount = variant.giamGias?.find(
        (discount: GiamGia) => new Date(discount.thoi_gian_bat_dau) > now
      );
      return upcomingDiscount 
        ? { status: 'upcoming', label: 'Sắp áp dụng', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' }
        : { status: 'expired', label: 'Hết hiệu lực', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }

    const endDate = new Date(activeDiscount.thoi_gian_ket_thuc);
    const timeLeft = endDate.getTime() - now.getTime();
    const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    
    return {
      status: 'active',
      label: `Còn ${daysLeft} ngày`,
      color: daysLeft <= 3 
        ? 'bg-amber-50 text-amber-700 border-amber-100'
        : 'bg-emerald-50 text-emerald-700 border-emerald-100'
    };
  };

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => router.push("/admin/products")}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{product.ten_san_pham}</h1>
                <p className="text-sm text-slate-500">Mã sản phẩm: {product.ma_san_pham}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-10 w-10"
                      onClick={() => {
                        navigator.clipboard.writeText(product.ma_san_pham);
                        toast.success('Đã sao chép mã sản phẩm');
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sao chép mã sản phẩm</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="outline" className="h-10" onClick={() => router.push(`/admin/products/${productId}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Chỉnh sửa
              </Button>
              <Button variant="destructive" className="h-10" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa
              </Button>
            </div>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Tổng số lượng</p>
                    <p className="text-2xl font-bold">{totalStock}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Package className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Đã bán</p>
                    <p className="text-2xl font-bold">{totalSold}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Giá trung bình</p>
                    <p className="text-2xl font-bold">{formatCurrency(averagePrice)}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <Tag className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Số biến thể</p>
                    <p className="text-2xl font-bold">{product.sanPhamChiTiets?.length || 0}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Info className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">Trạng thái</p>
                    <Badge className={product.trang_thai === "HoatDong" ? "bg-green-500" : "bg-red-500"}>
                      {product.trang_thai === "HoatDong" ? "Đang bán" : "Ngừng bán"}
                    </Badge>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    {product.trang_thai === "HoatDong" ? (
                      <Eye className="w-6 h-6 text-yellow-600" />
                    ) : (
                      <EyeOff className="w-6 h-6 text-yellow-600" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Product images */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-blue-500" />
                    Hình ảnh sản phẩm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="overflow-hidden" ref={emblaRef}>
                      <div className="flex">
                        {imagesForDisplay.map((image, index) => (
                          <div key={image.id_hinh_anh} className="flex-[0_0_100%] min-w-0 relative aspect-square rounded-lg overflow-hidden group">
                            <Image
                              src={image.hinh_anh_urls.startsWith('/') ? API_BASE + image.hinh_anh_urls : image.hinh_anh_urls}
                              alt={`Hình ảnh ${index + 1}`}
                              fill
                              className="object-cover transition-transform group-hover:scale-105 cursor-zoom-in"
                              onClick={() => handleImageClick(image.hinh_anh_urls.startsWith('/') ? API_BASE + image.hinh_anh_urls : image.hinh_anh_urls, index)}
                            />
                            {image.mac_dinh && (
                              <Badge className="absolute top-2 right-2 bg-blue-500">Mặc định</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <button
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all hover:scale-110"
                      onClick={scrollPrev}
                      aria-label="Xem hình ảnh trước"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full shadow-md transition-all hover:scale-110"
                      onClick={scrollNext}
                      aria-label="Xem hình ảnh tiếp theo"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Color selection */}
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-500 mb-2">Màu sắc</p>
                    <div className="flex gap-2">
                      <button
                        className={`px-3 py-1 rounded-full border-2 transition-all duration-300 ease-in-out transform hover:scale-105 ${
                          selectedColor === null
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-transparent hover:border-blue-200'
                        }`}
                        onClick={() => setSelectedColor(null)}
                      >
                        Tất cả
                      </button>
                      {uniqueColors.map((color) => (
                        <button
                          key={color?.id_mau_sac}
                          className={`px-3 py-1 rounded-full border-2 transition-all duration-300 ease-in-out transform hover:scale-105 ${
                            selectedColor === String(color?.id_mau_sac)
                              ? 'border-blue-500 bg-blue-50 shadow-md'
                              : 'border-transparent hover:border-blue-200'
                          }`}
                          onClick={() => setSelectedColor(color?.id_mau_sac ? String(color.id_mau_sac) : null)}
                        >
                          {color?.ten_mau_sac}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Thumbnail list */}
                  <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                    {imagesForDisplay.map((image, index) => (
                      <button
                        key={image.id_hinh_anh}
                        className="flex-shrink-0 w-20 h-20 relative rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all duration-300 ease-in-out transform hover:scale-105"
                        onClick={() => emblaApi?.scrollTo(index)}
                      >
                        <Image
                          src={image.hinh_anh_urls.startsWith('/') ? API_BASE + image.hinh_anh_urls : image.hinh_anh_urls}
                          alt={`Thumbnail ${index + 1}`}
                          fill
                          className="object-cover transition-transform duration-300 ease-in-out hover:scale-110"
                        />
                        {image.mac_dinh && (
                          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        )}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column - Product details */}
            <div className="lg:col-span-2">
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">
                    <Info className="w-4 h-4 mr-2" />
                    Thông tin chung
                  </TabsTrigger>
                  <TabsTrigger value="variants">
                    <Package className="w-4 h-4 mr-2" />
                    Biến thể
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-6">
                  <div className="space-y-6">
                    {/* General Information Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Thông tin chung</CardTitle>
                        <CardDescription>Thông tin cơ bản về sản phẩm</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm font-medium text-slate-500">Tên sản phẩm</p>
                            <p className="mt-1">{product.ten_san_pham}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">Mã sản phẩm</p>
                            <p className="mt-1">{product.ma_san_pham}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">Thương hiệu</p>
                            <div className="mt-1">
                              <p>{product.thuongHieu?.ten_thuong_hieu}</p>
                              <p className="text-sm text-slate-500">Mã: {product.thuongHieu?.ma_thuong_hieu}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">Danh mục</p>
                            <div className="mt-1">
                              <p>{product.danhMuc?.ten_danh_muc}</p>
                              <p className="text-sm text-slate-500">Mã: {product.danhMuc?.ma_danh_muc}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">Kiểu dáng</p>
                            <div className="mt-1">
                              <p>{product.kieuDang?.ten_kieu_dang}</p>
                              <p className="text-sm text-slate-500">Mã: {product.kieuDang?.ma_kieu_dang}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">Chất liệu</p>
                            <div className="mt-1">
                              <p>{product.chatLieu?.ten_chat_lieu}</p>
                              <p className="text-sm text-slate-500">Mã: {product.chatLieu?.ma_chat_lieu}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">Xuất xứ</p>
                            <div className="mt-1">
                              <p>{product.xuatXu?.ten_xuat_xu}</p>
                              <p className="text-sm text-slate-500">Mã: {product.xuatXu?.ma_xuat_xu}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">Trạng thái</p>
                            <Badge className={product.trang_thai === "HoatDong" ? "bg-green-500" : "bg-red-500"}>
                              {product.trang_thai === "HoatDong" ? "Đang bán" : "Ngừng bán"}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-500">Mô tả</p>
                          <p className="mt-1 whitespace-pre-line">{product.mo_ta}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Metadata Card */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Thông tin bổ sung</CardTitle>
                        <CardDescription>Thông tin về người tạo và thời gian</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <p className="text-sm font-medium text-slate-500">Người tạo</p>
                            <div className="mt-1">
                              <p>{product.ten_nguoi_tao}</p>
                              <p className="text-sm text-slate-500">Mã: {product.ma_nguoi_tao}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-500">Ngày tạo</p>
                            <p className="mt-1">
                              {new Date(product.ngay_tao).toLocaleString('vi-VN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          {product.ngay_sua && (
                            <div>
                              <p className="text-sm font-medium text-slate-500">Cập nhật lần cuối</p>
                              <p className="mt-1">
                                {new Date(product.ngay_sua).toLocaleString('vi-VN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          )}
                          {product.ma_nguoi_sua && (
                            <div>
                              <p className="text-sm font-medium text-slate-500">Người cập nhật</p>
                              <div className="mt-1">
                                <p>{product.ten_nguoi_sua}</p>
                                <p className="text-sm text-slate-500">Mã: {product.ma_nguoi_sua}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="variants" className="mt-6">
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle>Biến thể sản phẩm</CardTitle>
                      <CardDescription>Danh sách các biến thể của sản phẩm</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {/* Filters and Search */}
                      <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="flex-1">
                          <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Tìm kiếm theo mã hoặc kích thước..."
                              className="pl-8"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                          </div>
                        </div>
                        <Select value={filterColor || "all"} onValueChange={(value) => setFilterColor(value === "all" ? null : value)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Lọc theo màu" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả màu</SelectItem>
                            {uniqueColors.map((color) => (
                              <SelectItem key={color?.id_mau_sac} value={String(color?.id_mau_sac)}>
                                {color?.ten_mau_sac}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={filterSize || "all"} onValueChange={(value) => setFilterSize(value === "all" ? null : value)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Lọc theo kích thước" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả kích thước</SelectItem>
                            {uniqueSizes.map((size) => (
                              <SelectItem key={size?.id_kich_co} value={String(size?.id_kich_co)}>
                                {size?.ten_kich_co}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={filterStatus || "all"} onValueChange={(value) => setFilterStatus(value === "all" ? null : value)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Lọc theo trạng thái" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tất cả trạng thái</SelectItem>
                            <SelectItem value="HoatDong">Đang bán</SelectItem>
                            <SelectItem value="KhongHoatDong">Ngừng bán</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Toolbar */}
                      {selectedVariants.length > 0 && (
                        <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg border">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-500">
                              Đã chọn {selectedVariants.length} biến thể
                            </span>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => setSelectedVariants([])}
                              className="h-8"
                            >
                              Bỏ chọn
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setIsUpdateStatusDialogOpen(true)}
                              className="h-8"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Cập nhật trạng thái
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Variants Table */}
                      <div className="rounded-md border overflow-auto" style={{
                        scrollbarWidth: 'none',  /* Firefox */
                        msOverflowStyle: 'none',  /* Internet Explorer 10+ */
                      }}>
                        <style jsx>{`
                          div::-webkit-scrollbar {
                            display: none;  /* Safari and Chrome */
                          }
                        `}</style>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px]">
                                <Checkbox
                                  checked={
                                    filteredAndSortedVariants.length > 0 && 
                                    selectedVariants.length === filteredAndSortedVariants.length
                                  }
                                  onCheckedChange={handleSelectAll}
                                  aria-label="Chọn tất cả"
                                />
                              </TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-slate-100"
                                onClick={() => handleSort('ma_san_pham_chi_tiet')}
                              >
                                <div className="flex items-center gap-2">
                                  Mã biến thể
                                  {sortField === 'ma_san_pham_chi_tiet' && (
                                    <ArrowUpDown className="h-4 w-4" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead>Màu sắc</TableHead>
                              <TableHead>Kích cỡ</TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-slate-100"
                                onClick={() => handleSort('so_luong')}
                              >
                                <div className="flex items-center gap-2">
                                  Số lượng
                                  {sortField === 'so_luong' && (
                                    <ArrowUpDown className="h-4 w-4" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead>Đã bán</TableHead>
                              <TableHead 
                                className="cursor-pointer hover:bg-slate-100"
                                onClick={() => handleSort('gia_ban')}
                              >
                                <div className="flex items-center gap-2">
                                  Giá bán
                                  {sortField === 'gia_ban' && (
                                    <ArrowUpDown className="h-4 w-4" />
                                  )}
                                </div>
                              </TableHead>
                              <TableHead>Giảm giá</TableHead>
                              <TableHead>Trạng thái</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredAndSortedVariants.map((variant) => (
                              <TableRow 
                                key={variant.id_san_pham_chi_tiet}
                                className={`transition-all duration-300 ease-in-out transform hover:scale-[1.01] ${
                                  selectedColor === String(variant.mauSac?.id_mau_sac)
                                    ? 'bg-blue-50 hover:bg-blue-100 shadow-sm'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={selectedVariants.includes(variant.id_san_pham_chi_tiet)}
                                    onCheckedChange={(checked) => 
                                      handleSelectVariant(variant.id_san_pham_chi_tiet, checked as boolean)
                                    }
                                    aria-label={`Chọn biến thể ${variant.ma_san_pham_chi_tiet}`}
                                  />
                                </TableCell>
                                <TableCell className="font-medium">{variant.ma_san_pham_chi_tiet}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded-full border transition-transform duration-300 ease-in-out transform hover:scale-110"
                                      style={{ backgroundColor: variant.mauSac?.ma_mau_sac }}
                                    />
                                    <span className="transition-colors duration-300">{variant.mauSac?.ten_mau_sac}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span className="transition-colors duration-300">{variant.kichCo?.ten_kich_co}</span>
                                </TableCell>
                                <TableCell>
                                  <span className="transition-colors duration-300">{variant.so_luong}</span>
                                </TableCell>
                                <TableCell>
                                  <span className={`px-2 py-1 rounded-full text-xs ${
                                    variant.so_luong_da_ban > 100 ? "bg-blue-100 text-blue-800" :
                                    variant.so_luong_da_ban > 50 ? "bg-indigo-100 text-indigo-800" :
                                    variant.so_luong_da_ban > 0 ? "bg-purple-100 text-purple-800" :
                                    "bg-slate-100 text-slate-800"
                                  }`}>
                                    {variant.so_luong_da_ban || 0}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  {(() => {
                                    const activeDiscount = variant.giamGias?.find(
                                      (discount: GiamGia) => 
                                        new Date(discount.thoi_gian_bat_dau) <= new Date() && 
                                        new Date(discount.thoi_gian_ket_thuc) >= new Date()
                                    );

                                    if (!activeDiscount) {
                                      return formatCurrency(variant.gia_ban);
                                    }

                                    const discountedPrice = activeDiscount.kieu_giam_gia === 'PhanTram'
                                      ? variant.gia_ban * (1 - activeDiscount.gia_tri_giam / 100)
                                      : variant.gia_ban - activeDiscount.gia_tri_giam;

                                    return (
                                      <div className="text-center transition-all duration-300 ease-in-out transform hover:scale-105">
                                        <div className="text-sm font-bold text-green-600">
                                          {formatCurrency(discountedPrice)}
                                        </div>
                                        <div className="text-sm text-slate-400 line-through mb-1">
                                          {formatCurrency(variant.gia_ban)}
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </TableCell>
                                <TableCell>
                                  {variant.giamGias && variant.giamGias.length > 0 ? (
                                    <div className="flex flex-col gap-2">
                                      <Button 
                                        variant="ghost" 
                                        size="sm"
                                        className="h-auto px-0 hover:bg-transparent hover:opacity-70 transition-opacity"
                                        onClick={() => setSelectedVariantForDiscounts(variant)}
                                      >
                                        {(() => {
                                          const now = new Date();
                                          const activeDiscounts = variant.giamGias?.filter(
                                            (discount: GiamGia) => 
                                              new Date(discount.thoi_gian_bat_dau) <= now && 
                                              new Date(discount.thoi_gian_ket_thuc) >= now
                                          ) || [];

                                          const upcomingDiscount = variant.giamGias?.find(
                                            (discount: GiamGia) => new Date(discount.thoi_gian_bat_dau) > now
                                          );

                                          if (activeDiscounts.length === 0) {
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
                                                  Xem lịch sử ({variant.giamGias?.length || 0})
                                                </span>
                                              </div>
                                            );
                                          }

                                          return (
                                            <div className="flex flex-col gap-2 items-start">
                                              <div className="flex items-center gap-2">
                                                <div className="flex -space-x-3">
                                                  {activeDiscounts.map((giamGia: GiamGia, index: number) => (
                                                    <Badge 
                                                      key={giamGia.id_giam_gia}
                                                      className={cn(
                                                        "shadow-sm border-2 border-white font-medium",
                                                        giamGia.kieu_giam_gia === 'PhanTram' 
                                                          ? "bg-violet-500 text-white hover:bg-violet-600" 
                                                          : "bg-teal-500 text-white hover:bg-teal-600"
                                                      )}
                                                      style={{ zIndex: activeDiscounts.length - index }}
                                                    >
                                                      {giamGia.kieu_giam_gia === 'PhanTram' 
                                                        ? `-${giamGia.gia_tri_giam}%`
                                                        : `-${formatCurrency(giamGia.gia_tri_giam)}`}
                                                    </Badge>
                                                  ))}
                                                </div>
                                                {variant.giamGias && variant.giamGias.length > activeDiscounts.length && (
                                                  <span className="text-xs text-slate-600 group-hover:text-violet-600 transition-colors">
                                                    +{variant.giamGias.length - activeDiscounts.length} khác
                                                  </span>
                                                )}
                                              </div>
                                              {activeDiscounts.length > 0 && (
                                                <CountdownDisplay 
                                                  date={activeDiscounts[0].thoi_gian_ket_thuc} 
                                                  type="end" 
                                                />
                                              )}
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
                                  <Badge 
                                    className={cn(
                                      "font-medium",
                                      variant.trang_thai === "HoatDong" 
                                        ? "bg-emerald-500 text-white" 
                                        : "bg-rose-500 text-white"
                                    )}
                                  >
                                    {variant.trang_thai === "HoatDong" ? "Đang bán" : "Ngừng bán"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                            {filteredAndSortedVariants.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                                  Không tìm thấy biến thể nào
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none">
          <DialogTitle className="sr-only">Xem hình ảnh phóng to</DialogTitle>
          <div className="relative w-full h-full">
            {selectedImage && (
              <>
                <div 
                  className="relative w-full h-[80vh] overflow-hidden"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {isImageLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
                      <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <Image
                    src={selectedImage}
                    alt="Zoomed image"
                    fill
                    className={`object-contain cursor-move transition-opacity duration-300 ${isImageLoading ? 'opacity-0' : 'opacity-100'}`}
                    style={{
                      transform: `scale(${zoomLevel}) translate(${imagePosition.x / zoomLevel}px, ${imagePosition.y / zoomLevel}px)`,
                      transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                    }}
                    onLoad={handleImageLoad}
                  />
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 rounded-full p-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 0.5}
                  >
                    <ZoomOut className="w-5 h-5" />
                  </Button>
                  <span className="text-white text-sm min-w-[60px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/20"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 3}
                  >
                    <ZoomIn className="w-5 h-5" />
                  </Button>
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white bg-black/50 hover:bg-black/70 rounded-full p-3 transition-all hover:scale-110"
                    onClick={() => setSelectedImage(null)}
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog cập nhật trạng thái */}
      <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập nhật trạng thái</DialogTitle>
            <DialogDescription>
              Chọn trạng thái mới cho {selectedVariants.length} biến thể đã chọn
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Select
              value={selectedStatus}
              onValueChange={(value: 'HoatDong' | 'KhongHoatDong') => setSelectedStatus(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HoatDong">Đang bán</SelectItem>
                <SelectItem value="KhongHoatDong">Ngừng bán</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateStatusDialogOpen(false)}
              disabled={isUpdatingStatus}
            >
              Hủy
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Đang cập nhật...
                </>
              ) : (
                'Cập nhật'
              )}
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
                    discount => 
                      new Date(discount.thoi_gian_bat_dau) <= now && 
                      new Date(discount.thoi_gian_ket_thuc) >= now
                  );

                  const upcomingDiscounts = selectedVariantForDiscounts.giamGias.filter(
                    discount => new Date(discount.thoi_gian_bat_dau) > now
                  );

                  const expiredDiscounts = selectedVariantForDiscounts.giamGias.filter(
                    discount => new Date(discount.thoi_gian_ket_thuc) < now
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
                  {selectedVariantForDiscounts.giamGias.map((giamGia, index) => {
                    const isActive = 
                      new Date(giamGia.thoi_gian_bat_dau) <= new Date() && 
                      new Date(giamGia.thoi_gian_ket_thuc) >= new Date();
                    const isUpcoming = new Date(giamGia.thoi_gian_bat_dau) > new Date();

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
                                {new Date(giamGia.thoi_gian_bat_dau).toLocaleDateString('vi-VN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })} 
                                {" - "} 
                                {new Date(giamGia.thoi_gian_ket_thuc).toLocaleDateString('vi-VN', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
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
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRemoveDiscount(giamGia)}
                                disabled={isRemovingDiscount}
                              >
                                <Trash className="h-4 w-4" />
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

      {/* Dialog xác nhận xóa giảm giá */}
      <Dialog open={isConfirmRemoveOpen} onOpenChange={setIsConfirmRemoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa giảm giá</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa giảm giá "{discountToRemove?.ten_giam_gia}" khỏi sản phẩm này? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmRemoveOpen(false)}
              disabled={isRemovingDiscount}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={confirmRemoveDiscount}
              disabled={isRemovingDiscount}
            >
              {isRemovingDiscount ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Đang xóa...
                </>
              ) : (
                'Xóa giảm giá'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
} 