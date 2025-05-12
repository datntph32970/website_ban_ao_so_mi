"use client";

import { useState } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Save, Upload, Store, Mail, Phone, MapPin, Globe } from "lucide-react";

export default function SettingsPage() {
  // Dữ liệu cài đặt cửa hàng
  const [storeSettings, setStoreSettings] = useState({
    name: "Shoes Store",
    email: "contact@shoesstore.com",
    phone: "0912345678",
    address: "123 Đường ABC, Quận 1, TP. Hồ Chí Minh",
    website: "https://shoesstore.com",
    logo: "/store-logo.png",
    description: "Cửa hàng bán giày uy tín, chất lượng cao.",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setStoreSettings(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSaveChanges = () => {
    // Giả định lưu thay đổi lên server
    alert("Đã lưu thay đổi thành công!");
  };

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cài đặt cửa hàng</h1>
        <p className="text-slate-500">Quản lý thông tin và cấu hình cửa hàng</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cửa hàng</CardTitle>
              <CardDescription>Cập nhật thông tin cơ bản về cửa hàng bán giày của bạn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Tên cửa hàng
                  </label>
                  <div className="flex">
                    <div className="bg-slate-100 p-2 flex items-center rounded-l-md border border-r-0 border-slate-200">
                      <Store className="h-4 w-4 text-slate-500" />
                    </div>
                    <Input
                      id="name"
                      value={storeSettings.name}
                      onChange={handleInputChange}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="website" className="text-sm font-medium">
                    Website
                  </label>
                  <div className="flex">
                    <div className="bg-slate-100 p-2 flex items-center rounded-l-md border border-r-0 border-slate-200">
                      <Globe className="h-4 w-4 text-slate-500" />
                    </div>
                    <Input
                      id="website"
                      value={storeSettings.website}
                      onChange={handleInputChange}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    Email liên hệ
                  </label>
                  <div className="flex">
                    <div className="bg-slate-100 p-2 flex items-center rounded-l-md border border-r-0 border-slate-200">
                      <Mail className="h-4 w-4 text-slate-500" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      value={storeSettings.email}
                      onChange={handleInputChange}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Số điện thoại
                  </label>
                  <div className="flex">
                    <div className="bg-slate-100 p-2 flex items-center rounded-l-md border border-r-0 border-slate-200">
                      <Phone className="h-4 w-4 text-slate-500" />
                    </div>
                    <Input
                      id="phone"
                      value={storeSettings.phone}
                      onChange={handleInputChange}
                      className="rounded-l-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">
                  Địa chỉ cửa hàng
                </label>
                <div className="flex">
                  <div className="bg-slate-100 p-2 flex items-center rounded-l-md border border-r-0 border-slate-200">
                    <MapPin className="h-4 w-4 text-slate-500" />
                  </div>
                  <Input
                    id="address"
                    value={storeSettings.address}
                    onChange={handleInputChange}
                    className="rounded-l-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Mô tả cửa hàng
                </label>
                <textarea
                  id="description"
                  rows={3}
                  className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={storeSettings.description}
                  onChange={handleInputChange}
                ></textarea>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" className="mr-2">Hủy</Button>
              <Button onClick={handleSaveChanges} className="gap-1">
                <Save className="h-4 w-4" />
                <span>Lưu thay đổi</span>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cài đặt thanh toán</CardTitle>
              <CardDescription>Cấu hình phương thức thanh toán cho cửa hàng</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="cod" className="h-4 w-4" defaultChecked />
                  <label htmlFor="cod" className="text-sm font-medium">Thanh toán khi nhận hàng (COD)</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="bank" className="h-4 w-4" defaultChecked />
                  <label htmlFor="bank" className="text-sm font-medium">Chuyển khoản ngân hàng</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="momo" className="h-4 w-4" defaultChecked />
                  <label htmlFor="momo" className="text-sm font-medium">Ví điện tử (MoMo, ZaloPay, VNPay)</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input type="checkbox" id="credit" className="h-4 w-4" />
                  <label htmlFor="credit" className="text-sm font-medium">Thẻ tín dụng/ghi nợ</label>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button variant="outline" className="mr-2">Hủy</Button>
              <Button onClick={handleSaveChanges} className="gap-1">
                <Save className="h-4 w-4" />
                <span>Lưu thay đổi</span>
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo cửa hàng</CardTitle>
              <CardDescription>Cập nhật logo hiển thị trên cửa hàng</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="h-40 w-40 bg-slate-100 rounded-md flex items-center justify-center mb-4">
                <Store className="h-12 w-12 text-slate-400" />
              </div>

              <div className="w-full">
                <label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="flex items-center justify-center gap-2 border border-dashed border-slate-300 p-3 rounded-md hover:bg-slate-50 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>Tải lên logo mới</span>
                  </div>
                  <input id="logo-upload" type="file" className="hidden" />
                </label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Phiên bản hệ thống</CardTitle>
              <CardDescription>Thông tin phiên bản phần mềm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Phiên bản</span>
                  <span className="text-sm font-medium">1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Cập nhật lần cuối</span>
                  <span className="text-sm font-medium">22/03/2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Trạng thái</span>
                  <span className="text-sm font-medium text-green-600">Đã cập nhật</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Kiểm tra cập nhật</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
