"use client";

import { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/ui/multi-select";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import Link from "next/link";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { sanPhamService } from "@/services/san-pham.service";
import { attributeService } from "@/services/attribute.service";
import { SanPham } from "@/types/san-pham";
import { ThamSoPhanTrangSanPhamDTO, PhanTrangSanPhamDTO } from "@/types/san-pham";
import { DanhMuc } from "@/types/danh-muc";
import { ThuongHieu } from "@/types/thuong-hieu";
import { KieuDang } from "@/types/kieu-dang";
import { ChatLieu } from "@/types/chat-lieu";
import { XuatXu } from "@/types/xuat-xu";
import { QuickAddToCartDialog } from "../components/QuickAddToCartDialog";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, X as XIcon, ShoppingCart } from "lucide-react";
import { format, differenceInMilliseconds, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

// Add interface for discount
interface GiamGia {
  id_giam_gia: string;
  ma_giam_gia: string;
  ten_giam_gia: string;
  kieu_giam_gia: 'PhanTram' | 'SoTien';
  gia_tri_giam: number;
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
  trang_thai: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<SanPham[]>([]);
  const [categories, setCategories] = useState<DanhMuc[]>([]);
  const [brands, setBrands] = useState<ThuongHieu[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("ngay_tao-desc");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<SanPham | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const productsPerPage = 12;
  const [selectedStyleIds, setSelectedStyleIds] = useState<string[]>([]);
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [selectedOriginIds, setSelectedOriginIds] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000000]);
  const [maxProductPrice, setMaxProductPrice] = useState(5000000);
  const [styles, setStyles] = useState<KieuDang[]>([]);
  const [materials, setMaterials] = useState<ChatLieu[]>([]);
  const [origins, setOrigins] = useState<XuatXu[]>([]);
  const [debouncedPriceRange, setDebouncedPriceRange] = useState<[number, number]>([0, 5000000]);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [
    searchTerm, 
    sortBy, 
    selectedCategories, 
    selectedBrands, 
    selectedStyleIds,
    selectedMaterialIds,
    selectedOriginIds,
    debouncedPriceRange,
    currentPage
  ]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedPriceRange(priceRange);
    }, 400);
    return () => clearTimeout(handler);
  }, [priceRange]);

  const loadFilters = async () => {
    try {
      const [categoriesData, brandsData, stylesData, materialsData, originsData] = await Promise.all([
        attributeService.getActiveCategories(),
        attributeService.getActiveBrands(),
        attributeService.getActiveStyles(),
        attributeService.getActiveMaterials(),
        attributeService.getActiveOrigins(),
      ]);
      setCategories(categoriesData);
      setBrands(brandsData);
      setStyles(stylesData);
      setMaterials(materialsData);
      setOrigins(originsData);
    } catch (error) {
      console.error("Error loading filters:", error);
    }
  };

  const loadProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const [sortField, sortOrder] = sortBy.split('-');
      const params: ThamSoPhanTrangSanPhamDTO = {
        trang_hien_tai: currentPage,
        so_phan_tu_tren_trang: productsPerPage,
        tim_kiem: searchTerm,
        sap_xep_theo: sortField,
        sap_xep_tang: sortOrder === 'asc',
        id_danh_muc: selectedCategories,
        id_thuong_hieu: selectedBrands,
        id_kieu_dang: selectedStyleIds,
        id_chat_lieu: selectedMaterialIds,
        id_xuat_xu: selectedOriginIds,
        gia_tu: debouncedPriceRange[0],
        gia_den: debouncedPriceRange[1] < maxProductPrice ? debouncedPriceRange[1] : maxProductPrice,
      };

      const response: PhanTrangSanPhamDTO = await sanPhamService.getDanhSachSanPhamHoatDong(params);
      
      // Cập nhật giá lớn nhất từ response API
      if (response.gia_lon_nhat) {
        setMaxProductPrice(response.gia_lon_nhat);
        // Nếu giá trị hiện tại của price range lớn hơn giá lớn nhất mới, cập nhật lại
        if (priceRange[1] > response.gia_lon_nhat) {
          setPriceRange([priceRange[0], response.gia_lon_nhat]);
        }
      }

      // Lấy thông tin chi tiết cho từng sản phẩm
      const productsWithDetails = await Promise.all(
        response.danh_sach.map(async (product) => {
          try {
            const chiTiet = await sanPhamService.getChiTietSanPham(product.id_san_pham);
            return {
              ...product,
              sanPhamChiTiets: chiTiet.sanPhamChiTiets?.filter(spct => spct.trang_thai === 'HoatDong'),
              url_anh_mac_dinh: chiTiet.url_anh_mac_dinh
            };
          } catch (error) {
            console.error(`Error fetching details for product ${product.id_san_pham}:`, error);
            return product;
          }
        })
      );

      setProducts(productsWithDetails);
      setTotalPages(response.tong_so_trang);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setIsLoading(false);
    }
  }, [
    currentPage,
    searchTerm,
    sortBy,
    selectedCategories,
    selectedBrands,
    selectedStyleIds,
    selectedMaterialIds,
    selectedOriginIds,
    debouncedPriceRange,
    maxProductPrice,
    productsPerPage
  ]);

  // Update the checkbox handlers
  const handleStyleChange = (styleId: string, checked: boolean) => {
    setSelectedStyleIds(prev =>
      checked
        ? [...prev, styleId]
        : prev.filter(id => id !== styleId)
    );
    setCurrentPage(1);
  };

  const handleMaterialChange = (materialId: string, checked: boolean) => {
    setSelectedMaterialIds(prev =>
      checked
        ? [...prev, materialId]
        : prev.filter(id => id !== materialId)
    );
    setCurrentPage(1);
  };

  const handleOriginChange = (originId: string, checked: boolean) => {
    setSelectedOriginIds(prev =>
      checked
        ? [...prev, originId]
        : prev.filter(id => id !== originId)
    );
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedStyleIds([]);
    setSelectedMaterialIds([]);
    setSelectedOriginIds([]);
    setPriceRange([0, maxProductPrice]);
    setCurrentPage(1);
  };

  // Update getActiveDiscount function with proper typing
  const getDiscountInfo = (variants: any[]) => {
    const now = new Date();
    const discountedPrices: number[] = [];
    const originalPrices: number[] = [];
    const discountLabels: string[] = [];
    let hasAnyDiscount = false;

    variants.forEach(variant => {
      let price = variant.gia_ban;
      let label = '';
      const discount = variant.giamGias?.find((g: any) =>
        new Date(g.thoi_gian_bat_dau) <= now && new Date(g.thoi_gian_ket_thuc) >= now
      );
      if (discount) {
        hasAnyDiscount = true;
        if (discount.kieu_giam_gia === 'PhanTram') {
          price = price * (1 - discount.gia_tri_giam / 100);
          label = `Giảm ${discount.gia_tri_giam}%`;
        } else if (discount.kieu_giam_gia === 'SoTien') {
          price = price - discount.gia_tri_giam;
          label = `Giảm ${formatCurrency(discount.gia_tri_giam)}`;
        }
      }
      discountedPrices.push(price);
      originalPrices.push(variant.gia_ban);
      if (label) discountLabels.push(label);
    });

    // Loại bỏ trùng lặp
    const uniqueLabels = Array.from(new Set(discountLabels));
    const hasMultipleDiscounts = uniqueLabels.length > 1;
    const singleDiscountLabel = uniqueLabels.length === 1 ? uniqueLabels[0] : null;

    return {
      minDiscountedPrice: Math.min(...discountedPrices),
      maxDiscountedPrice: Math.max(...discountedPrices),
      minOriginalPrice: Math.min(...originalPrices),
      maxOriginalPrice: Math.max(...originalPrices),
      hasMultipleDiscounts,
      singleDiscountLabel,
      hasAnyDiscount
    };
  };

  // Add this helper function after getActiveDiscount
  const getTimeRemaining = (endDate: string): string => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} ngày ${hours} giờ`;
    } else if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    } else {
      return `${minutes} phút`;
    }
  };

  // Sau getDiscountInfo, thêm hàm getNearestDiscountEndTime
  const getNearestDiscountEndTime = (variants: any[]) => {
    const now = new Date();
    let nearestEnd: Date | null = null;
    variants.forEach(variant => {
      const discount = variant.giamGias?.find((g: any) =>
        new Date(g.thoi_gian_bat_dau) <= now && new Date(g.thoi_gian_ket_thuc) >= now
      );
      if (discount) {
        const end = new Date(discount.thoi_gian_ket_thuc);
        if (!nearestEnd || end < nearestEnd) {
          nearestEnd = end;
        }
      }
    });
    return nearestEnd;
  };

  // Hàm format thời gian còn lại
  const formatTimeLeft = (end: Date) => {
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    if (diff <= 0) return 'Đã kết thúc';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days} ngày ${hours} giờ`;
    if (hours > 0) return `${hours} giờ ${minutes} phút`;
    return `${minutes} phút`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Tất cả sản phẩm</h1>
        <div className="flex flex-col md:flex-row gap-4">
          <Input
            placeholder="Tìm kiếm sản phẩm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sắp xếp theo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ngay_tao-desc">Mới nhất</SelectItem>
              <SelectItem value="ngay_tao-asc">Cũ nhất</SelectItem>
              <SelectItem value="gia_ban-asc">Giá tăng dần</SelectItem>
              <SelectItem value="gia_ban-desc">Giá giảm dần</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filters */}
        <div className="space-y-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="categories">
              <AccordionTrigger>Danh mục</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category.id_danh_muc} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id_danh_muc}`}
                        checked={selectedCategories.includes(category.id_danh_muc)}
                        onCheckedChange={(checked) => {
                          setSelectedCategories(prev =>
                            checked
                              ? [...prev, category.id_danh_muc]
                              : prev.filter(id => id !== category.id_danh_muc)
                          );
                          setCurrentPage(1);
                        }}
                      />
                      <label
                        htmlFor={`category-${category.id_danh_muc}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {category.ten_danh_muc}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="brands">
              <AccordionTrigger>Thương hiệu</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {brands.map((brand) => (
                    <div key={brand.id_thuong_hieu} className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brand.id_thuong_hieu}`}
                        checked={selectedBrands.includes(brand.id_thuong_hieu)}
                        onCheckedChange={(checked) => {
                          setSelectedBrands(prev =>
                            checked
                              ? [...prev, brand.id_thuong_hieu]
                              : prev.filter(id => id !== brand.id_thuong_hieu)
                          );
                          setCurrentPage(1);
                        }}
                      />
                      <label
                        htmlFor={`brand-${brand.id_thuong_hieu}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {brand.ten_thuong_hieu}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="styles">
              <AccordionTrigger>Kiểu dáng</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {styles.map((style) => (
                    <div key={style.id_kieu_dang} className="flex items-center space-x-2">
                      <Checkbox
                        id={`style-${style.id_kieu_dang}`}
                        checked={selectedStyleIds.includes(String(style.id_kieu_dang))}
                        onCheckedChange={(checked) => handleStyleChange(String(style.id_kieu_dang), checked as boolean)}
                      />
                      <label
                        htmlFor={`style-${style.id_kieu_dang}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {style.ten_kieu_dang}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="materials">
              <AccordionTrigger>Chất liệu</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {materials.map((material) => (
                    <div key={material.id_chat_lieu} className="flex items-center space-x-2">
                      <Checkbox
                        id={`material-${material.id_chat_lieu}`}
                        checked={selectedMaterialIds.includes(String(material.id_chat_lieu))}
                        onCheckedChange={(checked) => handleMaterialChange(String(material.id_chat_lieu), checked as boolean)}
                      />
                      <label
                        htmlFor={`material-${material.id_chat_lieu}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {material.ten_chat_lieu}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="origins">
              <AccordionTrigger>Xuất xứ</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {origins.map((origin) => (
                    <div key={origin.id_xuat_xu} className="flex items-center space-x-2">
                      <Checkbox
                        id={`origin-${origin.id_xuat_xu}`}
                        checked={selectedOriginIds.includes(String(origin.id_xuat_xu))}
                        onCheckedChange={(checked) => handleOriginChange(String(origin.id_xuat_xu), checked as boolean)}
                      />
                      <label
                        htmlFor={`origin-${origin.id_xuat_xu}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {origin.ten_xuat_xu}
                      </label>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="price">
              <AccordionTrigger>Giá</AccordionTrigger>
              <AccordionContent>
                <div className="px-2 pt-4">
                  <Slider
                    min={0}
                    max={maxProductPrice}
                    step={10000}
                    value={priceRange}
                    onValueChange={val => setPriceRange([val[0], val[1]])}
                    className="mb-4"
                  />
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>{formatCurrency(priceRange[0])}</span>
                    <span>{formatCurrency(priceRange[1])}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Active filters */}
          {(selectedCategories.length > 0 || selectedBrands.length > 0 || 
            selectedStyleIds.length > 0 || selectedMaterialIds.length > 0 || 
            selectedOriginIds.length > 0 || priceRange[0] > 0 || priceRange[1] < maxProductPrice) && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {selectedCategories.length > 0 && (
                  <Badge className="gap-1 bg-slate-100 text-slate-700">
                    Danh mục: {selectedCategories.map(id => 
                      categories.find(c => String(c.id_danh_muc) === id)?.ten_danh_muc
                    ).join(", ")}
                  </Badge>
                )}
                {selectedBrands.length > 0 && (
                  <Badge className="gap-1 bg-slate-100 text-slate-700">
                    Thương hiệu: {selectedBrands.map(id => 
                      brands.find(b => String(b.id_thuong_hieu) === id)?.ten_thuong_hieu
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
                {(priceRange[0] > 0 || priceRange[1] < maxProductPrice) && (
                  <Badge className="gap-1 bg-slate-100 text-slate-700">
                    Giá: {formatCurrency(priceRange[0])} - {formatCurrency(priceRange[1])}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Đặt lại bộ lọc
              </Button>
            </div>
          )}
        </div>

        {/* Product Grid */}
        <div className="md:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(8)].map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <div className="aspect-square bg-slate-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {products.map((product) => {
                  const { minDiscountedPrice, maxDiscountedPrice, minOriginalPrice, maxOriginalPrice, hasMultipleDiscounts, singleDiscountLabel, hasAnyDiscount } = getDiscountInfo(product.sanPhamChiTiets || []);
                  const totalSold = product.sanPhamChiTiets?.reduce((sum, spct) => sum + (spct.so_luong_da_ban || 0), 0) || 0;
                  const nearestEnd = getNearestDiscountEndTime(product.sanPhamChiTiets || []);

                  return (
                    <Card key={product.id_san_pham} className="group relative">
                      <Link href={`/products/${product.id_san_pham}`}>
                        <div className="aspect-square relative overflow-hidden">
                          <Image
                            src={getImageUrl(product.url_anh_mac_dinh)}
                            alt={product.ten_san_pham}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                          {hasMultipleDiscounts && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
                              Có nhiều mức giảm giá
                            </div>
                          )}
                          {!hasMultipleDiscounts && singleDiscountLabel && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
                              {singleDiscountLabel}
                            </div>
                          )}
                          {/* Thời gian còn lại giảm giá */}
                          {nearestEnd && (
                            <div className="absolute left-0 right-0 bottom-0 w-full bg-red-600/70 text-white text-right py-2 px-3 font-medium rounded-b-lg text-sm">
                              Kết thúc sau: {formatTimeLeft(nearestEnd)}
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium mb-2 group-hover:text-blue-600 line-clamp-2">
                            {product.ten_san_pham}
                          </h3>
                          <div className="mb-2">
                            {hasAnyDiscount ? (
                              <>
                                <p className="font-bold text-blue-600">
                                  {minDiscountedPrice === maxDiscountedPrice
                                    ? formatCurrency(minDiscountedPrice)
                                    : `${formatCurrency(minDiscountedPrice)} - ${formatCurrency(maxDiscountedPrice)}`}
                                </p>
                                <p className="text-sm text-slate-500 line-through">
                                  {minOriginalPrice === maxOriginalPrice
                                    ? formatCurrency(minOriginalPrice)
                                    : `${formatCurrency(minOriginalPrice)} - ${formatCurrency(maxOriginalPrice)}`}
                                </p>
                              </>
                            ) : (
                              <p className="font-bold text-blue-600">
                                {minOriginalPrice === maxOriginalPrice
                                  ? formatCurrency(minOriginalPrice)
                                  : `${formatCurrency(minOriginalPrice)} - ${formatCurrency(maxOriginalPrice)}`}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-slate-500">
                            Đã bán: {totalSold}
                          </div>
                        </div>
                      </Link>
                      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          size="icon"
                          className="rounded-full"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedProduct(product);
                            setIsQuickAddOpen(true);
                          }}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Quick Add Dialog */}
              {selectedProduct && (
                <QuickAddToCartDialog
                  isOpen={isQuickAddOpen}
                  onClose={() => {
                    setIsQuickAddOpen(false);
                    setSelectedProduct(null);
                  }}
                  product={selectedProduct}
                />
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Trước
                  </Button>
                  {[...Array(totalPages)].map((_, index) => (
                    <Button
                      key={index + 1}
                      variant={currentPage === index + 1 ? "default" : "outline"}
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Sau
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
} 