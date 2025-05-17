"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

const getErrorMessage = (responseCode?: string | null) => {
  if (!responseCode) return null;
  
  const errorMessages: Record<string, string> = {
    '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
    '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng',
    '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
    '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán',
    '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa',
    '13': 'Giao dịch không thành công do: Khách hàng nhập sai mật khẩu xác thực giao dịch (OTP)',
    '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch',
    '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày',
    '75': 'Ngân hàng thanh toán đang bảo trì',
    '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định',
    '99': 'Các lỗi khác',
  };

  return errorMessages[responseCode] || null;
};

export default function PaymentFailedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      // Lấy thông tin lỗi từ URL parameters
      const message = searchParams.get('message');
      const responseCode = searchParams.get('responseCode');
      
      // Ưu tiên hiển thị thông báo lỗi cụ thể từ VNPay nếu có
      const vnpayError = getErrorMessage(responseCode);
      setError(vnpayError || message || 'Đã có lỗi xảy ra trong quá trình thanh toán');
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchParams]);

  useEffect(() => {
    // Hiển thị toast message khi component mount
    toast.error('Thanh toán thất bại!');
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-slate-600">Đang kiểm tra thông tin thanh toán...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <Card className="max-w-lg mx-auto p-8">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Thanh toán thất bại
          </h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <p className="text-sm text-left">{error}</p>
            </div>
          </div>
          <div className="space-y-4">
            <Link href="/checkout">
              <Button className="w-full">Thử lại</Button>
            </Link>
            <Link href="/account/orders">
              <Button variant="outline" className="w-full">
                Xem đơn hàng của tôi
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="w-full">
                Về trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
} 