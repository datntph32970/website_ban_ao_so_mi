"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { formatCurrency, getImageUrl } from "@/lib/utils";
import { gioHangService } from "@/services/gio-hang.service";
import { khachHangService } from "@/services/khach-hang.service";
import { ghnService } from "@/services/ghn-service";
import { DiaChiDTO } from "@/types/khach-hang";
import { GioHangResponse } from "@/types/gio-hang";
import { MapPin, CreditCard, Wallet } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [cartData, setCartData] = useState<GioHangResponse | null>(null);
  const [defaultAddress, setDefaultAddress] = useState<DiaChiDTO | null>(null);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"COD" | "VNPAY">("COD");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [cartResponse, addressResponse] = await Promise.all([
        gioHangService.getSelectedItems(),
        khachHangService.getMyAddresses()
      ]);

      setCartData(cartResponse);
      const defaultAddr = addressResponse.addresses.find(addr => addr.dia_chi_mac_dinh);
      setDefaultAddress(defaultAddr || null);

      if (defaultAddr && cartResponse.items.length > 0) {
        calculateShippingFee(defaultAddr, cartResponse);
      }
    } catch (error) {
      console.error('Error loading checkout data:', error);
      toast.error('Không thể tải thông tin thanh toán');
      router.push('/cart');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateShippingFee = async (address: DiaChiDTO, cart: GioHangResponse) => {
    try {
      setIsCalculatingFee(true);
      
      // Lấy mã quận/huyện và phường/xã từ địa chỉ
      const districtId = await ghnService.findDistrictId(address.tinh, address.huyen);
      if (!districtId) {
        throw new Error('Không tìm thấy mã quận/huyện');
      }

      const wardCode = await ghnService.findWardCode(districtId, address.xa);
      if (!wardCode) {
        throw new Error('Không tìm thấy mã phường/xã');
      }

      // Tạo danh sách items cho API GHN
      const items = cart.items.map(item => ({
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
        insurance_value: cartTotal
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

  const handlePlaceOrder = async () => {
    if (!defaultAddress) {
      toast.error('Vui lòng chọn địa chỉ giao hàng');
      return;
    }

    if (!cartData || cartData.items.length === 0) {
      toast.error('Giỏ hàng trống');
      return;
    }

    try {
      // TODO: Gọi API tạo đơn hàng
      toast.success('Đặt hàng thành công');
      router.push('/account/orders');
    } catch (error) {
      console.error('Error placing order:', error);
      toast.error('Không thể đặt hàng');
    }
  };

  const cartTotal = cartData?.items.reduce(
    (total, item) => total + (item.gia_sau_giam || item.gia_ban) * item.so_luong,
    0
  ) || 0;

  const finalTotal = cartTotal + shippingFee;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Không có sản phẩm để thanh toán</h1>
          <p className="text-slate-500 mb-8">Vui lòng chọn sản phẩm trong giỏ hàng</p>
          <Link href="/cart">
            <Button>Quay lại giỏ hàng</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Thanh toán</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <Card className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-medium flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Địa chỉ giao hàng
                  </h2>
                  {defaultAddress ? (
                    <div className="mt-4">
                      <p className="font-medium">{defaultAddress.ten_nguoi_nhan}</p>
                      <p className="text-sm text-slate-500 mt-1">{defaultAddress.so_dien_thoai}</p>
                      <p className="text-sm mt-2">
                        {defaultAddress.dia_chi_cu_the}, {defaultAddress.xa}, {defaultAddress.huyen}, {defaultAddress.tinh}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-sm text-slate-500">Chưa có địa chỉ giao hàng</p>
                      <Link href="/account" className="text-blue-600 hover:underline text-sm mt-2 block">
                        + Thêm địa chỉ mới
                      </Link>
                    </div>
                  )}
                </div>
                {defaultAddress && (
                  <Link href="/account">
                    <Button variant="outline" size="sm">Thay đổi</Button>
                  </Link>
                )}
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-6">
              <h2 className="font-medium mb-4">Sản phẩm</h2>
              <div className="space-y-4">
                {cartData.items.map((item) => (
                  <div key={item.id_gio_hang_chi_tiet} className="flex gap-4">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={getImageUrl(item.url_anh)}
                        alt={item.ten_san_pham}
                        fill
                        className="object-cover rounded-md"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium line-clamp-2">{item.ten_san_pham}</p>
                      <div className="text-sm text-slate-500 mt-1 space-x-4">
                        <span>Màu: {item.ten_mau_sac}</span>
                        <span>Size: {item.ten_kich_co}</span>
                        <span>SL: {item.so_luong}</span>
                      </div>
                      <div className="mt-2">
                        {item.gia_sau_giam ? (
                          <div>
                            <span className="font-medium text-blue-600">
                              {formatCurrency(item.gia_sau_giam)}
                            </span>
                            <span className="text-sm text-slate-500 line-through ml-2">
                              {formatCurrency(item.gia_ban)}
                            </span>
                          </div>
                        ) : (
                          <span className="font-medium">{formatCurrency(item.gia_ban)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Payment Method */}
            <Card className="p-6">
              <h2 className="font-medium mb-4">Phương thức thanh toán</h2>
              <RadioGroup value={paymentMethod} onValueChange={(value: "COD" | "VNPAY") => setPaymentMethod(value)}>
                <div className="flex items-center space-x-2 mb-4">
                  <RadioGroupItem value="COD" id="cod" />
                  <Label htmlFor="cod" className="flex items-center gap-2">
                    <Wallet className="h-5 w-5" />
                    Thanh toán khi nhận hàng (COD)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="VNPAY" id="vnpay" />
                  <Label htmlFor="vnpay" className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Thanh toán qua VNPAY
                  </Label>
                </div>
              </RadioGroup>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-8">
              <h2 className="font-medium mb-4">Tổng đơn hàng</h2>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Tạm tính ({cartData.items.length} sản phẩm)</span>
                  <span>{formatCurrency(cartTotal)}</span>
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

              <Separator className="my-4" />

              <div className="flex justify-between items-center mb-6">
                <span className="font-medium">Tổng cộng</span>
                <span className="text-xl font-bold text-blue-600">{formatCurrency(finalTotal)}</span>
              </div>

              <Button 
                className="w-full" 
                size="lg"
                disabled={!defaultAddress || isCalculatingFee}
                onClick={handlePlaceOrder}
              >
                Đặt hàng
              </Button>

              <p className="text-xs text-slate-500 mt-4 text-center">
                Bằng cách nhấn "Đặt hàng", bạn đồng ý với các điều khoản và điều kiện của chúng tôi
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 