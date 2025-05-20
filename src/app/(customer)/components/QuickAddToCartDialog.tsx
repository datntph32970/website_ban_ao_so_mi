import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { SanPham, SanPhamChiTietDTO } from "@/types/san-pham";
import { gioHangService } from "@/services/gio-hang.service";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import Cookies from "js-cookie";

interface GiamGia {
  id_giam_gia: string;
  ma_giam_gia: string;
  ten_giam_gia: string;
  kieu_giam_gia: string; // Accept string to match DTO
  gia_tri_giam: number;
  thoi_gian_bat_dau: string;
  thoi_gian_ket_thuc: string;
  trang_thai: string;
  mo_ta?: string;
  so_luong_toi_da?: number;
  so_luong_da_su_dung?: number;
  ngay_tao?: string;
}

interface DiscountInfo {
  finalPrice: number;
  originalPrice: number;
  discountLabel: string | null;
  nearestEnd: Date | null;
  hasMultipleDiscounts: boolean;
}

interface QuickAddToCartDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product: SanPham;
}

export function QuickAddToCartDialog({ isOpen, onClose, product }: QuickAddToCartDialogProps) {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<SanPhamChiTietDTO | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Reset state when dialog opens
      setSelectedColor("");
      setSelectedSize("");
      setQuantity(1);
      setSelectedVariant(null);
    }
  }, [isOpen]);

  const getAvailableSizes = (colorId: string) => {
    if (!product?.sanPhamChiTiets) return [];
    return product.sanPhamChiTiets
      .filter(variant => String(variant.mauSac?.id_mau_sac) === colorId && variant.trang_thai === "HoatDong")
      .map(variant => variant.kichCo)
      .filter((size): size is NonNullable<typeof size> => size !== undefined);
  };

  const getVariantByColorAndSize = (colorId: string, sizeId: string): SanPhamChiTietDTO | null => {
    return product?.sanPhamChiTiets?.find(
      variant => 
        String(variant.mauSac?.id_mau_sac) === colorId && 
        String(variant.kichCo?.id_kich_co) === sizeId &&
        variant.trang_thai === "HoatDong"
    ) as unknown as SanPhamChiTietDTO | null;
  };

  const handleColorChange = (colorId: string) => {
    setSelectedColor(colorId);
    setSelectedSize("");
    setSelectedVariant(null);
  };

  const handleSizeChange = (sizeId: string) => {
    setSelectedSize(sizeId);
    const variant = getVariantByColorAndSize(selectedColor, sizeId);
    setSelectedVariant(variant);
    setQuantity(1);
  };

  const calculateDiscountedPrice = (variant: SanPhamChiTietDTO): DiscountInfo => {
    const now = new Date();
    const activeDiscounts = (variant.giamGias || []).filter((g: GiamGia) => {
      const start = new Date(g.thoi_gian_bat_dau);
      const end = new Date(g.thoi_gian_ket_thuc);
      return start <= now && end >= now;
    });

    if (activeDiscounts.length === 0) return {
      finalPrice: variant.gia_ban,
      originalPrice: variant.gia_ban,
      discountLabel: null,
      nearestEnd: null,
      hasMultipleDiscounts: false
    };

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

    let finalPrice = variant.gia_ban;
    let discountLabel = '';

    if (highestDiscount.kieu_giam_gia === 'PhanTram') {
      finalPrice = variant.gia_ban * (1 - highestDiscount.gia_tri_giam / 100);
      discountLabel = `Giảm ${highestDiscount.gia_tri_giam}%`;
    } else if (highestDiscount.kieu_giam_gia === 'SoTien') {
      finalPrice = Math.max(0, variant.gia_ban - highestDiscount.gia_tri_giam);
      discountLabel = `Giảm ${formatCurrency(highestDiscount.gia_tri_giam)}`;
    }

    // Find nearest end time
    const nearestEnd = activeDiscounts.reduce((nearest: Date | null, discount: GiamGia) => {
      const end = new Date(discount.thoi_gian_ket_thuc);
      if (!nearest || end < nearest) {
        return end;
      }
      return nearest;
    }, null);

    return {
      finalPrice,
      originalPrice: variant.gia_ban,
      discountLabel,
      nearestEnd,
      hasMultipleDiscounts: activeDiscounts.length > 1
    };
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
      setIsLoading(true);
      
      // Kiểm tra số lượng tồn trước khi thêm
      const quantityCheck = await gioHangService.checkProductQuantity(selectedVariant.id_san_pham_chi_tiet);
      
      if (quantity > quantityCheck.availableQuantity) {
        toast.error(`Chỉ còn ${quantityCheck.availableQuantity} sản phẩm trong kho`);
        return;
      }

      // Thêm vào giỏ hàng
      await gioHangService.addToCart(selectedVariant.id_san_pham_chi_tiet, quantity);
      
      toast.success('Đã thêm vào giỏ hàng');
      onClose();
    } catch (error: any) {
      console.error('Error adding to cart:', error);
      toast.error(error.response?.data?.message || 'Không thể thêm vào giỏ hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const uniqueColors = Array.from(
    new Map(
      product.sanPhamChiTiets
        ?.filter(variant => variant.trang_thai === "HoatDong" && variant.mauSac)
        .map(variant => [variant.mauSac?.id_mau_sac, variant.mauSac])
    ).values()
  ).filter((color): color is NonNullable<typeof color> => color !== undefined);

  const availableSizes = getAvailableSizes(selectedColor);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Thêm vào giỏ hàng</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="flex gap-4 items-start">
            <div className="relative w-24 h-24 rounded-lg overflow-hidden">
              <Image
                src={getImageUrl(product.url_anh_mac_dinh)}
                alt={product.ten_san_pham}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h3 className="font-medium">{product.ten_san_pham}</h3>
              {selectedVariant && (
                <>
                  {(() => {
                    const discountInfo = calculateDiscountedPrice(selectedVariant);
                    return (
                      <div className="mt-1">
                        {discountInfo.discountLabel && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="bg-red-500 text-white px-2 py-0.5 rounded text-sm">
                              {discountInfo.hasMultipleDiscounts ? 'Có nhiều mức giảm giá' : discountInfo.discountLabel}
                            </span>
                            {discountInfo.nearestEnd && (
                              <span className="text-sm text-red-500">
                                Kết thúc sau: {formatTimeLeft(discountInfo.nearestEnd)}
                              </span>
                            )}
                          </div>
                        )}
                        <p className="font-bold text-blue-600">
                          {formatCurrency(discountInfo.finalPrice)}
                        </p>
                        {discountInfo.discountLabel && (
                          <p className="text-sm text-slate-500 line-through">
                            {formatCurrency(discountInfo.originalPrice)}
                          </p>
                        )}
                      </div>
                    );
                  })()}
                </>
              )}
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-medium mb-2">Màu sắc</label>
            <div className="flex flex-wrap gap-2">
              {uniqueColors.map(color => (
                <button
                  key={color.id_mau_sac}
                  onClick={() => handleColorChange(String(color.id_mau_sac))}
                  className={`px-3 py-1 rounded-full border text-sm ${
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
                    className={`px-3 py-1 rounded-full border text-sm ${
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
                  disabled={quantity <= 1 || isLoading}
                >
                  -
                </Button>
                <span className="w-12 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(prev => Math.min(selectedVariant.so_luong, prev + 1))}
                  disabled={quantity >= selectedVariant.so_luong || isLoading}
                >
                  +
                </Button>
                <span className="text-sm text-slate-500 ml-2">
                  {selectedVariant.so_luong} sản phẩm có sẵn
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Hủy
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedVariant || isLoading}
              onClick={handleAddToCart}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                'Thêm vào giỏ'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 