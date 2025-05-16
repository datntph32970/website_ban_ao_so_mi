"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sanPhamService } from "@/services/san-pham.service";
import { gioHangService } from "@/services/gio-hang.service";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { SanPham } from "@/types/san-pham";
import { SanPhamChiTiet } from "@/types/san-pham-chi-tiet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "react-hot-toast";
import Cookies from "js-cookie";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<SanPham | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<SanPhamChiTiet | null>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, []);

  const loadProduct = async () => {
    try {
      setIsLoading(true);
      const response = await sanPhamService.getChiTietSanPham(params.id as string);
      setProduct(response);
      setMainImage(getImageUrl(response.url_anh_mac_dinh));

      // Tự động chọn biến thể đầu tiên nếu có
      if (response.sanPhamChiTiets && response.sanPhamChiTiets.length > 0) {
        const firstVariant = response.sanPhamChiTiets[0];
        setSelectedColor(String(firstVariant.mauSac?.id_mau_sac || ""));
        setSelectedSize(String(firstVariant.kichCo?.id_kich_co || ""));
        setSelectedVariant(firstVariant);
      }
    } catch (error) {
      console.error("Error loading product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableSizes = (colorId: string) => {
    if (!product?.sanPhamChiTiets) return [];
    return product.sanPhamChiTiets
      .filter(variant => String(variant.mauSac?.id_mau_sac) === colorId && variant.trang_thai === "HoatDong")
      .map(variant => variant.kichCo)
      .filter((size): size is NonNullable<typeof size> => size !== undefined);
  };

  const getVariantByColorAndSize = (colorId: string, sizeId: string) => {
    return product?.sanPhamChiTiets?.find(
      variant => 
        String(variant.mauSac?.id_mau_sac) === colorId && 
        String(variant.kichCo?.id_kich_co) === sizeId &&
        variant.trang_thai === "HoatDong"
    ) || null;
  };

  const handleColorChange = (colorId: string) => {
    setSelectedColor(colorId);
    setSelectedSize("");
    setSelectedVariant(null);
    
    // Cập nhật ảnh chính khi đổi màu
    const variant = product?.sanPhamChiTiets?.find(v => String(v.mauSac?.id_mau_sac) === colorId);
    if (variant?.hinhAnhSanPhamChiTiets?.[0]) {
      setMainImage(getImageUrl(variant.hinhAnhSanPhamChiTiets[0].hinh_anh_urls));
    } else {
      setMainImage(getImageUrl(product?.url_anh_mac_dinh || ""));
    }
  };

  const handleSizeChange = (sizeId: string) => {
    setSelectedSize(sizeId);
    const variant = getVariantByColorAndSize(selectedColor, sizeId);
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const calculateDiscountedPrice = (variant: SanPhamChiTiet) => {
    if (!variant.giamGia) return variant.gia_ban;
    
    if (variant.giamGia.kieu_giam_gia === 'PhanTram') {
      return variant.gia_ban * (1 - variant.giamGia.gia_tri_giam / 100);
    } else if (variant.giamGia.kieu_giam_gia === 'SoTien') {
      return Math.max(0, variant.gia_ban - variant.giamGia.gia_tri_giam);
    }
    
    return variant.gia_ban;
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    // Kiểm tra đăng nhập và role
    const token = Cookies.get('token');
    const userRole = Cookies.get('userRole');
    
    if (!token) {
      router.push('/auth/login');
      return;
    }
    
    if (userRole !== 'KhachHang') {
      toast.error('Chỉ khách hàng mới có thể thêm vào giỏ hàng');
      return;
    }

    try {
      // Kiểm tra số lượng tồn trước khi thêm
      const quantityCheck = await gioHangService.checkProductQuantity(selectedVariant.id_san_pham_chi_tiet);
      
      if (quantity > quantityCheck.availableQuantity) {
        toast.error(`Chỉ còn ${quantityCheck.availableQuantity} sản phẩm trong kho`);
        return;
      }

      // Thêm vào giỏ hàng
      const response = await gioHangService.addToCart(selectedVariant.id_san_pham_chi_tiet, quantity);
      
      toast.success('Đã thêm vào giỏ hàng');

      // Reset số lượng về 1
      setQuantity(1);
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="aspect-square bg-slate-200 rounded" />
            <div className="space-y-4">
              <div className="h-8 bg-slate-200 rounded w-3/4" />
              <div className="h-6 bg-slate-200 rounded w-1/2" />
              <div className="h-24 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-200 rounded w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-lg text-slate-500">Không tìm thấy sản phẩm</p>
      </div>
    );
  }

  const uniqueColors = Array.from(
    new Map(
      product.sanPhamChiTiets
        ?.filter(variant => variant.trang_thai === "HoatDong" && variant.mauSac)
        .map(variant => [variant.mauSac?.id_mau_sac, variant.mauSac])
    ).values()
  ).filter((color): color is NonNullable<typeof color> => color !== undefined);

  const availableSizes = getAvailableSizes(selectedColor);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square relative rounded-lg overflow-hidden max-w-md mx-auto">
            <Image
              src={mainImage}
              alt={product.ten_san_pham}
              fill
              className="object-cover"
            />
          </div>
          <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
            {product.sanPhamChiTiets
              ?.find(v => String(v.mauSac?.id_mau_sac) === selectedColor)
              ?.hinhAnhSanPhamChiTiets?.map((image, index) => (
                <button
                  key={image.id_hinh_anh}
                  className="aspect-square relative rounded-lg overflow-hidden"
                  onClick={() => setMainImage(getImageUrl(image.hinh_anh_urls))}
                  aria-label={`Xem ảnh ${product.ten_san_pham} ${index + 1}`}
                >
                  <Image
                    src={getImageUrl(image.hinh_anh_urls)}
                    alt={`${product.ten_san_pham} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.ten_san_pham}</h1>
            <p className="text-slate-500">{product.ma_san_pham}</p>
          </div>

          {/* Price */}
          <div>
            {selectedVariant ? (
              <>
                {selectedVariant.giamGia ? (
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-blue-600">
                      {formatCurrency(calculateDiscountedPrice(selectedVariant))}
                    </p>
                    <p className="text-lg text-slate-500 line-through">
                      {formatCurrency(selectedVariant.gia_ban)}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(selectedVariant.gia_ban)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-lg text-slate-500">Vui lòng chọn phiên bản</p>
            )}
          </div>

          {/* Variants */}
          <div className="space-y-4">
            {/* Colors */}
            <div>
              <label className="block text-sm font-medium mb-2">Màu sắc</label>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map(color => (
                  <button
                    key={color.id_mau_sac}
                    onClick={() => handleColorChange(String(color.id_mau_sac))}
                    className={`px-4 py-2 rounded-full border ${
                      selectedColor === String(color.id_mau_sac)
                        ? "border-blue-600 bg-blue-50 text-blue-600"
                        : "border-slate-200 hover:border-blue-600"
                    }`}
                  >
                    {color.ten_mau_sac}
                  </button>
                ))}
              </div>
            </div>

            {/* Sizes */}
            {selectedColor && (
              <div>
                <label className="block text-sm font-medium mb-2">Kích cỡ</label>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map(size => (
                    <button
                      key={size.id_kich_co}
                      onClick={() => handleSizeChange(String(size.id_kich_co))}
                      className={`px-4 py-2 rounded-full border ${
                        selectedSize === String(size.id_kich_co)
                          ? "border-blue-600 bg-blue-50 text-blue-600"
                          : "border-slate-200 hover:border-blue-600"
                      }`}
                    >
                      {size.ten_kich_co}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            {selectedVariant && (
              <div>
                <label className="block text-sm font-medium mb-2">Số lượng</label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center">{quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(prev => Math.min(selectedVariant.so_luong, prev + 1))}
                    disabled={quantity >= selectedVariant.so_luong}
                  >
                    +
                  </Button>
                  <span className="text-sm text-slate-500 ml-2">
                    {selectedVariant.so_luong} sản phẩm có sẵn
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Add to Cart */}
          <Button
            className="w-full"
            size="lg"
            disabled={!selectedVariant || isLoading}
            onClick={handleAddToCart}
          >
            {isLoading ? 'Đang xử lý...' : 'Thêm vào giỏ hàng'}
          </Button>

          {/* Product Details */}
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="description" className="flex-1">Mô tả</TabsTrigger>
              <TabsTrigger value="details" className="flex-1">Chi tiết</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-4">
              <div className="prose max-w-none">
                {product.mo_ta}
              </div>
            </TabsContent>
            <TabsContent value="details" className="mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Thương hiệu</p>
                    <p>{product.thuongHieu?.ten_thuong_hieu || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Danh mục</p>
                    <p>{product.danhMuc?.ten_danh_muc || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Kiểu dáng</p>
                    <p>{product.kieuDang?.ten_kieu_dang || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Chất liệu</p>
                    <p>{product.chatLieu?.ten_chat_lieu || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Xuất xứ</p>
                    <p>{product.xuatXu?.ten_xuat_xu || "N/A"}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 