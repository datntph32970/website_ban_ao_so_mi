"use client";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Package, Tag, Info, Image as ImageIcon, Edit, Trash2, Copy, Share2, Eye, EyeOff, AlertCircle, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Search, ArrowUpDown } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import { SanPham } from "@/types/san-pham";
import {  SanPhamChiTiet } from "@/types/san-pham-chi-tiet";
import { sanPhamService } from "@/services/san-pham.service";
import toast from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatCurrency } from "@/lib/utils";
import useEmblaCarousel from 'embla-carousel-react';
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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
import Link from 'next/link';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const unwrappedParams = React.use(params);
  const productId = unwrappedParams.id;
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

  // All useState hooks
  const [product, setProduct] = useState<SanPham | null>(null);
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
  const [sortField, setSortField] = useState<keyof SanPhamChiTiet | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [filterSize, setFilterSize] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // All useEffect hooks
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await sanPhamService.getChiTietSanPham(productId);
        setProduct(data);
      } catch (error) {
        toast.error("Không thể tải thông tin sản phẩm");
        router.push("/products");
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
  const averagePrice = product.sanPhamChiTiets ? product.sanPhamChiTiets.reduce((sum, variant) => sum + (variant.gia_ban || 0), 0) / product.sanPhamChiTiets.length : 0;

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
      images.push(...colorImages);
    } else {
      // If no color selected, show all variant images
      product.sanPhamChiTiets?.forEach(variant => {
        variant.hinhAnhSanPhamChiTiets?.forEach(image => {
          if (!images.some(img => img.hinh_anh_urls === image.hinh_anh_urls)) {
            images.push(image);
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

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="container mx-auto px-4">
          {/* Page header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => router.push("/products")}>
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
                    <Button variant="outline" size="icon" className="h-10 w-10">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Sao chép mã sản phẩm</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="icon" className="h-10 w-10">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Chia sẻ sản phẩm</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="outline" className="h-10" onClick={() => router.push(`/products/${productId}/edit`)}>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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

                      {/* Variants Table */}
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
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
                              <TableHead 
                                className="cursor-pointer hover:bg-slate-100"
                                onClick={() => handleSort('kichCo')}
                              >
                                <div className="flex items-center gap-2">
                                  Kích cỡ
                                  {sortField === 'kichCo' && (
                                    <ArrowUpDown className="h-4 w-4" />
                                  )}
                                </div>
                              </TableHead>
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
                              <TableHead 
                                className="cursor-pointer hover:bg-slate-100"
                                onClick={() => handleSort('gia_nhap')}
                              >
                                <div className="flex items-center gap-2">
                                  Giá nhập
                                  {sortField === 'gia_nhap' && (
                                    <ArrowUpDown className="h-4 w-4" />
                                  )}
                                </div>
                              </TableHead>
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
                                  <span className="transition-colors duration-300">{formatCurrency(variant.gia_nhap)}</span>
                                </TableCell>
                                <TableCell>
                                  {variant.giamGia ? (
                                    <div className="text-center transition-all duration-300 ease-in-out transform hover:scale-105">
                                      <div className="text-sm font-bold text-green-600">
                                        {variant.giamGia.kieu_giam_gia === 'PhanTram'
                                          ? formatCurrency(variant.gia_ban * (1 - variant.giamGia.gia_tri_giam / 100))
                                          : formatCurrency(Math.max(0, variant.gia_ban - variant.giamGia.gia_tri_giam))}
                                      </div>
                                      <div className="text-sm text-slate-400 line-through">
                                        {formatCurrency(variant.gia_ban)}
                                      </div>
                                      {variant.giamGia.ten_giam_gia && (
                                        <Link href={`/discounts?search=${encodeURIComponent(variant.giamGia.ten_giam_gia)}`} legacyBehavior>
                                          <a className="text-xs text-blue-600 mt-1 hover:underline cursor-pointer" target="_self" rel="noopener noreferrer">
                                            {variant.giamGia.ten_giam_gia}
                                          </a>
                                        </Link>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-center transition-all duration-300 ease-in-out transform hover:scale-105">
                                      <span className="text-sm text-slate-700">{formatCurrency(variant.gia_ban)}</span>
                                      <div className="text-xs text-slate-400">Không giảm giá</div>
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {variant.giamGia ? (
                                    <Badge className="bg-red-500 transition-all duration-300 ease-in-out transform hover:scale-105">
                                      {variant.giamGia.kieu_giam_gia === 'PhanTram' 
                                        ? `-${variant.giamGia.gia_tri_giam}%`
                                        : `-${formatCurrency(variant.giamGia.gia_tri_giam)}`}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground transition-colors duration-300">Không giảm giá</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge className={`transition-all duration-300 ease-in-out transform hover:scale-105 ${
                                    variant.trang_thai === "HoatDong" ? "bg-green-500" : "bg-red-500"
                                  }`}>
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
    </AdminLayout>
  );
} 