"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog";
import { Edit, Plus, Search, Trash, Filter, ArrowUpDown, ChevronUp, ChevronDown, Tag, Layers, Footprints, Feather, Globe, DollarSign, RefreshCw, CheckCircle2, X as XIcon, Eye } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { SanPham } from "@/types/san-pham";
import { SanPhamChiTiet } from "@/types/san-pham-chi-tiet";
import { GiamGia } from "@/types/giam-gia";
import { sanPhamService } from "@/services/san-pham.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, differenceInMilliseconds, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ThuongHieu } from "@/types/thuong-hieu";
import { DanhMuc } from "@/types/danh-muc";
import { KieuDang } from "@/types/kieu-dang";
import { ChatLieu } from "@/types/chat-lieu";
import { XuatXu } from "@/types/xuat-xu";
import { attributeService } from "@/services/attribute.service";
import { MultiSelect } from "@/components/ui/multi-select";
import { Slider } from "@/components/ui/slider";

// Add interface for variant price calculation
interface VariantPriceInfo {
  effectivePrice: number;
  originalPrice: number;
  discount: any | null;
}

// Add this helper function at the top level of the file, after the imports
const getEffectivePriceAndDiscount = (variant: any): VariantPriceInfo => {
  const now = new Date();
  const activeDiscount = variant.giamGias?.find(
    (discount: any) => 
      new Date(discount.thoi_gian_bat_dau) <= now && 
      new Date(discount.thoi_gian_ket_thuc) >= now
  );

  if (!activeDiscount) {
    return {
      effectivePrice: variant.gia_ban,
      originalPrice: variant.gia_ban,
      discount: null
    };
  }

  const discountedPrice = activeDiscount.kieu_giam_gia === 'PhanTram'
    ? variant.gia_ban * (1 - activeDiscount.gia_tri_giam / 100)
    : variant.gia_ban - activeDiscount.gia_tri_giam;

  return {
    effectivePrice: discountedPrice,
    originalPrice: variant.gia_ban,
    discount: activeDiscount
  };
};

// Add this helper function after getEffectivePriceAndDiscount
const getDiscountTimeRemaining = (discount: any) => {
  const now = new Date();
  const endDate = new Date(discount.thoi_gian_ket_thuc);
  const timeRemaining = differenceInMilliseconds(endDate, now);
  
  if (timeRemaining <= 0) return null;
  
  return formatDistanceToNow(endDate, { 
    addSuffix: true,
    locale: vi 
  });
};

// Update the ProductListItem type to include new fields and make price fields required
type ProductListItem = {
  id: string;
  code: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  minPrice: number;
  maxPrice: number;
  minEffectivePrice: number;
  maxEffectivePrice: number;
  hasActiveDiscount: boolean;
  stock: number;
  sold: number;
  imageUrl: string;
  created_at: string;
  updated_at: string;
  promotionId?: string;
  discountInfo?: GiamGia | null;
  minOriginPrice: number;
  maxOriginPrice: number;
  trang_thai: string;
};

// Remove the import of mapSanPhamList and define it here
function mapSanPhamList(products: any[], API_BASE: string): ProductListItem[] {
  return products.map(product => {
    const variants = product.sanPhamChiTiets || [];
    const variantPrices = variants.map(getEffectivePriceAndDiscount);
    
    // Initialize arrays with 0 if empty to avoid undefined values
    const effectivePrices = variantPrices.map((p: VariantPriceInfo) => p.effectivePrice);
    const originalPrices = variantPrices.map((p: VariantPriceInfo) => p.originalPrice);
    
    // Use 0 as default if arrays are empty
    const minEffectivePrice = effectivePrices.length > 0 ? Math.min(...effectivePrices) : 0;
    const maxEffectivePrice = effectivePrices.length > 0 ? Math.max(...effectivePrices) : 0;
    const minOriginalPrice = originalPrices.length > 0 ? Math.min(...originalPrices) : 0;
    const maxOriginalPrice = originalPrices.length > 0 ? Math.max(...originalPrices) : 0;
    
    // Find active discount
    const activeDiscount = variantPrices.find((p: VariantPriceInfo) => p.discount !== null)?.discount;
    const hasActiveDiscount = activeDiscount !== undefined;

    const imageUrl = product.url_anh_mac_dinh 
      ? `${API_BASE}${product.url_anh_mac_dinh}`.replace(/\/+/g, '/')
      : '';

    return {
      id: product.id_san_pham,
      code: product.ma_san_pham,
      name: product.ten_san_pham,
      brand: product.thuongHieu?.ten_thuong_hieu || '',
      category: product.danhMuc?.ten_danh_muc || '',
      price: minOriginalPrice,
      minPrice: minOriginalPrice,
      maxPrice: maxOriginalPrice,
      minEffectivePrice,
      maxEffectivePrice,
      hasActiveDiscount,
      stock: variants.reduce((sum: number, v: any) => sum + (v.so_luong || 0), 0),
      sold: variants.reduce((sum: number, v: any) => sum + (v.so_luong_da_ban || 0), 0),
      imageUrl,
      created_at: product.ngay_tao,
      updated_at: product.ngay_cap_nhat,
      trang_thai: product.trang_thai,
      minOriginPrice: minOriginalPrice,
      maxOriginPrice: maxOriginalPrice,
      discountInfo: activeDiscount || null
    };
  });
}

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Thêm state cho bộ lọc
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [selectedOriginIds, setSelectedOriginIds] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [maxProductPrice, setMaxProductPrice] = useState(5000000);
  const [debouncedPriceRange, setDebouncedPriceRange] = useState<[number, number]>([0, 5000000]);

  const [brands, setBrands] = useState<ThuongHieu[]>([]);
  const [categories, setCategories] = useState<DanhMuc[]>([]);
  const [styles, setStyles] = useState<KieuDang[]>([]);
  const [materials, setMaterials] = useState<ChatLieu[]>([]);
  const [origins, setOrigins] = useState<XuatXu[]>([]);

  // Debounce cho các select filter
  const [debouncedFilters, setDebouncedFilters] = useState({
    brand: selectedBrandIds,
    category: selectedCategoryIds,
    style: selectedStyleIds,
    material: selectedMaterialIds,
    origin: selectedOriginIds,
  });

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isUpdateStatusDialogOpen, setIsUpdateStatusDialogOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<'HoatDong' | 'KhongHoatDong'>('HoatDong');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchAttributes = async () => {
    setBrands(await sanPhamService.getDanhSachThuongHieu());
    setCategories(await attributeService.getAttributes('DanhMuc'));
    setStyles(await sanPhamService.getDanhSachKieuDang());
    setMaterials(await sanPhamService.getDanhSachChatLieu());
    setOrigins(await sanPhamService.getDanhSachXuatXu());
  };

  useEffect(() => {
    fetchAttributes();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Debounce priceRange
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 400);
    return () => clearTimeout(handler);
  }, [priceRange]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters({
        brand: selectedBrandIds,
        category: selectedCategoryIds,
        style: selectedStyleIds,
        material: selectedMaterialIds,
        origin: selectedOriginIds,
      });
    }, 400);
    return () => clearTimeout(handler);
  }, [selectedBrandIds, selectedCategoryIds, selectedStyleIds, selectedMaterialIds, selectedOriginIds]);

    const fetchProducts = async () => {
      try {
      setIsLoading(true);
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
      const response = await sanPhamService.getDanhSachSanPham({
        trang_hien_tai: currentPage,
        so_phan_tu_tren_trang: 10,
        tim_kiem: debouncedSearchTerm,
        sap_xep_theo: sortBy || undefined,
        sap_xep_tang: sortDirection === "asc",
        id_thuong_hieu: debouncedFilters.brand.length > 0 ? debouncedFilters.brand : undefined,
        id_danh_muc: debouncedFilters.category.length > 0 ? debouncedFilters.category : undefined,
        id_kieu_dang: debouncedFilters.style.length > 0 ? debouncedFilters.style : undefined,
        id_chat_lieu: debouncedFilters.material.length > 0 ? debouncedFilters.material : undefined,
        id_xuat_xu: debouncedFilters.origin.length > 0 ? debouncedFilters.origin : undefined,
        gia_tu: debouncedPriceRange[0] > 0 ? debouncedPriceRange[0] : undefined,
        gia_den: debouncedPriceRange[1] < 5000000 ? debouncedPriceRange[1] : undefined,
      });
      const mapped = mapSanPhamList(response.danh_sach, API_BASE);
        setProducts(mapped);
      setTotalPages(response.tong_so_trang);
      setTotalItems(response.tong_so_phan_tu);
      // Lấy giá lớn nhất từ API
      setMaxProductPrice(response.gia_lon_nhat || 5000000);
      } catch (error) {
      toast.error("Không thể tải danh sách sản phẩm");
    } finally {
      setIsLoading(false);
      }
    };

  useEffect(() => {
    fetchProducts();
  }, [currentPage, debouncedSearchTerm, sortBy, sortDirection, debouncedFilters, debouncedPriceRange]);

  // Nếu maxProductPrice thay đổi và priceRange vượt quá max, cập nhật lại priceRange
  useEffect(() => {
    if (priceRange[1] > maxProductPrice) {
      setPriceRange([priceRange[0], maxProductPrice]);
    }
  }, [maxProductPrice]);

  // Lọc sản phẩm theo từ khóa tìm kiếm và bộ lọc
  const filteredProducts = products.filter(product => {
    // Tìm kiếm theo tên hoặc mã sản phẩm dựa vào loại tìm kiếm
    let matchesSearch = true;
    if (searchTerm.trim() !== "") {
      matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase());
    }

    // Lọc theo giá
    const matchesPrice =
      product.price >= debouncedPriceRange[0] &&
      product.price <= debouncedPriceRange[1];

    // Lọc theo thương hiệu
    const matchesBrand =
      selectedBrandIds.length === 0 ||
      selectedBrandIds.includes(product.brand);

    // Lọc theo danh mục
    const matchesCategory =
      selectedCategoryIds.length === 0 ||
      selectedCategoryIds.includes(product.category);

    // Lọc theo khuyến mãi
    const matchesDiscount =
      product.promotionId !== undefined;

    return matchesSearch && matchesPrice && matchesBrand && matchesCategory && matchesDiscount;
  });

  // Sắp xếp sản phẩm
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (!sortBy) return 0;

    if (sortBy === "name") {
      return sortDirection === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }

    if (sortBy === "price") {
      return sortDirection === "asc"
        ? a.price - b.price
        : b.price - a.price;
    }

    if (sortBy === "stock") {
      return sortDirection === "asc"
        ? a.stock - b.stock
        : b.stock - a.stock;
    }

    if (sortBy === "code") {
      return sortDirection === "asc"
        ? a.code.localeCompare(b.code)
        : b.code.localeCompare(a.code);
    }

    return 0;
  });

  // Reset bộ lọc
  const resetFilters = () => {
    setPriceRange([0, maxProductPrice]);
    setSelectedBrandIds([]);
    setSelectedCategoryIds([]);
    setSelectedStyleIds([]);
    setSelectedMaterialIds([]);
    setSelectedOriginIds([]);
    setSortBy(null);
    setSortDirection("asc");
    setSearchTerm("");
  };

  // Xử lý sắp xếp
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  // Xử lý xóa sản phẩm
  const handleDelete = (id: string) => {
    setProductToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    try {
      await sanPhamService.xoaSanPham(productToDelete);
      toast.success('Xóa sản phẩm thành công!');
      fetchProducts(); // Tải lại danh sách sau khi xóa
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
      toast.error('Có lỗi xảy ra khi xóa sản phẩm!');
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  // Format giá tiền
  const formatCurrency = (value: number | string) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    }).format(Number(value));

  // Xử lý tìm kiếm
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
  };

  // Xử lý phân trang
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Add new function to handle bulk delete
  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedProducts.map(id => sanPhamService.xoaSanPham(id)));
      toast.success('Xóa sản phẩm thành công!');
      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      console.error('Lỗi khi xóa sản phẩm:', error);
      toast.error('Có lỗi xảy ra khi xóa sản phẩm!');
    } finally {
      setIsBulkDeleteDialogOpen(false);
    }
  };

  // Add function to handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => String(p.id)));
    } else {
      setSelectedProducts([]);
    }
  };

  // Add function to handle individual selection
  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts(prev => [...prev, productId]);
    } else {
      setSelectedProducts(prev => prev.filter(id => id !== productId));
    }
  };

  // Add handler for updating status
  const handleUpdateStatus = async () => {
    try {
      setIsUpdatingStatus(true);
      await sanPhamService.capNhatTrangThaiNhieuSanPham(selectedProducts, selectedStatus);
      
      toast.success('Cập nhật trạng thái thành công');
      setIsUpdateStatusDialogOpen(false);
      setSelectedProducts([]);
      
      // Refresh product list
      fetchProducts();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error(error.response?.data || 'Không thể cập nhật trạng thái');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Quản lý sản phẩm</h1>

            <p className="text-slate-500">Quản lý danh sách sản phẩm </p>

          </div>
          <div className="flex gap-2">
            {selectedProducts.length > 0 && (
              <>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => setIsUpdateStatusDialogOpen(true)}
                >
                  <Eye className="h-4 w-4" />
                  <span>Cập nhật trạng thái ({selectedProducts.length})</span>
                </Button>
              <Button 
                variant="destructive" 
                className="gap-2"
                onClick={() => setIsBulkDeleteDialogOpen(true)}
              >
                <Trash className="h-4 w-4" />
                <span>Xóa ({selectedProducts.length})</span>
              </Button>
              </>
            )}
          <Link href="/admin/products/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Thêm sản phẩm</span>
            </Button>
          </Link>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-2 items-center mb-3">
            {/* Search input */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <Input
                className="pl-10 pr-8 h-10 text-sm"
                placeholder="Tìm kiếm sản phẩm..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
              {searchTerm && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  onClick={() => handleSearch("")}
                  tabIndex={0}
                  aria-label="Xóa tìm kiếm"
                >
                  <XIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {/* Filter section */}
          <div className="flex flex-wrap gap-2">
            {/* Brand filter */}
            <div className="w-[200px]">
              <MultiSelect
                options={brands.map(b => ({ label: b.ten_thuong_hieu, value: String(b.id_thuong_hieu) }))}
                values={selectedBrandIds}
                onChange={setSelectedBrandIds}
                placeholder="Thương hiệu..."
                className="w-full"
              />
            </div>

            {/* Category filter */}
            <div className="w-[200px]">
              <MultiSelect
                options={categories.map(c => ({ label: c.ten_danh_muc, value: String(c.id_danh_muc) }))}
                values={selectedCategoryIds}
                onChange={setSelectedCategoryIds}
                placeholder="Danh mục..."
                className="w-full"
              />
            </div>

            {/* Style filter */}
            <div className="w-[200px]">
              <MultiSelect
                options={styles.map(s => ({ label: s.ten_kieu_dang, value: String(s.id_kieu_dang) }))}
                values={selectedStyleIds}
                onChange={setSelectedStyleIds}
                placeholder="Kiểu dáng..."
                className="w-full"
              />
            </div>

            {/* Material filter */}
            <div className="w-[200px]">
              <MultiSelect
                options={materials.map(m => ({ label: m.ten_chat_lieu, value: String(m.id_chat_lieu) }))}
                values={selectedMaterialIds}
                onChange={setSelectedMaterialIds}
                placeholder="Chất liệu..."
                className="w-full"
              />
            </div>

            {/* Origin filter */}
            <div className="w-[200px]">
              <MultiSelect
                options={origins.map(o => ({ label: o.ten_xuat_xu, value: String(o.id_xuat_xu) }))}
                values={selectedOriginIds}
                onChange={setSelectedOriginIds}
                placeholder="Xuất xứ..."
                className="w-full"
              />
            </div>

            {/* Price range filter */}
            <div className="w-[260px] flex flex-col gap-1">
              <Slider
                min={0}
                max={maxProductPrice}
                step={10000}
                value={priceRange}
                onValueChange={val => setPriceRange([val[0], val[1]])}
                className="mb-1"
              />
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>{formatCurrency(priceRange[0])}</span>
                <span>{formatCurrency(priceRange[1])}</span>
              </div>
            </div>

            {/* Reset button */}
          <Button
            variant="outline"
              size="sm"
              onClick={resetFilters}
            className="gap-2"
          >
              <RefreshCw className="h-4 w-4" />
              Đặt lại
          </Button>
          </div>

          {/* Active filters display */}
          {(selectedBrandIds.length > 0 || selectedCategoryIds.length > 0 || 
            selectedStyleIds.length > 0 || selectedMaterialIds.length > 0 || 
            selectedOriginIds.length > 0 || priceRange[0] > 0 || priceRange[1] < 5000000) && (
            <div className="flex flex-wrap gap-2">
              {selectedBrandIds.length > 0 && (
                <Badge className="gap-1 bg-slate-100 text-slate-700">
                  Thương hiệu: {selectedBrandIds.map(id => 
                    brands.find(b => String(b.id_thuong_hieu) === id)?.ten_thuong_hieu
                  ).join(", ")}
                </Badge>
              )}
              {selectedCategoryIds.length > 0 && (
                <Badge className="gap-1 bg-slate-100 text-slate-700">
                  Danh mục: {selectedCategoryIds.map(id => 
                    categories.find(c => String(c.id_danh_muc) === id)?.ten_danh_muc
                  ).join(", ")}
                </Badge>
              )}
              {selectedStyleIds.length > 0 && (
                <Badge className="gap-1 bg-slate-100 text-slate-700">
                  Kiểu dáng: {selectedStyleIds.map(id => 
                    styles.find(s => String(s.id_kieu_dang) === id)?.ten_kieu_dang
                  ).join(", ")}
                </Badge>
              )}
              {selectedMaterialIds.length > 0 && (
                <Badge className="gap-1 bg-slate-100 text-slate-700">
                  Chất liệu: {selectedMaterialIds.map(id => 
                    materials.find(m => String(m.id_chat_lieu) === id)?.ten_chat_lieu
                  ).join(", ")}
                </Badge>
              )}
              {selectedOriginIds.length > 0 && (
                <Badge className="gap-1 bg-slate-100 text-slate-700">
                  Xuất xứ: {selectedOriginIds.map(id => 
                    origins.find(o => String(o.id_xuat_xu) === id)?.ten_xuat_xu
                  ).join(", ")}
                </Badge>
              )}
              {(priceRange[0] > 0 || priceRange[1] < 5000000) && (
                <Badge className="gap-1 bg-slate-100 text-slate-700">
                  Giá: {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="rounded-lg border shadow-sm overflow-hidden bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Chọn tất cả"
                  />
                </TableHead>
                <TableHead className="w-[50px]">STT</TableHead>
                <TableHead className="w-[80px]">Ảnh</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("ma_san_pham")}
                >
                  <div className="flex items-center">
                    Mã sản phẩm
                    {sortBy === "ma_san_pham" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-slate-100 transition-colors"
                  onClick={() => handleSort("ten_san_pham")}
                >
                  <div className="flex items-center">
                    Tên sản phẩm
                    {sortBy === "ten_san_pham" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead>Thương hiệu</TableHead>
                <TableHead>Danh mục</TableHead>
                <TableHead
                  className="cursor-pointer hover:bg-slate-100 transition-colors text-right"
                  onClick={() => handleSort("gia_ban")}
                >
                  <div className="flex items-center justify-end">
                    Giá (₫)
                    {sortBy === "gia_ban" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-center">Tồn kho</TableHead>
                <TableHead className="text-center">Đã bán</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-slate-100 transition-colors text-center"
                  onClick={() => handleSort("trang_thai")}
                >
                  <div className="flex items-center justify-center">
                    Trạng thái
                    {sortBy === "trang_thai" && (
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    )}
                  </div>
                </TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-10">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-10 text-slate-500">
                    Không tìm thấy sản phẩm nào
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product, idx) => (
                  <TableRow key={String(product.id)} className="hover:bg-slate-50 transition-colors">
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(String(product.id))}
                        onCheckedChange={(checked) => handleSelectProduct(String(product.id), checked as boolean)}
                        aria-label={`Chọn sản phẩm ${product.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {(currentPage - 1) * 10 + idx + 1}
                    </TableCell>
                    <TableCell>
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="h-14 w-14 object-cover rounded-md" />
                      ) : (
                        <div className="h-14 w-14 rounded-md bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                          {product.code.split('-')[0]}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.code}
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/admin/products/${String(product.id)}`}
                        className="hover:text-blue-600 hover:underline transition-colors"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-gray-50 text-gray-700 rounded-full text-xs">
                        {product.brand}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium align-middle">
                      {product.hasActiveDiscount ? (
                        <div className="text-right">
                          <div className="text-sm text-green-600">
                            {product.minEffectivePrice === product.maxEffectivePrice
                              ? formatCurrency(product.minEffectivePrice)
                              : `${formatCurrency(product.minEffectivePrice)} - ${formatCurrency(product.maxEffectivePrice)}`}
                          </div>
                          <div className="text-xs text-slate-400 line-through">
                            {product.minOriginPrice === product.maxOriginPrice
                              ? formatCurrency(product.minOriginPrice)
                              : `${formatCurrency(product.minOriginPrice)} - ${formatCurrency(product.maxOriginPrice)}`}
                          </div>
                          {product.discountInfo && (
                            <div className="text-xs text-orange-600 mt-1">
                              {getDiscountTimeRemaining(product.discountInfo)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-right">
                          <span className="text-sm text-slate-700">
                            {product.minPrice === product.maxPrice
                              ? formatCurrency(product.minPrice)
                              : `${formatCurrency(product.minPrice)} - ${formatCurrency(product.maxPrice)}`}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.stock > 30 ? "bg-green-100 text-green-800" :
                        product.stock > 10 ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.sold > 100 ? "bg-blue-100 text-blue-800" :
                        product.sold > 50 ? "bg-indigo-100 text-indigo-800" :
                        product.sold > 0 ? "bg-purple-100 text-purple-800" :
                        "bg-slate-100 text-slate-800"
                      }`}>
                        {product.sold}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge 
                        className={`${
                          product.trang_thai === "HoatDong" 
                            ? "bg-green-100 text-green-700 hover:bg-green-200" 
                            : "bg-red-100 text-red-700 hover:bg-red-200"
                        }`}
                      >
                        {product.trang_thai === "HoatDong" ? "Đang bán" : "Ngừng bán"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Link href={`/admin/products/${String(product.id)}/edit`}>
                        <Button size="icon" variant="ghost" className="text-blue-500 hover:bg-blue-50">
                            <Edit className="h-4 w-4" />
                          </Button>
                          </Link>
                        <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(String(product.id))}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination controls */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-slate-500">
            Hiển thị {products.length} trên tổng số {totalItems} sản phẩm
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Trước
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant="outline"
                size="sm"
                className={currentPage === page ? "bg-slate-100" : ""}
                onClick={() => handlePageChange(page)}
              >
                {page}
              </Button>
            ))}
            <Button 
              variant="outline" 
              size="sm" 
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Sau
            </Button>
          </div>
        </div>

        {/* Add bulk delete dialog */}
        <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa sản phẩm</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa {selectedProducts.length} sản phẩm đã chọn? Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsBulkDeleteDialogOpen(false)}>Hủy</Button>
              <Button variant="destructive" onClick={handleBulkDelete}>Xóa sản phẩm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa sản phẩm</DialogTitle>
              <DialogDescription>
                Bạn có chắc chắn muốn xóa sản phẩm này? Hành động này không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Hủy</Button>
              <Button variant="destructive" onClick={confirmDelete}>Xóa sản phẩm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add update status dialog */}
        <Dialog open={isUpdateStatusDialogOpen} onOpenChange={setIsUpdateStatusDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Cập nhật trạng thái sản phẩm</DialogTitle>
              <DialogDescription>
                Chọn trạng thái mới cho {selectedProducts.length} sản phẩm đã chọn
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
      </div>
    </AdminLayout>
  );
}
