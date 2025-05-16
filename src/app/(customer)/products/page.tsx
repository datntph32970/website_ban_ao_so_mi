"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const productsPerPage = 12;

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [searchTerm, sortBy, selectedCategories, selectedBrands, currentPage]);

  const loadFilters = async () => {
    try {
      const [categoriesData, brandsData] = await Promise.all([
        attributeService.getActiveCategories(),
        attributeService.getActiveBrands(),
      ]);
      setCategories(categoriesData);
      setBrands(brandsData);
    } catch (error) {
      console.error("Error loading filters:", error);
    }
  };

  const loadProducts = async () => {
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
      };

      const response: PhanTrangSanPhamDTO = await sanPhamService.getDanhSachSanPhamHoatDong(params);
      setProducts(response.danh_sach);
      setTotalPages(response.tong_so_trang);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Hàm tính giá sau giảm giá
  const calculateDiscountedPrice = (price: number, discount: any) => {
    if (!discount) return price;
    
    if (discount.kieu_giam_gia === 'PhanTram') {
      return price * (1 - discount.gia_tri_giam / 100);
    } else if (discount.kieu_giam_gia === 'SoTien') {
      return Math.max(0, price - discount.gia_tri_giam);
    }
    
    return price;
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
          </Accordion>

          {(selectedCategories.length > 0 || selectedBrands.length > 0) && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setSelectedCategories([]);
                setSelectedBrands([]);
                setCurrentPage(1);
              }}
            >
              Xóa bộ lọc
            </Button>
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
                  const minPrice = Math.min(...(product.sanPhamChiTiets?.map(spct => spct.gia_ban) || [0]));
                  const maxPrice = Math.max(...(product.sanPhamChiTiets?.map(spct => spct.gia_ban) || [0]));
                  
                  const minDiscountedPrice = Math.min(...(product.sanPhamChiTiets?.map(spct => 
                    calculateDiscountedPrice(spct.gia_ban, spct.giamGia)) || [0]));
                  const maxDiscountedPrice = Math.max(...(product.sanPhamChiTiets?.map(spct => 
                    calculateDiscountedPrice(spct.gia_ban, spct.giamGia)) || [0]));
                  
                  const hasDiscount = minDiscountedPrice < minPrice;
                  const totalSold = product.sanPhamChiTiets?.reduce((sum, spct) => sum + (spct.so_luong_da_ban || 0), 0) || 0;

                  return (
                    <Card key={product.id_san_pham} className="group">
                      <Link href={`/products/${product.id_san_pham}`}>
                        <div className="aspect-square relative overflow-hidden">
                          <Image
                            src={getImageUrl(product.url_anh_mac_dinh)}
                            alt={product.ten_san_pham}
                            fill
                            className="object-cover transition-transform group-hover:scale-105"
                          />
                          {hasDiscount && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
                              Giảm {Math.round((1 - minDiscountedPrice / minPrice) * 100)}%
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium mb-2 group-hover:text-blue-600 line-clamp-2">
                            {product.ten_san_pham}
                          </h3>
                          <div className="mb-2">
                            {hasDiscount ? (
                              <>
                                <p className="font-bold text-blue-600">
                                  {minDiscountedPrice === maxDiscountedPrice
                                    ? formatCurrency(minDiscountedPrice)
                                    : `${formatCurrency(minDiscountedPrice)} - ${formatCurrency(maxDiscountedPrice)}`}
                                </p>
                                <p className="text-sm text-slate-500 line-through">
                                  {minPrice === maxPrice
                                    ? formatCurrency(minPrice)
                                    : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
                                </p>
                              </>
                            ) : (
                              <p className="font-bold text-blue-600">
                                {minPrice === maxPrice
                                  ? formatCurrency(minPrice)
                                  : `${formatCurrency(minPrice)} - ${formatCurrency(maxPrice)}`}
                              </p>
                            )}
                          </div>
                          <div className="text-sm text-slate-500">
                            Đã bán: {totalSold}
                          </div>
                        </div>
                      </Link>
                    </Card>
                  );
                })}
              </div>

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