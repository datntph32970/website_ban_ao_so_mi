"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Loader2, Package2 } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { hoaDonService } from "@/services/hoa-don.service";
import { HoaDonAdminDTO } from "@/types/hoa-don";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [orderData, setOrderData] = useState<HoaDonAdminDTO | null>(null);
  const orderCode = searchParams.get('orderCode');

  useEffect(() => {
    if (!orderCode) {
      // Nếu không có mã đơn hàng, chuyển về trang orders
      router.push('/account/orders');
      return;
    }

    const loadOrderData = async () => {
      try {
        const data = await hoaDonService.getHoaDonTheoMa(orderCode);
        setOrderData(data);
        toast.success('Thanh toán thành công!');
      } catch (error) {
        console.error('Error loading order:', error);
        toast.error('Không thể tải thông tin đơn hàng');
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderData();

    // Tự động chuyển hướng sau 10 giây
    const redirectTimer = setTimeout(() => {
      router.push('/account/orders');
    }, 10000);

    return () => clearTimeout(redirectTimer);
  }, [orderCode]);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Đang xử lý thanh toán...</p>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-lg mx-auto p-8">
          <div className="text-center">
            <Package2 className="h-16 w-16 text-slate-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">
              Không tìm thấy đơn hàng
            </h1>
            <p className="text-slate-600 mb-8">
              Không thể tìm thấy thông tin đơn hàng. Vui lòng kiểm tra lại hoặc liên hệ với chúng tôi để được hỗ trợ.
            </p>
            <div className="space-y-4">
              <Link href="/account/orders">
                <Button className="w-full">Xem đơn hàng của tôi</Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Về trang chủ
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-lg mx-auto p-8">
        <div className="text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Thanh toán thành công!
          </h1>
          <p className="text-slate-600">
            Cảm ơn bạn đã mua hàng. Đơn hàng của bạn đã được xác nhận và đang được xử lý.
          </p>
          <div className="mt-6 space-y-4 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-left">
              <p className="text-sm text-green-800">
                <span className="font-medium">Mã đơn hàng:</span> {orderData.ma_hoa_don}
              </p>
              <p className="text-sm text-green-800">
                <span className="font-medium">Trạng thái:</span> {orderData.trang_thai === 'DangChoXuLy' ? 'Đang chờ xử lý' : orderData.trang_thai}
              </p>
              <p className="text-sm text-green-800">
                <span className="font-medium">Phương thức thanh toán:</span> {orderData.ten_phuong_thuc_thanh_toan}
              </p>
              <p className="text-sm text-green-800">
                <span className="font-medium">Tổng tiền:</span> {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(orderData.tong_tien_phai_thanh_toan || 0)}
              </p>
            </div>
          </div>
          <div className="space-y-4 mt-8">
            <Link href="/account/orders">
              <Button className="w-full">Xem đơn hàng của tôi</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Tiếp tục mua sắm
              </Button>
            </Link>
          </div>
          <p className="text-sm text-slate-500 mt-6">
            Tự động chuyển hướng sau 10 giây...
          </p>
        </div>
      </Card>
    </div>
  );
} 