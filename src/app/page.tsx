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
import { QuickAddToCartDialog } from "./(customer)/components/QuickAddToCartDialog";
import { ShoppingCart, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

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

interface SanPhamChiTietBanChay {
  id_san_pham_chi_tiet: string;
  ma_san_pham_chi_tiet: string;
  gia_ban: number;
  giamGias?: GiamGia[];
}

interface ThongTinChiTiet {
  url_anh_mac_dinh: string;
  gia_ban_thap_nhat: number;
  gia_ban_cao_nhat: number;
  gia_sau_giam_thap_nhat: number;
  gia_sau_giam_cao_nhat: number;
  hasMultipleDiscounts: boolean;
  singleDiscountLabel: string | null;
  hasAnyDiscount: boolean;
  nearestEnd: Date | null;
}

interface SanPhamBanChay {
  id_san_pham: string;
  ma_san_pham: string;
  ten_san_pham: string;
  mo_ta: string;
  so_luong_ban: number;
  thong_tin_chi_tiet?: ThongTinChiTiet;
}

// Thêm các hàm xử lý giảm giá giống trang products
const getDiscountInfo = (variants: SanPhamChiTietBanChay[]) => {
  const now = new Date();
  console.log('Current time:', now.toISOString());
  
  const discountedPrices: number[] = [];
  const originalPrices: number[] = [];
  const discountLabels: string[] = [];
  let hasAnyDiscount = false;

  variants.forEach(variant => {
    let price = variant.gia_ban;
    let label = '';
    const activeDiscounts = variant.giamGias?.filter((g: GiamGia) => {
      const start = new Date(g.thoi_gian_bat_dau);
      const end = new Date(g.thoi_gian_ket_thuc);
      console.log('Discount time range:', {
        product: variant.ma_san_pham_chi_tiet,
        discount: g.ma_giam_gia,
        start: start.toISOString(),
        end: end.toISOString(),
        isActive: start <= now && end >= now
      });
      return start <= now && end >= now;
    }) || [];

    if (activeDiscounts.length > 0) {
      hasAnyDiscount = true;
      // Use the highest discount if multiple active
      const highestDiscount = activeDiscounts.reduce((prev: GiamGia, current: GiamGia) => {
        const prevValue = prev.kieu_giam_gia === 'PhanTram' 
          ? (variant.gia_ban * prev.gia_tri_giam / 100)
          : prev.gia_tri_giam;
        const currentValue = current.kieu_giam_gia === 'PhanTram'
          ? (variant.gia_ban * current.gia_tri_giam / 100)
          : current.gia_tri_giam;
        return prevValue > currentValue ? prev : current;
      });

      if (highestDiscount.kieu_giam_gia === 'PhanTram') {
        price = price * (1 - highestDiscount.gia_tri_giam / 100);
        label = `Giảm ${highestDiscount.gia_tri_giam}%`;
      } else if (highestDiscount.kieu_giam_gia === 'SoTien') {
        price = price - highestDiscount.gia_tri_giam;
        label = `Giảm ${formatCurrency(highestDiscount.gia_tri_giam)}`;
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

  console.log('Discount info:', {
    hasAnyDiscount,
    hasMultipleDiscounts,
    singleDiscountLabel,
    uniqueLabels,
    minDiscountedPrice: Math.min(...discountedPrices),
    maxDiscountedPrice: Math.max(...discountedPrices),
    minOriginalPrice: Math.min(...originalPrices),
    maxOriginalPrice: Math.max(...originalPrices)
  });

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

const getNearestDiscountEndTime = (variants: SanPhamChiTietBanChay[]) => {
  const now = new Date();
  let nearestEnd: Date | null = null;
  
  variants.forEach(variant => {
    const activeDiscounts = variant.giamGias?.filter((g: GiamGia) => {
      const start = new Date(g.thoi_gian_bat_dau);
      const end = new Date(g.thoi_gian_ket_thuc);
      return start <= now && end >= now;
    }) || [];

    if (activeDiscounts.length > 0) {
      activeDiscounts.forEach(discount => {
        const end = new Date(discount.thoi_gian_ket_thuc);
        if (!nearestEnd || end < nearestEnd) {
          nearestEnd = end;
        }
      });
    }
  });

  if (nearestEnd) {
    console.log('Nearest end time:', (nearestEnd as Date).toISOString());
  }
  return nearestEnd;
};

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

export default function HomePage() {
  const router = useRouter();
  const [featuredProducts, setFeaturedProducts] = useState<SanPhamBanChay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<SanPham | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isLoadingQuickAdd, setIsLoadingQuickAdd] = useState(false);

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
                console.log('Product details:', {
                  id: product.id_san_pham,
                  name: product.ten_san_pham,
                  chiTiet
                });

                const chiTietAny = chiTiet as any;
                let variants: any[] = [];
                
                // Lấy variants từ chi tiết sản phẩm
                if (Array.isArray(chiTietAny.sanPhamChiTiets) && chiTietAny.sanPhamChiTiets.length > 0) {
                  variants = chiTietAny.sanPhamChiTiets;
                } else {
                  // Fallback to min/max prices if no variants
                  const minPrice = chiTietAny.gia_ban_thap_nhat || 0;
                  const maxPrice = chiTietAny.gia_ban_cao_nhat || minPrice;
                  variants = [{
                    gia_ban: minPrice,
                    giamGias: []
                  }];
                  if (maxPrice !== minPrice) {
                    variants.push({
                      gia_ban: maxPrice,
                      giamGias: []
                    });
                  }
                }

                const { minDiscountedPrice, maxDiscountedPrice, minOriginalPrice, maxOriginalPrice, hasMultipleDiscounts, singleDiscountLabel, hasAnyDiscount } = getDiscountInfo(variants);
                const nearestEnd = getNearestDiscountEndTime(variants);
                const imageUrl = chiTietAny.url_anh_mac_dinh || "";

                return {
                  ...product,
                  thong_tin_chi_tiet: {
                    url_anh_mac_dinh: imageUrl,
                    gia_ban_thap_nhat: minOriginalPrice,
                    gia_ban_cao_nhat: maxOriginalPrice,
                    gia_sau_giam_thap_nhat: minDiscountedPrice,
                    gia_sau_giam_cao_nhat: maxDiscountedPrice,
                    hasMultipleDiscounts,
                    singleDiscountLabel,
                    hasAnyDiscount,
                    nearestEnd
                  }
                };
              } catch (error) {
                console.error(`Error fetching details for product ${product.id_san_pham}:`, error);
                return product;
              }
            })
          );
          console.log('Processed products:', productsWithDetails);
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

  const handleQuickAdd = async (product: SanPhamBanChay) => {
    try {
      setIsLoadingQuickAdd(true);
      const fullProduct = await sanPhamService.getChiTietSanPham(product.id_san_pham);
      setSelectedProduct(fullProduct);
      setIsQuickAddOpen(true);
    } catch (error) {
      console.error('Error loading product details:', error);
      toast.error('Không thể tải thông tin sản phẩm');
    } finally {
      setIsLoadingQuickAdd(false);
    }
  };

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
              {featuredProducts.map((product: SanPhamBanChay) => {
                const chiTiet = product.thong_tin_chi_tiet || {
                  url_anh_mac_dinh: '',
                  gia_ban_thap_nhat: 0,
                  gia_ban_cao_nhat: 0,
                  gia_sau_giam_thap_nhat: 0,
                  gia_sau_giam_cao_nhat: 0,
                  hasMultipleDiscounts: false,
                  singleDiscountLabel: null,
                  hasAnyDiscount: false,
                  nearestEnd: null
                };

                const {
                  url_anh_mac_dinh,
                  gia_ban_thap_nhat,
                  gia_ban_cao_nhat,
                  gia_sau_giam_thap_nhat,
                  gia_sau_giam_cao_nhat,
                  hasMultipleDiscounts,
                  singleDiscountLabel,
                  hasAnyDiscount,
                  nearestEnd
                } = chiTiet;

                return (
                  <Card key={product.id_san_pham} className="group relative">
                    <Link href={`/products/${product.id_san_pham}`}>
                      <div className="aspect-square relative overflow-hidden">
                        <Image
                          src={getImageUrl(url_anh_mac_dinh)}
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
                        {hasAnyDiscount && nearestEnd && (
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
                                {gia_sau_giam_thap_nhat === gia_sau_giam_cao_nhat
                                  ? formatCurrency(gia_sau_giam_thap_nhat)
                                  : `${formatCurrency(gia_sau_giam_thap_nhat)} - ${formatCurrency(gia_sau_giam_cao_nhat)}`}
                              </p>
                              <p className="text-sm text-slate-500 line-through">
                                {gia_ban_thap_nhat === gia_ban_cao_nhat
                                  ? formatCurrency(gia_ban_thap_nhat)
                                  : `${formatCurrency(gia_ban_thap_nhat)} - ${formatCurrency(gia_ban_cao_nhat)}`}
                              </p>
                            </>
                          ) : (
                            <p className="font-bold text-blue-600">
                              {gia_ban_thap_nhat === gia_ban_cao_nhat
                                ? formatCurrency(gia_ban_thap_nhat)
                                : `${formatCurrency(gia_ban_thap_nhat)} - ${formatCurrency(gia_ban_cao_nhat)}`}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-slate-500">
                          Đã bán: {product.so_luong_ban}
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
                          handleQuickAdd(product);
                        }}
                        disabled={isLoadingQuickAdd}
                      >
                        {isLoadingQuickAdd ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <ShoppingCart className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
            )}
            
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
