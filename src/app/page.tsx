"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { CustomerLayout } from "@/components/layout/CustomerLayout";
import { thongKeService } from "@/services/thong-ke.service";
import { sanPhamService } from "@/services/san-pham.service";
import { SanPham } from "@/types/san-pham";
import { SanPhamChiTiet } from "@/types/san-pham-chi-tiet";

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

// Hàm lấy khoảng giá của sản phẩm
const getPriceRange = (sanPhamChiTiets: SanPhamChiTiet[] | undefined) => {
  if (!sanPhamChiTiets || sanPhamChiTiets.length === 0) {
    return {
      minPrice: 0,
      maxPrice: 0,
      hasDiscount: false,
      minOriginalPrice: 0,
      maxOriginalPrice: 0,
    };
  }

  let minPrice = Infinity;
  let maxPrice = -Infinity;
  let minOriginalPrice = Infinity;
  let maxOriginalPrice = -Infinity;
  let hasDiscount = false;

  sanPhamChiTiets.forEach(spct => {
    const originalPrice = spct.gia_ban;
    const discountedPrice = calculateDiscountedPrice(spct.gia_ban, spct.giamGia);
    
    if (discountedPrice < originalPrice) hasDiscount = true;
    
    minPrice = Math.min(minPrice, discountedPrice);
    maxPrice = Math.max(maxPrice, discountedPrice);
    minOriginalPrice = Math.min(minOriginalPrice, originalPrice);
    maxOriginalPrice = Math.max(maxOriginalPrice, originalPrice);
  });

  return {
    minPrice: minPrice === Infinity ? 0 : minPrice,
    maxPrice: maxPrice === -Infinity ? 0 : maxPrice,
    hasDiscount,
    minOriginalPrice: minOriginalPrice === Infinity ? 0 : minOriginalPrice,
    maxOriginalPrice: maxOriginalPrice === -Infinity ? 0 : maxOriginalPrice,
  };
};

interface SanPhamBanChay {
  id_san_pham: string;
  ma_san_pham: string;
  ten_san_pham: string;
  mo_ta: string;
  so_luong_ban: number;
  thong_tin_chi_tiet?: {
    url_anh_mac_dinh: string;
    gia_ban_thap_nhat: number;
    gia_ban_cao_nhat: number;
    gia_sau_giam_thap_nhat: number;
    gia_sau_giam_cao_nhat: number;
  };
}

export default function HomePage() {
  const router = useRouter();
  const [featuredProducts, setFeaturedProducts] = useState<SanPhamBanChay[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userRole = Cookies.get('userRole');
    
    // If user is admin or employee, redirect to admin dashboard
    if (userRole === 'Admin' || userRole === 'NhanVien') {
      router.push("/admin/dashboard");
      return;
    }
  }, [router]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        // Lấy sản phẩm bán chạy trong tháng
        const response = await thongKeService.getSanPhamBanChayTheoThang(currentMonth, currentYear);
        
        if (response.success && Array.isArray(response.data.san_pham_ban_chay)) {
          // Lấy thông tin chi tiết cho mỗi sản phẩm
          const productsWithDetails = await Promise.all(
            response.data.san_pham_ban_chay.map(async (product) => {
              try {
                const chiTiet = await sanPhamService.getChiTietSanPham(product.id_san_pham);
                const activeVariants = chiTiet.sanPhamChiTiets?.filter(spct => spct.trang_thai === 'HoatDong') || [];
                
                const pricesWithDiscount = activeVariants.map(spct => ({
                  original: spct.gia_ban,
                  discounted: calculateDiscountedPrice(spct.gia_ban, spct.giamGia)
                }));

                const originalPrices = pricesWithDiscount.map(p => p.original);
                const discountedPrices = pricesWithDiscount.map(p => p.discounted);
                
                return {
                  ...product,
                  thong_tin_chi_tiet: {
                    url_anh_mac_dinh: chiTiet.url_anh_mac_dinh,
                    gia_ban_thap_nhat: Math.min(...originalPrices),
                    gia_ban_cao_nhat: Math.max(...originalPrices),
                    gia_sau_giam_thap_nhat: Math.min(...discountedPrices),
                    gia_sau_giam_cao_nhat: Math.max(...discountedPrices)
                  }
                };
              } catch (error) {
                console.error(`Error fetching details for product ${product.id_san_pham}:`, error);
                return product;
              }
            })
          );
          setFeaturedProducts(productsWithDetails);
        }
      } catch (error) {
        console.error("Error loading products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []);

  return (
    <CustomerLayout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative h-[600px] bg-slate-900 text-white">
          <div className="container mx-auto px-4 h-full flex items-center">
            <div className="max-w-2xl">
              <h1 className="text-5xl font-bold mb-6">
                Khám phá bộ sưu tập áo sơ mi nam mới nhất
              </h1>
              <p className="text-xl mb-8">
                Đẳng cấp và phong cách cho quý ông hiện đại
              </p>
              <Button size="lg" asChild>
                <Link href="/products">Khám phá ngay</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Sản phẩm bán chạy trong tháng</h2>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[...Array(8)].map((_, index) => (
                  <Card key={index} className="animate-pulse">
                    <div className="aspect-square bg-slate-200" />
                    <div className="p-4 space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-4 bg-slate-200 rounded w-1/2" />
                      <div className="h-4 bg-slate-200 rounded w-1/4" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                  <Card key={product.id_san_pham} className="group">
                    <Link href={`/products/${product.id_san_pham}`}>
                    <div className="aspect-square relative overflow-hidden">
                      <Image
                          src={getImageUrl(product.thong_tin_chi_tiet?.url_anh_mac_dinh)}
                          alt={product.ten_san_pham}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />
                        {product.thong_tin_chi_tiet && 
                          product.thong_tin_chi_tiet.gia_sau_giam_thap_nhat < product.thong_tin_chi_tiet.gia_ban_thap_nhat && (
                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
                            Giảm {Math.round((1 - product.thong_tin_chi_tiet.gia_sau_giam_thap_nhat / product.thong_tin_chi_tiet.gia_ban_thap_nhat) * 100)}%
                          </div>
                        )}
                    </div>
                    <div className="p-4">
                        <h3 className="font-medium mb-2 group-hover:text-blue-600 line-clamp-2">
                          {product.ten_san_pham}
                      </h3>
                        <div className="mb-2">
                          {product.thong_tin_chi_tiet && (
                            product.thong_tin_chi_tiet.gia_sau_giam_thap_nhat < product.thong_tin_chi_tiet.gia_ban_thap_nhat ? (
                              <>
                                <p className="font-bold text-blue-600">
                                  {product.thong_tin_chi_tiet.gia_sau_giam_thap_nhat === product.thong_tin_chi_tiet.gia_sau_giam_cao_nhat
                                    ? formatCurrency(product.thong_tin_chi_tiet.gia_sau_giam_thap_nhat)
                                    : `${formatCurrency(product.thong_tin_chi_tiet.gia_sau_giam_thap_nhat)} - ${formatCurrency(product.thong_tin_chi_tiet.gia_sau_giam_cao_nhat)}`}
                                </p>
                                <p className="text-sm text-slate-500 line-through">
                                  {product.thong_tin_chi_tiet.gia_ban_thap_nhat === product.thong_tin_chi_tiet.gia_ban_cao_nhat
                                    ? formatCurrency(product.thong_tin_chi_tiet.gia_ban_thap_nhat)
                                    : `${formatCurrency(product.thong_tin_chi_tiet.gia_ban_thap_nhat)} - ${formatCurrency(product.thong_tin_chi_tiet.gia_ban_cao_nhat)}`}
                                </p>
                              </>
                            ) : (
                              <p className="font-bold text-blue-600">
                                {product.thong_tin_chi_tiet.gia_ban_thap_nhat === product.thong_tin_chi_tiet.gia_ban_cao_nhat
                                  ? formatCurrency(product.thong_tin_chi_tiet.gia_ban_thap_nhat)
                                  : `${formatCurrency(product.thong_tin_chi_tiet.gia_ban_thap_nhat)} - ${formatCurrency(product.thong_tin_chi_tiet.gia_ban_cao_nhat)}`}
                              </p>
                            )
                          )}
                        </div>
                        <div className="text-sm text-slate-500">
                          Đã bán: {product.so_luong_ban}
                        </div>
                    </div>
                  </Link>
                </Card>
              ))}
            </div>
            )}
            <div className="text-center mt-12">
              <Button size="lg" variant="outline" asChild>
                <Link href="/products">Xem tất cả sản phẩm</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Chất lượng cao cấp</h3>
                <p className="text-slate-600">
                  Sản phẩm chính hãng 100%, chất lượng đảm bảo
                </p>
              </div>
              <div>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Giao hàng nhanh chóng</h3>
                <p className="text-slate-600">
                  Giao hàng trong vòng 2-4 ngày trên toàn quốc
                </p>
              </div>
              <div>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">Thanh toán an toàn</h3>
                <p className="text-slate-600">
                  Hỗ trợ nhiều phương thức thanh toán an toàn
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </CustomerLayout>
  );
}
