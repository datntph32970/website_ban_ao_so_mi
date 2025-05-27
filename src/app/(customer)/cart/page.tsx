"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { gioHangService } from "@/services/gio-hang.service";
import { khachHangService } from "@/services/khach-hang.service";
import { ghnService } from "@/services/ghn-service";
import { hoaDonService } from "@/services/hoa-don.service";
import { GioHangChiTiet, GioHangResponse } from "@/types/gio-hang";
import { DiaChiDTO } from "@/types/khach-hang";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
  const router = useRouter();
  const [cartData, setCartData] = useState<GioHangResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [defaultAddress, setDefaultAddress] = useState<DiaChiDTO | null>(null);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    loadCartItems();
    loadDefaultAddress();
  }, []);

  useEffect(() => {
    if (defaultAddress && cartData?.items && selectedItems.size > 0) {
      calculateShippingFee();
    }
  }, [defaultAddress, selectedItems, cartData]);

  const loadDefaultAddress = async () => {
    try {
      const addresses = await khachHangService.getMyAddresses();
      const defaultAddr = addresses.addresses.find(addr => addr.dia_chi_mac_dinh);
      setDefaultAddress(defaultAddr || null);
    } catch (error) {
      console.error('Error loading default address:', error);
      toast.error('Không thể tải địa chỉ mặc định');
    }
  };

  const calculateShippingFee = async () => {
    if (!defaultAddress || selectedItems.size === 0) {
      setShippingFee(0);
      return;
    }

    try {
      setIsCalculatingFee(true);
      
      // Lấy mã quận/huyện và phường/xã từ địa chỉ
      const districtId = await ghnService.findDistrictId(defaultAddress.tinh, defaultAddress.huyen);
      if (!districtId) {
        throw new Error('Không tìm thấy mã quận/huyện');
      }

      const wardCode = await ghnService.findWardCode(districtId, defaultAddress.xa);
      if (!wardCode) {
        throw new Error('Không tìm thấy mã phường/xã');
      }

      // Tạo danh sách items cho API GHN
      const selectedProducts = cartData?.items.filter(item => 
        selectedItems.has(item.id_gio_hang_chi_tiet)
      ) || [];

      const items = selectedProducts.map(item => ({
        name: item.ten_san_pham,
        quantity: item.so_luong,
        length: 20, // cm - kích thước áo khi gấp gọn
        width: 15,  // cm
        height: 3,  // cm
        weight: 200 // gram - trọng lượng trung bình của một áo sơ mi
      }));

      const response = await ghnService.calculateShippingFee({
        to_district_id: districtId,
        to_ward_code: wardCode,
        items,
        insurance_value: selectedTotal
      });

      setShippingFee(response.total);
    } catch (error) {
      console.error('Error calculating shipping fee:', error);
      toast.error(error instanceof Error ? error.message : 'Không thể tính phí vận chuyển');
      setShippingFee(0);
    } finally {
      setIsCalculatingFee(false);
    }
  };

  useEffect(() => {
    if (cartData?.items) {
      // Khi cart data thay đổi, cập nhật selected items dựa trên trạng thái trang_thai
      const newSelectedItems = new Set<string>();
      cartData.items.forEach(item => {
        if (item.trang_thai) {
          newSelectedItems.add(item.id_gio_hang_chi_tiet);
        }
      });
      setSelectedItems(newSelectedItems);
    }
  }, [cartData]);

  const loadCartItems = async () => {
    try {
      setIsLoading(true);
      const response = await gioHangService.getMyCart();
      setCartData(response);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể tải giỏ hàng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateQuantity = async (idGioHangChiTiet: string, soLuong: number) => {
    try {
      setIsUpdating(true);
      await gioHangService.updateQuantity(idGioHangChiTiet, soLuong);
      await loadCartItems();
      toast.success('Đã cập nhật số lượng');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật số lượng');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveItem = async (idGioHangChiTiet: string) => {
    if (!confirm('Bạn có chắc muốn xóa sản phẩm này khỏi giỏ hàng?')) return;

    try {
      setIsUpdating(true);
      await gioHangService.removeFromCart(idGioHangChiTiet);
      await loadCartItems();
      toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa sản phẩm');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClearCart = async () => {
    if (!confirm('Bạn có chắc muốn xóa tất cả sản phẩm khỏi giỏ hàng?')) return;

    try {
      setIsUpdating(true);
      await gioHangService.clearCart();
      setCartData(null);
      setSelectedItems(new Set());
      toast.success('Đã xóa tất cả sản phẩm khỏi giỏ hàng');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể xóa giỏ hàng');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleItem = async (idGioHangChiTiet: string, checked: boolean) => {
    try {
      setIsUpdating(true);
      await gioHangService.updateCartItemStatus(idGioHangChiTiet, checked);
      await loadCartItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleAll = async (checked: boolean) => {
    try {
      setIsUpdating(true);
      const updatePromises = cartData?.items.map(item => 
        gioHangService.updateCartItemStatus(item.id_gio_hang_chi_tiet, checked)
      ) || [];
      await Promise.all(updatePromises);
      await loadCartItems();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể cập nhật trạng thái');
    } finally {
      setIsUpdating(false);
    }
  };

  const isAllSelected = cartData?.items && cartData.items.length > 0 && 
    cartData.items.every(item => selectedItems.has(item.id_gio_hang_chi_tiet));

  const selectedTotal = cartData?.items
    .filter(item => selectedItems.has(item.id_gio_hang_chi_tiet))
    .reduce((total, item) => total + (item.gia_sau_giam || item.gia_ban) * item.so_luong, 0) || 0;

  const finalTotal = selectedTotal + shippingFee;

  const handleCheckout = async () => {
    if (selectedItems.size === 0) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm');
      return;
    }

    if (!defaultAddress) {
      toast.error('Vui lòng thêm địa chỉ giao hàng');
      return;
    }

    try {
      setIsCheckingOut(true);
      
      // 1. Tạo hóa đơn online với phí vận chuyển
      const response = await hoaDonService.taoHoaDonOnline(shippingFee);
      
      toast.success(response.message);
      // 2. Chuyển hướng đến trang thanh toán với ID hóa đơn
      router.push(`/checkout?order_id=${response.hoa_don.id_hoa_don}`);
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast.error(error.response?.data || 'Không thể tạo đơn hàng. Vui lòng thử lại sau.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-slate-200 w-1/4 rounded"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 min-h-[calc(100vh-4rem)]">
        <div className="max-w-md mx-auto text-center">
          <div className="mb-8">
            <ShoppingBag className="w-16 h-16 mx-auto text-slate-400" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Giỏ hàng trống</h1>
          <p className="text-slate-500 mb-8">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
          <Link href="/products">
            <Button className="gap-2">
              Tiếp tục mua sắm
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Giỏ hàng của bạn</h1>
          <Button 
            variant="ghost" 
            onClick={handleClearCart}
            disabled={isUpdating}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Xóa tất cả
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-100">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={(checked) => handleToggleAll(checked === true)}
                    disabled={isUpdating || cartData.items.length === 0}
                  />
                  <span className="font-medium">Chọn tất cả ({cartData.totalItems} sản phẩm)</span>
                </div>
              </div>

              <AnimatePresence>
                {cartData.items.map((item) => (
                  <motion.div
                    key={item.id_gio_hang_chi_tiet}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex gap-4">
                      <div className="flex items-center">
                        <Checkbox
                          checked={selectedItems.has(item.id_gio_hang_chi_tiet)}
                          onCheckedChange={(checked) => handleToggleItem(item.id_gio_hang_chi_tiet, checked === true)}
                          disabled={isUpdating}
                        />
                      </div>

                      {/* Product Image */}
                      <div className="relative w-24 h-24 flex-shrink-0">
                        <Image
                          src={getImageUrl(item.url_anh)}
                          alt={item.ten_san_pham}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <Link 
                              href={`/products/${item.id_san_pham_chi_tiet}`}
                              className="font-medium hover:text-blue-600 line-clamp-2"
                            >
                              {item.ten_san_pham}
                            </Link>
                            
                            <div className="text-sm text-slate-500 mt-1 space-x-4">
                              <span>Màu: {item.ten_mau_sac}</span>
                              <span>Size: {item.ten_kich_co}</span>
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-slate-400 hover:text-red-500"
                            disabled={isUpdating}
                            onClick={() => handleRemoveItem(item.id_gio_hang_chi_tiet)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="mt-4 flex justify-between items-end">
                          <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={isUpdating || item.so_luong <= 1}
                              onClick={() => handleUpdateQuantity(item.id_gio_hang_chi_tiet, item.so_luong - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-8 text-center font-medium">{item.so_luong}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={isUpdating || item.so_luong >= item.so_luong_ton}
                              onClick={() => handleUpdateQuantity(item.id_gio_hang_chi_tiet, item.so_luong + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="text-right">
                            {item.gia_sau_giam ? (
                              <div>
                                <span className="font-medium text-blue-600 text-lg">
                                  {formatCurrency(item.gia_sau_giam)}
                                </span>
                                <p className="text-sm text-slate-500 line-through">
                                  {formatCurrency(item.gia_ban)}
                                </p>
                              </div>
                            ) : (
                              <span className="font-medium text-lg">
                                {formatCurrency(item.gia_ban)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="bg-white rounded-lg shadow-sm border border-slate-100 p-6 space-y-4">
                <h2 className="text-lg font-bold">Tổng đơn hàng</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Tạm tính ({selectedItems.size} sản phẩm)</span>
                    <span>{formatCurrency(selectedTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Phí vận chuyển</span>
                    {isCalculatingFee ? (
                      <span className="text-slate-400">Đang tính...</span>
                    ) : shippingFee > 0 ? (
                      <span>{formatCurrency(shippingFee)}</span>
                    ) : (
                      <span className="text-green-600 font-medium">Miễn phí</span>
                    )}
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Tổng cộng</span>
                    <span className="text-xl font-bold text-blue-600">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>

                {!defaultAddress && selectedItems.size > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                    <p>Vui lòng thêm địa chỉ giao hàng để tính phí vận chuyển</p>
                    <Link href="/account" className="text-blue-600 hover:underline mt-1 block">
                      Thêm địa chỉ
                    </Link>
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleCheckout}
                  disabled={selectedItems.size === 0 || isCheckingOut || isCalculatingFee}
                >
                  {isCheckingOut ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    "Thanh toán"
                  )}
                </Button>
              </div>

              {selectedItems.size > 0 && (
                <p className="text-xs text-slate-500 mt-4 text-center">
                  Bằng cách nhấn "Thanh toán", bạn đồng ý với các điều khoản và điều kiện của chúng tôi
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 