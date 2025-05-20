import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ThamSoPhanTrangSanPhamDTO, PhanTrangSanPhamAdminDTO, SanPhamAdminDTO, SanPhamChiTietAdminDTO } from "@/types/san-pham";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, X, Plus, ChevronDown, ChevronUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState, useEffect, useMemo } from "react";
import { formatCurrency, getImageUrl } from "@/lib/utils";
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
import { AddProductsDialog } from "./AddProductsDialog";
import Link from "next/link";
import Image from "next/image";
import { giamGiaService } from "@/services/giam-gia.service";
import { cn } from "@/lib/utils";


interface DiscountProductsProps {
  discountId: string;
  fetchProducts: (params: ThamSoPhanTrangSanPhamDTO) => Promise<PhanTrangSanPhamAdminDTO>;
  onSuccess?: () => void;
}

// Add useDebounce hook
function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

export function DiscountProducts({ discountId, fetchProducts, onSuccess }: DiscountProductsProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

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

  // Query để lấy danh sách sản phẩm sử dụng hàm fetchProducts được truyền vào
  const { data: productsData, isLoading } = useQuery<PhanTrangSanPhamAdminDTO>({
    queryKey: ['products', discountId, pageConfig],
    queryFn: () => fetchProducts(pageConfig),
  });

  // Add a memoized function to get expanded product details from local data
  const expandedProductDetail = useMemo(() => {
    if (!expandedProductId || !productsData?.danh_sach) return null;
    return productsData.danh_sach.find(p => p.id_san_pham === expandedProductId) || null;
  }, [expandedProductId, productsData?.danh_sach]);

  // Effect để cập nhật trạng thái checkbox sản phẩm dựa trên trạng thái checkbox sản phẩm chi tiết
  useEffect(() => {
    if (!productsData?.danh_sach) return;

    const newSelectedProducts = productsData.danh_sach
      .filter((product: SanPhamAdminDTO) => {
        if (expandedProductId === product.id_san_pham && expandedProductDetail) {
          const productVariants = expandedProductDetail.sanPhamChiTiets || [];
          return productVariants.length > 0 && 
            productVariants.every((variant: SanPhamChiTietAdminDTO) => selectedVariants.includes(variant.id_san_pham_chi_tiet));
        }
        const productVariants = product.sanPhamChiTiets || [];
        return productVariants.length > 0 && 
          productVariants.every((variant: SanPhamChiTietAdminDTO) => selectedVariants.includes(variant.id_san_pham_chi_tiet));
      })
      .map((product: SanPhamAdminDTO) => product.id_san_pham);

    setSelectedProducts(newSelectedProducts);
  }, [selectedVariants, productsData, expandedProductId, expandedProductDetail]);

  // Lọc sản phẩm theo từ khóa tìm kiếm
  const filteredProducts = useMemo(() => {
    return productsData?.danh_sach.filter(product => 
      product.ten_san_pham.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.ma_san_pham.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
  }, [productsData, searchTerm]);

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  // Update useEffect to watch debouncedSearchTerm
  useEffect(() => {
    setPageConfig(prev => ({
      ...prev,
      tim_kiem: debouncedSearchTerm,
      trang_hien_tai: 1
    }));
  }, [debouncedSearchTerm]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);
  };

  const handleProductClick = (productId: string) => {
    console.log('Product clicked:', productId); // Debug log
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
        p.sanPhamChiTiets?.map((v: SanPhamChiTietAdminDTO) => v.id_san_pham_chi_tiet) || []
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
      const productDetail = expandedProductId === product.id_san_pham ? expandedProductDetail : product;
      const variantIds = productDetail?.sanPhamChiTiets?.map((v: SanPhamChiTietAdminDTO) => v.id_san_pham_chi_tiet) || [];
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
      const productDetail = expandedProductId === product.id_san_pham ? expandedProductDetail : product;
      const variantIds = productDetail?.sanPhamChiTiets?.map((v: SanPhamChiTietAdminDTO) => v.id_san_pham_chi_tiet) || [];
      setSelectedVariants(prev => prev.filter(id => !variantIds.includes(id)));
    }
  };

  const handleSelectAllVariants = (product: SanPhamAdminDTO, checked: boolean) => {
    const productDetail = expandedProductId === product.id_san_pham ? expandedProductDetail : product;
    if (checked) {
      const variantIds = productDetail?.sanPhamChiTiets?.map((v: SanPhamChiTietAdminDTO) => v.id_san_pham_chi_tiet) || [];
      setSelectedVariants(prev => [...prev, ...variantIds]);
    } else {
      const variantIds = productDetail?.sanPhamChiTiets?.map((v: SanPhamChiTietAdminDTO) => v.id_san_pham_chi_tiet) || [];
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

  const handleDeleteSelected = async () => {
    try {
      setIsDeleting(true);
      
      await giamGiaService.xoaGiamGiaKhoiSanPhamChiTiet({
        id_giam_gia: discountId,
        san_pham_chi_tiet_ids: selectedVariants
      });
      
      // Reset selections
      setSelectedProducts([]);
      setSelectedVariants([]);
      
      // Close dialog
      setIsDeleteDialogOpen(false);
      
      // Show success message
      toast.success(`Đã gỡ giảm giá khỏi ${selectedVariants.length} biến thể sản phẩm thành công!`);
      
      // Refetch data
      await queryClient.invalidateQueries({ queryKey: ['products', discountId, pageConfig] });
      if (expandedProductId) {
        await queryClient.invalidateQueries({ 
          queryKey: ['product-detail', expandedProductId, discountId] 
        });
      }
    } catch (error) {
      console.error('Error removing discount:', error);
      toast.error('Có lỗi xảy ra khi gỡ giảm giá!');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddProducts = () => {
    setIsAddDialogOpen(true);
  };

  const handleSort = (field: string) => {
    setPageConfig(prev => ({
      ...prev,
      sap_xep_theo: field,
      sap_xep_tang: prev.sap_xep_theo === field ? !prev.sap_xep_tang : true
    }));
  };

  const handleCategoryChange = (value: string) => {
    setPageConfig(prev => ({
      ...prev,
      id_danh_muc: value === "all" ? [] : [value],
      trang_hien_tai: 1
    }));
  };

  const handleBrandChange = (value: string) => {
    setPageConfig(prev => ({
      ...prev,
      id_thuong_hieu: value === "all" ? [] : [value],
      trang_hien_tai: 1
    }));
  };

  const renderProductRow = (product: SanPhamAdminDTO, index: number) => {
    const isExpanded = expandedProductId === product.id_san_pham;
    const isSelected = selectedProducts.includes(product.id_san_pham);
    const productVariants = product.sanPhamChiTiets || [];
    const allVariantsSelected = productVariants.length > 0 && 
      productVariants.every((variant: SanPhamChiTietAdminDTO) => selectedVariants.includes(variant.id_san_pham_chi_tiet));

    return (
      <React.Fragment key={product.id_san_pham}>
        <TableRow 
          key={product.id_san_pham}
          className={cn(
            "cursor-pointer transition-all duration-200",
            expandedProductId === product.id_san_pham 
              ? "bg-blue-50/80 hover:bg-blue-50 shadow-sm" 
              : "hover:bg-slate-50"
          )}
          onClick={() => handleProductClick(product.id_san_pham)}
        >
          <TableCell onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={selectedProducts.includes(product.id_san_pham)}
              onCheckedChange={(checked) => handleSelectProduct(product, !!checked)}
            />
          </TableCell>
          <TableCell>
            <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">
              {product.ma_san_pham}
            </code>
          </TableCell>
          <TableCell>
            {product.url_anh_mac_dinh && (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                <Image
                  src={getImageUrl(product.url_anh_mac_dinh)}
                  alt={product.ten_san_pham}
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </TableCell>
          <TableCell>
            <div className="space-y-1">
              <p className="font-medium">{product.ten_san_pham}</p>
              <p className="text-sm text-slate-500">{product.ma_san_pham}</p>
              <p className="text-sm text-slate-500 line-clamp-2">{product.mo_ta}</p>
            </div>
          </TableCell>
          <TableCell>
            <Badge className="bg-slate-100 text-slate-800">{product.thuongHieu?.ten_thuong_hieu}</Badge>
          </TableCell>
          <TableCell>
            <Badge className="bg-slate-100 text-slate-800">{product.danhMuc?.ten_danh_muc}</Badge>
          </TableCell>
          <TableCell>
            <Badge className={product.trang_thai === "HoatDong" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
              {product.trang_thai === "HoatDong" ? "Đang hoạt động" : "Ngừng hoạt động"}
            </Badge>
          </TableCell>
          <TableCell className="text-right">
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0"
            >
              {expandedProductId === product.id_san_pham ? "Thu gọn" : "Xem chi tiết"}
            </Button>
          </TableCell>
        </TableRow>
        {isExpanded && (
          <TableRow>
            <TableCell colSpan={8}>
              <div className="p-4 space-y-4 bg-blue-50/50 rounded-lg border border-blue-100 shadow-inner">
                {/* Additional Product Details */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Kiểu dáng</p>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.kieuDang?.ten_kieu_dang}</span>
                        <span className="text-xs text-slate-400">({product.kieuDang?.ma_kieu_dang})</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-500">Chất liệu</p>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.chatLieu?.ten_chat_lieu}</span>
                        <span className="text-xs text-slate-400">({product.chatLieu?.ma_chat_lieu})</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-500">Xuất xứ</p>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{product.xuatXu?.ten_xuat_xu}</span>
                        <span className="text-xs text-slate-400">({product.xuatXu?.ma_xuat_xu})</span>
                      </div>
                    </div>
                  </div>

                  {/* Variants Table */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900">Chi tiết biến thể</h4>
                    </div>
                    <div className="rounded-lg border border-blue-100 overflow-hidden bg-white">
                      <Table>
                        <TableHeader className="bg-blue-50/50">
                          <TableRow>
                            <TableHead className="w-[50px]">Chọn</TableHead>
                            <TableHead>Mã</TableHead>
                            <TableHead>Hình ảnh</TableHead>
                            <TableHead>Màu sắc</TableHead>
                            <TableHead>Kích cỡ</TableHead>
                            <TableHead className="text-right">Số lượng</TableHead>
                            <TableHead className="text-right">Đã bán</TableHead>
                            <TableHead className="text-right">Giá bán</TableHead>
                            <TableHead>Giảm giá</TableHead>
                            <TableHead>Trạng thái</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(product.sanPhamChiTiets || []).map((variant, index) => {
                            const firstImage = variant.hinhAnhSanPhamChiTiets?.[0]?.hinh_anh_urls;
                            return (
                              <TableRow 
                                key={variant.id_san_pham_chi_tiet}
                                className={cn(
                                  "transition-colors duration-200",
                                  selectedVariants.includes(variant.id_san_pham_chi_tiet)
                                    ? "bg-blue-50/50"
                                    : "hover:bg-slate-50"
                                )}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={selectedVariants.includes(variant.id_san_pham_chi_tiet)}
                                    onCheckedChange={(checked) => handleSelectVariant(variant.id_san_pham_chi_tiet, !!checked)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs">
                                    {variant.ma_san_pham_chi_tiet}
                                  </code>
                                </TableCell>
                                <TableCell>
                                  {firstImage && (
                                    <div className="relative w-10 h-10 rounded overflow-hidden">
                                      <Image
                                        src={getImageUrl(firstImage)}
                                        alt={variant.ma_san_pham_chi_tiet}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span>{variant.mauSac.ten_mau_sac}</span>
                                    <span className="text-xs text-slate-400">{variant.mauSac.ma_mau_sac}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span>{variant.kichCo.ten_kich_co}</span>
                                    <span className="text-xs text-slate-400">{variant.kichCo.ma_kich_co}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{variant.so_luong}</TableCell>
                                <TableCell className="text-right">{variant.so_luong_da_ban}</TableCell>
                                <TableCell className="text-right font-medium">
                                  <div className="space-y-1">
                                    {variant.giamGias && variant.giamGias.length > 0 && variant.giamGias.some(g => g.id_giam_gia === discountId) ? (
                                      <>
                                        <div className="text-slate-500 line-through">
                                          {formatCurrency(variant.gia_ban)}
                                        </div>
                                        <div className="text-red-600">
                                          {formatCurrency(
                                            variant.giamGias.find(g => g.id_giam_gia === discountId)?.kieu_giam_gia === 'PhanTram'
                                              ? variant.gia_ban - (variant.gia_ban * (variant.giamGias.find(g => g.id_giam_gia === discountId)?.gia_tri_giam || 0) / 100)
                                              : variant.giamGias.find(g => g.id_giam_gia === discountId)?.kieu_giam_gia === 'SoTien'
                                                ? variant.gia_ban - (variant.giamGias.find(g => g.id_giam_gia === discountId)?.gia_tri_giam || 0)
                                                : variant.gia_ban
                                          )}
                                        </div>
                                      </>
                                    ) : (
                                      formatCurrency(variant.gia_ban)
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {variant.giamGias && variant.giamGias.length > 0 && variant.giamGias.some(g => g.id_giam_gia === discountId) ? (
                                    <div className="space-y-1">
                                      <Badge className={variant.giamGias.find(g => g.id_giam_gia === discountId)?.kieu_giam_gia === 'PhanTram' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                                        {variant.giamGias.find(g => g.id_giam_gia === discountId)?.kieu_giam_gia === 'PhanTram' 
                                          ? `${variant.giamGias.find(g => g.id_giam_gia === discountId)?.gia_tri_giam}%`
                                          : formatCurrency(variant.giamGias.find(g => g.id_giam_gia === discountId)?.gia_tri_giam || 0)
                                        }
                                      </Badge>
                                      <div className="text-xs text-slate-500">
                                        {format(new Date(variant.giamGias.find(g => g.id_giam_gia === discountId)?.thoi_gian_bat_dau || ''), "dd/MM/yyyy", { locale: vi })} 
                                        {" - "}
                                        {format(new Date(variant.giamGias.find(g => g.id_giam_gia === discountId)?.thoi_gian_ket_thuc || ''), "dd/MM/yyyy", { locale: vi })}
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-slate-500 text-sm">Không có</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge className={variant.trang_thai === "HoatDong" ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-800"}>
                                    {variant.trang_thai === "HoatDong" ? "Hoạt động" : "Ngừng hoạt động"}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
            </TableCell>
          </TableRow>
        )}
      </React.Fragment>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const totalSelectedVariants = selectedVariants.length;
  const totalVariants = productsData?.danh_sach.reduce((acc: number, product: SanPhamAdminDTO) => 
    acc + (product.sanPhamChiTiets?.length || 0), 0
  ) || 0;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
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
            Đã chọn {selectedVariants.length}/{totalVariants} biến thể
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleAddProducts}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Thêm sản phẩm
          </Button>
          {selectedVariants.length > 0 && (
            <Button 
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <X className="h-4 w-4 mr-2" />
              Gỡ giảm giá ({selectedVariants.length})
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="flex-1 overflow-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <Table>
            <TableHeader className="sticky top-0 bg-slate-50 z-10">
              <TableRow className="hover:bg-slate-50">
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedProducts.length === (productsData?.danh_sach.length || 0)}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-[50px]">Mã</TableHead>
                <TableHead className="w-[80px]">Hình ảnh</TableHead>
                <TableHead 
                  className="w-[300px] cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("ten_san_pham")}
                >
                  Thông tin sản phẩm
                </TableHead>
                <TableHead>Thương hiệu</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!productsData?.danh_sach.length ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <p>Không tìm thấy sản phẩm nào</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                productsData.danh_sach.map((product, index) => renderProductRow(product, index))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Hiển thị {productsData?.danh_sach.length || 0} / {productsData?.tong_so_phan_tu || 0} kết quả
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pageConfig.trang_hien_tai! - 1)}
            disabled={pageConfig.trang_hien_tai! === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm">
            Trang {pageConfig.trang_hien_tai} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pageConfig.trang_hien_tai! + 1)}
            disabled={pageConfig.trang_hien_tai! === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận gỡ giảm giá</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn gỡ giảm giá khỏi {selectedVariants.length} biến thể sản phẩm đã chọn? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteSelected}
              disabled={isDeleting}
            >
              {isDeleting ? 'Đang xử lý...' : 'Xác nhận gỡ giảm giá'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Products Dialog */}
      <AddProductsDialog
        discountId={discountId}
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['products', discountId, pageConfig] });
        }}
        fetchProducts={giamGiaService.getSanPhamCoTheGiamGia}
      />
    </div>
  );
} 