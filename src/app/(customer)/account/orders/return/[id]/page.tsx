"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Upload } from "lucide-react";
import { hoaDonService } from "@/services/hoa-don.service";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { HoaDonAdminDTO, HoaDonChiTietAdminDTO } from "@/types/hoa-don";
import { getImageUrl } from "@/lib/utils";

export default function ReturnRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [returnReason, setReturnReason] = useState("");
  const [returnImage, setReturnImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [order, setOrder] = useState<HoaDonAdminDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const resolvedParams = await params;
        const orderData = await hoaDonService.getHoaDonByIdCuaKhachHang(resolvedParams.id);
        setOrder(orderData);
      } catch (error) {
        console.error("Error fetching order:", error);
        toast.error("Không thể tải thông tin đơn hàng");
        router.push("/account/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReturnImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!returnReason.trim()) {
      toast.error("Vui lòng nhập lý do trả hàng");
      return;
    }

    if (!returnImage) {
      toast.error("Vui lòng tải lên hình ảnh sản phẩm");
      return;
    }

    try {
      setIsSubmitting(true);
      const resolvedParams = await params;
      await hoaDonService.yeuCauTraHang(resolvedParams.id, returnReason, returnImage);
      toast.success("Yêu cầu trả hàng đã được gửi thành công");
      router.push("/account/orders");
    } catch (error: any) {
      console.error("Error submitting return request:", error);
      toast.error(error.response?.data || "Không thể gửi yêu cầu trả hàng");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Không tìm thấy thông tin đơn hàng</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push("/account/orders")}
          >
            Quay lại danh sách đơn hàng
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-2xl font-bold mb-6">Yêu cầu trả hàng</h1>

          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h2 className="font-medium mb-2">Thông tin đơn hàng</h2>
            <div className="space-y-2 text-sm">
              <p>Mã đơn hàng: #{order.ma_hoa_don}</p>
              <p>Ngày đặt: {new Date(order.ngay_tao).toLocaleDateString("vi-VN")}</p>
              <p>Tổng tiền: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(order.tong_tien_phai_thanh_toan)}</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="font-medium mb-4">Sản phẩm trong đơn hàng</h2>
            <div className="space-y-4">
              {order.hoaDonChiTiets?.map((item: HoaDonChiTietAdminDTO) => (
                <div key={item.id_hoa_don_chi_tiet} className="flex gap-4 p-4 bg-white rounded-lg border">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <Image
                      src={getImageUrl(item.sanPhamChiTiet.url_anh_san_pham_chi_tiet)}
                      alt={item.sanPhamChiTiet.ten_san_pham}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-1 truncate">{item.sanPhamChiTiet.ten_san_pham}</h3>
                    <div className="text-sm text-slate-500 space-y-1">
                      <p>Phân loại: {item.sanPhamChiTiet.ten_mau_sac} - {item.sanPhamChiTiet.ten_kich_co}</p>
                      <p>Số lượng: {item.so_luong}</p>
                      <p>Đơn giá: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.don_gia)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="returnReason">Lý do trả hàng*</Label>
              <Textarea
                id="returnReason"
                placeholder="Vui lòng nhập lý do trả hàng"
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="min-h-[120px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="returnImage">Hình ảnh sản phẩm*</Label>
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="returnImage"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="returnImage"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {previewUrl ? (
                    <div className="relative w-full max-w-xs mx-auto">
                      <Image
                        src={previewUrl}
                        alt="Preview"
                        width={300}
                        height={300}
                        className="rounded-lg object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                          e.preventDefault();
                          setReturnImage(null);
                          setPreviewUrl("");
                        }}
                      >
                        Xóa
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-slate-400" />
                      <div className="text-sm text-slate-500">
                        <span className="font-medium text-blue-600">Tải lên</span> hoặc kéo thả hình ảnh
                      </div>
                      <p className="text-xs text-slate-400">
                        PNG, JPG hoặc JPEG (tối đa 5MB)
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang gửi...
                  </>
                ) : (
                  "Gửi yêu cầu"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 