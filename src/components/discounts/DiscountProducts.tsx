import { useQuery, useQueryClient } from "@tanstack/react-query";
import { giamGiaService } from "@/services/giam-gia.service";
import { ThamSoPhanTrangSanPhamDTO, PhanTrangSanPhamDTO, SanPham } from "@/types/san-pham";
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
import { useState, useEffect } from "react";
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
import { sanPhamService } from "@/services/san-pham.service";
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

interface DiscountProductsProps {
  discountId: string;
  onAddProducts?: () => void;
}

export function DiscountProducts({ discountId, onAddProducts }: DiscountProductsProps) {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
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

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['discount-products', discountId, pageConfig],
    queryFn: () => giamGiaService.getDSSanPhamCuaGiamGia(discountId, pageConfig),
  });

  // Query để lấy chi tiết sản phẩm khi mở rộng
  const { data: expandedProductDetail, isLoading: isLoadingDetail } = useQuery({
    queryKey: ['product-detail', expandedProductId, discountId],
    queryFn: () => {
      if (!expandedProductId) return null;
      console.log('Fetching product detail for:', expandedProductId); // Debug log
      return giamGiaService.getSanPhamChiTietDangGiamGia(discountId, expandedProductId);
    },
    enabled: !!expandedProductId && !!discountId,
  });

  // Effect để cập nhật trạng thái checkbox sản phẩm dựa trên trạng thái checkbox sản phẩm chi tiết
  useEffect(() => {
    if (!productsData?.danh_sach) return;

    const newSelectedProducts = productsData.danh_sach
      .filter(product => {
        // Nếu sản phẩm đang được mở rộng, sử dụng dữ liệu từ expandedProductDetail
        if (expandedProductId === product.id_san_pham && expandedProductDetail) {
          const productVariants = expandedProductDetail.sanPhamChiTiets || [];
          return productVariants.length > 0 && 
            productVariants.every(variant => selectedVariants.includes(variant.id_san_pham_chi_tiet));
        }
        // Nếu không, sử dụng dữ liệu từ productsData
        const productVariants = product.sanPhamChiTiets || [];
        return productVariants.length > 0 && 
          productVariants.every(variant => selectedVariants.includes(variant.id_san_pham_chi_tiet));
      })
      .map(product => product.id_san_pham);

    setSelectedProducts(newSelectedProducts);
  }, [selectedVariants, productsData, expandedProductId, expandedProductDetail]);

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
    console.log('Product clicked:', productId); // Debug log
    if (expandedProductId === productId) {
      setExpandedProductId(null);
    } else {
      setExpandedProductId(productId);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allProductIds = productsData?.danh_sach.map(p => p.id_san_pham) || [];
      setSelectedProducts(allProductIds);
      // Select all variants of all products
      const allVariantIds = productsData?.danh_sach.flatMap(p => 
        p.sanPhamChiTiets?.map(v => v.id_san_pham_chi_tiet) || []
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
      const variantIds = productDetail?.sanPhamChiTiets?.map(v => v.id_san_pham_chi_tiet) || [];
      setSelectedVariants(prev => {
        const newVariants = [...prev];
        variantIds.forEach(id => {
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
      const variantIds = productDetail?.sanPhamChiTiets?.map(v => v.id_san_pham_chi_tiet) || [];
      setSelectedVariants(prev => prev.filter(id => !variantIds.includes(id)));
    }
  };

  const handleSelectAllVariants = (product: SanPham, checked: boolean) => {
    // Use expandedProductDetail if available
    const productDetail = expandedProductId === product.id_san_pham ? expandedProductDetail : product;
    if (checked) {
      const variantIds = productDetail?.sanPhamChiTiets?.map(v => v.id_san_pham_chi_tiet) || [];
      setSelectedVariants(prev => [...prev, ...variantIds]);
    } else {
      const variantIds = productDetail?.sanPhamChiTiets?.map(v => v.id_san_pham_chi_tiet) || [];
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
      await queryClient.invalidateQueries({ queryKey: ['discount-products', discountId] });
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

  const renderProductDetails = (product: SanPham) => {
    if (isLoadingDetail) {
      return (
        <div className="p-4 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      );
    }

    // Sử dụng dữ liệu chi tiết từ API nếu có
    const productDetail = expandedProductDetail || product;
    const productVariants = productDetail.sanPhamChiTiets || [];

    return (
      <div className="p-4 space-y-6">
        {/* Thông tin sản phẩm */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Thông tin sản phẩm</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p><span className="font-medium">Mã sản phẩm:</span> {productDetail.ma_san_pham}</p>
              <p><span className="font-medium">Tên sản phẩm:</span> {productDetail.ten_san_pham}</p>
              <p><span className="font-medium">Mô tả:</span> {productDetail.mo_ta}</p>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Thương hiệu:</span> {productDetail.thuongHieu?.ten_thuong_hieu}</p>
              <p><span className="font-medium">Danh mục:</span> {productDetail.danhMuc?.ten_danh_muc}</p>
              <div className="flex items-center gap-2">
                <span className="font-medium">Trạng thái:</span>
                <Badge className={productDetail.trang_thai === 'HoatDong' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                  {productDetail.trang_thai === 'HoatDong' ? "Đang bán" : "Ngừng bán"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách sản phẩm chi tiết */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Danh sách biến thể sản phẩm</h3>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="w-[50px]">Ảnh</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>Mã</TableHead>
                  <TableHead className="text-right w-[100px]">Số lượng</TableHead>
                  <TableHead className="text-right w-[120px]">Giá nhập</TableHead>
                  <TableHead className="text-right w-[150px]">Giá bán</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productVariants.map((variant) => {
                  const firstImage = variant.hinhAnhSanPhamChiTiets?.[0]?.hinh_anh_urls;
                  const discountedPrice = variant.giamGia 
                    ? variant.giamGia.kieu_giam_gia === 'PhanTram'
                      ? variant.gia_ban * (1 - variant.giamGia.gia_tri_giam / 100)
                      : variant.gia_ban - variant.giamGia.gia_tri_giam
                    : null;

                  return (
                    <TableRow key={variant.id_san_pham_chi_tiet}>
                      <TableCell>
                        <Checkbox
                          checked={selectedVariants.includes(variant.id_san_pham_chi_tiet)}
                          onCheckedChange={(checked) => handleSelectVariant(variant.id_san_pham_chi_tiet, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="w-12 h-12 relative">
                          <img
                            src={getImageUrl(firstImage)}
                            alt={variant.ma_san_pham_chi_tiet}
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium line-clamp-1">{productDetail.ten_san_pham}</p>
                          <div className="flex items-center gap-1.5">
                            <Badge className="text-xs border">
                              {variant.mauSac?.ten_mau_sac}
                            </Badge>
                            <Badge className="text-xs border">
                              {variant.kichCo?.ten_kich_co}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-medium">
                          {variant.ma_san_pham_chi_tiet}
                        </code>
                      </TableCell>
                      <TableCell className="text-right">{variant.so_luong}</TableCell>
                      <TableCell className="text-right">{formatCurrency(variant.gia_nhap)}</TableCell>
                      <TableCell className="text-right">
                        <div className="space-y-0.5">
                          {discountedPrice ? (
                            <>
                              <p className="text-sm line-through text-slate-500">
                                {formatCurrency(variant.gia_ban)}
                              </p>
                              <p className="font-medium text-red-600">
                                {formatCurrency(discountedPrice)}
                              </p>
                              <p className="text-xs text-slate-500">
                                Giảm: {variant.giamGia?.kieu_giam_gia === 'PhanTram' 
                                  ? `${variant.giamGia?.gia_tri_giam}%` 
                                  : formatCurrency(variant.giamGia?.gia_tri_giam || 0)
                                }
                              </p>
                            </>
                          ) : (
                            <p className="font-medium">
                              {formatCurrency(variant.gia_ban)}
                            </p>
                          )}
                        </div>
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  const totalPages = productsData?.tong_so_trang || 1;

  const totalSelectedVariants = selectedVariants.length;
  const totalVariants = productsData?.danh_sach.reduce((acc, product) => 
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
              Xóa ({selectedVariants.length})
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
                <TableHead className="w-[50px]">STT</TableHead>
                <TableHead 
                  className="w-[300px] cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("ten_san_pham")}
                >
                  Thông tin sản phẩm
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-slate-100"
                  onClick={() => handleSort("ma_san_pham")}
                >
                  Mã sản phẩm
                </TableHead>
                <TableHead>Thương hiệu</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!productsData?.danh_sach.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <p>Không tìm thấy sản phẩm nào</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                productsData.danh_sach.map((product, idx) => (
                  <React.Fragment key={product.id_san_pham}>
                    <TableRow 
                      className="cursor-pointer hover:bg-slate-50"
                      onClick={() => handleProductClick(product.id_san_pham)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedProducts.includes(product.id_san_pham)}
                          onCheckedChange={(checked) => handleSelectProduct(product, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>{(pageConfig.trang_hien_tai! - 1) * pageConfig.so_phan_tu_tren_trang! + idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img
                            src={getImageUrl(product.url_anh_mac_dinh)}
                            alt={product.ten_san_pham}
                            className="w-12 h-12 object-cover rounded"
                          />
                          <div className="space-y-1">
                            <p className="font-medium">{product.ten_san_pham}</p>
                            <p className="text-sm text-slate-500 line-clamp-2">{product.mo_ta}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="px-1.5 py-0.5 bg-slate-100 rounded text-xs font-medium">
                          {product.ma_san_pham}
                        </code>
                      </TableCell>
                      <TableCell>{product.thuongHieu?.ten_thuong_hieu}</TableCell>
                      <TableCell>{product.danhMuc?.ten_danh_muc}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={product.trang_thai === 'HoatDong' ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                            {product.trang_thai === 'HoatDong' ? "Đang bán" : "Ngừng bán"}
                          </Badge>
                          {expandedProductId === product.id_san_pham ? (
                            <ChevronUp className="h-4 w-4 text-slate-500" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-slate-500" />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedProductId === product.id_san_pham && (
                      <TableRow>
                        <TableCell colSpan={7} className="p-0">
                          {renderProductDetails(product)}
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
          queryClient.invalidateQueries({ queryKey: ['discount-products', discountId] });
        }}
      />
    </div>
  );
} 