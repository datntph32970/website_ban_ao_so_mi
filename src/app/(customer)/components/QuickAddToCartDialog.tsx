import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { SanPham } from "@/types/san-pham";
import { SanPhamChiTiet } from "@/types/san-pham-chi-tiet";
import { gioHangService } from "@/services/gio-hang.service";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import Cookies from "js-cookie";

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
  const [selectedVariant, setSelectedVariant] = useState<SanPhamChiTiet | null>(null);
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
              {selectedVariant ? (
                <>
                  {selectedVariant.giamGia ? (
                    <div className="mt-1">
                      <p className="font-bold text-blue-600">
                        {formatCurrency(calculateDiscountedPrice(selectedVariant))}
                      </p>
                      <p className="text-sm text-slate-500 line-through">
                        {formatCurrency(selectedVariant.gia_ban)}
                      </p>
                    </div>
                  ) : (
                    <p className="font-bold text-blue-600 mt-1">
                      {formatCurrency(selectedVariant.gia_ban)}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500 mt-1">Vui lòng chọn phiên bản</p>
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