"use client";

import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Save, Upload, Store, Mail, Phone, MapPin, Globe } from "lucide-react";
import { cuaHangService } from "@/services/cua-hang.service";
import { phuongThucThanhToanService } from "@/services/phuong-thuc-thanh-toan.service";
import { toast } from "react-hot-toast";
import { getImageUrl } from "@/lib/utils";

// Payment Method List Component
const PaymentMethodList = ({ 
  methods, 
  onStatusChange, 
  disabled 
}: { 
  methods: Array<{
    id_phuong_thuc_thanh_toan: string;
    ten_phuong_thuc_thanh_toan: string;
    mo_ta?: string;
    trang_thai: boolean;
  }>;
  onStatusChange: (id: string) => void;
  disabled: boolean;
}) => {
  return (
    <div className="space-y-4">
      {methods.map((method) => {
        // Ensure we have a valid ID
        if (!method.id_phuong_thuc_thanh_toan) {
          console.warn('Payment method missing ID:', method);
          return null;
        }

        return (
          <div key={method.id_phuong_thuc_thanh_toan} className="flex items-center justify-between space-x-2 py-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`payment-${method.id_phuong_thuc_thanh_toan}`}
                  checked={method.trang_thai}
                  onCheckedChange={() => onStatusChange(method.id_phuong_thuc_thanh_toan)}
                  disabled={disabled}
                />
                <label
                  htmlFor={`payment-${method.id_phuong_thuc_thanh_toan}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {method.ten_phuong_thuc_thanh_toan}
                </label>
              </div>
              {method.mo_ta && (
                <p className="text-sm text-slate-500 ml-6">{method.mo_ta}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Version Info Component
const VersionInfo = () => {
  return (
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
  );
};

export default function SettingsPage() {
  // Dữ liệu cài đặt cửa hàng
  const [storeSettings, setStoreSettings] = useState({
    id_cua_hang: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    logo: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // State cho phương thức thanh toán
  const [paymentMethods, setPaymentMethods] = useState<Array<{
    id_phuong_thuc_thanh_toan: string;
    ten_phuong_thuc_thanh_toan: string;
    ma_phuong_thuc_thanh_toan: string;
    mo_ta: string;
    trang_thai: boolean;
  }>>([]);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [savingPayments, setSavingPayments] = useState(false);

  useEffect(() => {
    const fetchStore = async () => {
      try {
        setLoading(true);
        const data = await cuaHangService.getThongTinCuaHang();
        setStoreSettings({
          id_cua_hang: data.id_cua_hang,
          name: data.ten_cua_hang || "",
          email: data.email || "",
          phone: data.sdt || "",
          address: data.dia_chi || "",
          website: data.website || "",
          logo: data.hinh_anh_url || "",
          description: data.mo_ta || "",
        });
      } catch (err) {
        toast.error("Không thể tải thông tin cửa hàng");
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, []);

  // Fetch payment methods
  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setLoadingPayments(true);
        const data = await phuongThucThanhToanService.getDanhSachPhuongThucThanhToan();
        setPaymentMethods(data);
      } catch (err) {
        toast.error("Không thể tải danh sách phương thức thanh toán");
      } finally {
        setLoadingPayments(false);
      }
    };
    fetchPaymentMethods();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setStoreSettings(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSaveChanges = async () => {
    try {
      setSaving(true);
      await cuaHangService.capNhatThongTinCuaHang({
        id_cua_hang: storeSettings.id_cua_hang,
        ten_cua_hang: storeSettings.name,
        email: storeSettings.email,
        sdt: storeSettings.phone,
        dia_chi: storeSettings.address,
        website: storeSettings.website,
        mo_ta: storeSettings.description,
      });
      toast.success("Đã lưu thay đổi thành công!");
    } catch (err) {
      toast.error("Lưu thay đổi thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await cuaHangService.uploadLogo(file);
      
      if (result.url) {
        setStoreSettings(prev => ({
          ...prev,
          logo: result.url || ''
        }));
        toast.success("Logo đã được tải lên thành công!");
      } else {
        throw new Error("Không nhận được URL hình ảnh");
      }
    } catch (error: any) {
      toast.error(error.message || "Không thể tải lên logo");
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // Handle payment method status change
  const handlePaymentMethodChange = async (id: string) => {
    if (!id) {
      console.error('Invalid payment method ID');
      return;
    }

    try {
      setSavingPayments(true);
      console.log('Updating payment method:', id); // Debug log

      const result = await phuongThucThanhToanService.capNhatTrangThaiPhuongThucThanhToan(id);
      
      setPaymentMethods(prev => prev.map(m => 
        m.id_phuong_thuc_thanh_toan === id ? { ...m, trang_thai: result.trang_thai } : m
      ));
      
      toast.success(result.message);
    } catch (err) {
      console.error('Error updating payment method:', err);
      toast.error("Không thể cập nhật trạng thái phương thức thanh toán");
    } finally {
      setSavingPayments(false);
    }
  };

  // Add debug log for payment methods
  useEffect(() => {
    if (paymentMethods.length > 0) {
      console.log('Payment Methods:', paymentMethods);
    }
  }, [paymentMethods]);

  // Render loading state
  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-10">Đang tải thông tin cửa hàng...</div>
      </AdminLayout>
    );
  }

  // Render main content
  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cài đặt cửa hàng</h1>
        <p className="text-slate-500">Quản lý thông tin và cấu hình cửa hàng</p>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content Column */}
          <div className="md:col-span-2 space-y-6">
          {/* Store Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Thông tin cửa hàng</CardTitle>
                <CardDescription>Cập nhật thông tin cơ bản về cửa hàng của bạn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
              {/* Name and Website */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Tên cửa hàng</label>
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
                  <label htmlFor="website" className="text-sm font-medium">Website</label>
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

              {/* Email and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email liên hệ</label>
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
                  <label htmlFor="phone" className="text-sm font-medium">Số điện thoại</label>
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

              {/* Address */}
                <div className="space-y-2">
                <label htmlFor="address" className="text-sm font-medium">Địa chỉ cửa hàng</label>
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

              {/* Description */}
                <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Mô tả cửa hàng</label>
                  <textarea
                    id="description"
                    rows={3}
                    className="w-full border border-slate-200 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={storeSettings.description}
                    onChange={handleInputChange}
                />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" className="mr-2">Hủy</Button>
                <Button onClick={handleSaveChanges} className="gap-1" disabled={saving}>
                  <Save className="h-4 w-4" />
                  <span>{saving ? "Đang lưu..." : "Lưu thay đổi"}</span>
                </Button>
              </CardFooter>
            </Card>

          {/* Payment Settings Card */}
            <Card>
              <CardHeader>
                <CardTitle>Cài đặt thanh toán</CardTitle>
                <CardDescription>Cấu hình phương thức thanh toán cho cửa hàng</CardDescription>
              </CardHeader>
              <CardContent>
              {loadingPayments ? (
                <div className="py-4 text-center text-slate-500">
                  Đang tải phương thức thanh toán...
                  </div>
              ) : paymentMethods.length > 0 ? (
                <PaymentMethodList
                  methods={paymentMethods}
                  onStatusChange={handlePaymentMethodChange}
                  disabled={savingPayments}
                />
              ) : (
                <div className="py-4 text-center text-slate-500">
                  Không có phương thức thanh toán nào
                </div>
              )}
              </CardContent>
            </Card>
          </div>

        {/* Sidebar Column */}
          <div className="space-y-6">
          {/* Logo Card */}
            <Card>
              <CardHeader>
                <CardTitle>Logo cửa hàng</CardTitle>
                <CardDescription>Cập nhật logo hiển thị trên cửa hàng</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                {storeSettings.logo ? (
                  <img
                    src={getImageUrl(storeSettings.logo)}
                    alt="Logo cửa hàng"
                    className="h-40 w-40 object-contain bg-white rounded-md mb-4 border"
                  />
                ) : (
                  <div className="h-40 w-40 bg-slate-100 rounded-md flex items-center justify-center mb-4">
                    <Store className="h-12 w-12 text-slate-400" />
                  </div>
                )}
                <div className="w-full">
                  <label htmlFor="logo-upload" className="cursor-pointer">
                    <div className="flex items-center justify-center gap-2 border border-dashed border-slate-300 p-3 rounded-md hover:bg-slate-50 transition-colors">
                      <Upload className="h-4 w-4" />
                    <span>{uploading ? "Đang tải lên..." : "Tải lên logo mới"}</span>
                    </div>
                  <input
                    id="logo-upload"
                    type="file"
                    className="hidden"
                    onChange={handleLogoUpload}
                    accept="image/*"
                    disabled={uploading}
                  />
                  </label>
                </div>
              </CardContent>
            </Card>

          {/* Version Card */}
            <Card>
              <CardHeader>
                <CardTitle>Phiên bản hệ thống</CardTitle>
                <CardDescription>Thông tin phiên bản phần mềm</CardDescription>
              </CardHeader>
              <CardContent>
              <VersionInfo />
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
