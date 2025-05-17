import { useQuery, useQueryClient } from "@tanstack/react-query";
import { giamGiaService } from "@/services/giam-gia.service";
import { ThamSoPhanTrangSanPhamDTO, PhanTrangSanPhamDTO, SanPham } from "@/types/san-pham";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, X, ChevronDown, ChevronUp } from "lucide-react";
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

interface AddProductsDialogProps {
  discountId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddProductsDialog({ 
  discountId, 
  open, 
  onOpenChange,
  onSuccess 
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
  const { data: productsData, isLoading } = useQuery<PhanTrangSanPhamDTO>({
    queryKey: ['available-products', discountId, pageConfig, discountStatus],
    queryFn: () => giamGiaService.getSanPhamCoTheGiamGia({
      timkiem: pageConfig.tim_kiem || "",
      id_danh_muc: pageConfig.id_danh_muc?.[0] || "",
      id_thuong_hieu: pageConfig.id_thuong_hieu?.[0] || "",
      giam_gia_cua_san_phan_chi_tiet: "",
      trang_hien_tai: pageConfig.trang_hien_tai,
      so_phan_tu_tren_trang: pageConfig.so_phan_tu_tren_trang,
      sap_xep_theo: pageConfig.sap_xep_theo || "",
      sap_xep_tang: pageConfig.sap_xep_tang,
      trang_thai_giam_gia: discountStatus === "all" ? undefined : discountStatus
    }),
  });

  // Query để lấy chi tiết sản phẩm khi mở rộng
  const { data: expandedProductDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['product-detail', expandedProductId],
    queryFn: () => {
      if (!expandedProductId) return null;
      return sanPhamService.getChiTietSanPham(expandedProductId);
    },
    enabled: !!expandedProductId,
  });

  // Effect để cập nhật trạng thái checkbox sản phẩm dựa trên trạng thái checkbox sản phẩm chi tiết
  useEffect(() => {
    if (!productsData?.danh_sach || !Array.isArray(productsData.danh_sach)) return;

    const newSelectedProducts = productsData.danh_sach
      .filter((product: SanPham) => {
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
      .map((product: SanPham) => product.id_san_pham);

    setSelectedProducts(newSelectedProducts);
  }, [selectedVariants, productsData, expandedProductId, expandedProductDetail]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setExpandedProductId(null);
      setSelectedProducts([]);
      setSelectedVariants([]);
      setPageConfig(prev => ({
        ...prev,
        trang_hien_tai: 1,
        tim_kiem: "",
        id_thuong_hieu: [],
        id_danh_muc: []
      }));
      setDiscountStatus("all");
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['available-products'] });
    }
  }, [open, queryClient]);

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
      const allProductIds = productsData?.danh_sach?.map((p: SanPham) => p.id_san_pham) || [];
      setSelectedProducts(allProductIds);
      const allVariantIds = productsData?.danh_sach?.flatMap((p: SanPham) => 
        p.sanPhamChiTiets?.map((v: any) => v.id_san_pham_chi_tiet) || []
      ) || [];
      setSelectedVariants(allVariantIds);
    } else {
      setSelectedProducts([]);
      setSelectedVariants([]);
    }
  };

  const handleSelectProduct = (product: SanPham, checked: boolean) => {
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
      await giamGiaService.themGiamGiaVaoSanPhamChiTiet({
        id_giam_gia: discountId,
        san_pham_chi_tiet_ids: selectedVariants
      });
      
      // Reset selections
      setSelectedProducts([]);
      setSelectedVariants([]);
      
      // Close dialog
      onOpenChange(false);
      
      // Show success message
      toast.success(`Đã thêm ${selectedVariants.length} biến thể sản phẩm vào giảm giá thành công!`);
      
      // Call onSuccess callback
      onSuccess?.();
    } catch (error: any) {
      console.error('Error adding products to discount:', error);
      toast.error(error.response.data || 'Có lỗi xảy ra khi thêm sản phẩm vào giảm giá!');
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

  const renderProductDetails = (product: SanPham) => {
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
            <p><span className="font-medium">Thương hiệu:</span> {productDetail.ten_thuong_hieu}</p>
          </div>
          <div className="space-y-1">
            <p><span className="font-medium">Danh mục:</span> {productDetail.ten_danh_muc}</p>
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
                  <TableHead className="w-[30px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productVariants.map((variant: any) => {
                  const firstImage = variant.hinhAnhSanPhamChiTiets?.[0]?.hinh_anh_urls;
                  const giamGia = variant.giamGia;
                  const giaSauGiam = giamGia 
                    ? giamGia.kieu_giam_gia === 'PhanTram' 
                      ? variant.gia_ban * (1 - giamGia.gia_tri_giam / 100)
                      : variant.gia_ban - giamGia.gia_tri_giam
                    : variant.gia_ban;

                  return (
                    <TableRow 
                      key={variant.id_san_pham_chi_tiet}
                      className={`transition-colors duration-200 cursor-pointer ${
                        selectedVariants.includes(variant.id_san_pham_chi_tiet)
                          ? 'bg-blue-50 hover:bg-blue-100 shadow-sm'
                          : 'hover:bg-slate-50'
                      }`}
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
                          {giamGia ? (
                            <>
                              <p className="text-sm line-through text-slate-500">
                                {formatCurrency(variant.gia_ban)}
                              </p>
                              <div className="flex items-center justify-end gap-2">
                                <p className="text-sm font-medium text-red-600">
                                  {formatCurrency(giaSauGiam)}
                                </p>
                                <Badge className="text-xs bg-red-100 text-red-700">
                                  {giamGia.kieu_giam_gia === 'PhanTram' 
                                    ? `-${giamGia.gia_tri_giam}%` 
                                    : `-${formatCurrency(giamGia.gia_tri_giam || 0)}`}
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in-50 slide-in-from-bottom-4 duration-300">
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
            <Select
              value={discountStatus}
              onValueChange={handleDiscountStatusChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái giảm giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="ChuaCoGiamGia">Chưa có giảm giá</SelectItem>
                <SelectItem value="CoGiamGia">Có giảm giá</SelectItem>
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
                      .filter((product: SanPham) => !expandedProductId || product.id_san_pham === expandedProductId)
                      .map((product: SanPham, idx: number) => (
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
  );
} 